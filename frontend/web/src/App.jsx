import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Menu, MoreHorizontal, Send, Siren, X, Activity } from 'lucide-react';
import { Badge, Brand, Button, Field, Header, MapPanel } from './components/ui.jsx';
import DashboardScreen from './components/screens/Dashboard.jsx';
import HazardDetailsScreen from './components/screens/HazardDetails.jsx';
import EventAssessmentScreen from './components/screens/EventAssessment.jsx';
import WarningLevelScreen from './components/screens/WarningLevel.jsx';
import AffectedAreaScreen from './components/screens/AffectedArea.jsx';
import WarningReviewScreen from './components/screens/WarningReview.jsx';
import DeliveryStatusScreen from './components/screens/DeliveryStatus.jsx';
import WarningRegisterScreen from './components/screens/WarningRegister.jsx';
import useHazardWarningData from './hooks/useHazardWarningData';
import { getApiErrorMessage } from './services/apiClient';
import { DmcReportReviewPage, DutyIncidentReportsPanel } from './pages/DemoRolePortals.jsx';
import AuthPage from './pages/AuthPages.jsx';
import { clearAuthSession, readAuthSession, saveAuthSession } from './services/authService';
import { getGroundReports, reviewGroundReport } from './services/reportWorkflowService';
import ResponseOperationsDashboard from './pages/ResponseOperationsDashboard.jsx';
import IncidentPlanningPage from './pages/IncidentPlanningPage.jsx';
import TeamSelectionPage from './pages/TeamSelectionPage.jsx';
import ResponseAssignmentPage from './pages/ResponseAssignmentPage.jsx';
import ShelterCoordinationPage from './pages/ShelterCoordinationPage.jsx';
import ResourceCoordinationDashboard from './pages/ResourceCoordinationDashboard.jsx';
import CreateDistributionPage from './pages/CreateDistributionPage.jsx';
import ReviewDistributionPage from './pages/ReviewDistributionPage.jsx';
import ProcessingDistributionPage from './pages/ProcessingDistributionPage.jsx';
import DistributionSuccessPage from './pages/DistributionSuccessPage.jsx';
import ResponseMonitoringPage from './pages/ResponseMonitoringPage.jsx';
import './App.css';

const initialWarning = {
  level: 'High', urgency: 'Immediate', confidence: 'High', recommendation: 'Issue a public warning to flood-prone communities and coordinate evacuation readiness with local authorities.',
  districts: ['Gampaha'], areas: ['Gampaha', 'Kelaniya', 'Wattala'], title: 'Flood Warning — Gampaha District',
  message: 'Heavy rainfall has caused rising water levels in parts of Gampaha District. Residents in low-lying areas should move to safe locations and follow instructions from local authorities.',
  instructions: 'Move to higher ground. Keep emergency supplies ready. Do not walk or drive through flood water. Call 117 for emergency assistance.',
  language: 'English', format: 'Text + Map Link', channels: ['Push Notification', 'SMS Alert', 'Audible / Siren'],
  start: '2026-10-07T10:00', end: '2026-10-08T10:00', expiry: '2026-10-08T12:00', remarks: 'Hazard data reviewed and cross-checked with field reports.',
}

const getDefaultSchedule = () => {
  const start = new Date(Date.now() + 5 * 60 * 1000)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const toDateTimeLocal = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16)
  return { start: toDateTimeLocal(start), end: toDateTimeLocal(end), expiry: toDateTimeLocal(end) }
}

const navItems = [
  { label: 'Hazard Monitoring', icon: Activity, screen: 'dashboard' },
  { label: 'Incident Reports', icon: ClipboardList, screen: 'incidents' },
  { label: 'Warnings', icon: Siren, screen: 'warnings' },
]

