import { Bell, Boxes, LayoutDashboard, ShieldAlert, Warehouse } from 'lucide-react'

export default function DashboardLayout({ children, activeSection = 'resources', breadcrumb = 'Operations / Resource Coordination', role = 'District Officer' }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShieldAlert size={22} /></div>
          <div><strong>Safe Lanka</strong><span>Disaster Management</span></div>
        </div>
        <p className="nav-label">OPERATIONS</p>
        <div className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}><LayoutDashboard size={17} /> Overview</div>
        <div className={`nav-item ${activeSection === 'incidents' ? 'active' : ''}`}><ShieldAlert size={17} /> Active Incidents</div>
        <div className={`nav-item ${activeSection === 'resources' ? 'active' : ''}`}><Boxes size={17} /> Resource Coordination</div>
        <div className="nav-item"><Warehouse size={17} /> Shelters</div>
        <div className="officer"><div className="avatar">{role === 'Response Officer' ? 'RO' : 'DO'}</div><div><strong>{role}</strong><span>Colombo District</span></div></div>
      </aside>
      <main className="main">
        <header className="topbar"><span className="breadcrumb">{breadcrumb}</span><div className="top-actions"><Bell size={18} /><span className="role">{role}</span></div></header>
        {children}
      </main>
    </div>
  )
}
