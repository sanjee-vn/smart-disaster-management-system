import { useCallback, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, EmptyState, Icon, Notice, Screen, SectionTitle, ui } from '../components/UI';
import { colors as c } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getPublishedAlerts } from '../services/reports';

async function openLink(url) {
  try { await Linking.openURL(url); } catch { Alert.alert('Unable to open', 'Please open this address or phone number manually.'); }
}
const CONTACTS = [
  { title: 'Disaster Management Centre', detail: 'Disaster emergency call centre', number: '117', source: 'https://117.dmc.gov.lk/' },
  { title: 'Suwa Seriya', detail: 'Emergency ambulance service', number: '1990', source: 'https://www.1990.lk/' },
];
export function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadAlerts = useCallback(() => {
    let active = true;
    setLoading(true);
    getPublishedAlerts()
      .then(data => { if (active) { setAlerts(data); setError(''); } })
      .catch(() => { if (active) setError('Published alerts could not be loaded. Check your connection and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useFocusEffect(loadAlerts);
  return <Screen insetTop={false} title="Alerts & Updates" subtitle="Disaster warning information">
    {error && <Notice warning>{error}</Notice>}
    {loading && <EmptyState icon="notifications-outline" title="Loading alerts" message="Checking for published DMC warnings..." />}
    {!loading && !error && alerts.length === 0 && <EmptyState icon="notifications-outline" title="No published alerts" message="There are no active warnings in the system right now. Continue to follow official local instructions." />}
    {!loading && alerts.map(item => <Card key={item.id}>
      <View style={ui.row}><Icon name="warning-outline" color={item.level === 'Very High' || item.level === 'High' ? c.error : c.primary} /><View style={ui.flex}><Text style={ui.cardTitle}>{item.title}</Text><Text style={ui.muted}>{item.level} · {item.district}</Text></View></View>
      <Text style={[ui.muted, { marginTop: 10 }]}>{item.message}</Text>
      {item.instructions ? <Notice>{item.instructions}</Notice> : null}
      <Text style={[ui.muted, { marginTop: 8, fontSize: 11 }]}>Published {new Date(item.publishedAt).toLocaleString('en-LK')}</Text>
    </Card>)}
    <Card><SectionTitle title="Official information" /><Text style={ui.muted}>Visit the Sri Lanka Disaster Management Centre for official updates and instructions.</Text><Button title="Open DMC website" secondary icon="open-outline" onPress={() => openLink('https://www.dmc.gov.lk/')} /></Card>
  </Screen>;
}
export function ContactsScreen() {
  return <Screen insetTop={false} title="Emergency Contacts" subtitle="Sri Lanka emergency services">
    <Notice warning>If you need immediate assistance, contact the appropriate emergency service. Submitting a report does not place an emergency call.</Notice>
    {CONTACTS.map(contact => <Card key={contact.number}><View style={ui.row}><Icon name="call-outline" color={c.error} /><View style={ui.flex}><Text style={ui.cardTitle}>{contact.title}</Text><Text style={ui.muted}>{contact.detail}</Text></View><Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>{contact.number}</Text></View><Button title={`Open dialer · ${contact.number}`} icon="call-outline" onPress={() => openLink(`tel:${contact.number}`)} /><Button title="Official source" secondary icon="open-outline" onPress={() => openLink(contact.source)} /></Card>)}
  </Screen>;
}
export function GuidelinesScreen() {
  return <Screen insetTop={false} title="Stay Prepared" subtitle="Simple steps before an emergency">
    <Card><Icon name="water-outline" /><SectionTitle title="Drinking water" /><Text style={ui.muted}>Keep drinking water available for household members and check your supplies regularly.</Text></Card>
    <Card><Icon name="medkit-outline" /><SectionTitle title="Emergency essentials" /><Text style={ui.muted}>Keep a flashlight, spare batteries, first-aid supplies and a phone charger in an easy-to-carry kit.</Text></Card>
    <Card><Icon name="people-outline" /><SectionTitle title="A household plan" /><Text style={ui.muted}>Discuss where to meet and how to stay in contact. Follow instructions from your local authorities.</Text></Card>
    <Button title="Red Cross preparedness guide" secondary icon="open-outline" onPress={() => openLink('https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html')} />
  </Screen>;
}
const TOPICS = {
  Personal: ['Personal information', 'Your registered citizen account details.'],
  Location: ['Your location choices', 'Location is requested only when you choose to attach it to a report or use the map. Background location tracking is not enabled. Manage location permission in your phone settings.'],
  Notifications: ['Notification preferences', 'Push notifications and a live alert feed are not enabled yet. No notification preference is being presented as an active delivery setting.'],
  Language: ['Application language', 'The interface currently supports English. Sinhala and Tamil language options can be added when translations are available.'],
  Accessibility: ['Accessible by design', 'The interface supports system text scaling, labeled actions and large touch targets. Adjust font size and screen-reader preferences in your phone accessibility settings.'],
  Privacy: ['Privacy & security', 'Your session token is kept in secure device storage. Reports are submitted under your account. Copies of successful submissions are stored on this device; report history is refreshed from the server when available.'],
  Support: ['Help & support', 'Keep your computer and phone on the same network for development testing. If report submission fails, your entered details remain on the form. If a connection times out, retrying may create a duplicate report.'],
  About: ['ResQConnect', 'A Smart Disaster Management System connecting citizen ground reports with disaster-response teams. Report incidents, view published warnings and follow response updates. Version 1.0.0.'],
};
export function PreferencesScreen({ route }) {
  const topic = route.params?.topic;
  const { user } = useAuth();
  const content = TOPICS[topic] || TOPICS.About;
  return <Screen insetTop={false} title={content[0]}><Card>{topic === 'Personal' ? <><Text style={ui.cardTitle}>{user?.name}</Text><Text style={ui.muted}>{user?.email}</Text><Text style={ui.muted}>Citizen</Text></> : <Text style={ui.muted}>{content[1]}</Text>}</Card>{['Location', 'Accessibility'].includes(topic) && <Button title="Open phone settings" secondary icon="settings-outline" onPress={() => Linking.openSettings().catch(() => Alert.alert('Unable to open settings', 'Open your phone settings manually.'))} />}{topic === 'Support' && <Notice>The report reference helps identify a successfully submitted report. Keep it if your device cannot save its receipt.</Notice>}</Screen>;
}
