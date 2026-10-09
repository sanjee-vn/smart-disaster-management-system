import useCurrentLocation from '../hooks/useCurrentLocation';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, ui } from '../components/UI';
import { useReports } from '../context/ReportsContext';
import { useAuth } from '../context/AuthContext';
import { colors as c } from '../theme';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { statusInfo } from '../utils/reports.cjs';
import { getPublishedAlerts } from '../services/reports';

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}
const ACTIONS = [
  { title: 'Disaster Map', icon: 'map-outline', route: 'Map', tint: '#C4DFC8', color: '#315C3A' },
  { title: 'My Reports', icon: 'documents-outline', route: 'Reports', tint: '#AEDDD5', color: '#075F57' },
  { title: 'Emergency Contacts', icon: 'call-outline', route: 'Contacts', tint: '#F8BDBD', color: '#B43135' },
];
export default function HomeScreen({ navigation }) {
  const currentLocation = useCurrentLocation();
  const { reports, loading, reload } = useReports();
  const [alerts, setAlerts] = useState([]);
  useFocusEffect(useCallback(() => {
    void reload();
    getPublishedAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, [reload]));
  const { user } = useAuth();
  const latest = reports[0];
  const latestAlert = alerts[0];
  const status = latest ? statusInfo(latest.status) : null;
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#CEE8D1', '#B9CFC5', '#EDF2EF']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
        <View style={s.brandRow}>
          <View style={s.brand}><Icon name="shield-checkmark-outline" size={27} color="#163E2A" /><Text style={s.brandName}>ResQConnect</Text></View>
          <View style={s.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Open alerts and notifications" onPress={() => navigation.navigate('Alerts')} style={s.bell}><Icon name="notifications-outline" size={23} color="#244A3B" /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open profile and settings" onPress={() => navigation.navigate('Profile')} style={s.bell}><Icon name="settings-outline" size={23} color="#244A3B" /></Pressable></View>
        </View>
        <View style={s.welcomeRow}>
          <View style={ui.flex}><Text style={s.heading}>{greeting()}, {user?.name?.split(' ')[0] || 'User'}!</Text><Text style={s.headerSubtitle}>Stay safe. Stay informed.</Text></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh current location" disabled={currentLocation.busy} onPress={currentLocation.refresh} style={s.heroFooter}><Icon name="location-outline" size={22} color="#6A7772" /><Text style={s.locationText}>{currentLocation.busy ? 'Finding your location...' : currentLocation.place}</Text><Icon name="chevron-down" size={17} color="#6A7772" /></Pressable>
        {!!currentLocation.error && <Text style={{ color: '#B42318', marginTop: 8 }}>{currentLocation.error}</Text>}
      </LinearGradient>

      <View style={s.body}>
        <Pressable accessibilityRole="button" accessibilityLabel={latestAlert ? `View alert: ${latestAlert.title}` : 'View alerts and updates'} onPress={() => navigation.navigate('Alerts')} style={({ pressed }) => [s.alert, pressed && s.pressed]}>
          <View style={s.alertStripe} />
          <View style={s.alertTop}><View style={s.alertBadge}><Icon name="warning-outline" size={16} color="#8F5E15" /><Text style={s.alertLabel}>ALERTS & WARNINGS</Text></View><Icon name="arrow-forward" size={20} color="#8F5E15" /></View>
          <Text style={s.alertTitle}>{latestAlert?.title || 'No published alerts'}</Text>
          <Text style={s.alertDescription}>{latestAlert?.message || 'Published DMC warnings and safety updates will appear here.'}</Text>
          <View style={s.alertBottom}><View style={s.feedState}><View style={s.amberDot} /><Text style={s.feedText}>{latestAlert ? `${latestAlert.level} · ${latestAlert.district}` : 'Alert feed connected'}</Text></View><Text style={s.alertLink}>View alerts →</Text></View>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Report an Incident" onPress={() => navigation.navigate('ReportIncident')} style={({ pressed }) => [s.reportAction, pressed && s.pressed]}>
          <View style={s.reportIcon}><Icon name="megaphone-outline" size={28} color="#D8F5E9" /></View>
          <View style={s.reportCopy}><Text style={s.reportEyebrow}>MAKE A DIFFERENCE</Text><Text style={s.reportTitle}>Report an Incident</Text><Text style={s.reportSubtitle}>See a disaster? Share what you observe.</Text></View>
          <View style={s.reportArrow}><Icon name="arrow-forward" size={22} color="#0C543F" /></View>
        </Pressable>

        <View style={s.sectionRow}><Text style={s.sectionTitle}>Quick Access</Text><Text style={s.sectionCaption}>Here when you need it</Text></View>
        <View style={s.actions}>{ACTIONS.map(action => <Pressable key={action.route} accessibilityRole="button" onPress={() => navigation.navigate(action.route)} style={({ pressed }) => [s.quick, pressed && s.pressed]}><View style={[s.quickIcon, { backgroundColor: action.tint }]}><Icon name={action.icon} size={26} color={action.color} /></View><Text style={s.quickTitle}>{action.title}</Text></Pressable>)}</View>

        <View style={s.sectionRow}><Text style={s.sectionTitle}>Your activity</Text><Pressable accessibilityRole="button" onPress={() => navigation.navigate('Reports')} style={s.textButton}><Text style={s.link}>View reports →</Text></Pressable></View>
        {latest ? <Pressable accessibilityRole="button" accessibilityLabel={`View latest report: ${latest.title}`} onPress={() => navigation.navigate('ReportDetails', { reportId: latest._id })} style={({ pressed }) => [s.activity, pressed && s.pressed]}><View style={s.activityTop}><Icon name="document-text-outline" size={20} /><Text style={s.activityLabel}>LATEST SUBMISSION</Text><View style={[s.statusDot, { backgroundColor: status.color }]} /></View><Text numberOfLines={1} style={s.activityTitle}>{latest.title}</Text><View style={s.activityBottom}><Text style={[s.activityStatus, { color: status.color }]}>{status.label}</Text><Text style={s.localLabel}>Last recorded on this device</Text></View></Pressable> : <View style={s.emptyActivity}><View style={s.emptyIcon}><Icon name="file-tray-outline" size={24} color="#709087" /></View><View style={ui.flex}><Text style={s.emptyTitle}>{loading ? 'Loading your activity…' : 'Your first report starts here'}</Text><Text style={s.emptyDescription}>Submitted reports saved on this device appear here.</Text></View></View>}

        <View style={s.bottomRow}><View style={s.bottomBrand}><Icon name="shield-checkmark-outline" size={15} color="#739088" /><Text style={s.bottomText}>Informed citizens. Stronger communities.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open safety guidelines" onPress={() => navigation.navigate('Guidelines')} style={s.safetyLink}><Text style={s.link}>Safety tips</Text><Icon name="chevron-forward" size={14} /></Pressable></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#CEE8D1' }, content: { flexGrow: 1, backgroundColor: '#EDF2EF' },
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 25 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }, brandName: { fontSize: 17, color: '#133D28', fontWeight: '700', letterSpacing: -0.3 }, headerActions: { flexDirection: 'row', gap: 9 }, bell: { height: 46, width: 46, borderRadius: 23, backgroundColor: 'rgba(221, 238, 224, 0.48)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.24)', alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#4C6D59', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  welcomeRow: { marginTop: 28, marginBottom: 24 }, heading: { color: '#0B1D12', fontWeight: '800', fontSize: 29, lineHeight: 37, letterSpacing: -0.8 }, headerSubtitle: { color: '#4E6358', fontSize: 16, lineHeight: 23, marginTop: 8 }, heroFooter: { minHeight: 54, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFCFB', borderRadius: 15, gap: 8, borderWidth: 3, borderColor: '#E2EAE4', elevation: 4, shadowColor: '#506359', shadowOpacity: 0.17, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }, locationText: { flex: 1, fontSize: 14, color: '#253A2E' },
  body: { paddingHorizontal: 16, paddingBottom: 20, gap: 20, maxWidth: 680, width: '100%', alignSelf: 'center' },
  alert: { backgroundColor: '#FFE2AF', borderRadius: 20, borderWidth: 1.5, borderColor: '#BB8B35', padding: 21, paddingLeft: 24, overflow: 'hidden', elevation: 4, shadowColor: '#736346', shadowOpacity: 0.17, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }, alertStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#C3912F' }, alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 }, alertLabel: { fontSize: 11, fontWeight: '800', color: '#805517', letterSpacing: 0.9 }, alertTitle: { color: '#1D180F', fontSize: 18, lineHeight: 25, fontWeight: '800', marginTop: 16 }, alertDescription: { color: '#30291E', fontSize: 14, lineHeight: 22, marginTop: 8 }, alertBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 18 }, feedState: { flexDirection: 'row', alignItems: 'center', gap: 6 }, amberDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EB9E46' }, feedText: { color: '#5C4B30', fontSize: 11 }, alertLink: { color: '#755018', fontWeight: '700', fontSize: 13 },
  reportAction: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#00603F', paddingHorizontal: 20, paddingVertical: 22, borderRadius: 20, minHeight: 136 }, reportIcon: { width: 51, height: 51, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C7D61' }, reportCopy: { flex: 1, gap: 7 }, reportEyebrow: { color: '#BEE1CE', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, reportTitle: { color: 'white', fontSize: 20, fontWeight: '800', lineHeight: 25 }, reportSubtitle: { color: '#C2E1D2', fontSize: 14, lineHeight: 21 }, reportArrow: { backgroundColor: '#C9EDD5', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }, sectionTitle: { color: '#111D16', fontWeight: '800', fontSize: 19 }, sectionCaption: { color: '#63736A', fontSize: 12 }, actions: { flexDirection: 'row', gap: 12 }, quick: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F3EC', borderWidth: 2, borderColor: '#FAFFFB', borderRadius: 23, paddingHorizontal: 7, paddingVertical: 21, gap: 12, minHeight: 138, elevation: 5, shadowColor: '#40554A', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } }, quickIcon: { width: 51, height: 51, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }, quickTitle: { textAlign: 'center', color: '#15241A', fontSize: 13, lineHeight: 18, fontWeight: '500' }, textButton: { minHeight: 44, justifyContent: 'center' }, link: { color: c.primary, fontWeight: '600', fontSize: 13 },
  activity: { backgroundColor: 'white', borderWidth: 1, borderColor: '#DDE9E2', borderRadius: 16, padding: 16, gap: 10 }, activityTop: { flexDirection: 'row', alignItems: 'center', gap: 7 }, activityLabel: { flex: 1, fontWeight: '700', fontSize: 10, letterSpacing: 0.8, color: '#738980' }, statusDot: { width: 6, height: 6, borderRadius: 3 }, activityTitle: { fontSize: 16, fontWeight: '700', color: '#173C30' }, activityBottom: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }, activityStatus: { fontSize: 11, fontWeight: '600' }, localLabel: { color: '#728980', fontSize: 10 }, emptyActivity: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDE9E2', borderRadius: 16, padding: 16, backgroundColor: '#E8F0EB' }, emptyIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE9E2' }, emptyTitle: { color: '#385D4C', fontWeight: '700', fontSize: 14, marginBottom: 4 }, emptyDescription: { color: '#728980', fontSize: 12, lineHeight: 18 }, bottomRow: { alignItems: 'center', gap: 2, marginTop: 3 }, bottomBrand: { flexDirection: 'row', alignItems: 'center', gap: 5 }, bottomText: { color: '#7C9187', fontSize: 10 }, safetyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, justifyContent: 'center' }, pressed: { opacity: 0.78 },
});
