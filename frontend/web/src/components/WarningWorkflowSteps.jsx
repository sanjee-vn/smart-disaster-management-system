import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const steps = [
  { key: 'review', number: 1, label: 'Review' },
  { key: 'configure', number: 2, label: 'Configure' },
  { key: 'status', number: 3, label: 'Issued / Status' },
]

export default function WarningWorkflowSteps({ warningId, current }) {
  const navigate = useNavigate()
  const currentIndex = steps.findIndex((step) => step.key === current)
  return <nav className="warning-workflow-steps" aria-label="Operational warning workflow">
    <div><strong>Response Workflow Warning</strong><span>Backend-seeded operational integration flow</span></div>
    <ol>{steps.map((step, index) => <li key={step.key} className={index === currentIndex ? 'active' : index < currentIndex ? 'complete' : ''}>
      <button type="button" aria-current={index === currentIndex ? 'step' : undefined} onClick={() => navigate(`/warnings/${warningId}/${step.key}`)}>
        <span>{index < currentIndex ? <Check size={13} /> : step.number}</span>{step.label}
      </button>
    </li>)}</ol>
  </nav>
}
