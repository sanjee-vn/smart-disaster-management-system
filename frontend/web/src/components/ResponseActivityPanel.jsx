const teamMetrics = [
  ['AVAILABLE', 'Available Teams'],
]
const assignmentMetrics = [
  ['PLANNED', 'Planned Assignments'], ['DISPATCHED', 'Dispatched Assignments'],
  ['IN_PROGRESS', 'In-Progress Assignments'], ['COMPLETED', 'Completed Assignments'],
]

export default function ResponseActivityPanel({ teams, assignments, teamError, assignmentError }) {
  return <section className="response-panel activity-panel"><div className="response-panel-heading"><div><h2>Response Activity</h2><p>Current team readiness and assignment progress.</p></div></div><div className="activity-groups"><div><h3>Team availability</h3>{teamError ? <p className="metric-error">{teamError}</p> : teamMetrics.map(([status, label]) => <div className="activity-metric" key={status}><span>{label}</span><strong>{teams.filter((team) => team.status === status).length}</strong></div>)}</div><div><h3>Assignment status</h3>{assignmentError ? <p className="metric-error">{assignmentError}</p> : assignmentMetrics.map(([status, label]) => <div className="activity-metric" key={status}><span>{label}</span><strong>{assignments.filter((assignment) => assignment.status === status).length}</strong></div>)}</div></div></section>
}
