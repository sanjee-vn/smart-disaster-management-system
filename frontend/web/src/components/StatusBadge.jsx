import { formatEnumLabel } from '../utils/responseOperationsRoutes'

export default function StatusBadge({ value, kind = 'status' }) {
  const slug = value?.toLowerCase().replaceAll('_', '-') || 'unknown'
  return <span style={value === 'NOT_DISPATCHED' ? { color: '#B42318', backgroundColor: '#FEE4E2' } : undefined} className={`status-badge ${kind} ${slug}`}>{formatEnumLabel(value)}</span>
}
