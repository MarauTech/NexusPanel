import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Setup from './pages/Setup.jsx';
import ConnectServerScreen from './pages/ConnectServerScreen.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { getServerUrl } from './services/api.js';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isLoading, setupCompleted, serverConnected } = useAuth();
  const location = useLocation();

  if (!serverConnected || !isAuthenticated) {
    return <ConnectServerScreen />;
  }

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
  const { setupCompleted, isLoading, serverConnected } = useAuth();

  if (!serverConnected) {
    return <ConnectServerScreen />;
  }

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
  const { isAuthenticated, isLoading, setupCompleted, serverConnected } = useAuth();

  if (!serverConnected) {
    return <ConnectServerScreen />;
  }

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
  const { setupCompleted, serverConnected, isAuthenticated, isLoading, checkAuth } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isCapacitorOrStandalone = Boolean(
    window.Capacitor || 
    window.location.origin.includes('localhost') || 
    window.location.protocol === 'file:' || 
    window.location.protocol === 'capacitor:' ||
    !getServerUrl()
  );

  // If on mobile client and not yet authenticated or server not connected -> show 3-step setup (Language -> IP -> Login)
  if ((!serverConnected || !isAuthenticated) && isCapacitorOrStandalone) {
    return <ConnectServerScreen onConnected={() => checkAuth()} />;
  }

  return (
    <Routes>
      <Route path="/connect" element={<ConnectServerScreen onConnected={() => checkAuth()} />} />
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
