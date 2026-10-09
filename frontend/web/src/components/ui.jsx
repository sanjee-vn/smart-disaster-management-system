import { MapPin } from 'lucide-react';

export function Brand() {
  return <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>ResQConnect</strong><small>Smart Disaster Early-Warning<br />& Emergency Coordination System</small></div></div>
}

export function MapPanel({ compact = false, pins = 5 }) {
  return <div className={`map-panel ${compact ? 'map-compact' : ''}`} aria-label="Map of Sri Lanka showing hazard locations">
    <div className="map-grid" />
    <svg className="island" viewBox="0 0 220 300" role="img" aria-hidden="true"><path d="M103 12c10 6 7 17 15 23 6 5 7 13 14 18 8 6 7 16 12 23 8 12 11 22 8 35 8 10 7 21 3 31-3 9-1 17-8 25-7 9-7 21-12 32-4 9-2 18-8 27-6 10-8 21-14 30-8 12-9 26-20 35-9 8-15 1-20-7-7-11-7-23-14-33-8-11-8-23-14-34-5-10-10-21-9-32-5-10-8-22-5-34 2-11 0-22 6-32 5-8 4-18 10-25 8-9 12-18 20-26 7-7 9-15 15-22 6-8 10-17 21-19z" fill="#88c998" stroke="#4c8e66" strokeWidth="3"/><path d="M91 61l21 8 16 18-8 16 20 13-13 20-24-6-17 19-21-13-16 8-8-21 16-17-5-20 17-8z" fill="#6fb2a3" stroke="#498d7d" strokeWidth="2"/><path d="M72 135l26-11 17 13 22-6 13 19-15 16-17-4-12 18-22-7-12-17-18-4z" fill="#d7bf7d" stroke="#a68b4d" strokeWidth="2"/><path d="M75 190l22-9 18 7 11 18-14 20-10 25-12-5-9-27-15-13z" fill="#edc477" stroke="#bb9454" strokeWidth="2"/><path d="M79 275c5 8 8 13 9 20" fill="none" stroke="#4c8e66" strokeWidth="3" strokeLinecap="round"/></svg>
    {Array.from({ length: pins }, (_, i) => <span key={i} className={`map-pin pin-${i + 1}`}><MapPin size={compact ? 15 : 19} fill="currentColor" /></span>)}
    {!compact && <div className="map-legend"><b>Severity</b><span><i className="dot red" /> High</span><span><i className="dot orange" /> Medium</span><span><i className="dot green" /> Low</span></div>}
    <span className="map-label label-north">Northern Province</span><span className="map-label label-colombo">Colombo</span><span className="map-label label-galle">Galle</span>
    <div className="map-controls"><button aria-label="Zoom in">+</button><button aria-label="Zoom out">−</button></div>
  </div>
}

export function Field({ label, children, className = '' }) { return <label className={`field ${className}`}><span>{label}</span>{children}</label> }
export function Badge({ children, tone = '' }) { return <span className={`badge ${tone || String(children).toLowerCase().replaceAll(' ', '-')}`}>{children}</span> }
export function Button({ children, variant = 'secondary', icon: Icon, className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{Icon && <Icon size={16} />}{children}</button> }

export function Header({ title, eyebrow, actions }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow || 'DISASTER MANAGEMENT CENTRE ? SRI LANKA'}</div><h1>{title}</h1></div>{actions}</div> }
