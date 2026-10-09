import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IncidentMap from '../components/IncidentMap';
import { Filters, Icon, LoadingState, Notice, StatusBadge, ui } from '../components/UI';
import useOperationalUpdates from '../hooks/useOperationalUpdates';
import { colors as c } from '../theme';

const OVERVIEW = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 5, longitudeDelta: 5 };
const parseCoordinates = value => {
  const numbers = String(value || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return numbers.length >= 2 && Math.abs(numbers[0]) <= 90 && Math.abs(numbers[1]) <= 180 ? { latitude: numbers[0], longitude: numbers[1] } : null;
};

export default function StaffMapScreen() {
  const data = useOperationalUpdates();
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const markers = useMemo(() => data.incidents.flatMap(incident => {
    const point = parseCoordinates(incident.affectedArea || incident.warning?.targetArea);
    return point ? [{ ...incident, ...point, _id: incident.id, title: `${incident.hazardType} · ${incident.district}`, disasterType: incident.hazardType }] : [];
  }), [data.incidents]);
  const types = [...new Set(markers.map(item => item.disasterType))];
  const visible = markers.filter(item => filter === 'All' || item.disasterType === filter);
  const selected = visible.find(item => item._id === selectedId);
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><View style={styles.top}><Text style={ui.title}>Operational Map</Text><Text style={ui.muted}>Active incident locations shared by Response Operations.</Text><Filters values={['All', ...types]} selected={filter} onChange={value => { setFilter(value); setSelectedId(null); }}/>{data.error && <Notice warning>{data.error}</Notice>}<Text style={styles.caption}>{data.loading ? 'Loading active incidents…' : `${visible.length} mapped active incident${visible.length === 1 ? '' : 's'} · ${data.incidents.length - markers.length} without coordinates`}</Text></View>
    <View style={styles.map}>{data.loading ? <LoadingState message="Loading operational map…"/> : <IncidentMap region={OVERVIEW} reports={visible} selectedId={selectedId} onSelect={setSelectedId}/>} {!selected && !data.loading && <View pointerEvents="none" style={styles.mapNote}><Text style={styles.mapNoteText}>{visible.length ? 'Tap an incident marker to view operational context' : 'No active incidents with coordinates are available'}</Text></View>}{selected && <ScrollView style={styles.selection} contentContainerStyle={styles.selectionContent}><View style={ui.sectionRow}><Text style={ui.overline}>{selected.incidentId}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close incident card" onPress={() => setSelectedId(null)} style={styles.close}><Icon name="close"/></Pressable></View><Text style={ui.cardTitle}>{selected.hazardType} · {selected.district}</Text><Text style={ui.muted}>{selected.affectedArea}</Text><View style={{ alignSelf: 'flex-start' }}><StatusBadge status={selected.status}/></View><Text style={ui.muted}>Severity: {selected.severity} · Affected population: {Number(selected.affectedPopulation || 0).toLocaleString()}</Text></ScrollView>}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, top: { padding: 20, gap: 10 }, caption: { color: c.muted, fontSize: 11 }, map: { flex: 1, minHeight: 180 }, mapNote: { position: 'absolute', bottom: 17, left: 20, right: 20, borderRadius: 11, padding: 12, backgroundColor: 'white' }, mapNoteText: { color: c.muted, fontSize: 12, textAlign: 'center' }, selection: { position: 'absolute', left: 12, right: 12, bottom: 12, maxHeight: '90%', backgroundColor: 'white', borderRadius: 18, elevation: 4 }, selectionContent: { padding: 16, gap: 9 }, close: { minHeight: 44, width: 44, alignItems: 'center', justifyContent: 'center' } });
