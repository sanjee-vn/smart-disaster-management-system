import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthButton, a } from '../../components/AuthUI';
import { Icon } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
export default function OnboardingScreen({ route, navigation }) {
  const second = route.name === 'OnboardingTwo';
  const { finishOnboarding } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function finish() {
    setBusy(true); setError('');
    try { await finishOnboarding(); }
    catch { setError('Unable to save your preference. Please try again.'); }
    finally { setBusy(false); }
  }
  return <LinearGradient colors={['#D3E9D6', '#F2F6F2']} style={a.flex}><SafeAreaView style={a.flex}><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.top}><Text style={styles.wordmark}>Disaster Connect</Text><Pressable accessibilityRole="button" disabled={busy} onPress={finish} style={a.touch}><Text style={a.link}>Skip</Text></Pressable></View>
    <View style={styles.art}><View style={styles.orbit} /><View style={styles.orbitInner} /><View style={styles.mainIcon}><Icon name={second ? 'megaphone-outline' : 'map-outline'} size={72} color="#17644D" /></View><View style={styles.smallIcon}><Icon name={second ? 'location-outline' : 'shield-checkmark-outline'} size={29} color="#3F7551" /></View></View>
    <View style={styles.copy}><Text style={styles.eyebrow}>{second ? 'MAKE A DIFFERENCE' : 'STAY CONNECTED'}</Text><Text style={styles.title}>{second ? 'See it. Report it.' : 'Know your surroundings.'}</Text><Text style={styles.description}>{second ? 'Share what you observe with a location and clear details. Keep your report receipt and follow official guidance.' : 'Explore the map and find useful emergency contacts. Check official information to stay informed about your area.'}</Text></View>
    <View style={styles.dots}><View style={[styles.dot, !second && styles.activeDot]} /><View style={[styles.dot, second && styles.activeDot]} /></View>
    {!!error && <Text style={a.error}>{error}</Text>}
    <AuthButton title={second ? 'Get started' : 'Continue'} busy={busy} onPress={second ? finish : () => navigation.navigate('OnboardingTwo')} />
    {second && <AuthButton title="Back" secondary onPress={() => navigation.goBack()} />}
  </ScrollView></SafeAreaView></LinearGradient>;
}
const styles = StyleSheet.create({ page: { flexGrow: 1, padding: 26, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, wordmark: { fontWeight: '800', color: '#1B4930', fontSize: 17 }, art: { height: 260, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }, orbit: { position: 'absolute', height: 250, width: 250, borderRadius: 125, borderWidth: 1, borderColor: '#BED6C4' }, orbitInner: { position: 'absolute', height: 205, width: 205, borderRadius: 103, backgroundColor: '#CDE1D2' }, mainIcon: { width: 152, height: 152, borderRadius: 43, backgroundColor: '#F1F9F2', alignItems: 'center', justifyContent: 'center' }, smallIcon: { position: 'absolute', right: '12%', bottom: 28, backgroundColor: '#B6D6BD', width: 66, height: 66, borderRadius: 22, borderWidth: 3, borderColor: '#F1F7F1', alignItems: 'center', justifyContent: 'center' }, copy: { gap: 13, flex: 1 }, eyebrow: { color: '#578263', fontSize: 11, letterSpacing: 1.4, fontWeight: '800' }, title: { fontSize: 32, lineHeight: 40, fontWeight: '800', color: '#143C26', letterSpacing: -0.6 }, description: { fontSize: 16, lineHeight: 25, color: '#607868' }, dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginVertical: 7 }, dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#B8CDBE' }, activeDot: { backgroundColor: '#17644D', width: 25 } });
