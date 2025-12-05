import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; 
import ResetPasswordPage from './pages/ResetPasswordPage';   
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import NoticesPage from './pages/NoticesPage';
import ClubsPage from './pages/ClubsPage';
import ProfilePage from './pages/ProfilePage';
import ClubAnnouncementsPage from './pages/ClubAnnouncementsPage';
import ClubEventsPage from './pages/ClubEventsPage';
import ClubFollowersPage from './pages/ClubFollowersPage';
import ClubSettingsPage from './pages/ClubSettingsPage';
import { ClubProvider } from './context/ClubContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MyClubsPage from './pages/MyClubsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

const isAuthenticated = () => localStorage.getItem('token') !== null;

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <SocketProvider>
        <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        
      <Route
          path="/*" 
          element={
            <ClubProvider>
              <Routes>
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/club-announcements" element={<PrivateRoute><ClubAnnouncementsPage /></PrivateRoute>} />
                <Route path="/club-events" element={<PrivateRoute><ClubEventsPage /></PrivateRoute>} />
                <Route path="/club-followers" element={<PrivateRoute><ClubFollowersPage /></PrivateRoute>} />
                <Route path="/club-settings" element={<PrivateRoute><ClubSettingsPage /></PrivateRoute>} />

                <Route path="/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
                <Route path="/notices" element={<PrivateRoute><NoticesPage /></PrivateRoute>} />
                <Route path="/clubs" element={<PrivateRoute><ClubsPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/my-clubs" element={<PrivateRoute><MyClubsPage /></PrivateRoute>} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
               
                <Route
                  path="/"
                  element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
                />
              </Routes>
            </ClubProvider>
          }
          />
      </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;