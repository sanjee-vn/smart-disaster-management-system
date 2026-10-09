import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, EmptyState, Filters, LoadingState, Notice, Screen, SectionTitle, StatusBadge, ui } from '../components/UI';
import useOperationalUpdates from '../hooks/useOperationalUpdates';
import { acceptDistribution, deliverDistribution } from '../services/operationalUpdates';

const FILTERS = ['All', 'PENDING', 'EN_ROUTE', 'DELIVERED'];
const displayTime = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : 'Not available';

export default function StaffDeliveryReportsScreen() {
  const data = useOperationalUpdates();
  const [filter, setFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState('');
  const [actionError, setActionError] = useState('');
  const visible = data.distributions.filter(item => filter === 'All' || item.status === filter);

  const updateStatus = async (item, action) => {
    setUpdatingId(item.distributionId);
    setActionError('');
    try {
      if (action === 'accept') await acceptDistribution(item.distributionId);
      else await deliverDistribution(item.distributionId, item.incidentId);
      await data.retry();
    } catch (error) {
      setActionError(error.response?.data?.error?.message || error.response?.data?.message || 'Unable to update this delivery.');
    } finally {
      setUpdatingId('');
    }
  };

  return <Screen title="Resource Reports" subtitle="Delivery workflow: Pending → En route → Delivered">
    <Notice>Pending cards must be accepted before delivery. Only Staff Officers can perform these delivery actions.</Notice>
    <View style={ui.row}>
      <Card style={ui.flex}><Text style={ui.overline}>PENDING</Text><Text style={ui.title}>{data.distributions.filter(item => item.status === 'PENDING').length}</Text></Card>
      <Card style={ui.flex}><Text style={ui.overline}>EN ROUTE</Text><Text style={ui.title}>{data.distributions.filter(item => item.status === 'EN_ROUTE').length}</Text></Card>
    </View>
    <Filters values={FILTERS} selected={filter} onChange={setFilter}/>
    {data.error && <Notice warning>{data.error}</Notice>}
    {actionError && <Notice warning>{actionError}</Notice>}
    {data.loading ? <LoadingState message="Loading resource reports…"/> : visible.length === 0
      ? <EmptyState icon="document-text-outline" title="No resource reports" message="No distributions match this status."/>
      : <><SectionTitle title="Distribution records"/>{visible.map(item => {
        const busy = updatingId === item.distributionId;
        return <Card key={item.id}>
          <View style={ui.sectionRow}><View style={ui.flex}><Text style={ui.overline}>{item.distributionId}</Text><Text style={ui.cardTitle}>{item.item?.itemName || 'Resource allocation'}</Text></View><StatusBadge status={item.status} label={item.status === 'PENDING' ? 'Pending' : undefined}/></View>
          <Text>Incident: <Text style={ui.cardTitle}>{item.incidentId}</Text></Text>
          <Text style={ui.muted}>Shelter: {item.shelter?.name || 'Not available'}</Text>
          <Text style={ui.muted}>Allocated: {item.quantity} {item.item?.unit || ''} · {item.item?.category || 'Resource'}</Text>
          <Text style={ui.muted}>Warehouse / owner: {item.resourceOwner?.name || 'Not available'}</Text>
          <Text style={ui.muted}>Delivery resource: {item.deliveryResource?.name || 'Not available'}</Text>
          <Text style={ui.muted}>Issued: {displayTime(item.issuedAt || item.createdAt)}</Text>
          <Text style={ui.muted}>{item.status === 'DELIVERED' ? `Delivered: ${displayTime(item.deliveredAt)}` : `ETA: ${displayTime(item.eta)}`}</Text>
          {item.status === 'PENDING' && <Button title={busy ? 'Accepting…' : 'Accept Delivery'} disabled={Boolean(updatingId)} icon="checkmark-circle-outline" onPress={() => updateStatus(item, 'accept')}/>}
          {item.status === 'EN_ROUTE' && <Button title={busy ? 'Updating…' : 'Mark Delivered'} disabled={Boolean(updatingId)} icon="cube-outline" onPress={() => updateStatus(item, 'deliver')}/>}
          {item.status === 'DELIVERED' && <Notice>Delivery completed. This record is read-only.</Notice>}
        </Card>;
      })}</>}
  </Screen>;
}
