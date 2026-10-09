import { resolveAlertLocations } from '../services/alertLocations';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import IncidentMap from '../components/IncidentMap';
import { Button, Filters, Icon, StatusBadge, ui } from '../components/UI';
import { useReports } from '../context/ReportsContext';
import { coordinatesLabel, DISASTERS, formatDate } from '../utils/reports.cjs';
import { colors as c } from '../theme';
import { getPublishedAlerts } from '../services/reports';

const OVERVIEW = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 5, longitudeDelta: 5 };
function zoomTo(point) { return { latitude: point.latitude, longitude: point.longitude, latitudeDelta: 0.045, longitudeDelta: 0.045 }; }
export default function MapScreen({ route, navigation }) {
  const { reports, loading, storageError } = useReports();
  const [alerts, setAlerts] = useState([]);
  const [mappedAlerts, setMappedAlerts] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('All locations');
  const [alertLoading, setAlertLoading] = useState(true);
  const [alertError, setAlertError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    setAlertLoading(true); setAlertError('');
    getPublishedAlerts().then(async data => { if (active) { const activeAlerts = data.filter(alert => !alert.expiry || new Date(alert.expiry).getTime() > Date.now()); setAlerts(activeAlerts); setAlertLoading(false); await resolveAlertLocations(activeAlerts, pins => { if (active) setMappedAlerts(pins); }, () => active); } }).catch(() => { if (active) setAlertError('Unable to load alerts. Reopen the Map tab to retry.'); }).finally(() => { if (active) setAlertLoading(false); });
    return () => { active = false; };
  }, []));
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [region, setRegion] = useState(OVERVIEW);
  const [userLocation, setUserLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const visible = [...mappedAlerts, ...reports].filter(report => (filter === 'All' || report.disasterType === filter) && (sourceFilter === 'All locations' || (sourceFilter === 'Alerts' ? report.isAlert : !report.isAlert)));
  const selected = visible.find(report => report._id === selectedId);
  useFocusEffect(useCallback(() => {
    const report = reports.find(item => item._id === route.params?.reportId);
    if (report) { setFilter('All'); setSelectedId(report._id); setRegion(zoomTo(report)); }
  }, [reports, route.params?.reportId]));

  async function locate(search = false) {
    if (lock.current) return;
    if (search && !query.trim()) { setError('Enter a place name to search.'); return; }
    lock.current = true; setBusy(true); setError(''); Keyboard.dismiss();
    let timer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setError('Location permission is needed for location search and your position. Enable it in your phone settings.'); return; }
      const result = await Promise.race([
        search ? Location.geocodeAsync(query.trim()) : Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 20000); }),
      ]);
      const point = search ? result[0] : result.coords;
      if (!point) { setError('No matching location found. Try a town or a more specific place name.'); return; }
      if (!search) setUserLocation(point);
      setRegion(zoomTo(point)); setSelectedId(null);
    } catch { setError('Location could not be found. Check location services and your connection, then try again.'); }
    finally { clearTimeout(timer); lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.top}><Text style={ui.title}>Disaster Map</Text><Text style={ui.muted}>Explore published alerts and your report locations.</Text>
      <View style={styles.search}><Icon name="search-outline" color={c.muted} /><TextInput style={styles.input} accessibilityLabel="Search location" placeholder="Search a town or location" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} onSubmitEditing={() => locate(true)} returnKeyType="search" editable={!busy} /><Pressable accessibilityRole="button" accessibilityLabel="Search location" disabled={busy} onPress={() => locate(true)} style={styles.searchButton}>{busy ? <ActivityIndicator color={c.primary} /> : <Icon name="arrow-forward" />}</Pressable></View>
      <Filters values={['All locations', 'Alerts', 'My reports']} selected={sourceFilter} onChange={value => { setSourceFilter(value); setSelectedId(null); }} />
      <Filters values={['All', ...new Set([...Object.keys(DISASTERS), ...mappedAlerts.map(item => item.disasterType)])]} selected={filter} onChange={value => { setFilter(value); setSelectedId(null); }} />
      <Text style={styles.caption}>{loading || alertLoading ? 'Loading map locations...' : `${mappedAlerts.length} alert locations | ${reports.length} reports`}</Text>
      {alerts.some(alert => !mappedAlerts.some(pin => pin.id === alert.id)) && <Pressable onPress={() => navigation.navigate('Alerts')}><Text style={styles.caption}>{alerts.filter(alert => !mappedAlerts.some(pin => pin.id === alert.id)).length} alerts have no map location. View all alerts</Text></Pressable>}
      {!!(error || storageError || alertError) && <Text accessibilityLiveRegion="polite" style={styles.error}>{error || storageError || alertError}</Text>}
    </View>
    <View style={styles.map}><IncidentMap region={region} reports={visible} userLocation={userLocation} selectedId={selectedId} onSelect={id => { setSelectedId(id); const point = visible.find(item => item._id === id); if (point) setRegion(zoomTo(point)); }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Show my location" disabled={busy} onPress={() => locate()} style={styles.locate}><Icon name="locate-outline" /></Pressable>
      {!selected && <View pointerEvents="none" style={styles.mapNote}><Text style={styles.mapNoteText}>{visible.length ? 'Tap a marker to view details' : 'Sri Lanka overview · submit a report to add a marker'}</Text></View>}
      {selected && <ScrollView style={styles.selection} contentContainerStyle={styles.selectionContent}><View style={ui.sectionRow}><Text style={ui.overline}>{selected.disasterType.toUpperCase()}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close incident card" onPress={() => setSelectedId(null)} style={styles.close}><Icon name="close" size={20} /></Pressable></View><Text numberOfLines={2} style={ui.cardTitle}>{selected.title}</Text><Text style={styles.caption}>{coordinatesLabel(selected)} · {formatDate(selected.createdAt)}</Text>{selected.isAlert ? <><Text style={ui.cardTitle}>{selected.areaLabel || selected.district}</Text><Text style={ui.overline}>{selected.level} warning | {selected.district}</Text><Text style={ui.muted}>Affected areas: {(selected.areas || []).join(', ') || selected.district}</Text><Text style={ui.muted}>{selected.locationLabel}. Marker indicates a location, not an affected-area boundary.</Text><Text style={ui.cardTitle}>{selected.message}</Text><Text style={ui.muted}>{selected.instructions}</Text><Text style={styles.caption}>Starts: {formatDate(selected.start)} | Ends: {formatDate(selected.end)}
Expires: {formatDate(selected.expiry)}</Text></> : <><View style={{ alignSelf: 'flex-start' }}><StatusBadge status={selected.status} /></View><Button title="View report" onPress={() => navigation.navigate('ReportDetails', { reportId: selected._id })} /></>}</ScrollView>}
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, top: { padding: 20, gap: 10 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 13, borderWidth: 1, borderColor: c.border, borderRadius: 13, backgroundColor: 'white' }, input: { flex: 1, color: c.text, minHeight: 48, fontSize: 14 }, searchButton: { width: 46, height: 48, justifyContent: 'center', alignItems: 'center' }, caption: { color: c.muted, fontSize: 11, lineHeight: 17 }, error: { color: c.error, fontSize: 12, lineHeight: 18 }, map: { flex: 1, minHeight: 180 }, locate: { position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: 14, backgroundColor: 'white', elevation: 3, alignItems: 'center', justifyContent: 'center' }, mapNote: { position: 'absolute', bottom: 17, left: 20, right: 20, borderRadius: 11, padding: 12, backgroundColor: 'white' }, mapNoteText: { color: c.muted, fontSize: 12, textAlign: 'center' }, selection: { position: 'absolute', left: 12, right: 12, bottom: 12, maxHeight: '90%', backgroundColor: 'white', borderRadius: 18, elevation: 4 }, selectionContent: { padding: 16, gap: 9 }, close: { minHeight: 44, width: 44, alignItems: 'center', justifyContent: 'center' } });
