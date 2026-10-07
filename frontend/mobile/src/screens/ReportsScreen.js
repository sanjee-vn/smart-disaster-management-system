import { useState } from 'react';
import { Button, EmptyState, Filters, LoadingState, Notice, ReportCard, Screen } from '../components/UI';
import { useReports } from '../context/ReportsContext';

const FILTERS = { All: null, Pending: 'PENDING', Verified: 'VERIFIED', Rejected: 'REJECTED' };
export default function ReportsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const { reports, loading, storageError, reload } = useReports();
  const visible = reports.filter(report => !FILTERS[filter] || report.status === FILTERS[filter]);
  return <Screen title="My Reports" subtitle="Track the incidents you have reported.">
    <Notice>Showing submissions saved on this device. Verification updates and reports from other devices are not synced yet.</Notice>
    <Filters values={Object.keys(FILTERS)} selected={filter} onChange={setFilter} />
    {storageError && <><Notice warning>{storageError}</Notice><Button title="Retry loading" secondary onPress={reload} /></>}
    {loading ? <LoadingState /> : visible.length ? visible.map(report => <ReportCard key={report._id} report={report} onPress={() => navigation.navigate('ReportDetails', { reportId: report._id })} />) : <EmptyState title={filter === 'All' ? 'Your first report starts here' : `No ${filter.toLowerCase()} reports`} message={filter === 'All' ? 'Submit an incident to see its receipt, location and details here.' : 'There are no saved reports with this status.'} action="Report an Incident" onPress={() => navigation.navigate('ReportIncident')} />}
  </Screen>;
}
