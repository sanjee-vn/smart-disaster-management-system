import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button, EmptyState, Filters, LoadingState, Notice, ReportCard, Screen } from '../components/UI';
import { useReports } from '../context/ReportsContext';

const FILTERS = { All: null, Pending: ['PENDING', 'CLARIFICATION_REQUESTED'], Verified: ['VERIFIED', 'FORWARDED_TO_DUTY_OFFICER', 'WARNING_ISSUED'], Rejected: ['REJECTED'] };
export default function ReportsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const { reports, loading, storageError, reload } = useReports();
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const visible = reports.filter(report => !FILTERS[filter] || FILTERS[filter].includes(report.status));
  return <Screen title="My Reports" subtitle="Track the incidents you have reported.">
    <Notice>Report statuses are synchronized with DMC review updates.</Notice>
    <Filters values={Object.keys(FILTERS)} selected={filter} onChange={setFilter} />
    {storageError && <><Notice warning>{storageError}</Notice><Button title="Retry loading" secondary onPress={reload} /></>}
    {loading ? <LoadingState /> : visible.length ? visible.map(report => <ReportCard key={report._id} report={report} onPress={() => navigation.navigate('ReportDetails', { reportId: report._id })} />) : <EmptyState title={filter === 'All' ? 'Your first report starts here' : `No ${filter.toLowerCase()} reports`} message={filter === 'All' ? 'Submit an incident to see its receipt, location and details here.' : 'There are no saved reports with this status.'} action="Report an Incident" onPress={() => navigation.navigate('ReportIncident')} />}
  </Screen>;
}