function HazardWarningApp({ activeReport, onWarningIssued, onLogout, reports = [], onSelectReport, portalRole = 'duty' }) {
  const { hazards, warnings, loading, error, refresh, updateHazard: saveHazard, ensureReportHazard, loadDraft, saveDraft: persistDraft, publish, retry, escalate, cancel } = useHazardWarningData()
  const [screen, setScreen] = useState('dashboard')
  const [selectedHazardId, setSelectedHazardId] = useState('')
  const [warning, setWarning] = useState(initialWarning)
  const [filter, setFilter] = useState({ search: '', type: 'All types', district: 'All districts', severity: 'All severities', status: 'All statuses' })
  const [modal, setModal] = useState('')
  const [toast, setToast] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeNav, setActiveNav] = useState('Hazard Monitoring')
  const [issueId, setIssueId] = useState('')
  const [page, setPage] = useState(1)
  const [checks, setChecks] = useState([true, true, true, true])
  const [reportCount, setReportCount] = useState('6')
  const [photoCount, setPhotoCount] = useState('14')
  const [evidenceRequested, setEvidenceRequested] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [workflowReportId, setWorkflowReportId] = useState('')

  const selectedHazard = hazards.find((hazard) => hazard.id === selectedHazardId) || hazards[0]
  const issuedWarning = warnings.find((item) => item.id === issueId) || warnings[0]

  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer) }, [toast])

  const filteredHazards = useMemo(() => hazards.filter((hazard) => {
    const query = filter.search.trim().toLowerCase()
    return (!query || `${hazard.id} ${hazard.type} ${hazard.district}`.toLowerCase().includes(query))
      && (filter.type === 'All types' || hazard.type === filter.type)
      && (filter.district === 'All districts' || hazard.district === filter.district)
      && (filter.severity === 'All severities' || hazard.severity === filter.severity)
      && (filter.status === 'All statuses' || hazard.status === filter.status)
  }), [hazards, filter])

  const navigate = (destination, navLabel) => {
    setScreen(destination)
    if (navLabel) setActiveNav(navLabel)
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openReportWarning = async (report) => {
    if (portalRole !== 'duty') { setToast('Only a Duty Officer account can issue a warning.'); return }
    try {
      const hazard = await ensureReportHazard(report.id)
      setWorkflowReportId(report.id)
      if (onSelectReport) onSelectReport(report)
      setSelectedHazardId(hazard.id)
      setEvidenceRequested(false)
      setWarning((current) => ({
        ...current,
        ...getDefaultSchedule(),
        level: report.severity || hazard.severity || 'High',
        title: `${report.disasterType || hazard.type} Warning — ${hazard.district}`,
        message: report.description,
        districts: [hazard.district],
        areas: [report.areaLabel || hazard.district],
        remarks: `Based on verified citizen report ${report.reportId || report.id}.`,
      }))
      navigate('assessment', 'Assessments')
    } catch (requestError) {
      setToast(getApiErrorMessage(requestError, 'Could not prepare this report for warning creation.'))
    }
  }
  const beginWarning = async (id = selectedHazardId || hazards[0]?.id) => {
    if (portalRole !== 'duty') { setToast('Only a Duty Officer account can issue a warning.'); return }
    const hazard = hazards.find((item) => item.id === id)
    if (!hazard) { setToast('Load hazard records before starting a warning'); return }
    setSelectedHazardId(id)
    setEvidenceRequested(false)
    let draft = null
    try { draft = await loadDraft(id) }
    catch (requestError) { setToast(getApiErrorMessage(requestError, 'Could not load the saved draft.')) }
    setWarning(() => ({ ...initialWarning, ...getDefaultSchedule(), ...(draft?.warning || {}), districts: draft?.warning?.districts || [hazard.district], areas: draft?.warning?.areas || [hazard.district] }))
    navigate('assessment', 'Assessments')
  }
  const saveDraft = async () => {
    try {
      await persistDraft(selectedHazardId, warning)
      setToast('Warning draft saved to MongoDB.')
      return true
    } catch (requestError) {
      setToast(getApiErrorMessage(requestError, 'Could not save the warning draft.'))
      return false
    }
  }
  const updateHazard = async (key, value) => {
    try { await saveHazard(selectedHazardId, { [key]: value }) }
    catch (requestError) { setToast(getApiErrorMessage(requestError, 'Could not update the hazard.')) }
  }
  const updateWarning = (key, value) => setWarning((current) => ({ ...current, [key]: value }))
  const toggleInList = (key, value) => updateWarning(key, warning[key].includes(value) ? warning[key].filter((item) => item !== value) : [...warning[key], value])
  const publishWarning = async () => {
    if (publishing) return
    setPublishing(true)
    try {
      const sourceReportId = workflowReportId || activeReport?.id
      const created = await publish({ hazardId: selectedHazardId, reportId: sourceReportId, warning })
      setIssueId(created.id)
      setModal('')
      if (sourceReportId && onWarningIssued) onWarningIssued(sourceReportId, created.id)
      setWorkflowReportId('')
      navigate('delivery', 'Warnings')
      setToast('Warning recorded and queued. No external delivery provider is connected.')
    } catch (requestError) {
      setToast(getApiErrorMessage(requestError, 'Could not publish the warning.'))
    } finally {
      setPublishing(false)
    }
  }
  const retryChannel = async (id, channel) => {
    try { await retry(id, channel); setToast(`${channel} retry recorded in the queue.`) }
    catch (requestError) { setToast(getApiErrorMessage(requestError, 'Could not queue this retry.')) }
  }
  const dispatchEscalation = async () => {
    try { await escalate(issueId); setToast('Warning marked for regional review.'); setModal('') }
    catch (requestError) { setToast(getApiErrorMessage(requestError, 'Could not escalate the warning.')) }
  }
  const cancelIssuedWarning = async () => {
    try { await cancel(issueId); setToast('Warning cancelled.'); setModal('') }
    catch (requestError) { setToast(getApiErrorMessage(requestError, 'Could not cancel the warning.')) }
  }
  const toggleCheck = (index) => setChecks((current) => current.map((item, i) => i === index ? !item : item))

  const screenProps = { Header, Badge, Button, Field, MapPanel, hazards, selectedHazard, selectedHazardId, setSelectedHazardId, warning, setWarning, warnings, issuedWarning, filter, setFilter, filteredHazards, navigate, beginWarning, updateHazard, updateWarning, toggleInList, saveDraft, retryChannel, refreshData: refresh, setModal, setToast, setPage, page, reportCount, setReportCount, photoCount, setPhotoCount, setIssueId, evidenceRequested, setEvidenceRequested, checks, toggleCheck, publishWarning, cancelIssuedWarning };
  const pageByScreen = { dashboard: DashboardScreen, details: HazardDetailsScreen, assessment: EventAssessmentScreen, level: WarningLevelScreen, area: AffectedAreaScreen, review: WarningReviewScreen, delivery: DeliveryStatusScreen, warnings: WarningRegisterScreen };
  const warningsWithHazardNames = warnings.map((item) => {
    const hazard = hazards.find((candidate) => candidate.id === item.hazardId)
    return {
      ...item,
      hazardId: hazard ? `${hazard.type} — ${hazard.district}` : item.warning?.title || item.title || 'Hazard report',
    }
  })
  const currentScreen = screen === 'incidents'
    ? <DutyIncidentReportsPanel reports={reports} onIssueWarning={(report) => {
      if (portalRole !== 'duty') { setToast('Only a Duty Officer account can issue or review warning dispatch.'); return }
      if (report.status === 'WARNING_ISSUED') navigate('warnings', 'Warnings')
      else openReportWarning(report)
    }} />
    : screen === 'warnings'
      ? <WarningRegisterScreen {...screenProps} warnings={warningsWithHazardNames} />
      : React.createElement(pageByScreen[screen] || DashboardScreen, screenProps);

  return <div className="app-shell" data-portal-role={portalRole}><aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}><Brand/><div className="nav-caption">{portalRole === 'district' ? 'DISTRICT OFFICER' : 'DUTY OFFICER'}</div><nav>{navItems.filter(({ label }) => portalRole === 'duty' || label !== 'Warnings').map(({ label, icon: Icon, screen: destination }) => <button key={label} className={`nav-item ${activeNav === label ? 'nav-active' : ''}`} onClick={() => navigate(destination, label)}><Icon size={18}/><span>{label}</span>{label === 'Warnings' && warnings.length > 0 && <small>{warnings.length}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="connection-status"><i className="online-dot"/><span>{loading ? 'Connecting to API' : error ? 'API unavailable' : 'API connected'}</span></div><button className="user-card" onClick={onLogout}><span className="avatar">{portalRole === 'district' ? 'DS' : 'DO'}</span><span><b>{portalRole === 'district' ? 'District Officer' : 'Duty Officer'}</b><small>{portalRole === 'district' ? 'District Operations' : 'DMC · National Operations'}</small></span><span className="user-signout">Sign out</span></button></div></aside>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button><div className="topbar-breadcrumb"><span>Operations</span><ChevronRight size={14}/><b>{activeNav}</b></div><div className="topbar-actions"><span className="topbar-date">{new Date().toLocaleDateString('en-LK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span><button className="notification-button" aria-label="Notifications" onClick={() => setToast('You are up to date with all system notifications')}><Bell size={19}/><i/></button><div className="topbar-user"><span className="avatar">AO</span><span><b>Assessment Officer</b><small>National Operations</small></span><ChevronDown size={14}/></div></div></header><div className="content-area">{error && <div className="api-status-banner" role="alert"><span>{error}</span><Button variant="secondary-blue" onClick={() => void refresh()}>Retry connection</Button></div>}{!loading && !error && hazards.length === 0 && <div className="api-status-banner"><span>No hazard records found. Start the backend, then run <code>npm run seed:hazards</code> from the backend folder.</span><Button variant="secondary-blue" onClick={() => void refresh()}>Refresh</Button></div>}{currentScreen}<footer className="page-footer"><span>SDEWS · Smart Disaster Early-Warning System</span><span>Hazard and warning records stored in MongoDB <i className="online-dot"/></span></footer></div></main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal('') }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close icon-button" aria-label="Close dialog" onClick={() => setModal('')}><X size={19}/></button>{modal === 'hazard-actions' ? <><span className="modal-icon amber"><MoreHorizontal/></span><h2 id="modal-title">Hazard actions</h2><p>Choose an action for {selectedHazard.id} in {selectedHazard.district}.</p><div className="modal-actions vertical"><Button variant="primary" onClick={() => { setModal(''); navigate('details', 'Hazard Monitoring') }}>Review hazard details</Button><Button variant="teal-button" onClick={() => { setModal(''); beginWarning(selectedHazard.id) }}>Create warning draft</Button><Button onClick={() => setModal('')}>Close</Button></div></> : modal === 'publish' ? <><span className="modal-icon warning-icon"><AlertTriangle/></span><div className="modal-eyebrow">FINAL CONFIRMATION</div><h2 id="modal-title">Confirm publication</h2><p>You are about to publish this <b>{warning.level.toLowerCase()} warning</b> to <b>{warning.areas.length} affected areas</b> through {warning.channels.join(', ')}. This records the warning and adds it to the delivery queue. No external channel provider will send it from this build.</p><div className="modal-summary"><span>Hazard <b>{selectedHazard.id}</b></span><span>Target audience <b>{(warning.areas.length * 12480).toLocaleString()} people</b></span></div><div className="modal-actions"><Button onClick={() => setModal('')}>No, go back</Button><Button variant="danger-button" icon={Send} disabled={publishing} onClick={publishWarning}>{publishing ? 'Recording?' : 'Record warning'}</Button></div></> : modal === 'escalate' ? <><span className="modal-icon blue"><ArrowRight/></span><div className="modal-eyebrow">ESCALATION</div><h2 id="modal-title">Escalate this warning?</h2><p>This marks the warning for regional review. No external authority notification is configured.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Go back</Button><Button variant="primary" onClick={dispatchEscalation}>Confirm escalation</Button></div></> : modal === 'cancel-warning' ? <><span className="modal-icon danger"><X/></span><div className="modal-eyebrow">STOP DELIVERY</div><h2 id="modal-title">Cancel this warning?</h2><p>Further delivery attempts will stop. The issued warning will be marked as cancelled in the audit history.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Keep warning active</Button><Button variant="danger-button" onClick={cancelIssuedWarning}>Confirm cancellation</Button></div></> : <><span className="modal-icon amber"><AlertTriangle/></span><h2 id="modal-title">Cancel this process?</h2><p>Your latest saved draft is stored in MongoDB for this hazard.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Continue editing</Button><Button variant="danger-button" onClick={async () => { if (await saveDraft()) { setModal(''); navigate('dashboard', 'Dashboard') } }}>Save and exit</Button></div></>}</section></div>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>
}

function App() {
  const [authSession, setAuthSession] = useState(() => readAuthSession())
  const roleMap = { dmc_officer: 'dmc', duty_officer: 'duty', district_officer: 'district', district_resource_officer: 'resource', response_officer: 'response' }
  const role = roleMap[authSession?.user?.role] || ''
  const [reports, setReports] = useState([])
  const [activeReport, setActiveReport] = useState(null)

  useEffect(() => {
    if (!['dmc', 'duty'].includes(role)) return undefined
    let active = true
    getGroundReports().then((data) => { if (active) setReports(data) }).catch(() => { if (active) setReports([]) })
    return () => { active = false }
  }, [role])

  const login = (session) => {
    saveAuthSession(session)
    setAuthSession(session)
  }
  const logout = () => {
    clearAuthSession()
    setAuthSession(null)
    setActiveReport(null)
  }
  const updateReport = async (id, changes) => {
    const updated = await reviewGroundReport(id, changes)
    setReports((current) => current.map((report) => report.id === id ? updated : report))
    return updated
  }
  const issueWarningFor = (report) => setActiveReport(report)
  const finishWarning = (reportId, warningId) => {
    setReports((current) => current.map((report) => report.id === reportId ? {
      ...report,
      status: 'WARNING_ISSUED',
      warningId,
      warningIssuedAt: new Date().toISOString(),
    } : report))
    setActiveReport(null)
  }
  const loginPage = <AuthPage mode="login" onAuthenticated={login}/>
  const registerPage = <AuthPage mode="register" onAuthenticated={login}/>
  const dmcPage = role === 'dmc'
    ? <DmcReportReviewPage reports={reports} onUpdateReport={updateReport} onLogout={logout}/>
    : <Navigate to={role ? '/duty' : '/login'} replace/>
  const dutyPage = role === 'duty'
    ? <HazardWarningApp activeReport={activeReport} onWarningIssued={finishWarning} onLogout={logout} reports={reports} onSelectReport={issueWarningFor} portalRole="duty"/>
    : <Navigate to={role ? '/dmc' : '/login'} replace/>
  const districtPage = role === 'district'
    ? <HazardWarningApp activeReport={activeReport} onWarningIssued={finishWarning} onLogout={logout} reports={reports} onSelectReport={issueWarningFor} portalRole="district"/>
    : <Navigate to={role ? '/duty' : '/login'} replace/>
  const resourceEntry = role === 'resource'
    ? <ResponseOperationsDashboard/>
    : <Navigate to={role ? '/' : '/login'} replace/>
  const responseEntry = role === 'response'
    ? <ResponseOperationsDashboard/>
    : <Navigate to={role ? '/' : '/login'} replace/>
  const resourceIncidentPage = role === 'resource' ? <ResourceCoordinationDashboard/> : <Navigate to="/" replace/>
  const responseOnly = (page) => role === 'response' ? page : <Navigate to="/" replace/>
  const resourceOnly = (page) => role === 'resource' ? page : <Navigate to="/" replace/>

  return <BrowserRouter><Routes>
    <Route path="/" element={<Navigate to={role === 'dmc' ? '/dmc' : role === 'duty' ? '/duty/hazard-monitoring' : role === 'district' ? '/district' : role === 'resource' ? '/response-operations?area=resources' : role === 'response' ? '/response-operations' : '/login'} replace/>}/>
    <Route path="/login" element={role ? <Navigate to="/" replace/> : loginPage}/>
    <Route path="/register" element={role ? <Navigate to="/" replace/> : registerPage}/>
    <Route path="/dmc" element={dmcPage}/>
    <Route path="/duty" element={dutyPage}/>
    <Route path="/duty/hazard-monitoring" element={dutyPage}/>
    <Route path="/district" element={districtPage}/>
    <Route path="/response-operations" element={role === 'resource' ? resourceEntry : responseEntry}/>
    <Route path="/response-operations/incidents/:incidentId" element={responseOnly(<IncidentPlanningPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/teams" element={responseOnly(<TeamSelectionPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/assignment" element={responseOnly(<ResponseAssignmentPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/shelters" element={responseOnly(<ShelterCoordinationPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/monitoring" element={responseOnly(<ResponseMonitoringPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/resources" element={resourceIncidentPage}/>
    <Route path="/response-operations/incidents/:incidentId/resources/new/:shelterId" element={resourceOnly(<CreateDistributionPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/resources/review" element={resourceOnly(<ReviewDistributionPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/resources/processing" element={resourceOnly(<ProcessingDistributionPage/>)}/>
    <Route path="/response-operations/incidents/:incidentId/resources/success" element={resourceOnly(<DistributionSuccessPage/>)}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>
}

export default App
