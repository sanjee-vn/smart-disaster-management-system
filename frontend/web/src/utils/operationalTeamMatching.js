export const teamMatchesCapability = (team, capability) => {
  if (!team) return false
  const text = `${team.name || ''} ${team.type || ''}`.toUpperCase()
  if (capability === 'RESCUE') return text.includes('RESCUE')
  if (capability === 'MEDICAL') return text.includes('MEDICAL')
  if (capability === 'POLICE') return text.includes('POLICE')
  if (capability === 'ARMED_FORCES') return text.includes('ARMY') || text.includes('ARMED')
  if (capability === 'FIRE_RESCUE') return text.includes('FIRE')
  return false
}

export const isSuitableOperationalTeam = (team, request) => Boolean(team && request)
  && team.status === 'AVAILABLE'
  && Number(team.capacity || 0) >= Number(request.requestedPersonnelCount || 0)
  && teamMatchesCapability(team, request.capability)
