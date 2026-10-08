export const personnelRequirementCodes = ['RESCUE', 'POLICE', 'ARMED_FORCES', 'FIRE_RESCUE', 'MEDICAL']
export const shelterRequirementCodes = ['SHELTER', 'EVACUATION']
export const resourceRequirementCodes = ['FOOD', 'WATER', 'MEDICINE']

export const requirementLabels = {
  RESCUE: 'Rescue Team', POLICE: 'Police', ARMED_FORCES: 'Armed Forces', FIRE_RESCUE: 'Fire & Rescue', MEDICAL: 'Medical Team',
  SHELTER: 'Emergency Shelter', EVACUATION: 'Evacuation Support', FOOD: 'Food', WATER: 'Water', MEDICINE: 'Medicine',
}

const storageKey = (incidentId) => `c3-response-requirements:${incidentId}`
const validCodes = new Set([...personnelRequirementCodes, ...shelterRequirementCodes, ...resourceRequirementCodes])

export const normalizeRequirements = (requirements) => Array.isArray(requirements)
  ? [...new Set(requirements.filter((code) => validCodes.has(code)))]
  : []

export const savePlanningRequirements = (incidentId, requirements) => {
  if (!incidentId) return
  try { sessionStorage.setItem(storageKey(incidentId), JSON.stringify(normalizeRequirements(requirements))) } catch { /* storage is optional */ }
}

export const loadPlanningRequirements = (incidentId) => {
  if (!incidentId) return []
  try { return normalizeRequirements(JSON.parse(sessionStorage.getItem(storageKey(incidentId)) || '[]')) } catch { return [] }
}

export const getResourceRequirements = (requirements) => normalizeRequirements(requirements).filter((code) => resourceRequirementCodes.includes(code))
