import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, FileText, House, Layers3, Menu, MessageSquare, MoreHorizontal, Send, Settings, Siren, Users, X, Activity } from 'lucide-react';
import { Badge, Brand, Button, Field, Header, MapPanel } from './components/ui.jsx';
import DashboardScreen from './components/screens/Dashboard.jsx';
import HazardDetailsScreen from './components/screens/HazardDetails.jsx';
import EventAssessmentScreen from './components/screens/EventAssessment.jsx';
import WarningLevelScreen from './components/screens/WarningLevel.jsx';
import AffectedAreaScreen from './components/screens/AffectedArea.jsx';
import WarningReviewScreen from './components/screens/WarningReview.jsx';
import DeliveryStatusScreen from './components/screens/DeliveryStatus.jsx';
import WarningRegisterScreen from './components/screens/WarningRegister.jsx';
import PlaceholderPageScreen from './components/screens/PlaceholderPage.jsx';
import ResourceCoordinationDashboard from './pages/ResourceCoordinationDashboard';
import CreateDistributionPage from './pages/CreateDistributionPage';
import ReviewDistributionPage from './pages/ReviewDistributionPage';
import ProcessingDistributionPage from './pages/ProcessingDistributionPage';
import DistributionSuccessPage from './pages/DistributionSuccessPage';
import WarningReviewPage from './pages/WarningReviewPage';
import ConfigureWarningPage from './pages/ConfigureWarningPage';
import WarningStatusPage from './pages/WarningStatusPage';
import ResponseOperationsDashboard from './pages/ResponseOperationsDashboard';
import IncidentPlanningPage from './pages/IncidentPlanningPage';
import TeamSelectionPage from './pages/TeamSelectionPage';
import ResponseAssignmentPage from './pages/ResponseAssignmentPage';
import ShelterCoordinationPage from './pages/ShelterCoordinationPage';
import ResponseMonitoringPage from './pages/ResponseMonitoringPage';
import './App.css';

const initialHazards = [
  { id: 'HZ-2024-001', type: 'Heavy Rainfall', district: 'Colombo', severity: 'High', status: 'Monitoring', updated: '10:30 AM', population: '18,400', confidence: 'High', description: 'Persistent heavy rainfall is raising water levels across low-lying areas. Field teams are monitoring drainage and river conditions.', source: 'Department of Meteorology', ds: 'Colombo', location: '6.9271 N, 79.8612 E' },
  { id: 'HZ-2024-002', type: 'Flood', district: 'Gampaha', severity: 'High', status: 'Active', updated: '10:24 AM', population: '25,000+', confidence: 'High', description: 'River levels have risen following sustained rainfall. Residents in flood-prone communities should prepare to move to higher ground.', source: 'River Gauge Network', ds: 'Gampaha', location: '7.0917 N, 79.9997 E' },
  { id: 'HZ-2024-003', type: 'Landslide Risk', district: 'Kandy', severity: 'Medium', status: 'Monitoring', updated: '10:18 AM', population: '8,250', confidence: 'Medium', description: 'Soil saturation is increasing on steep slopes. Local authorities have been notified to monitor vulnerable settlements.', source: 'National Building Research Organisation', ds: 'Kandy', location: '7.2906 N, 80.6337 E' },
  { id: 'HZ-2024-004', type: 'Strong Winds', district: 'Galle', severity: 'Medium', status: 'Active', updated: '10:12 AM', population: '12,600', confidence: 'High', description: 'Strong coastal winds are expected this afternoon. Fisher communities and coastal residents should follow local advisories.', source: 'Department of Meteorology', ds: 'Galle', location: '6.0535 N, 80.2210 E' },
  { id: 'HZ-2024-005', type: 'Coastal Surge', district: 'Matara', severity: 'High', status: 'Warning Issued', updated: '09:58 AM', population: '31,200', confidence: 'High', description: 'Coastal water levels may rise during high tide. Keep clear of exposed shorelines and follow instructions from local officials.', source: 'Coast Conservation Department', ds: 'Matara', location: '5.9549 N, 80.5550 E' },
  { id: 'HZ-2024-006', type: 'Heavy Rainfall', district: 'Ratnapura', severity: 'Low', status: 'Monitoring', updated: '09:41 AM', population: '5,800', confidence: 'Medium', description: 'Showers are continuing across the district. Monitoring stations report stable river levels at this time.', source: 'Department of Meteorology', ds: 'Ratnapura', location: '6.6828 N, 80.3992 E' },
  { id: 'HZ-2024-007', type: 'Landslide Risk', district: 'Nuwara Eliya', severity: 'Medium', status: 'Active', updated: '09:30 AM', population: '7,100', confidence: 'Medium', description: 'Ground movement sensors have detected elevated activity. Avoid unstable slopes and heed local authority guidance.', source: 'NBRO Sensor Network', ds: 'Nuwara Eliya', location: '6.9497 N, 80.7891 E' },
  { id: 'HZ-2024-008', type: 'Flash Flood', district: 'Kalutara', severity: 'High', status: 'Pending', updated: '09:12 AM', population: '14,700', confidence: 'High', description: 'Rapid rainfall may cause flash flooding near streams and low crossings. Do not attempt to cross moving water.', source: 'Local Authority Report', ds: 'Kalutara', location: '6.5854 N, 79.9607 E' },
  { id: 'HZ-2024-009', type: 'Strong Winds', district: 'Trincomalee', severity: 'Medium', status: 'Monitoring', updated: '08:54 AM', population: '9,400', confidence: 'Medium', description: 'Gusty conditions are forecast for the eastern coast. Small craft should remain in harbour until conditions improve.', source: 'Department of Meteorology', ds: 'Trincomalee', location: '8.5874 N, 81.2152 E' },
  { id: 'HZ-2024-010', type: 'Heavy Rainfall', district: 'Batticaloa', severity: 'Low', status: 'Active', updated: '08:32 AM', population: '6,300', confidence: 'Medium', description: 'Localised rain showers are being tracked. No immediate threat to populated areas has been identified.', source: 'Department of Meteorology', ds: 'Batticaloa', location: '7.7310 N, 81.6747 E' },
]

