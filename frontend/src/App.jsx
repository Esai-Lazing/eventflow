
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import EventTheme from './pages/themes/EventTheme';
import Dashboard from './pages/Dashboard';
import InvitationPage from './pages/InvitationPage';
import CheckInPage from './pages/CheckInPage';
import ProfilePage from './pages/Profile';
import ErrorPage from './pages/ErrorPage';

import SmoothScroll from './components/SmoothScroll';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ErrorBoundary>
              <SmoothScroll>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateEvent />} />
                <Route path="/create/:eventType" element={<EventTheme />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/invite/:slug" element={<InvitationPage />} />
                <Route path="/check-in/:token" element={<CheckInPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<ErrorPage code="404" />} />
              </Routes>
            </SmoothScroll>
          </ErrorBoundary>
          </Router>
          <Toaster richColors position="bottom-center" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
