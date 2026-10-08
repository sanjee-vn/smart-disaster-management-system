import { useLocation } from 'react-router-dom'
import SdewsLayout from './SdewsLayout'

export default function DashboardLayout({ children, activeSection = 'resources', breadcrumb = 'Operations / Resource Coordination' }) {
  const { pathname, search } = useLocation()
  const warningRoute = /^\/warnings\/[^/]+\/(review|configure|status)$/
  const incidentResourceRoute = /^\/response-operations\/incidents\/[^/]+\/resources(?:\/|$)/
  const legacyResourceRoute = /^\/resource-coordination(?:\/|$)/
  const resourceEntry = pathname === '/response-operations' && new URLSearchParams(search).get('area') === 'resources'
  const role = warningRoute.test(pathname)
    ? 'Assessment / Warning Officer'
    : incidentResourceRoute.test(pathname) || legacyResourceRoute.test(pathname) || resourceEntry
      ? 'District / Resource Coordination Officer'
      : 'Response / Operations Officer'
  return <SdewsLayout role={role} breadcrumb={breadcrumb} contentClassName="component03-content-area"><div className="resource-shell" data-section={activeSection}>{children}</div></SdewsLayout>
}
