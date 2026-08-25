import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { useSettings } from '../../hooks/useSettings';
import { useServices } from '../../hooks/useServices';

export default function Layout() {
  const { settings } = useSettings();
  const { services } = useServices();
  const location = useLocation();

  const isSetupPage = location.pathname === '/setup';
  const isDashboard = location.pathname === '/' || location.pathname === '';
  
  // Hide top header if on /setup OR if on empty dashboard welcome/config screen
  const isEmptyDashboard = isDashboard && services.length === 0;
  const shouldShowHeader = !isSetupPage && !isEmptyDashboard;

  const bgStyle = settings?.background_url ? {
    backgroundImage: `url(${settings.background_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {};

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-bg-primary" style={bgStyle}>
      {/* Optional custom background overlay */}
      {settings?.background_url && (
        <div 
          className="fixed inset-0 pointer-events-none z-0" 
          style={{ 
            backgroundColor: `rgba(0,0,0,${(settings.background_opacity || 0) / 100})`,
            backdropFilter: `blur(${settings.background_blur || 0}px)` 
          }}
        />
      )}

      {/* Top Navigation Header */}
      {shouldShowHeader && <Header />}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
