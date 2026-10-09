import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, EmptyState, Icon, LoadingState, Notice, SectionTitle, StatusBadge, ui } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import useOperationalUpdates from '../hooks/useOperationalUpdates';
import { acceptDistribution, acceptResponseAssignment, deliverDistribution } from '../services/operationalUpdates';
import { colors as c } from '../theme';

const label = value => value ? String(value).replaceAll('_', ' ') : '';
const time = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : '';
const isDispatched = request => String(request?.status || '').trim().toUpperCase() === 'DISPATCHED';
const eventTime = event => event.occurredAt ? time(event.occurredAt) : 'Time not available';

const notificationEvents = data => [
  ...data.assignments
    .filter(assignment => ['DISPATCHED', 'IN_PROGRESS'].includes(assignment.status))
    .map(assignment => ({
      id: `assignment:${assignment.id || assignment.responseId}`,
      responseId: assignment.responseId,
      kind: 'assignment',
      status: assignment.staffStatus || 'PENDING',
      title: assignment.staffStatus === 'DISPATCHED' ? 'Response dispatch accepted' : 'Response dispatch pending acceptance',
      subject: assignment.responseId,
      incidentId: assignment.incident?.incidentId || assignment.incidentId?.incidentId || assignment.incidentId,
      summary: `${assignment.teams?.length || 0} assigned team${assignment.teams?.length === 1 ? '' : 's'} · ${assignment.destination || 'Destination unavailable'}`,
      detail: assignment.staffStatus === 'DISPATCHED'
        ? `Accepted ${time(assignment.staffAcceptedAt) || ''}`.trim()
        : 'Review this dispatch and accept it to begin the response.',
      occurredAt: assignment.staffAcceptedAt || assignment.dispatchedAt || assignment.createdAt,
    })),
  ...data.requests
    .filter(request => ['APPROVED', 'REJECTED', 'DISPATCHED'].includes(request.status))
    .map(request => ({
      id: `request:${request.id}`,
      kind: 'response',
      status: request.status,
      title: request.status === 'DISPATCHED' ? 'Response team dispatched' : request.status === 'APPROVED' ? 'Response request approved' : 'Response request rejected',
      subject: label(request.capability),
      incidentId: request.incident?.incidentId,
      summary: `${request.requestedPersonnelCount} personnel · ${request.requestedLocation}`,
      detail: request.approvedTeam?.name || request.rejectionReason || `Priority ${label(request.priority)}`,
      occurredAt: request.dispatchedAt || request.reviewedAt || request.createdAt,
    })),
  ...data.distributions.map(distribution => ({
    id: `distribution:${distribution.id}`,
    distributionId: distribution.distributionId,
    kind: 'distribution',
    status: distribution.status,
    title: distribution.status === 'DELIVERED' ? 'Relief supplies delivered' : distribution.status === 'PENDING' ? 'Relief delivery pending acceptance' : 'Relief delivery en route',
    subject: distribution.item?.itemName || distribution.distributionId,
    incidentId: distribution.incidentId,
    summary: `${distribution.quantity} ${distribution.item?.unit || ''} · ${distribution.shelter?.name || 'Shelter unavailable'}`,
    detail: distribution.status === 'DELIVERED'
      ? `Delivered by ${distribution.deliveryResource?.name || 'assigned resource'}`
      : `${distribution.status === 'PENDING' ? 'Open Reports to accept · ' : ''}ETA ${time(distribution.eta) || 'not available'} · ${distribution.deliveryResource?.name || 'Delivery resource unavailable'}`,
    occurredAt: distribution.deliveredAt || distribution.issuedAt || distribution.createdAt,
  })),
].sort((left, right) => new Date(right.occurredAt || 0).getTime() - new Date(left.occurredAt || 0).getTime());

