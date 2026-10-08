export const DEMO_REPORTS_KEY = 'sdews-demo-ground-reports-v1'

const initialReport = {
  id: 'HR-2026-0042',
  reportId: 'HR-2026-0042',
  title: 'Rising water level near Kelaniya',
  description: 'Water levels are rising rapidly near the Kelani River. Several roads and low lying homes are beginning to flood. Residents may need to move to higher ground.',
  disasterType: 'Flood',
  latitude: 6.9553,
  longitude: 79.8891,
  photo: null,
  citizenId: 'CITIZEN-1042',
  status: 'PENDING',
  district: 'Gampaha',
  areaLabel: 'Kelani River basin - Ward 4',
  createdAt: '2026-10-08T10:16:00+05:30',
}

export function loadDemoReports() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEMO_REPORTS_KEY) || 'null')
    return Array.isArray(saved) && saved.length ? saved : [initialReport]
  } catch {
    return [initialReport]
  }
}
