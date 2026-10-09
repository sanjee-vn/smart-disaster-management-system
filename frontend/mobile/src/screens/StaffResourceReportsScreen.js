import { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, EmptyState, Filters, LoadingState, Notice, Screen, SectionTitle, StatusBadge, ui } from '../components/UI';
import useOperationalUpdates from '../hooks/useOperationalUpdates';

const statuses = ['All', 'EN_ROUTE', 'DELIVERED'];
const displayTime = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : 'Not available';

export default function StaffResourceReportsScreen() {
  const data = useOperationalUpdates();
  const [status, setStatus] = useState('All');
  const visible = data.distributions.filter(item => status === 'All' || item.status === status);
  return <Screen title="Resource Reports" subtitle="Read-only Component 03 allocation and delivery status.">
    <Notice>Distribution records are synchronized from District Resource Coordination. Staff Officers cannot modify delivery status.</Notice>
    <View style={ui.row}><Card style={ui.flex}><Text style={ui.overline}>EN ROUTE</Text><Text style={ui.title}>{data.distributions.filter(item => item.status === 'EN_ROUTE').length}</Text></Card><Card style={ui.flex}><Text style={ui.overline}>DELIVERED</Text><Text style={ui.title}>{data.distributions.filter(item => item.status === 'DELIVERED').length}</Text></Card></View>
    <Filters values={statuses} selected={status} onChange={setStatus}/>
    {data.error && <Notice warning>{data.error}</Notice>}
    {data.loading ? <LoadingState message="Loading resource reports…"/> : visible.length === 0 ? <EmptyState icon="document-text-outline" title="No resource reports" message="No distributions match this status."/> : <><SectionTitle title="Distribution records"/>{visible.map(item => <Card key={item.id}><View style={ui.sectionRow}><View style={ui.flex}><Text style={ui.overline}>{item.distributionId}</Text><Text style={ui.cardTitle}>{item.item?.itemName || 'Resource allocation'}</Text></View><StatusBadge status={item.status}/></View><Text>Incident: <Text style={ui.cardTitle}>{item.incidentId}</Text></Text><Text style={ui.muted}>Shelter: {item.shelter?.name || 'Not available'}</Text><Text style={ui.muted}>Allocated: {item.quantity} {item.item?.unit || ''} · {item.item?.category || 'Resource'}</Text><Text style={ui.muted}>Warehouse / owner: {item.resourceOwner?.name || 'Not available'}</Text><Text style={ui.muted}>Delivery resource: {item.deliveryResource?.name || 'Not available'}</Text><Text style={ui.muted}>Issued: {displayTime(item.issuedAt || item.createdAt)}</Text><Text style={ui.muted}>{item.status === 'DELIVERED' ? `Delivered: ${displayTime(item.deliveredAt)}` : `ETA: ${displayTime(item.eta)}`}</Text></Card>)}</>}
  </Screen>;
}
