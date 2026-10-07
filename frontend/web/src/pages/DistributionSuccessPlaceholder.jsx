import { Link, useLocation } from 'react-router-dom'

export default function DistributionSuccessPlaceholder() {
  const { state } = useLocation()
  return <main className="placeholder"><div><h1>Distribution Created</h1>{state?.distribution ? <><p>The distribution was recorded successfully.</p><p className="draft-summary">{state.distribution.distributionId} · {state.distribution.status}</p></> : <p>No completed distribution result is available.</p>}<Link to="/resource-coordination">Return to Resource Coordination</Link></div></main>
}
