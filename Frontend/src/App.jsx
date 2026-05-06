import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Therapists from './pages/Therapists';
import TherapistProfile from './pages/TherapistProfile';
import CareerTherapy from './pages/CareerTherapy';
import BookSession from './pages/BookSession';
import Payment from './pages/Payment';
import PatientDashboard from './pages/PatientDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import AdminConsole from './pages/AdminConsole';

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Navbar /> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/therapists" element={<Therapists />} />
          <Route path="/therapist/:id" element={<TherapistProfile />} />
          <Route path="/career-therapy" element={<CareerTherapy />} />
          <Route path="/book/:id" element={<ProtectedRoute allowedRoles={['patient']}><BookSession /></ProtectedRoute>} />
          <Route path="/payment/:id" element={<ProtectedRoute allowedRoles={['patient']}><Payment /></ProtectedRoute>} />
          <Route path="/sessions" element={<Navigate to="/dashboard/patient" replace />} />
          <Route path="/dashboard/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/therapist" element={<ProtectedRoute allowedRoles={['therapist']}><TherapistDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminConsole /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoleProvider>
    </BrowserRouter>
  );
}
