import { useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw, Send, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import ValidationMessage from '../components/ValidationMessage'
import WarningWorkflowSteps from '../components/WarningWorkflowSteps'
import useWarningReviewData from '../hooks/useWarningReviewData'
import { updateWarning } from '../services/responseOperationsService'

const severityGuidance = {
  WATCH: 'Conditions require monitoring.',
  WARNING: 'Significant hazard risk is present.',
  EMERGENCY: 'Immediate protective action is required.',
}

function ConfigureWarningContent({ warningId, warning, incident }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    targetArea: warning.targetArea || '',
    severity: warning.severity || '',
    message: warning.message || '',
    issuedBy: warning.issuedBy || 'Assessment Officer',
  })
  const [errors, setErrors] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setReviewing(false)
    setConfirmed(false)
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.targetArea.trim()) nextErrors.targetArea = 'Target area is required.'
    if (!['WATCH', 'WARNING', 'EMERGENCY'].includes(form.severity)) nextErrors.severity = 'Select a valid severity.'
    if (!form.message.trim()) nextErrors.message = 'Warning message is required.'
    if (!form.issuedBy.trim()) nextErrors.issuedBy = 'Issuing officer is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openReview = (event) => {
    event.preventDefault()
    if (!validate()) return
    setReviewing(true)
    setConfirmed(false)
  }

  const issueWarning = async () => {
    if (submitting || !validate()) return
    if (!confirmed) {
      setErrors((current) => ({ ...current, confirmation: 'Confirm that the warning is ready to issue.' }))
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await updateWarning(warningId, {
        targetArea: form.targetArea.trim(), severity: form.severity,
        message: form.message.trim(), issuedBy: form.issuedBy.trim(), issue: true,
      })
      navigate(`/warnings/${warningId}/status`)
    } catch (requestError) {
      const response = requestError.response?.data
      setSubmitError(response?.message || 'Unable to issue the warning. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="content configure-warning-page">
        <button className="back-link" onClick={() => navigate(`/warnings/${warningId}/review`)}><ArrowLeft size={15} /> Warning Review</button>
        <WarningWorkflowSteps warningId={warningId} current="configure" />
        <div className="page-heading configure-warning-heading"><div><p className="warning-eyebrow">Hazard Warning · Controlled issue workflow</p><h1>Configure Warning</h1><p className="subtitle">Review and configure the official warning before publication.</p></div><StatusBadge value={warning.status} /></div>

        <section className="warning-context-strip">
          <div><span>Warning ID</span><strong>{warning.warningId}</strong></div><div><span>Hazard type</span><strong>{warning.hazardType}</strong></div><div><span>District</span><strong>{warning.district}</strong></div><div><span>Current status</span><strong>{warning.status}</strong></div>
        </section>

        <section className="form-card">
          <div className="form-card-title"><span className="step-number">1</span><div><h2>Existing Hazard Context</h2><p>Verified warning and incident information. Hazard type cannot be changed here.</p></div></div>
          <dl className="warning-details configure-context-grid">
            <div><dt>Hazard type</dt><dd>{warning.hazardType}</dd></div><div><dt>District</dt><dd>{warning.district}</dd></div><div><dt>Affected area</dt><dd>{incident?.affectedArea || 'No linked incident data'}</dd></div><div><dt>Affected population</dt><dd>{incident?.affectedPopulation?.toLocaleString() || 'Not available'}</dd></div><div><dt>Current severity</dt><dd><StatusBadge value={warning.severity} kind="severity" /></dd></div><div><dt>Existing target area</dt><dd>{warning.targetArea}</dd></div><div><dt>Linked incident</dt><dd>{incident?.incidentId || 'Not linked'}</dd></div>
          </dl>
        </section>

        <form onSubmit={openReview} noValidate>
          <section className="form-card">
            <div className="form-card-title"><span className="step-number">2</span><div><h2>Warning Configuration</h2><p>Define the audience, operational severity, and official public message.</p></div></div>
            <div className="form-grid two-columns">
              <div className="field"><label htmlFor="targetArea">Target Area <em>*</em></label><input id="targetArea" value={form.targetArea} onChange={(event) => changeField('targetArea', event.target.value)} aria-invalid={Boolean(errors.targetArea)} /><ValidationMessage message={errors.targetArea} /></div>
              <div className="field"><label htmlFor="severity">Severity <em>*</em></label><select id="severity" value={form.severity} onChange={(event) => changeField('severity', event.target.value)} aria-invalid={Boolean(errors.severity)}><option value="">Select severity</option><option value="WATCH">WATCH</option><option value="WARNING">WARNING</option><option value="EMERGENCY">EMERGENCY</option></select><ValidationMessage message={errors.severity} /></div>
              <div className="field configure-message-field"><label htmlFor="message">Warning Message <em>*</em></label><textarea id="message" rows="6" maxLength="2000" placeholder="Enter the official warning and required protective action" value={form.message} onChange={(event) => changeField('message', event.target.value)} aria-invalid={Boolean(errors.message)} /><ValidationMessage message={errors.message} /></div>
              <div className="field"><label htmlFor="issuedBy">Issuing Officer <em>*</em></label><input id="issuedBy" value={form.issuedBy} onChange={(event) => changeField('issuedBy', event.target.value)} aria-invalid={Boolean(errors.issuedBy)} /><ValidationMessage message={errors.issuedBy} /></div>
            </div>
          </section>

          <section className="form-card severity-guidance-card">
            <div className="form-card-title"><span className="step-number">3</span><div><h2>Severity Guidance</h2><p>Use this guidance to support—not override—the officer's assessment.</p></div></div>
            <div className="severity-guidance-grid">{Object.entries(severityGuidance).map(([level, guidance]) => <div key={level} className={form.severity === level ? 'selected' : ''}><StatusBadge value={level} kind="severity" /><p>{guidance}</p></div>)}</div>
          </section>

          {!reviewing && <div className="form-actions"><button type="button" className="btn cancel-btn" onClick={() => navigate(`/warnings/${warningId}/review`)}>Cancel</button><div><span>No warning changes have been saved</span><button type="submit" className="btn continue-btn">Review Warning</button></div></div>}
        </form>

        {reviewing && <section className="form-card warning-issue-review">
          <div className="form-card-title"><span className="step-number"><CheckCircle2 size={16} /></span><div><h2>Review Warning</h2><p>Confirm every detail before publishing the official warning.</p></div></div>
          <dl className="warning-details"><div><dt>Warning ID</dt><dd>{warning.warningId}</dd></div><div><dt>Hazard</dt><dd>{warning.hazardType}</dd></div><div><dt>District</dt><dd>{warning.district}</dd></div><div><dt>Target area</dt><dd>{form.targetArea.trim()}</dd></div><div><dt>Severity</dt><dd><StatusBadge value={form.severity} kind="severity" /></dd></div><div><dt>Issuing officer</dt><dd>{form.issuedBy.trim()}</dd></div><div className="review-message"><dt>Message</dt><dd>{form.message.trim()}</dd></div></dl>
          <label className="warning-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setErrors((current) => ({ ...current, confirmation: '' })) }} /><span>I confirm that this warning is accurate and ready for official publication.</span></label>
          <ValidationMessage message={errors.confirmation} />
          {submitError && <div className="api-inline-error"><AlertTriangle size={15} />{submitError}</div>}
          <div className="form-actions"><button type="button" className="btn cancel-btn" disabled={submitting} onClick={() => { setReviewing(false); setConfirmed(false) }}>Edit Configuration</button><div><span>This action updates the official warning record</span><button type="button" className="btn issue-warning-btn" disabled={submitting || !confirmed} onClick={issueWarning}><Send size={15} /> {submitting ? 'Issuing Warning…' : 'Issue Warning'}</button></div></div>
        </section>}
      </div>
    </DashboardLayout>
  )
}

export default function ConfigureWarningPage() {
  const { warningId } = useParams()
  const navigate = useNavigate()
  const { warning, incident, loading, error, notFound, retry } = useWarningReviewData(warningId)

  if (loading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading warning configuration" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Warning not found</h3><p>No warning record exists for {warningId}.</p><button className="btn btn-primary" onClick={() => navigate(`/warnings/${warningId}/review`)}>Back to Warning Review</button></div></div></DashboardLayout>
  if (error || !warning) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to configure warning</h3><p>{error || 'Warning data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button><button className="btn btn-secondary" onClick={() => navigate(`/warnings/${warningId}/review`)}>Back to Warning Review</button></div></div></DashboardLayout>

  return <ConfigureWarningContent key={warning.warningId} warningId={warningId} warning={warning} incident={incident} />
}
