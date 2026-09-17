import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useSession } from './store/session';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Schedule from './pages/Schedule';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import About from './pages/About';
import Feedback from './pages/Feedback';
import DashHome from './pages/dashboard/Home';
import DashEvents from './pages/dashboard/Events';
import DashSessions from './pages/dashboard/Sessions';
import DashBoothVisits from './pages/dashboard/BoothVisits';
import DashApplications from './pages/dashboard/Applications';
import DashRegistrations from './pages/dashboard/Registrations';
import DashBooths from './pages/dashboard/Booths';
import DashBoothRequests from './pages/dashboard/BoothRequests';
import DashFavorites from './pages/dashboard/Favorites';
import DashFeedback from './pages/dashboard/Feedback';
import DashNotifications from './pages/dashboard/Notifications';
import DashSettings from './pages/dashboard/Settings';
import DashUsers from './pages/dashboard/Users';
import DashAnalytics from './pages/dashboard/Analytics';
import DashReports from './pages/dashboard/Reports';
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import BecomeExhibitor from './pages/dashboard/BecomeExhibitor';
import BecomeOrganizer from './pages/dashboard/BecomeOrganizer';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import { PublicLayout } from './components/layout/PublicLayout';
import SplashScreen from './components/effects/SplashScreen';

function Hydrate({ children }) {
  const hydrate = useSession((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Hydrate>
        <Toaster richColors position="top-center" />
        <SplashScreen />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/about" element={<About />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register/exhibitor" element={<PublicLayout><BecomeExhibitor /></PublicLayout>} />
          <Route path="/register/organizer" element={<PublicLayout><BecomeOrganizer /></PublicLayout>} />
          <Route path="/assistant" element={<Navigate to="/" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashHome />} />
            <Route path="analytics" element={<DashAnalytics />} />
            <Route path="reports" element={<DashReports />} />
            <Route path="events" element={<DashEvents />} />
            <Route path="sessions" element={<DashSessions />} />
            <Route path="booth-visits" element={<DashBoothVisits />} />
            <Route path="applications" element={<DashApplications />} />
            <Route path="registrations" element={<DashRegistrations />} />
            <Route path="booths" element={<DashBooths />} />
            <Route path="booth-requests" element={<DashBoothRequests />} />
            <Route path="favorites" element={<DashFavorites />} />
            <Route path="feedback" element={<DashFeedback />} />
            <Route path="notifications" element={<DashNotifications />} />
            <Route path="settings" element={<DashSettings />} />
            <Route path="users" element={<DashUsers />} />
            <Route path="organizer" element={<OrganizerDashboard />} />
            <Route path="become-exhibitor" element={<BecomeExhibitor />} />
            <Route path="become-organizer" element={<BecomeOrganizer />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Hydrate>
    </BrowserRouter>
  );
}
