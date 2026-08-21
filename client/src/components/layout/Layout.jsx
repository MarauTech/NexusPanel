import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { useSettings } from '../../hooks/useSettings';
import { useServices } from '../../hooks/useServices';

export default function Layout() {
  const { settings } = useSettings();
  const { services, loading: servicesLoading } = useServices();
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg-primary" style={bgStyle}>
      {/* iOS Liquid Aurora Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-600/15 to-transparent blur-[120px] animate-aurora-1" />
        <div className="absolute top-[20%] -left-[15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-transparent blur-[110px] animate-aurora-2" />
        <div className="absolute -bottom-[10%] right-[15%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-tl from-emerald-500/10 via-teal-600/15 to-transparent blur-[130px] animate-aurora-3" />
        <div className="absolute bottom-[10%] left-[25%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-r from-rose-500/10 via-pink-600/10 to-transparent blur-[100px] animate-aurora-1" />
      </div>

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

      {/* Top Navigation Header - hidden on welcome/config screen, shown immediately once configured */}
      {shouldShowHeader && <Header />}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
