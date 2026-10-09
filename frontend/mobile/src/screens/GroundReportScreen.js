import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { submitGroundReport, uploadReportPhoto } from '../services/reports';
import { useReports } from '../context/ReportsContext';
import { DISASTERS } from '../utils/reports.cjs';
import { validateForm } from '../utils/reportValidation.cjs';
import PhotoReference from '../components/PhotoReference';

const TYPES = Object.keys(DISASTERS);
const ICONS = Object.values(DISASTERS).map(type => type.icon);
const EMPTY = { title: '', description: '', disasterType: '', photo: '' };
const TEAL = '#11766E';
function ErrorText({ text }) { return text ? <Text accessibilityLiveRegion="polite" style={s.error}>{text}</Text> : null; }
function Heading({ number, title, subtitle }) {
  return <View style={s.row}><View style={s.number}><Text style={s.numberText}>{number}</Text></View><View style={s.flex}><Text style={s.sectionTitle}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View></View>;
}
export default function GroundReportScreen({ navigation }) {
  const { recordReport, storageError } = useReports();
  const [form, setForm] = useState(EMPTY);
  const [photoAsset, setPhotoAsset] = useState(null);
  const [location, setLocation] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationError, setLocationError] = useState('');
  const [settings, setSettings] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [receipt, setReceipt] = useState(null);
  const lock = useRef(false);
  const scroll = useRef(null);
  const busy = locating || sending;
  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setFailure('');
  }
  async function getLocation() {
    if (lock.current) return;
    lock.current = true;
    setLocating(true); setLocation(null); setLocationError(''); setSettings(false);
    let timer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setSettings(!permission.canAskAgain);
        setLocationError('Allow location access to attach the incident location.');
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setLocationError('Turn on location services on your phone, then try again.'); return;
      }
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 25000); }),
      ]);
      setLocation(position.coords);
      setErrors(current => ({ ...current, location: undefined }));
    } catch {
      setLocationError('Unable to find your location. Move to a place with a clear GPS signal and try again.');
    } finally { clearTimeout(timer); lock.current = false; setLocating(false); }
  }
  async function submit() {
    if (lock.current) return;
    const next = validateForm(form, location);
    setErrors(next); setFailure('');
    if (Object.keys(next).length) { scroll.current?.scrollTo({ y: 0, animated: true }); return; }
    lock.current = true; setSending(true);
    try {
      const photo = photoAsset ? await uploadReportPhoto(photoAsset) : null;
      const report = await submitGroundReport({
        title: form.title.trim(), description: form.description.trim(), disasterType: form.disasterType,
        latitude: location.latitude, longitude: location.longitude,
        photo,
      });
      setReceipt(report);
      await recordReport(report);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch (error) {
      if (error.response?.status === 400) {
        const fields = error.response.data.errors || {};
        setErrors({ ...fields, location: fields.latitude || fields.longitude });
        setFailure('Check the highlighted details and try again.');
      } else if (!error.response) {
        setFailure('We could not confirm submission. Check your connection. Retrying may create a duplicate report.');
      } else { setFailure(error.response.data?.message || 'Unable to submit the report. Please try again.'); }
    } finally { lock.current = false; setSending(false); }
  }
  function reset() {
    setReceipt(null); setForm(EMPTY); setPhotoAsset(null); setLocation(null); setErrors({}); setFailure(''); setLocationError(''); setSettings(false);
  }
  return <SafeAreaView style={s.safe} edges={['left', 'right', 'bottom']}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.brandRow}><View style={s.brandMark}><Ionicons name="shield-checkmark-outline" size={24} color="white" /></View><View><Text style={s.brand}>RESQCONNECT</Text><Text style={s.brandSub}>Citizen reporting</Text></View></View>
          <Text style={s.eyebrow}>YOUR COMMUNITY. YOUR VOICE.</Text>
          <Text style={s.heroTitle}>{'Report what\nyou see.'}</Text>
          <Text style={s.heroDescription}>Share information from the ground to help response teams understand the situation.</Text>
        </View>
        <View style={s.body}>
          {receipt ? <View style={s.card}>
            <View style={s.successIcon}><Ionicons name="checkmark" size={38} color={TEAL} /></View>
            <Text style={s.successTitle}>Report submitted</Text>
            <Text style={s.successText}>Thank you for sharing what you observed. Your report has been saved and is pending review.</Text>
            <View style={s.locationPanel}><View style={s.flex}><Text style={s.label}>REPORT REFERENCE</Text><Text selectable style={s.reference}>{receipt._id}</Text><Text style={s.muted}>{receipt.title}</Text><Text style={s.badge}>Pending review</Text></View></View>
            {!!storageError && <ErrorText text={storageError} />}
            <Pressable accessibilityRole="button" onPress={() => navigation.popTo('MainTabs', { screen: 'Reports' })} style={[s.primary, { marginBottom: 12 }]}><Text style={s.primaryText}>View My Reports</Text><Ionicons name="documents-outline" size={19} color="white" /></Pressable>
            <Pressable accessibilityRole="button" onPress={reset} style={s.primary}><Text style={s.primaryText}>Submit another report</Text><Ionicons name="arrow-forward" size={19} color="white" /></Pressable>
          </View> : <>
            <View style={s.intro}><View style={s.flex}><Text style={s.pageTitle}>New ground report</Text><Text style={s.muted}>A few details can make a difference.</Text></View><Ionicons name="document-text-outline" size={27} color={TEAL} /></View>
            <View style={s.card}>
              <Heading number="01" title="Incident details" subtitle="Tell us what is happening." />
              <Text style={s.label}>REPORT TITLE *</Text>
              <TextInput accessibilityLabel="Report title" editable={!busy} value={form.title} onChangeText={value => update('title', value)} placeholder="e.g. Flooding near Galle Road" placeholderTextColor="#85969D" maxLength={150} style={[s.input, errors.title && s.invalid]} />
              <ErrorText text={errors.title} />
              <Text style={[s.label, s.spacing]}>DISASTER TYPE *</Text>
              <View style={s.types}>{TYPES.map((type, index) => {
                const selected = form.disasterType === type;
                return <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: busy }} disabled={busy} onPress={() => update('disasterType', type)} style={[s.chip, selected && s.selected]}><Ionicons name={ICONS[index]} size={18} color={selected ? TEAL : '#657E85'} /><Text style={[s.chipText, selected && s.selectedText]}>{type}</Text></Pressable>;
              })}</View>
              <ErrorText text={errors.disasterType} />
              <Text style={[s.label, s.spacing]}>DESCRIPTION *</Text>
              <TextInput accessibilityLabel="Incident description" editable={!busy} value={form.description} onChangeText={value => update('description', value)} placeholder="Describe the situation, nearby landmarks, and any visible damage..." placeholderTextColor="#85969D" multiline textAlignVertical="top" maxLength={5000} style={[s.input, s.textArea, errors.description && s.invalid]} />
              <View style={s.hints}><Text style={s.hint}>Include only what you observed.</Text><Text style={s.hint}>{form.description.length}/5000</Text></View>
              <ErrorText text={errors.description} />
            </View>
            <View style={s.card}>
              <Heading number="02" title="Incident location" subtitle="Report from the place you are observing." />
              <View style={s.locationPanel}><View style={s.locationIcon}><Ionicons name="location-outline" size={25} color={TEAL} /></View><View style={s.flex}><Text style={s.locationTitle}>{location ? 'Location attached' : 'Attach your location'}</Text><Text style={s.muted}>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'GPS coordinates help locate the incident.'}</Text>{location?.accuracy != null && <Text style={s.hint}>Accuracy: approximately {Math.round(location.accuracy)} m</Text>}</View></View>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={getLocation} style={[s.secondary, busy && s.disabled]}>{locating ? <ActivityIndicator color={TEAL} /> : <Ionicons name="locate-outline" size={20} color={TEAL} />}<Text style={s.secondaryText}>{locating ? 'Finding your location...' : location ? 'Refresh location' : 'Use current location'}</Text></Pressable>
              <ErrorText text={locationError || errors.location} />
              {settings && <Pressable accessibilityRole="button" onPress={() => Linking.openSettings().catch(() => setLocationError('Open your phone settings to enable location access.'))}><Text style={s.link}>Open permission settings</Text></Pressable>}
            </View>
            <PhotoReference value={photoAsset} onChange={value => { setPhotoAsset(value); update('photo', ''); }} error={errors.photo} disabled={busy} />
            <View style={s.notice}><Ionicons name="information-circle-outline" size={21} color="#697F87" /><Text style={s.noticeText}>Share accurate details and keep a safe distance from the incident. Reports are initially pending review.</Text></View>
            {!!failure && <View style={s.errorBanner}><ErrorText text={failure} /></View>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy: sending }} disabled={busy} onPress={submit} style={({ pressed }) => [s.primary, (busy || pressed) && s.disabled]}>{sending ? <ActivityIndicator color="white" /> : <Ionicons name="paper-plane-outline" size={20} color="white" />}<Text style={s.primaryText}>{sending ? 'Submitting report...' : 'Submit ground report'}</Text><Ionicons name="arrow-forward" size={19} color="white" /></Pressable>
            <Text style={s.footer}>Thank you for helping keep your community informed.</Text>
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#102C35' }, content: { flexGrow: 1, backgroundColor: '#F3F6F6' },
  hero: { backgroundColor: '#102C35', padding: 26, paddingBottom: 32 }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#24505A', alignItems: 'center', justifyContent: 'center' }, brand: { color: 'white', fontSize: 13, fontWeight: '800', letterSpacing: 1.8 }, brandSub: { color: '#A9C4C9', fontSize: 12, marginTop: 3 }, eyebrow: { color: '#9FCEC7', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginTop: 30 }, heroTitle: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: 'white', marginTop: 12, letterSpacing: -1 }, heroDescription: { color: '#BED0D3', fontSize: 14, lineHeight: 22, marginTop: 12, maxWidth: 440 },
  body: { padding: 20, paddingBottom: 44, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 18 }, intro: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }, pageTitle: { fontSize: 21, fontWeight: '800', color: '#102C35', marginBottom: 5 }, muted: { color: '#6B8189', fontSize: 12, lineHeight: 19 }, card: { padding: 20, borderRadius: 20, backgroundColor: 'white', borderColor: '#E2EAEB', borderWidth: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 24 }, number: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#EAF5F2', alignItems: 'center', justifyContent: 'center' }, numberText: { color: TEAL, fontWeight: '800', fontSize: 12 }, sectionTitle: { fontSize: 16, fontWeight: '700', color: '#102C35', marginBottom: 3 }, label: { color: '#415D66', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 9 }, spacing: { marginTop: 23 }, input: { backgroundColor: '#F8FAFA', borderColor: '#DFE8E9', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, color: '#102C35', minHeight: 51 }, invalid: { borderColor: '#C95353' }, textArea: { minHeight: 140, lineHeight: 22 }, types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#E2E9EB', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 12, minHeight: 44 }, selected: { backgroundColor: '#EAF6F2', borderColor: TEAL }, chipText: { color: '#58717A', fontSize: 12, fontWeight: '600' }, selectedText: { color: TEAL }, hints: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 9 }, hint: { fontSize: 10, color: '#83949A', lineHeight: 16 }, error: { color: '#B44141', fontSize: 12, lineHeight: 19, marginTop: 6 }, locationPanel: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F8F7', padding: 14, borderRadius: 12, marginBottom: 14 }, locationIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E4F1ED', alignItems: 'center', justifyContent: 'center' }, locationTitle: { fontSize: 13, fontWeight: '700', color: '#102C35', marginBottom: 4 }, secondary: { borderWidth: 1, borderColor: '#C9DFD8', borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, secondaryText: { color: TEAL, fontSize: 13, fontWeight: '700' }, link: { color: TEAL, fontWeight: '700', marginTop: 12 }, notice: { flexDirection: 'row', gap: 9, paddingHorizontal: 4 }, noticeText: { flex: 1, color: '#6B8189', fontSize: 12, lineHeight: 19 }, primary: { backgroundColor: TEAL, borderRadius: 14, minHeight: 56, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, primaryText: { color: 'white', fontSize: 14, fontWeight: '700' }, disabled: { opacity: 0.6 }, footer: { textAlign: 'center', color: '#83949A', fontSize: 11, lineHeight: 18 }, errorBanner: { backgroundColor: '#FFF1F0', borderRadius: 12, padding: 14 }, successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E5F5EE', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 16 }, successTitle: { fontSize: 26, color: '#102C35', fontWeight: '800', textAlign: 'center' }, successText: { color: '#6B8189', textAlign: 'center', fontSize: 14, lineHeight: 23, marginVertical: 15 }, reference: { fontSize: 12, color: '#102C35', marginBottom: 8 }, badge: { color: '#927027', backgroundColor: '#FFF1D6', padding: 7, borderRadius: 6, alignSelf: 'flex-start', marginTop: 13, fontSize: 11, fontWeight: '700' },
});
