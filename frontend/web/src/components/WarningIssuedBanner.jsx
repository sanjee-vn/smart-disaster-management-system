import { CheckCircle2 } from 'lucide-react'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not available'

export default function WarningIssuedBanner({ warning }) {
  return (
    <section className="warning-issued-banner">
      <span className="warning-issued-icon"><CheckCircle2 size={24} /></span>
      <div className="warning-issued-copy"><h2>Official warning issued successfully</h2><p>The final warning is active and available to emergency-response coordinators.</p></div>
      <dl><div><dt>Warning ID</dt><dd>{warning.warningId}</dd></div><div><dt>Issued at</dt><dd>{formatDateTime(warning.issuedAt)}</dd></div><div><dt>Issued by</dt><dd>{warning.issuedBy || 'Not available'}</dd></div></dl>
    </section>
  )
}
