import ValidationMessage from './ValidationMessage'

const groups = [
  { title: 'Emergency Response', options: [['RESCUE', 'Rescue Team'], ['POLICE', 'Police'], ['ARMED_FORCES', 'Armed Forces'], ['FIRE_RESCUE', 'Fire & Rescue'], ['MEDICAL', 'Medical Team']] },
  { title: 'Shelter / Evacuation', options: [['SHELTER', 'Emergency Shelter'], ['EVACUATION', 'Evacuation Support']] },
  { title: 'Relief Resources', options: [['FOOD', 'Food'], ['WATER', 'Water'], ['MEDICINE', 'Medicine']] },
]

export default function ResponseRequirementsSelector({ selected, onChange, error }) {
  const toggle = (code) => onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code])
  return <section className="planning-card response-requirements"><div className="planning-card-heading numbered"><span>4</span><div><h2>Response Requirements</h2><p>Select every operational capability required for this incident.</p></div></div><div className="capability-groups">{groups.map((group) => <fieldset key={group.title}><legend>{group.title}</legend><div>{group.options.map(([code, label]) => <label className={selected.includes(code) ? 'selected' : ''} key={code}><input type="checkbox" checked={selected.includes(code)} onChange={() => toggle(code)} /><span><strong>{label}</strong><small>{code}</small></span></label>)}</div></fieldset>)}</div><ValidationMessage message={error} /></section>
}
