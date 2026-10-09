import useCurrentLocation from '../hooks/useCurrentLocation';
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
  const currentLocation = useCurrentLocation();
  const { reports, loading } = useReports();
  const { user, logout, busy } = useAuth();
  async function signOut() {
    try { await logout(); }
    catch (error) { Alert.alert('Unable to log out', error.response?.data?.message || 'Check your connection and try again.'); }
  }
  const stats = [['Reports', reports.length], ['Verified', reports.filter(r => ['VERIFIED', 'FORWARDED_TO_DUTY_OFFICER', 'WARNING_ISSUED'].includes(r.status)).length], ['Pending', reports.filter(r => r.status === 'PENDING').length]];
  const citizen = user?.role === 'CITIZEN';
  return <Screen title="Profile" subtitle="Your activity and preferences.">
    <Card style={styles.identity}><View style={styles.avatar}><Text style={styles.initials}>{(user?.name || 'User').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</Text></View><Text style={styles.name}>{user?.name}</Text><Text style={ui.muted}>{user?.email}</Text><Text style={ui.muted}>{user?.role === 'STAFF_OFFICER' ? 'Staff Officer' : 'Citizen'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh profile location" disabled={currentLocation.busy} onPress={currentLocation.refresh} style={styles.location}><Icon name="location-outline" size={16} /><Text style={styles.locationText}>{currentLocation.busy ? 'Finding location...' : currentLocation.place}</Text><Icon name="refresh-outline" size={16}/></Pressable>{!!currentLocation.error && <Text style={styles.error}>{currentLocation.error}</Text>}</Card>
    {citizen && <><SectionTitle title="My Activity" /><Card><View style={styles.stats}>{stats.map(([label, value]) => <View key={label} style={styles.stat}><Text style={styles.value}>{loading ? '—' : value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View><Text style={styles.caption}>Your submitted reports and their latest recorded review status.</Text></Card><View style={styles.shortcuts}><Button title="My Reports" icon="documents-outline" onPress={() => navigation.navigate('Reports')}/><Button title="Report an Incident" secondary icon="add-circle-outline" onPress={() => navigation.navigate('ReportIncident')}/></View></>}
    {GROUPS.map(group => <View key={group.title} style={{ gap: 12 }}><SectionTitle title={group.title} /><Card style={{ paddingVertical: 5 }}>{group.options.map(([title, icon, topic], index) => <Pressable key={topic} accessibilityRole="button" onPress={() => navigation.navigate('Preferences', { topic, title })} style={[styles.option, index > 0 && styles.separator]}><Icon name={icon} size={21} /><Text style={styles.optionText}>{title}</Text><Icon name="chevron-forward" size={17} color={c.muted} /></Pressable>)}</Card></View>)}
    <Button title={busy ? 'Logging out…' : 'Log out'} secondary icon="log-out-outline" disabled={busy} onPress={() => Alert.alert('Log out?', 'You can sign back in to view your reports.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: signOut }])} />
    <Text style={styles.version}>RESQCONNECT · VERSION 1.0.0</Text>
  </Screen>;
}
const styles = StyleSheet.create({ initials: { color: '#11766E', fontWeight: '800', fontSize: 30 }, location: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#EAF5F0', maxWidth: '100%' }, locationText: { color: c.text, flexShrink: 1, fontSize: 12 }, error: { color: c.error, fontSize: 12 }, shortcuts: { gap: 10 }, identity: { backgroundColor: '#F0F8F3', borderColor: '#CDE4D6', alignItems: 'center', paddingVertical: 26 }, avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 22, color: c.text, fontWeight: '800' }, stats: { flexDirection: 'row', justifyContent: 'space-around' }, stat: { alignItems: 'center', gap: 5, flex: 1 }, value: { fontSize: 29, fontWeight: '800', color: c.text }, statLabel: { fontSize: 12, color: c.muted }, caption: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 7 }, option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 55 }, optionText: { flex: 1, fontSize: 14, color: c.text }, separator: { borderTopWidth: 1, borderColor: c.border }, version: { textAlign: 'center', fontSize: 10, color: c.muted, letterSpacing: 1, paddingVertical: 8 } });
