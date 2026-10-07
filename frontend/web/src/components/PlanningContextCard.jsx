import { ClipboardCheck } from 'lucide-react'
import { formatEnumLabel } from '../utils/responseOperationsRoutes'

export default function PlanningContextCard({ draft }) {
  return <section className="team-selection-card planning-context-card"><div className="team-card-heading"><span><ClipboardCheck size={18} /></span><div><h2>Planning Context</h2><p>Requirements received from Incident &amp; Response Planning.</p></div></div><div className="planning-context-facts"><div><span>Incident ID</span><strong>{draft.incidentId}</strong></div><div><span>Warning ID</span><strong>{draft.warningId || 'Not linked'}</strong></div><div><span>Priority</span><strong>{formatEnumLabel(draft.priority)}</strong></div><div><span>Existing response</span><strong>{draft.existingResponseId || 'None'}</strong></div></div><div className="capability-chip-list">{draft.requiredCapabilities.map((capability) => <span key={capability}>{formatEnumLabel(capability)}</span>)}</div><div className="planning-notes-preview"><span>Operational notes</span><p>{draft.operationalNotes || 'No operational notes provided.'}</p></div></section>
}
