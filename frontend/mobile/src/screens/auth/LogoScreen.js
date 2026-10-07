import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthButton, Brand, a } from '../../components/AuthUI';
import { useAuth } from '../../context/AuthContext';
export default function LogoScreen() {
  const { restoreError, restore } = useAuth();
  return <LinearGradient colors={['#B9D9C1', '#EDF3EE']} style={a.flex}><SafeAreaView style={styles.page}><View style={styles.center}><Brand large /><Text style={styles.tagline}>Together for a safer community.</Text>{restoreError ? <View style={styles.retry}><Text style={a.error}>{restoreError}</Text><AuthButton title="Retry connection" onPress={restore} /></View> : <ActivityIndicator color="#17644D" style={{ marginTop: 32 }} />}</View><Text style={a.footer}>SMART DISASTER MANAGEMENT SYSTEM</Text></SafeAreaView></LinearGradient>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 28, justifyContent: 'space-between' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, tagline: { color: '#557460', fontSize: 15, textAlign: 'center' }, retry: { maxWidth: 400, gap: 16, marginTop: 20 } });