const initialWarning = {
  level: 'High', urgency: 'Immediate', confidence: 'High', recommendation: 'Issue a public warning to flood-prone communities and coordinate evacuation readiness with local authorities.',
  districts: ['Gampaha'], areas: ['Gampaha', 'Kelaniya', 'Wattala'], title: 'Flood Warning — Gampaha District',
  message: 'Heavy rainfall has caused rising water levels in parts of Gampaha District. Residents in low-lying areas should move to safe locations and follow instructions from local authorities.',
  instructions: 'Move to higher ground. Keep emergency supplies ready. Do not walk or drive through flood water. Call 117 for emergency assistance.',
  language: 'English', format: 'Text + Map Link', channels: ['Push Notification', 'SMS Alert', 'Audible / Siren'],
  start: '2026-10-07T10:00', end: '2026-10-08T10:00', expiry: '2026-10-08T12:00', remarks: 'Hazard data reviewed and cross-checked with field reports.',
}

const navItems = [
  { label: 'Dashboard', icon: House, screen: 'dashboard' },
  { label: 'Hazard Monitoring', icon: Activity, screen: 'dashboard' },
  { label: 'Warnings', icon: Siren, screen: 'warnings' },
  { label: 'Incident Reports', icon: ClipboardList, screen: 'incidents' },
  { label: 'Assessments', icon: FileText, screen: 'dashboard' },
  { label: 'Resources', icon: Users, screen: 'resources' },
  { label: 'Communications', icon: MessageSquare, screen: 'communications' },
  { label: 'Reports', icon: Layers3, screen: 'reports' },
  { label: 'Users & Roles', icon: Users, screen: 'users' },
  { label: 'System Settings', icon: Settings, screen: 'settings' },
  { label: 'Help & Support', icon: CircleHelp, screen: 'help' },
]

function loadSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function HazardWarningApp() {
  const routeNavigate = useNavigate()
  const [hazards, setHazards] = useState(() => loadSaved('sdews-hazards', initialHazards))
  const [warnings, setWarnings] = useState(() => loadSaved('sdews-warnings', []))
  const [screen, setScreen] = useState('dashboard')
  const [selectedHazardId, setSelectedHazardId] = useState('HZ-2024-002')
  const [warning, setWarning] = useState(initialWarning)
  const [filter, setFilter] = useState({ search: '', type: 'All types', district: 'All districts', severity: 'All severities', status: 'All statuses' })
  const [modal, setModal] = useState('')
  const [toast, setToast] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [issueId, setIssueId] = useState('')
  const [page, setPage] = useState(1)
  const [checks, setChecks] = useState([true, true, true, true])
  const [reportCount, setReportCount] = useState('6')
  const [photoCount, setPhotoCount] = useState('14')
  const [evidenceRequested, setEvidenceRequested] = useState(false)

  const selectedHazard = hazards.find((hazard) => hazard.id === selectedHazardId) || hazards[0]
  const issuedWarning = warnings.find((item) => item.id === issueId) || warnings[0]

  useEffect(() => { localStorage.setItem('sdews-hazards', JSON.stringify(hazards)) }, [hazards])
  useEffect(() => { localStorage.setItem('sdews-warnings', JSON.stringify(warnings)) }, [warnings])
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
  const beginWarning = (id = selectedHazardId) => { setSelectedHazardId(id); setEvidenceRequested(false); setWarning(() => ({ ...initialWarning, districts: [hazards.find((hazard) => hazard.id === id)?.district || 'Gampaha'], areas: [hazards.find((hazard) => hazard.id === id)?.district || 'Gampaha'] })); navigate('assessment', 'Assessments') }
  const saveDraft = () => { localStorage.setItem('sdews-warning-draft', JSON.stringify({ hazardId: selectedHazardId, warning })); setToast('Draft saved on this device') }
  const updateHazard = (key, value) => setHazards((current) => current.map((hazard) => hazard.id === selectedHazardId ? { ...hazard, [key]: value } : hazard))
  const updateWarning = (key, value) => setWarning((current) => ({ ...current, [key]: value }))
  const toggleInList = (key, value) => updateWarning(key, warning[key].includes(value) ? warning[key].filter((item) => item !== value) : [...warning[key], value])
  const publishWarning = () => {
    const newId = `WRN-2026-${String(warnings.length + 2017).padStart(4, '0')}`
    const target = Math.max(2500, warning.areas.length * 12500)
    const next = { id: newId, hazardId: selectedHazardId, level: warning.level, status: 'Published', title: warning.title, district: warning.districts.join(', '), areas: warning.areas, channels: warning.channels, target, delivered: Math.round(target * 0.943), pending: Math.round(target * 0.034), failed: Math.round(target * 0.023), date: new Date().toISOString(), warning: { ...warning } }
    setWarnings((current) => [next, ...current])
    updateHazard('status', 'Warning Issued')
    setIssueId(newId)
    setModal('')
    navigate('delivery', 'Warnings')
  }
  const retryChannel = (id, channel) => {
    setWarnings((current) => current.map((item) => item.id === id ? { ...item, failed: Math.max(0, item.failed - Math.ceil(item.failed * .35)), delivered: Math.min(item.target, item.delivered + Math.ceil(item.failed * .35)), lastAction: `${channel} retry queued` } : item))
    setToast(`${channel} retry queued`)
  }
  const dispatchEscalation = () => { setWarnings((current) => current.map((item) => item.id === issueId ? { ...item, escalated: true, lastAction: 'Escalated to regional authority' } : item)); setToast('Escalation sent to the regional authority'); setModal('') }
  const cancelIssuedWarning = () => { setWarnings((current) => current.map((item) => item.id === issueId ? { ...item, status: 'Cancelled', lastAction: 'Warning cancelled by officer' } : item)); setToast('Warning cancelled'); setModal('') }
  const toggleCheck = (index) => setChecks((current) => current.map((item, i) => i === index ? !item : item))

  const screenProps = { Header, Badge, Button, Field, MapPanel, hazards, setHazards, selectedHazard, selectedHazardId, setSelectedHazardId, warning, setWarning, warnings, setWarnings, issuedWarning, filter, setFilter, filteredHazards, navigate, beginWarning, updateHazard, updateWarning, toggleInList, saveDraft, retryChannel, setModal, setToast, setPage, page, reportCount, setReportCount, photoCount, setPhotoCount, setIssueId, evidenceRequested, setEvidenceRequested, checks, toggleCheck, publishWarning, cancelIssuedWarning };
  const pageByScreen = { dashboard: DashboardScreen, details: HazardDetailsScreen, assessment: EventAssessmentScreen, level: WarningLevelScreen, area: AffectedAreaScreen, review: WarningReviewScreen, delivery: DeliveryStatusScreen, warnings: WarningRegisterScreen };
  const currentScreen = ['incidents', 'resources', 'communications', 'reports', 'users', 'settings', 'help'].includes(screen) ? <PlaceholderPageScreen kind={screen} {...screenProps} /> : React.createElement(pageByScreen[screen] || DashboardScreen, screenProps);

  return <div className="app-shell"><aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}><Brand/><div className="nav-caption">OPERATIONS</div><nav>{navItems.map(({ label, icon: Icon, screen: destination }) => <button key={label} className={`nav-item ${activeNav === label ? 'nav-active' : ''}`} onClick={() => label === 'Resources' ? routeNavigate('/resource-coordination') : navigate(destination, label)}><Icon size={18}/><span>{label}</span>{label === 'Warnings' && warnings.length > 0 && <small>{warnings.length}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="connection-status"><i className="online-dot"/><span>All systems operational</span></div><button className="user-card" onClick={() => setToast('Signed in as Assessment Officer')}><span className="avatar">AO</span><span><b>Assessment Officer</b><small>DMC · National Operations</small></span><ChevronDown size={15}/></button></div></aside>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button><div className="topbar-breadcrumb"><span>Operations</span><ChevronRight size={14}/><b>{activeNav}</b></div><div className="topbar-actions"><span className="topbar-date">Tuesday, 07 October 2026</span><button className="notification-button" aria-label="Notifications" onClick={() => setToast('You are up to date with all system notifications')}><Bell size={19}/><i/></button><div className="topbar-user"><span className="avatar">AO</span><span><b>Assessment Officer</b><small>National Operations</small></span><ChevronDown size={14}/></div></div></header><div className="content-area">{currentScreen}<footer className="page-footer"><span>SDEWS · Smart Disaster Early-Warning System</span><span>Data stored locally for this prototype <i className="online-dot"/></span></footer></div></main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal('') }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close icon-button" aria-label="Close dialog" onClick={() => setModal('')}><X size={19}/></button>{modal === 'hazard-actions' ? <><span className="modal-icon amber"><MoreHorizontal/></span><h2 id="modal-title">Hazard actions</h2><p>Choose an action for {selectedHazard.id} in {selectedHazard.district}.</p><div className="modal-actions vertical"><Button variant="primary" onClick={() => { setModal(''); navigate('details', 'Hazard Monitoring') }}>Review hazard details</Button><Button variant="teal-button" onClick={() => { setModal(''); beginWarning(selectedHazard.id) }}>Create warning draft</Button><Button onClick={() => setModal('')}>Close</Button></div></> : modal === 'publish' ? <><span className="modal-icon warning-icon"><AlertTriangle/></span><div className="modal-eyebrow">FINAL CONFIRMATION</div><h2 id="modal-title">Confirm publication</h2><p>You are about to publish this <b>{warning.level.toLowerCase()} warning</b> to <b>{warning.areas.length} affected areas</b> through {warning.channels.join(', ')}. Are you ready to send this public safety message?</p><div className="modal-summary"><span>Hazard <b>{selectedHazard.id}</b></span><span>Target audience <b>{(warning.areas.length * 12480).toLocaleString()} people</b></span></div><div className="modal-actions"><Button onClick={() => setModal('')}>No, go back</Button><Button variant="danger-button" icon={Send} onClick={publishWarning}>Yes, publish warning</Button></div></> : modal === 'escalate' ? <><span className="modal-icon blue"><ArrowRight/></span><div className="modal-eyebrow">ESCALATION</div><h2 id="modal-title">Escalate this warning?</h2><p>The regional authority will be notified and the warning will be flagged for urgent review.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Go back</Button><Button variant="primary" onClick={dispatchEscalation}>Confirm escalation</Button></div></> : modal === 'cancel-warning' ? <><span className="modal-icon danger"><X/></span><div className="modal-eyebrow">STOP DELIVERY</div><h2 id="modal-title">Cancel this warning?</h2><p>Further delivery attempts will stop. The issued warning will be marked as cancelled in the audit history.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Keep warning active</Button><Button variant="danger-button" onClick={cancelIssuedWarning}>Confirm cancellation</Button></div></> : <><span className="modal-icon amber"><AlertTriangle/></span><h2 id="modal-title">Cancel this process?</h2><p>Your current warning details are saved as a draft on this device.</p><div className="modal-actions"><Button onClick={() => setModal('')}>Continue editing</Button><Button variant="danger-button" onClick={() => { setModal(''); navigate('dashboard', 'Dashboard'); setToast('Warning process saved as a draft') }}>Save and exit</Button></div></>}</section></div>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HazardWarningApp />} />
        <Route path="/resource-coordination" element={<ResourceCoordinationDashboard />} />
        <Route path="/resource-coordination/distributions/new/:shelterId" element={<CreateDistributionPage />} />
        <Route path="/resource-coordination/distributions/review" element={<ReviewDistributionPage />} />
        <Route path="/resource-coordination/distributions/processing" element={<ProcessingDistributionPage />} />
        <Route path="/resource-coordination/distributions/success" element={<DistributionSuccessPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources" element={<ResourceCoordinationDashboard />} />
        <Route path="/response-operations/incidents/:incidentId/resources/new/:shelterId" element={<CreateDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources/review" element={<ReviewDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources/processing" element={<ProcessingDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources/success" element={<DistributionSuccessPage />} />
        <Route path="/response-operations/incidents/:incidentId/monitoring" element={<ResponseMonitoringPage />} />
        <Route path="/response-operations/incidents/:incidentId/shelters" element={<ShelterCoordinationPage />} />
        <Route path="/response-operations/incidents/:incidentId/assignment" element={<ResponseAssignmentPage />} />
        <Route path="/response-operations/incidents/:incidentId/teams" element={<TeamSelectionPage />} />
        <Route path="/response-operations/incidents/:incidentId" element={<IncidentPlanningPage />} />
        <Route path="/response-operations" element={<ResponseOperationsDashboard />} />
        <Route path="/warnings/:warningId/review" element={<WarningReviewPage />} />
        <Route path="/warnings/:warningId/configure" element={<ConfigureWarningPage />} />
        <Route path="/warnings/:warningId/status" element={<WarningStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
