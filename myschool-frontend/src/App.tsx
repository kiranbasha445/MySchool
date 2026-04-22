import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Students     from './pages/Students';
import Classes      from './pages/Classes';
import ClassRoom    from './pages/ClassRoom';
import Marks        from './pages/Marks';
import MyMarks      from './pages/MyMarks';
import MyChild      from './pages/MyChild';
import Achievements    from './pages/Achievements';
import Attendance      from './pages/Attendance';
import ManageUsers     from './pages/ManageUsers';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Public — no auth required */}
        <Route path="/classes"      element={<Classes />} />
        <Route path="/classes/:id"  element={<ClassRoom />} />

        {/* Protected */}
        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/students"     element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/marks"        element={<ProtectedRoute><Marks /></ProtectedRoute>} />
        <Route path="/my-marks"     element={<ProtectedRoute><MyMarks /></ProtectedRoute>} />
        <Route path="/my-child"     element={<ProtectedRoute><MyChild /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/attendance"   element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/users"        element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
