import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ResourceCoordinationDashboard from './pages/ResourceCoordinationDashboard'
import CreateDistributionPage from './pages/CreateDistributionPage'
import ReviewDistributionPage from './pages/ReviewDistributionPage'
import ProcessingDistributionPage from './pages/ProcessingDistributionPage'
import DistributionSuccessPlaceholder from './pages/DistributionSuccessPlaceholder'
import WarningReviewPage from './pages/WarningReviewPage'
import ConfigureWarningPage from './pages/ConfigureWarningPage'
import WarningStatusPage from './pages/WarningStatusPage'
import ResponseOperationsDashboard from './pages/ResponseOperationsDashboard'
import IncidentPlanningPage from './pages/IncidentPlanningPage'
import TeamSelectionPage from './pages/TeamSelectionPage'
import ResponseAssignmentPage from './pages/ResponseAssignmentPage'
import ShelterCoordinationPlaceholder from './pages/ShelterCoordinationPlaceholder'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/resource-coordination" element={<ResourceCoordinationDashboard />} />
        <Route path="/resource-coordination/distributions/new/:shelterId" element={<CreateDistributionPage />} />
        <Route path="/resource-coordination/distributions/review" element={<ReviewDistributionPage />} />
        <Route path="/resource-coordination/distributions/processing" element={<ProcessingDistributionPage />} />
        <Route path="/resource-coordination/distributions/success" element={<DistributionSuccessPlaceholder />} />
        <Route path="/response-operations/incidents/:incidentId/resources" element={<ResourceCoordinationDashboard />} />
        <Route path="/response-operations/incidents/:incidentId/resources/new/:shelterId" element={<CreateDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources/review" element={<ReviewDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/resources/processing" element={<ProcessingDistributionPage />} />
        <Route path="/response-operations/incidents/:incidentId/shelters" element={<ShelterCoordinationPlaceholder />} />
        <Route path="/response-operations/incidents/:incidentId/assignment" element={<ResponseAssignmentPage />} />
        <Route path="/response-operations/incidents/:incidentId/teams" element={<TeamSelectionPage />} />
        <Route path="/response-operations/incidents/:incidentId" element={<IncidentPlanningPage />} />
        <Route path="/response-operations" element={<ResponseOperationsDashboard />} />
        <Route path="/warnings/:warningId/review" element={<WarningReviewPage />} />
        <Route path="/warnings/:warningId/configure" element={<ConfigureWarningPage />} />
        <Route path="/warnings/:warningId/status" element={<WarningStatusPage />} />
        <Route path="*" element={<Navigate to="/resource-coordination" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
