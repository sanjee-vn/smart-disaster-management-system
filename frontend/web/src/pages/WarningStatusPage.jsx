import { AlertTriangle, ArrowLeft, ArrowRight, Edit3, RefreshCw, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import DeliveryStatusPanel from '../components/DeliveryStatusPanel'
import LinkedIncidentCard from '../components/LinkedIncidentCard'
import StatusBadge from '../components/StatusBadge'
import WarningDetailsCard from '../components/WarningDetailsCard'
import WarningIssuedBanner from '../components/WarningIssuedBanner'
import WarningWorkflowSteps from '../components/WarningWorkflowSteps'
import { warningDeliveryChannels } from '../data/warningDeliveryDemoData'
import useWarningReviewData from '../hooks/useWarningReviewData'

export default function WarningStatusPage() {
  const { warningId } = useParams()
  const navigate = useNavigate()
  const { warning, incident, loading, error, incidentError, notFound, retry } = useWarningReviewData(warningId)

  if (!warningId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Warning ID is missing</h3><p>Open this page from a valid warning record.</p><button className="btn btn-secondary" onClick={() => navigate('/?view=warnings')}>Back to Warnings</button></div></div></DashboardLayout>
  if (loading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading warning status" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Warning not found</h3><p>No warning record exists for {warningId}.</p><button className="btn btn-secondary" onClick={() => navigate(`/warnings/${warningId}/review`)}>Back to Warning Review</button></div></div></DashboardLayout>
  if (error || !warning) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load warning status</h3><p>{error || 'Warning data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button><button className="btn btn-secondary" onClick={() => navigate(`/warnings/${warningId}/review`)}>Back to Warning Review</button></div></div></DashboardLayout>

  const isActive = warning.status === 'ACTIVE'
  return (
    <DashboardLayout>
      <div className="content warning-status-page">
        <button className="back-link" onClick={() => navigate(`/warnings/${warningId}/review`)}><ArrowLeft size={15} /> Warning Review</button>
        <WarningWorkflowSteps warningId={warningId} current="status" />
        <header className="warning-status-header">
          <div><p className="warning-eyebrow">Hazard Warning · Publication Status</p><h1>{isActive ? 'Warning Issued' : 'Warning Not Yet Active'}</h1><p className="subtitle">{isActive ? 'The official warning has been published and emergency-response coordination can now begin.' : 'This warning must be configured and issued before emergency-response coordination can begin.'}</p></div>
          <div className="warning-header-badges"><StatusBadge value={warning.status} /><StatusBadge value={warning.severity} kind="severity" /></div>
        </header>

        {!isActive && <section className="warning-inactive-panel"><AlertTriangle size={23} /><div><h2>This warning is currently {warning.status}</h2><p>Return to configuration to validate and issue the official warning.</p></div><button className="btn continue-btn" onClick={() => navigate(`/warnings/${warningId}/configure`)}>Configure Warning <ArrowRight size={14} /></button></section>}
        {isActive && <WarningIssuedBanner warning={warning} />}
        <div className="warning-status-grid">
          <WarningDetailsCard warning={warning} />
          {isActive && <DeliveryStatusPanel channels={warningDeliveryChannels} />}
          {isActive && <LinkedIncidentCard incident={incident} error={incidentError} onRetry={retry} />}
        </div>

        <div className="warning-actions warning-status-actions">
          <button className="btn cancel-btn" onClick={() => navigate(`/warnings/${warningId}/review`)}><ArrowLeft size={14} /> Back to Warning Review</button>
          <div><button className="btn cancel-btn" onClick={() => navigate(`/warnings/${warningId}/configure`)}><Edit3 size={14} /> Reconfigure Warning</button>{isActive && <button className="btn continue-btn" disabled={!incident || Boolean(incidentError)} title={!incident ? 'A linked incident is required to start emergency response' : undefined} onClick={() => navigate('/response-operations', { state: { selectedIncidentId: incident.incidentId } })}>Start Emergency Response <ArrowRight size={15} /></button>}</div>
        </div>
        {isActive && !incident && !incidentError && <p className="response-transition-note">Emergency response cannot start until an incident is linked to this warning.</p>}
      </div>
    </DashboardLayout>
  )
}
