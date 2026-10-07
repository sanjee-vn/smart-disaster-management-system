import { Link, useLocation } from 'react-router-dom'

export default function DistributionProcessingPlaceholder() {
  const { state } = useLocation()
  return <main className="placeholder"><div><h1>Distribution Processing</h1><p>The processing step will be implemented in the next slice.</p>{state?.draft && <p className="draft-summary">Validated draft: {state.draft.quantity} {state.draft.unit} of {state.draft.itemName}</p>}<Link to="/resource-coordination">Return to Resource Coordination</Link></div></main>
}
