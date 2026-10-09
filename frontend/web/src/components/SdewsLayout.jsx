import { useState } from 'react'
import { Activity, Bell, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, ClipboardList, FileText, House, Layers3, LogOut, Menu, MessageSquare, PackageCheck, Settings, ShieldCheck, Siren, Truck, Users, Warehouse } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from './ui.jsx'
import { clearAuthSession } from '../services/authService'

const navigation = [
  { label: 'Dashboard', icon: House, to: '/' },
  { label: 'Hazard Monitoring', icon: Activity, to: '/?view=hazards' },
  { label: 'Warnings', icon: Siren, to: '/?view=warnings' },
  { label: 'Incident Reports', icon: ClipboardList, to: '/?view=incidents' },
  { label: 'Assessments', icon: FileText, to: '/?view=assessments' },
  { label: 'Communications', icon: MessageSquare, to: '/?view=communications' },
  { label: 'Reports', icon: Layers3, to: '/?view=reports' },
  { label: 'Users & Roles', icon: Users, to: '/?view=users' },
  { label: 'System Settings', icon: Settings, to: '/?view=settings' },
  { label: 'Help & Support', icon: CircleHelp, to: '/?view=help' },
]

const incidentIdFromPath = (pathname) => {
  const match = pathname.match(/^\/response-operations\/incidents\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const responseNavigation = (incidentId) => {
  const incidentRoot = incidentId ? `/response-operations/incidents/${encodeURIComponent(incidentId)}` : ''
  return [
    { label: 'Response Dashboard', icon: House, to: '/response-operations' },
    { label: 'Incident Planning', icon: ClipboardList, to: incidentRoot },
    { label: 'Team / Dispatch', icon: Users, to: incidentRoot && `${incidentRoot}/teams` },
    { label: 'Shelter & Evacuation', icon: ShieldCheck, to: incidentRoot && `${incidentRoot}/shelters` },
    { label: 'Response Monitoring', icon: Activity, to: incidentRoot && `${incidentRoot}/monitoring` },
    { label: 'Request Status', icon: ClipboardCheck, to: '/response-operations/request-status' },
  ]
}

const resourceNavigation = (incidentId) => {
  const resourceRoot = incidentId ? `/response-operations/incidents/${encodeURIComponent(incidentId)}/resources` : ''
  return [
    { label: 'Resource Dashboard', icon: House, to: '/resource-operations' },
    { label: 'Resource Allocation', icon: Warehouse, to: resourceRoot },
    { label: 'Distribution Monitoring', icon: Truck, to: resourceRoot && `${resourceRoot}?view=distributions` },
    { label: 'Resource Monitoring', icon: PackageCheck, to: resourceRoot && `${resourceRoot}?view=monitoring` },
  ]
}

const viewLabels = {
  hazards: 'Hazard Monitoring', warnings: 'Warnings', incidents: 'Incident Reports',
  assessments: 'Assessments', communications: 'Communications',
  reports: 'Reports', users: 'Users & Roles', settings: 'System Settings', help: 'Help & Support',
}

function activeLabel(pathname, search) {
  const view = new URLSearchParams(search).get('view')
  const area = new URLSearchParams(search).get('area')
  if (/^\/warnings\/[^/]+\/(review|configure|status)$/.test(pathname)) return 'Warnings'
  if (pathname === '/response-operations/request-status') return 'Request Status'
  if (pathname === '/resource-operations/requests') return 'Incoming Requests'
  if (pathname === '/resource-operations') return 'Resource Dashboard'
  if (/^\/resource-coordination\/distributions(?:\/|$)/.test(pathname)) return 'Distribution Monitoring'
  if (/^\/resource-coordination(?:\/|$)/.test(pathname)) return 'Resource Allocation'
  if (/^\/response-operations\/incidents\/[^/]+\/resources(?:\/|$)/.test(pathname)) {
    const resourceView = new URLSearchParams(search).get('view')
    return resourceView === 'distributions' ? 'Distribution Monitoring' : resourceView === 'monitoring' ? 'Resource Monitoring' : 'Resource Allocation'
  }
  if (/^\/response-operations\/incidents\/[^/]+\/monitoring\/?$/.test(pathname)) return 'Response Monitoring'
  if (/^\/response-operations\/incidents\/[^/]+\/requests\/?$/.test(pathname)) return 'Operational Requests'
  if (/^\/response-operations\/incidents\/[^/]+\/(?:teams|assignment)\/?$/.test(pathname)) return 'Team / Dispatch'
  if (/^\/response-operations\/incidents\/[^/]+\/shelters\/?$/.test(pathname)) return 'Shelter & Evacuation'
  if (/^\/response-operations\/incidents\/[^/]+\/?$/.test(pathname)) return 'Incident Planning'
  if (pathname === '/response-operations' && area === 'resources') return 'Resource Allocation'
  if (pathname === '/response-operations' && area === 'monitoring') return 'Response Monitoring'
  if (pathname === '/response-operations' || pathname === '/response-operations/') return 'Response Dashboard'
  return viewLabels[view] || 'Dashboard'
}

function roleInitials(role) {
  if (role.startsWith('Assessment')) return 'AW'
  if (role.startsWith('District')) return 'DR'
  return 'RO'
}

export default function SdewsLayout({ children, role = 'Assessment Officer', breadcrumb, warningCount = 0, activeNavigation, contentClassName = '', onNotification, onProfile }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const active = activeNavigation || activeLabel(pathname, search)
  const initials = roleInitials(role)
  const incidentId = incidentIdFromPath(pathname)
  const isResourceOfficer = role.includes('Resource Coordination') || role === 'District Resource Officer'
  const isResponseOfficer = !isResourceOfficer && (role.includes('Response') || role === 'Response Officer')
  const visibleNavigation = isResourceOfficer ? resourceNavigation(incidentId) : isResponseOfficer ? responseNavigation(incidentId) : navigation

  const goTo = (to) => {
    setMobileMenu(false)
    navigate(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const signOut = () => {
    clearAuthSession()
    window.location.assign('/login')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}><Brand/><div className="nav-caption">OPERATIONS</div><nav>{visibleNavigation.map(({ label, icon: Icon, to }) => <button key={label} type="button" className={`nav-item ${active === label ? 'nav-active' : ''}`} disabled={!to} title={!to ? 'Select an incident from the dashboard first' : undefined} onClick={() => to && goTo(to)}><Icon size={18}/><span>{label}</span>{label === 'Warnings' && warningCount > 0 && <small>{warningCount}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="connection-status"><i className="online-dot"/><span>All systems operational</span></div>{onProfile && <button className="user-card" onClick={onProfile}><span className="avatar">{initials}</span><span><b>{role}</b><small>DMC · National Operations</small></span><ChevronDown size={15}/></button>}<button className="user-card" onClick={signOut}><span className="avatar"><LogOut size={14}/></span><span><b>Sign out</b><small>{role}</small></span></button></div></aside>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button><div className="topbar-breadcrumb"><span>Operations</span><ChevronRight size={14}/><b>{breadcrumb || active}</b></div><div className="topbar-actions"><span className="topbar-date">Tuesday, 07 October 2026</span><button className="notification-button" aria-label="Notifications" onClick={onNotification}><Bell size={19}/><i/></button><div className="topbar-user"><span className="avatar">{initials}</span><span><b>{role}</b><small>National Operations</small></span><ChevronDown size={14}/></div></div></header><div className={`content-area ${contentClassName}`.trim()}>{children}<footer className="page-footer"><span>SDEWS · Smart Disaster Early-Warning System</span><span>Data stored locally for this prototype <i className="online-dot"/></span></footer></div></main>
  </div>
}
