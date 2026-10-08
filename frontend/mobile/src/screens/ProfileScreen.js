import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, Screen, SectionTitle, ui } from '../components/UI';
import { useReports } from '../context/ReportsContext';
import { useAuth } from '../context/AuthContext';
import { colors as c } from '../theme';

const GROUPS = [
  { title: 'Account', options: [['Personal Information', 'person-outline', 'Personal'], ['Location Preferences', 'location-outline', 'Location'], ['Notification Settings', 'notifications-outline', 'Notifications']] },
  { title: 'App', options: [['Language', 'language-outline', 'Language'], ['Accessibility', 'accessibility-outline', 'Accessibility'], ['Privacy & Security', 'lock-closed-outline', 'Privacy'], ['Help & Support', 'help-circle-outline', 'Support']] },
  { title: 'About', options: [['About the Application', 'information-circle-outline', 'About']] },
];
export default function ProfileScreen({ navigation }) {
  const { reports, loading } = useReports();
  const { user, logout, busy } = useAuth();
  async function signOut() {
    try { await logout(); }
    catch (error) { Alert.alert('Unable to log out', error.response?.data?.message || 'Check your connection and try again.'); }
  }
  const stats = [['Reports', reports.length], ['Verified', reports.filter(r => r.status === 'VERIFIED').length], ['Pending', reports.filter(r => r.status === 'PENDING').length]];
  const citizen = user?.role === 'CITIZEN';
  return <Screen title="Profile" subtitle="Your activity and preferences.">
    <Card style={styles.identity}><View style={styles.avatar}><Icon name="person-outline" size={36} /></View><Text style={styles.name}>{user?.name}</Text><Text style={ui.muted}>{user?.email}</Text><Text style={ui.muted}>{user?.role === 'STAFF_OFFICER' ? 'Staff Officer' : 'Citizen'}</Text><View style={ui.row}><Icon name="location-outline" size={16} /><Text style={ui.muted}>Location not selected</Text></View></Card>
    {citizen && <><SectionTitle title="My Activity" /><Card><View style={styles.stats}>{stats.map(([label, value]) => <View key={label} style={styles.stat}><Text style={styles.value}>{loading ? '—' : value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View><Text style={styles.caption}>Based on receipts saved on this device.</Text></Card></>}
    {GROUPS.map(group => <View key={group.title} style={{ gap: 12 }}><SectionTitle title={group.title} /><Card style={{ paddingVertical: 5 }}>{group.options.map(([title, icon, topic], index) => <Pressable key={topic} accessibilityRole="button" onPress={() => navigation.navigate('Preferences', { topic, title })} style={[styles.option, index > 0 && styles.separator]}><Icon name={icon} size={21} /><Text style={styles.optionText}>{title}</Text><Icon name="chevron-forward" size={17} color={c.muted} /></Pressable>)}</Card></View>)}
    <Button title={busy ? 'Logging out…' : 'Log out'} secondary icon="log-out-outline" disabled={busy} onPress={signOut} />
    <Text style={styles.version}>DISASTER CONNECT · VERSION 1.0.0</Text>
  </Screen>;
}
const styles = StyleSheet.create({ identity: { alignItems: 'center', paddingVertical: 26 }, avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 22, color: c.text, fontWeight: '800' }, stats: { flexDirection: 'row', justifyContent: 'space-around' }, stat: { alignItems: 'center', gap: 5, flex: 1 }, value: { fontSize: 29, fontWeight: '800', color: c.text }, statLabel: { fontSize: 12, color: c.muted }, caption: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 7 }, option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 55 }, optionText: { flex: 1, fontSize: 14, color: c.text }, separator: { borderTopWidth: 1, borderColor: c.border }, version: { textAlign: 'center', fontSize: 10, color: c.muted, letterSpacing: 1, paddingVertical: 8 } });
