import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import LoginPage from '../pages/auth/LoginPage'
import DashboardLayout from '../components/layout/DashboardLayout'
import DashboardPage from '../pages/DashboardPage'
import CustomersPage from '../pages/customers/CustomersPage'
import JobsPage from '../pages/jobs/JobsPage'
import EstimatesPage from '../pages/estimates/EstimatesPage'
import ReportsPage from '../pages/reports/ReportsPage'
import SchedulePage from '../pages/schedule/SchedulePage'
import TimeTrackingPage from '../pages/time-tracking/TimeTrackingPage'
import InvoicesPage from '../pages/invoices/InvoicesPage'
import PaymentsPage from '../pages/payments/PaymentsPage'
import CampaignsPage from '../pages/marketing/CampaignsPage'
import OnlineBookingPage from '../pages/booking/OnlineBookingPage'
import TechnicianDashboard from '../pages/technician/TechnicianDashboard'
import TechnicianManagement from '../pages/admin/TechnicianManagement'
import SendJobViaSMS from '../pages/admin/SendJobViaSMS'
import JobDetailsPage from '../pages/jobs/JobDetailsPage'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

// Role-based dashboard component
function RoleBasedDashboard() {
  const user = useSelector((state: RootState) => state.auth.user)
  return user?.role === 'technician' ? <TechnicianDashboard /> : <DashboardPage />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RoleBasedDashboard />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobId" element={<JobDetailsPage />} />
        <Route path="send-jobs" element={<SendJobViaSMS />} />
        <Route path="technicians" element={<TechnicianManagement />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="time-tracking" element={<TimeTrackingPage />} />
        <Route path="marketing" element={<CampaignsPage />} />
        <Route path="booking" element={<OnlineBookingPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

