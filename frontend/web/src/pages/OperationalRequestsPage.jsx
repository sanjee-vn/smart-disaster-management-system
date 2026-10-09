import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { createOperationalRequest, getIncident, getOperationalRequests } from '../services/responseOperationsService'
import { loadPlanningRequirements, normalizeRequirements, personnelRequirementCodes, requirementLabels } from '../utils/responseRequirements'

export default function OperationalRequestsPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const planned = (state?.planningDraft?.requiredCapabilities || []).filter((code) => personnelRequirementCodes.includes(code))
  const planningRequirements = normalizeRequirements(state?.planningDraft?.requiredCapabilities || loadPlanningRequirements(incidentId))
  const [incident, setIncident] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ capability: planned[0] || 'RESCUE', requestedPersonnelCount: '', requestedLocation: '', requiredAt: '', priority: state?.planningDraft?.priority || 'HIGH', notes: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(state?.dispatchNotice || '')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextIncident, nextRequests] = await Promise.all([getIncident(incidentId), getOperationalRequests({ incidentId })])
      setIncident(nextIncident)
      setRequests(nextRequests)
      setForm((current) => ({ ...current, requestedLocation: current.requestedLocation || nextIncident.affectedArea || nextIncident.district }))
      return nextRequests
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load operational requests.')
      return null
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  useEffect(() => { queueMicrotask(load) }, [load])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const created = await createOperationalRequest({ incidentId, ...form, planningRequirements, requestedPersonnelCount: Number(form.requestedPersonnelCount), requiredAt: new Date(form.requiredAt).toISOString() })
      setForm((current) => ({ ...current, requestedPersonnelCount: '', requiredAt: '', notes: '' }))
      const nextRequests = await getOperationalRequests({ incidentId })
      setRequests(nextRequests)
      setNotice(`Request ${created.requestId} created successfully. Status: PENDING — waiting for District Resource Officer review.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to create operational request.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !incident) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading operational requests"/></div></DashboardLayout>
  if (!incident) return <DashboardLayout breadcrumb="Response Operations / Operational Requests"><div className="content"><div className="state error"><AlertTriangle size={28}/><h3>Incident request context unavailable</h3><p>{error || `No incident exists for ${incidentId}.`}</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Dashboard</button></div></div></DashboardLayout>

  return <DashboardLayout breadcrumb="Response Operations / Operational Requests"><div className="content response-operations-page">
    <button className="back-link" onClick={() => navigate(`/response-operations/incidents/${encodeURIComponent(incidentId)}`)}><ArrowLeft size={14}/> Incident Planning</button>
    <header className="response-page-header"><div><p className="warning-eyebrow">Response / Operations Officer</p><h1>Operational Response Requests</h1><p className="subtitle">Request personnel capabilities for {incident.incidentId}. District coordination reviews each request before dispatch.</p></div><button className="btn btn-secondary" disabled={busy} onClick={load}><RefreshCw size={14}/> Refresh</button></header>
    {error && <div className="response-partial-warning"><AlertTriangle size={17}/>{error}</div>}
    {notice && <div className="request-action-message success" role="status"><CheckCircle2 size={16}/>{notice}</div>}
    <form className="planning-card" onSubmit={submit}><h2>Create incident-scoped request</h2><div className="form-grid two-columns">
      <div className="field"><label>Capability</label><select value={form.capability} onChange={(event) => setForm({ ...form, capability: event.target.value })}>{personnelRequirementCodes.map((code) => <option key={code} value={code}>{requirementLabels[code]}</option>)}</select></div>
      <div className="field"><label>Personnel required</label><input type="number" min="1" required value={form.requestedPersonnelCount} onChange={(event) => setForm({ ...form, requestedPersonnelCount: event.target.value })}/></div>
      <div className="field"><label>Required location</label><input required value={form.requestedLocation} onChange={(event) => setForm({ ...form, requestedLocation: event.target.value })}/></div>
      <div className="field"><label>Required date/time</label><input type="datetime-local" required value={form.requiredAt} onChange={(event) => setForm({ ...form, requiredAt: event.target.value })}/></div>
      <div className="field"><label>Priority</label><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="field"><label>Notes</label><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}/></div>
    </div><button className="btn continue-btn" disabled={busy}>Create Request</button></form>
    <section className="response-panel"><div className="response-panel-heading"><div><h2>Requests for this incident</h2><p>Approval does not deploy a team. Dispatch remains a Response Officer action.</p></div><span>{requests.length}</span></div>
      {requests.length === 0 ? <div className="response-inline-state">No operational requests created.</div> : <div className="table-wrap"><table className="response-table"><thead><tr><th>Capability</th><th>Personnel</th><th>Location</th><th>Required</th><th>Priority</th><th>Status</th><th>Assigned Team / Result</th><th>Action</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><strong>{requirementLabels[request.capability]}</strong></td><td>{request.requestedPersonnelCount}</td><td>{request.requestedLocation}</td><td>{new Date(request.requiredAt).toLocaleString()}</td><td><StatusBadge value={request.priority}/></td><td><StatusBadge value={request.status}/></td><td>{request.approvedTeam?.name || request.rejectionReason || (request.status === 'APPROVED' ? 'Team selection pending' : 'Waiting for review')}</td><td>{request.status === 'APPROVED' ? <button className="btn response-row-action" disabled={busy} onClick={() => navigate(`/response-operations/incidents/${encodeURIComponent(incidentId)}/assignment?requestId=${encodeURIComponent(request.requestId)}`)}>Review Dispatch</button> : request.status === 'PENDING' ? 'Waiting review' : '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div></DashboardLayout>
}
