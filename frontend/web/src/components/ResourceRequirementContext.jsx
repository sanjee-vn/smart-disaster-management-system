import { requirementLabels, resourceRequirementCodes } from '../utils/responseRequirements'

export default function ResourceRequirementContext({ requirements = [], distributions = [], compact = false }) {
  const selected = new Set(requirements)
  const statusFor = (code) => {
    if (!selected.has(code)) return 'Not requested'
    const matching = distributions.filter((distribution) => distribution.item?.category?.toUpperCase() === code)
    if (matching.length === 0) return 'Required · Not allocated'
    const awaiting = matching.filter((distribution) => distribution.status === 'PENDING').length
    const enRoute = matching.filter((distribution) => distribution.status === 'EN_ROUTE').length
    const delivered = matching.filter((distribution) => distribution.status === 'DELIVERED').length
    if (awaiting) return `${awaiting} pending staff acceptance${enRoute ? ` · ${enRoute} en route` : ''}${delivered ? ` · ${delivered} delivered` : ''}`
    if (enRoute && delivered) return `${enRoute} en route · ${delivered} delivered`
    if (enRoute) return `${enRoute} allocation${enRoute === 1 ? '' : 's'} en route`
    if (delivered) return `${delivered} delivery record${delivered === 1 ? '' : 's'}`
    return 'Required · Allocation recorded'
  }

  return <section className={`resource-requirement-context ${compact ? 'compact' : ''}`}><div><span>Incident planning context</span><h2>Resource Requirements</h2><p>Planning flags guide allocation; they do not define target quantities or restrict additional operational needs.</p></div><div className="resource-requirement-grid">{resourceRequirementCodes.map((code) => <article className={selected.has(code) ? 'required' : ''} key={code}><strong>{requirementLabels[code]}</strong><span>{statusFor(code)}</span></article>)}</div></section>
}
