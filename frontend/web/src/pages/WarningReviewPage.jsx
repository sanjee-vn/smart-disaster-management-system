import { AlertTriangle, ArrowLeft, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import HazardAssessmentCard from '../components/HazardAssessmentCard'
import StatusBadge from '../components/StatusBadge'
import TargetAreaPanel from '../components/TargetAreaPanel'
import WarningOverviewCard from '../components/WarningOverviewCard'
import WarningSummaryCard from '../components/WarningSummaryCard'
import { warningReviewDemoEvidence } from '../data/warningReviewDemoContent'
import useWarningReviewData from '../hooks/useWarningReviewData'

export default function WarningReviewPage() {
  const { warningId } = useParams()
  const navigate = useNavigate()
  const { warning, incident, loading, error, incidentError, notFound, retry } = useWarningReviewData(warningId)

  if (!warningId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={26} /><h3>Warning ID is missing</h3><p>Open this page from a valid warning record.</p><button className="btn btn-primary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (loading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading warning review" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Warning not found</h3><p>No warning record exists for {warningId}.</p><button className="btn btn-primary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (error || !warning) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load warning</h3><p>{error || 'Warning data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={13} /> Retry</button><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="content warning-review-page">
        <button className="back-link" onClick={() => navigate('/response-operations')}><ArrowLeft size={15} /> Response Operations</button>
        <div className="warning-page-header">
          <div><p className="warning-eyebrow">Hazard Warning · Read-only review</p><h1>Warning Review</h1><p className="subtitle">Review verified hazard information before configuring an official warning.</p><div className="warning-header-badges"><StatusBadge value={warning.severity} kind="severity" /><StatusBadge value={warning.status} /></div></div>
          <div className="warning-header-meta"><div><span>Warning ID</span><strong>{warning.warningId}</strong></div><div><span>Hazard</span><strong>{warning.hazardType}</strong></div><div><span>District</span><strong>{warning.district}</strong></div><div><span>Target area</span><strong>{warning.targetArea}</strong></div></div>
        </div>

        <div className="warning-content-grid">
          <WarningOverviewCard warning={warning} />
          <HazardAssessmentCard warning={warning} incident={incident} incidentError={incidentError} evidence={warningReviewDemoEvidence} />
          <TargetAreaPanel warning={warning} incident={incident} />
          <WarningSummaryCard warning={warning} incident={incident} />
        </div>

        <div className="warning-actions"><button className="btn cancel-btn" onClick={() => navigate('/response-operations')}><ArrowLeft size={14} /> Back to Response Operations</button><div><span>This review does not modify the warning record</span><button className="btn continue-btn" onClick={() => navigate(`/warnings/${warning.warningId}/configure`)}>Configure Warning <ArrowRight size={15} /></button></div></div>
      </div>
    </DashboardLayout>
  )
}
