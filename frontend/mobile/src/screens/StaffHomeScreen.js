import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Icon, LoadingState, Notice, SectionTitle, ui } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import useOperationalUpdates from '../hooks/useOperationalUpdates';
import { deliverOperationalRequest } from '../services/operationalUpdates';
import { colors as c } from '../theme';
import { useState } from 'react';

const label = value => value ? String(value).replaceAll('_', ' ') : '';
const time = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : '';
const isDispatched = request => String(request?.status || '').trim().toUpperCase() === 'DISPATCHED';
const EventStatus = ({ value }) => <Text style={styles.status}>{label(value)}</Text>;

export default function StaffHomeScreen({ navigation }) {
  const { user } = useAuth();
  const data = useOperationalUpdates();
  const [delivering, setDelivering] = useState('');
  const [deliveredRequests, setDeliveredRequests] = useState({});
  const dispatched = data.requests.filter(isDispatched);
  const enRoute = data.distributions.filter(item => item.status === 'EN_ROUTE');
  const delivered = data.distributions.filter(item => item.status === 'DELIVERED');
  const requestEvents = [...dispatched, ...Object.values(deliveredRequests)];
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.retry} tintColor={c.primary}/>}>
    <LinearGradient colors={['#CEE8D1', '#B9CFC5', '#EDF2EF']} style={styles.hero}>
      <View style={ui.sectionRow}><View style={styles.brand}><Icon name="shield-checkmark-outline" size={27} color="#163E2A"/><Text style={styles.brandName}>Disaster Connect</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={styles.iconButton}><Icon name="person-outline" color="#244A3B"/></Pressable></View>
      <Text style={styles.eyebrow}>STAFF OPERATIONS</Text><Text style={styles.title}>Welcome, {user?.name?.split(' ')[0] || 'Staff Officer'}</Text><Text style={styles.subtitle}>Track dispatched response teams and confirm delivery when work is complete.</Text>
      <View style={styles.metrics}><View><Text style={styles.metricValue}>{data.incidents.length}</Text><Text style={styles.metricLabel}>Active incidents</Text></View><View><Text style={styles.metricValue}>{dispatched.length}</Text><Text style={styles.metricLabel}>Teams dispatched</Text></View><View><Text style={styles.metricValue}>{enRoute.length}</Text><Text style={styles.metricLabel}>En route</Text></View><View><Text style={styles.metricValue}>{delivered.length}</Text><Text style={styles.metricLabel}>Delivered</Text></View></View>
    </LinearGradient>
    {data.error && <Notice warning>{data.error}</Notice>}
    {data.loading ? <LoadingState message="Loading operational notifications…"/> : <>
      <SectionTitle title="Response dispatch notifications" action="Map" onPress={() => navigation.navigate('Map')}/>
      {requestEvents.map(request => <Card key={request.id}><View style={ui.sectionRow}><View style={ui.flex}>{request.incident?.incidentId && <Text style={ui.overline}>{request.incident.incidentId}</Text>}{request.capability && <Text style={ui.cardTitle}>{label(request.capability)}</Text>}</View><EventStatus value={request.status}/></View>{request.requestedPersonnelCount != null && request.requestedLocation && <Text style={ui.muted}>{request.requestedPersonnelCount} personnel · {request.requestedLocation}</Text>}{(request.requiredAt || request.priority) && <Text style={ui.muted}>{request.requiredAt ? `Required: ${time(request.requiredAt)}` : ''}{request.requiredAt && request.priority ? ' · ' : ''}{request.priority ? `Priority ${label(request.priority)}` : ''}</Text>}{request.approvedTeam && <Text style={styles.detail}>Team: <Text style={styles.strong}>{request.approvedTeam.name}</Text> · Capacity {request.approvedTeam.capacity}</Text>}{isDispatched(request) && <Pressable accessibilityRole="button" disabled={delivering === request.requestId} onPress={() => Alert.alert('Confirm delivery', 'Mark this dispatched response request as delivered?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delivered', onPress: async () => { setDelivering(request.requestId); try { const updatedRequest = await deliverOperationalRequest(request.requestId); setDeliveredRequests(current => ({ ...current, [request.requestId]: updatedRequest })); await data.retry(); } catch (error) { if (error.response?.status !== 401) Alert.alert('Could not mark delivered', error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Please try again.'); } finally { setDelivering(''); } } }])} style={[styles.actionButton, delivering === request.requestId && { opacity: 0.6 }]}><Text style={styles.actionText}>{delivering === request.requestId ? 'Saving…' : 'Delivered'}</Text></Pressable>}</Card>)}
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, content: { padding: 20, paddingBottom: 30, gap: 17, width: '100%', maxWidth: 700, alignSelf: 'center' }, hero: { borderRadius: 23, padding: 20, gap: 9, overflow: 'hidden' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandName: { color: '#163E2A', fontSize: 17, fontWeight: '800' }, iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center' }, eyebrow: { marginTop: 12, color: '#326049', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#163E2A', fontSize: 27, fontWeight: '800' }, subtitle: { color: '#506C5D', fontSize: 13, lineHeight: 20 }, metrics: { marginTop: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metricValue: { color: '#163E2A', fontSize: 20, fontWeight: '800' }, metricLabel: { color: '#587164', fontSize: 10 }, status: { color: '#12664C', backgroundColor: '#E4F3EA', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '800' }, detail: { color: c.text, fontSize: 13, lineHeight: 20 }, strong: { fontWeight: '700' }, actionButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.primary, paddingHorizontal: 16 }, actionText: { color: '#fff', fontWeight: '700', fontSize: 14 } });
