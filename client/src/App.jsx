import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Kiosk from './pages/Kiosk.jsx';
import Login from './pages/Login.jsx';
import Setup from './pages/Setup.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isLoading, setupCompleted } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (setupCompleted === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}

function SetupRouteGuard({ children }) {
  const { setupCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (setupCompleted === true) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LoginRouteGuard({ children }) {
  const { isAuthenticated, isLoading, setupCompleted } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (setupCompleted === false) {
    return <Navigate to="/setup" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { setupCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/kiosk" element={<Kiosk />} />
      <Route path="/setup" element={<SetupRouteGuard><Setup /></SetupRouteGuard>} />
      <Route path="/login" element={<LoginRouteGuard><Login /></LoginRouteGuard>} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={
          setupCompleted === false ? <Navigate to="/setup" replace /> : <Dashboard />
        } />
        <Route path="admin/*" element={
          <ProtectedAdminRoute>
            <Admin />
          </ProtectedAdminRoute>
        } />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
