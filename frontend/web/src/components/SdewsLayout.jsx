import { useState } from 'react'
import { Activity, Bell, ChevronDown, ChevronRight, CircleHelp, ClipboardList, FileText, House, Layers3, LogOut, Menu, MessageSquare, Settings, Siren, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from './ui.jsx'
import { clearAuthSession } from '../services/authService'

const navigation = [
  { label: 'Dashboard', icon: House, to: '/' },
  { label: 'Hazard Monitoring', icon: Activity, to: '/?view=hazards' },
  { label: 'Warnings', icon: Siren, to: '/?view=warnings' },
  { label: 'Incident Reports', icon: ClipboardList, to: '/?view=incidents' },
  { label: 'Assessments', icon: FileText, to: '/?view=assessments' },
  { label: 'Response Planning', icon: ClipboardList, to: '/response-operations' },
  { label: 'Resource Allocation', icon: Users, to: '/response-operations?area=resources' },
  { label: 'Response Monitoring', icon: Activity, to: '/response-operations?area=monitoring' },
  { label: 'Communications', icon: MessageSquare, to: '/?view=communications' },
  { label: 'Reports', icon: Layers3, to: '/?view=reports' },
  { label: 'Users & Roles', icon: Users, to: '/?view=users' },
  { label: 'System Settings', icon: Settings, to: '/?view=settings' },
  { label: 'Help & Support', icon: CircleHelp, to: '/?view=help' },
]

const viewLabels = {
  hazards: 'Hazard Monitoring', warnings: 'Warnings', incidents: 'Incident Reports',
  assessments: 'Assessments', communications: 'Communications',
  reports: 'Reports', users: 'Users & Roles', settings: 'System Settings', help: 'Help & Support',
}

function activeLabel(pathname, search) {
  const view = new URLSearchParams(search).get('view')
  const area = new URLSearchParams(search).get('area')
  if (/^\/warnings\/[^/]+\/(review|configure|status)$/.test(pathname)) return 'Warnings'
  if (/^\/resource-coordination(?:\/|$)/.test(pathname)) return 'Resource Allocation'
  if (/^\/response-operations\/incidents\/[^/]+\/resources(?:\/|$)/.test(pathname)) return 'Resource Allocation'
  if (/^\/response-operations\/incidents\/[^/]+\/monitoring\/?$/.test(pathname)) return 'Response Monitoring'
  if (/^\/response-operations\/incidents\/[^/]+(?:\/(?:teams|assignment|shelters))?\/?$/.test(pathname)) return 'Response Planning'
  if (pathname === '/response-operations' && area === 'resources') return 'Resource Allocation'
  if (pathname === '/response-operations' && area === 'monitoring') return 'Response Monitoring'
  if (pathname === '/response-operations' || pathname === '/response-operations/') return 'Response Planning'
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
  const incidentMatch = pathname.match(/^\/response-operations\/incidents\/([^/]+)/)
  const currentIncidentId = incidentMatch?.[1]
  const contextualNavigation = navigation.map((item) => {
    if (!currentIncidentId) return item
    if (item.label === 'Resource Allocation') return { ...item, to: `/response-operations/incidents/${currentIncidentId}/resources` }
    if (item.label === 'Response Monitoring') return { ...item, to: `/response-operations/incidents/${currentIncidentId}/monitoring` }
    return item
  })

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
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}><Brand/><div className="nav-caption">OPERATIONS</div><nav>{contextualNavigation.map(({ label, icon: Icon, to }) => <button key={label} className={`nav-item ${active === label ? 'nav-active' : ''}`} onClick={() => goTo(to)}><Icon size={18}/><span>{label}</span>{label === 'Warnings' && warningCount > 0 && <small>{warningCount}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="connection-status"><i className="online-dot"/><span>All systems operational</span></div>{onProfile && <button className="user-card" onClick={onProfile}><span className="avatar">{initials}</span><span><b>{role}</b><small>DMC · National Operations</small></span></button>}<button className="user-card" onClick={signOut}><span className="avatar"><LogOut size={14}/></span><span><b>Sign out</b><small>{role}</small></span></button></div></aside>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button><div className="topbar-breadcrumb"><span>Operations</span><ChevronRight size={14}/><b>{breadcrumb || active}</b></div><div className="topbar-actions"><span className="topbar-date">Tuesday, 07 October 2026</span><button className="notification-button" aria-label="Notifications" onClick={onNotification}><Bell size={19}/><i/></button><div className="topbar-user"><span className="avatar">{initials}</span><span><b>{role}</b><small>National Operations</small></span><ChevronDown size={14}/></div></div></header><div className={`content-area ${contentClassName}`.trim()}>{children}<footer className="page-footer"><span>SDEWS · Smart Disaster Early-Warning System</span><span>Data stored locally for this prototype <i className="online-dot"/></span></footer></div></main>
  </div>
}
