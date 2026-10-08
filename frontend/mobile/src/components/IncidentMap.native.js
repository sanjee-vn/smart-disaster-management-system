import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors as c } from '../theme';
import { DISASTERS } from '../utils/reports.cjs';

export default function IncidentMap({ region, reports, userLocation, selectedId, onSelect }) {
  const map = useRef(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 15000); return () => clearTimeout(timer); }, []);
  useEffect(() => { if (ready) map.current?.animateToRegion(region, 450); }, [region, ready]);
  return <View style={styles.container}>
    <MapView ref={map} style={StyleSheet.absoluteFillObject} initialRegion={region} onMapReady={() => setReady(true)} showsUserLocation={!!userLocation} showsMyLocationButton={false} toolbarEnabled={false}>
      {reports.map(report => <Marker key={report._id} identifier={report._id} coordinate={{ latitude: report.latitude, longitude: report.longitude }} pinColor={DISASTERS[report.disasterType]?.color || c.primary} title={report.title} description={report.disasterType} opacity={selectedId && selectedId !== report._id ? 0.6 : 1} onPress={() => onSelect(report._id)} />)}
    </MapView>
    {!ready && <View style={styles.loading}><ActivityIndicator color={c.primary} /><Text style={styles.text}>{slow ? 'Map is taking longer to load. Check your internet connection.' : 'Loading map…'}</Text></View>}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#E5ECEE' }, loading: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EDF3F4', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 }, text: { color: c.muted, textAlign: 'center', lineHeight: 22 } });
