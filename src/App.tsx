import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/Landing';
import LoginPage from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import type { UserRole } from './types';
import StaffManagement from './pages/admin/Staff';
import Inventory from './pages/admin/Inventory';
import Rulebook from './pages/admin/Rulebook';
import AdminEvents from './pages/admin/AdminEvents';
import AdminProfile from './pages/admin/AdminProfile';
import AdminChats from './pages/admin/AdminChats';
import Pharmacy from './pages/patient/Pharmacy';
import PatientsList from './pages/doctor/PatientsList';
import DoctorSchedule from './pages/doctor/Schedule';
import DiseaseTrends from './pages/doctor/DiseaseTrends';
import DoctorMessages from './pages/doctor/Messages';
import DoctorProfile from './pages/doctor/Profile';
import BioWasteManagement from './pages/admin/BioWaste';
import IpdBedManagement from './pages/admin/IpdBedManagement';
import PatientVisits from './pages/patient/Visits';
import DoctorSearch from './pages/patient/DoctorSearch';
import PatientChatbot from './pages/patient/Chatbot';
import PatientProfile from './pages/patient/Profile';
import PatientMessages from './pages/patient/Messages';
import Events from './pages/patient/Events';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if they try to access unauthorized route
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DoctorDashboard />} />
              <Route path="patients" element={<PatientsList />} />
              <Route path="schedule" element={<DoctorSchedule />} />
              <Route path="trends" element={<DiseaseTrends />} />
              <Route path="messages" element={<DoctorMessages />} />
              <Route path="events" element={<Events />} />
              <Route path="profile" element={<DoctorProfile />} />
            </Route>

            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PatientDashboard />} />
              <Route path="visits" element={<PatientVisits />} />
              <Route path="search" element={<DoctorSearch />} />
              <Route path="chatbot" element={<PatientChatbot />} />
              <Route path="messages" element={<PatientMessages />} />
              <Route path="events" element={<Events />} />
              <Route path="profile" element={<PatientProfile />} />
              <Route path="abha" element={<div>ABHA Integration Pending</div>} />
              <Route path="alerts" element={<div>Alerts Pending</div>} />
              <Route path="pharmacy" element={<Pharmacy />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="ipd" element={<IpdBedManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="doctors" element={<StaffManagement />} />
              <Route path="biowaste" element={<BioWasteManagement />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="rulebook" element={<Rulebook />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="chats" element={<AdminChats />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="patients" element={<PatientsList />} />
              <Route path="trends" element={<DiseaseTrends />} />
              <Route path="analytics" element={<DiseaseTrends />} />
            </Route>

          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