export default function StaffHomeScreen({ navigation }) {
  const { user } = useAuth();
  const data = useOperationalUpdates();
  const [acceptingId, setAcceptingId] = useState('');
  const [actionError, setActionError] = useState('');
  const dispatched = data.requests.filter(isDispatched);
  const enRoute = data.distributions.filter(item => item.status === 'EN_ROUTE');
  const delivered = data.distributions.filter(item => item.status === 'DELIVERED');
  const events = notificationEvents(data);
  const acceptAssignment = async responseId => {
    if (!responseId || acceptingId) return;
    setAcceptingId(responseId);
    setActionError('');
    try {
      await acceptResponseAssignment(responseId);
      await data.retry();
    } catch (error) {
      setActionError(error.response?.data?.message || error.response?.data?.error?.message || 'Unable to accept this response dispatch.');
    } finally {
      setAcceptingId('');
    }
  };
  const updateDistribution = async (event, action) => {
    if (!event.distributionId || acceptingId) return;
    setAcceptingId(event.distributionId);
    setActionError('');
    try {
      if (action === 'accept') await acceptDistribution(event.distributionId);
      else await deliverDistribution(event.distributionId, event.incidentId);
      await data.retry();
    } catch (error) {
      setActionError(error.response?.data?.error?.message || error.response?.data?.message || 'Unable to update this relief delivery.');
    } finally {
      setAcceptingId('');
    }
  };
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.retry} tintColor={c.primary}/>}>
    <LinearGradient colors={['#CEE8D1', '#B9CFC5', '#EDF2EF']} style={styles.hero}>
      <View style={ui.sectionRow}><View style={styles.brand}><Icon name="shield-checkmark-outline" size={27} color="#163E2A"/><Text style={styles.brandName}>Disaster Connect</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={styles.iconButton}><Icon name="person-outline" color="#244A3B"/></Pressable></View>
      <Text style={styles.eyebrow}>STAFF OPERATIONS</Text><Text style={styles.title}>Welcome, {user?.name?.split(' ')[0] || 'Staff Officer'}</Text><Text style={styles.subtitle}>Review response updates and manage assigned relief deliveries from Reports.</Text>
      <View style={styles.metrics}><View><Text style={styles.metricValue}>{data.incidents.length}</Text><Text style={styles.metricLabel}>Active incidents</Text></View><View><Text style={styles.metricValue}>{dispatched.length}</Text><Text style={styles.metricLabel}>Teams dispatched</Text></View><View><Text style={styles.metricValue}>{enRoute.length}</Text><Text style={styles.metricLabel}>En route</Text></View><View><Text style={styles.metricValue}>{delivered.length}</Text><Text style={styles.metricLabel}>Delivered</Text></View></View>
    </LinearGradient>
    {data.error && <Notice warning>{data.error}</Notice>}
    {actionError && <Notice warning>{actionError}</Notice>}
    {data.loading ? <LoadingState message="Loading operational notifications…"/> : <>
      <SectionTitle title="Latest operational updates" action="Map" onPress={() => navigation.navigate('Map')}/>
      {events.length === 0 ? <EmptyState icon="notifications-outline" title="No operational notifications" message="Dispatch and relief-delivery updates will appear here."/> : events.map(event => <Card key={event.id} style={styles.notificationCard}><View style={styles.notificationRow}><View style={[styles.eventIcon, event.kind === 'distribution' && styles.deliveryIcon]}><Icon name={event.kind === 'distribution' ? 'cube-outline' : 'people-outline'} size={21} color={event.kind === 'distribution' ? '#8A641F' : c.primary}/></View><View style={ui.flex}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventTime}>{eventTime(event)}</Text></View><StatusBadge status={event.status} label={(event.kind === 'assignment' || event.kind === 'distribution') && event.status === 'PENDING' ? 'Pending' : undefined}/></View><View style={styles.eventBody}>{event.incidentId && <Text style={ui.overline}>{event.incidentId}</Text>}<Text style={ui.cardTitle}>{event.subject}</Text><Text style={ui.muted}>{event.summary}</Text><Text style={styles.detail}>{event.detail}</Text>{event.kind === 'assignment' && event.status === 'PENDING' && <Button title={acceptingId === event.responseId ? 'Accepting…' : 'Accept Dispatch'} icon="checkmark-circle-outline" disabled={Boolean(acceptingId)} onPress={() => acceptAssignment(event.responseId)} />}{event.kind === 'distribution' && event.status === 'PENDING' && <Button title={acceptingId === event.distributionId ? 'Accepting…' : 'Accept Delivery'} icon="checkmark-circle-outline" disabled={Boolean(acceptingId)} onPress={() => updateDistribution(event, 'accept')} />}{event.kind === 'distribution' && event.status === 'EN_ROUTE' && <Button title={acceptingId === event.distributionId ? 'Updating…' : 'Mark Delivered'} icon="cube-outline" disabled={Boolean(acceptingId)} onPress={() => updateDistribution(event, 'deliver')} />}</View></Card>)}
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, content: { padding: 20, paddingBottom: 30, gap: 17, width: '100%', maxWidth: 700, alignSelf: 'center' }, hero: { borderRadius: 23, padding: 20, gap: 9, overflow: 'hidden' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandName: { color: '#163E2A', fontSize: 17, fontWeight: '800' }, iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center' }, eyebrow: { marginTop: 12, color: '#326049', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#163E2A', fontSize: 27, fontWeight: '800' }, subtitle: { color: '#506C5D', fontSize: 13, lineHeight: 20 }, metrics: { marginTop: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metricValue: { color: '#163E2A', fontSize: 20, fontWeight: '800' }, metricLabel: { color: '#587164', fontSize: 10 }, notificationCard: { padding: 0, overflow: 'hidden', gap: 0 }, notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#F8FBFA', borderBottomWidth: 1, borderBottomColor: c.border }, eventIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.tint }, deliveryIcon: { backgroundColor: c.amberBg }, eventTitle: { color: c.text, fontSize: 14, fontWeight: '800' }, eventTime: { color: c.muted, fontSize: 11, marginTop: 3 }, eventBody: { padding: 16, gap: 5 }, detail: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' } });
