import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ResourceCoordinationDashboard from './pages/ResourceCoordinationDashboard'
import CreateDistributionPage from './pages/CreateDistributionPage'
import ReviewDistributionPage from './pages/ReviewDistributionPage'
import DistributionProcessingPlaceholder from './pages/DistributionProcessingPlaceholder'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/resource-coordination" element={<ResourceCoordinationDashboard />} />
        <Route path="/resource-coordination/distributions/new/:shelterId" element={<CreateDistributionPage />} />
        <Route path="/resource-coordination/distributions/review" element={<ReviewDistributionPage />} />
        <Route path="/resource-coordination/distributions/processing" element={<DistributionProcessingPlaceholder />} />
        <Route path="*" element={<Navigate to="/resource-coordination" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
