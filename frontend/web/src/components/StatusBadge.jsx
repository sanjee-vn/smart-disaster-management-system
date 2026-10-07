import { formatEnumLabel } from '../utils/responseOperationsRoutes'

export default function StatusBadge({ value, kind = 'status' }) {
  const slug = value?.toLowerCase().replaceAll('_', '-') || 'unknown'
  return <span className={`status-badge ${kind} ${slug}`}>{formatEnumLabel(value)}</span>
}
