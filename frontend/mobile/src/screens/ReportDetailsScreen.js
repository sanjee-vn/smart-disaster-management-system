import { Image, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, EmptyState, Icon, LoadingState, Notice, Screen, SectionTitle, StatusBadge, ui } from '../components/UI';
import { useReports } from '../context/ReportsContext';
import { coordinatesLabel, DISASTERS, formatDate, reportTimeline } from '../utils/reports.cjs';
import { colors as c } from '../theme';

export default function ReportDetailsScreen({ route, navigation }) {
  const { reports, loading, reload } = useReports();
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const [photoError, setPhotoError] = useState(false);
  const report = reports.find(item => item._id === route.params?.reportId);
  if (loading && !report) return <Screen insetTop={false} title="Report details"><LoadingState /></Screen>;
  if (!report) return <Screen insetTop={false} title="Report details"><EmptyState title="Report unavailable" message="This report is not saved on this device." action="My Reports" onPress={() => navigation.popTo('MainTabs', { screen: 'Reports' })} /></Screen>;
  const category = DISASTERS[report.disasterType];
  const photoUrl = report.photo && /^https?:\/\//i.test(report.photo) ? report.photo : null;
  return <Screen insetTop={false} title="Report details" subtitle="Your incident submission">
    <Card><View style={ui.row}><View style={styles.category}><Icon name={category.icon} color={category.color} size={28} /></View><Text style={ui.overline}>{report.disasterType.toUpperCase()}</Text></View><Text style={styles.title}>{report.title}</Text><View style={{ alignSelf: 'flex-start' }}><StatusBadge status={report.status} /></View></Card>
    <Notice>This status is synchronized with the latest DMC review.</Notice>
    <Card><SectionTitle title="What you observed" /><Text style={ui.muted}>{report.description}</Text></Card>
    <Card><SectionTitle title="Incident location" /><View style={ui.row}><Icon name="location-outline" /><Text selectable style={ui.muted}>{coordinatesLabel(report)}</Text></View><Button title="Show on map" secondary icon="map-outline" onPress={() => navigation.popTo('MainTabs', { screen: 'Map', params: { reportId: report._id } })} /></Card>
    {report.photo && <Card><SectionTitle title="Attached photo" />{photoUrl && !photoError ? <Image accessibilityLabel="Incident photograph" source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" onError={() => setPhotoError(true)} /> : <Text style={ui.muted}>The attached photo is not available on this device.</Text>}</Card>}
    <Card><SectionTitle title="Report timeline" />{reportTimeline(report).map((item, index, timeline) => <View key={item.title} style={styles.timelineRow}><View style={styles.track}><View style={[styles.timelineDot, item.complete && styles.complete]}>{item.complete && <Icon name="checkmark" size={11} color="white" />}</View>{index < timeline.length - 1 && <View style={styles.line} />}</View><View style={styles.timelineText}><Text style={[ui.cardTitle, !item.complete && { color: c.muted }]}>{item.title}</Text><Text style={ui.muted}>{item.detail}</Text></View></View>)}</Card>
    <Card><SectionTitle title="Submission information" /><Text style={ui.overline}>SUBMITTED · SRI LANKA TIME</Text><Text style={ui.muted}>{formatDate(report.createdAt)}</Text><Text style={ui.overline}>REPORT ID</Text><Text selectable style={styles.reference}>{report._id}</Text></Card>
  </Screen>;
}
const styles = StyleSheet.create({ title: { fontSize: 24, lineHeight: 32, color: c.text, fontWeight: '800' }, category: { padding: 12, backgroundColor: c.background, borderRadius: 12 }, photo: { width: '100%', height: 220, borderRadius: 12 }, timelineRow: { flexDirection: 'row', gap: 13 }, track: { width: 20, alignItems: 'center' }, timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#BFCFD3', alignItems: 'center', justifyContent: 'center' }, complete: { borderColor: c.primary, backgroundColor: c.primary }, line: { flex: 1, width: 2, minHeight: 30, backgroundColor: c.border, marginTop: 5 }, timelineText: { flex: 1, paddingBottom: 18 }, reference: { color: c.text, fontSize: 13 } });
