const DISASTERS = {
  Flood: { icon: 'water-outline', color: '#2677B8' },
  Landslide: { icon: 'trail-sign-outline', color: '#B66D26' },
  Storm: { icon: 'thunderstorm-outline', color: '#7C5AB5' },
  Drought: { icon: 'sunny-outline', color: '#9E8023' },
  Fire: { icon: 'flame-outline', color: '#C54A45' },
  Earthquake: { icon: 'pulse-outline', color: '#926850' },
  Other: { icon: 'ellipsis-horizontal-outline', color: '#637E8B' },
};
const STATUSES = {
  PENDING: { label: 'Pending verification', color: '#8E651B', background: '#FFF3DB' },
  VERIFIED: { label: 'Verified', color: '#1C7855', background: '#E4F4EB' },
  REJECTED: { label: 'Rejected', color: '#B04444', background: '#FCEAEA' },
  CLARIFICATION_REQUESTED: { label: 'More information requested', color: '#8E651B', background: '#FFF3DB' },
  FORWARDED_TO_DUTY_OFFICER: { label: 'Verified and forwarded', color: '#266DA4', background: '#E7F1FB' },
  WARNING_ISSUED: { label: 'Warning issued', color: '#B04444', background: '#FCEAEA' },
  RESPONSE_INITIATED: { label: 'Response initiated', color: '#266DA4', background: '#E7F1FB' },
  RESOLVED: { label: 'Resolved', color: '#1C7855', background: '#E4F4EB' },
};
function statusInfo(status) {
  return STATUSES[status] || { label: 'Status unavailable', color: '#617783', background: '#ECF1F4' };
}
function coordinatesLabel(report) {
  return Number.isFinite(report?.latitude) && Number.isFinite(report?.longitude)
    ? `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}` : 'Location unavailable';
}
function formatDate(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime())
    ? date.toLocaleString('en-LK', { timeZone: 'Asia/Colombo', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Date unavailable';
}
function isReport(value) {
  return value && typeof value._id === 'string' && typeof value.title === 'string'
    && typeof value.description === 'string' && typeof value.citizenId === 'string'
    && !!DISASTERS[value.disasterType] && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
    && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
function mergeReports(current, incoming) {
  const byId = new Map();
  for (const report of [...current, ...incoming]) if (isReport(report)) byId.set(report._id, report);
  return [...byId.values()].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}
function reportTimeline(report) {
  const items = [{ title: 'Report submitted', detail: formatDate(report.createdAt), complete: true }];
  if (report.status === 'REJECTED') return [...items, { title: 'Report rejected', detail: formatDate(report.updatedAt), complete: true }];
  const stage = { PENDING: 0, CLARIFICATION_REQUESTED: 0, VERIFIED: 1, FORWARDED_TO_DUTY_OFFICER: 1, WARNING_ISSUED: 2, RESPONSE_INITIATED: 2, RESOLVED: 3 }[report.status] ?? 0;
  return [...items, ...['Verification', 'Response initiated', 'Resolved'].map((title, index) => ({
    title: title === 'Verification' ? stage >= 1 ? 'Report verified' : 'Verification pending' : title,
    complete: stage > index,
    detail: stage > index ? 'Recorded in report status' : 'Not recorded yet',
  }))];
}
module.exports = { DISASTERS, STATUSES, statusInfo, coordinatesLabel, formatDate, isReport, mergeReports, reportTimeline };
