import React from 'react';
import * as LucideIcons from 'lucide-react';

// Curated SVG paths for top homelab & self-hosted applications
const BRAND_SVGS = {
  proxmox: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.3l7.8 4.3-3.4 1.9-4.4-2.4-4.4 2.4-3.4-1.9L12 4.3zM4 9.8l3.2 1.8v4.9L4 14.7V9.8zm4.8 7.4v-4.9l3.2 1.8v4.9L8.8 17.2zm6.4 0l-3.2-1.8v-4.9l3.2-1.8v8.5zm4.8-2.5l-3.2 1.8v-4.9l3.2-1.8v4.9z"/>
    </svg>
  ),
  docker: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M13.98 11.08h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H11.1zm-2.88 0h2.09v1.94H8.22zm-2.88 0h2.09v1.94H5.34zm8.64-2.88h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H11.1zm-2.88 0h2.09v1.94H8.22zm8.64-2.88h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H13.98zm8.64 8.64c-.11-.53-.41-.98-.84-1.3-.43-.32-.97-.47-1.52-.42-.51.05-.98.24-1.37.55-.42-.14-.86-.21-1.3-.21H2.43c-.48 0-.94.19-1.28.53-.34.34-.53.8-.53 1.28 0 2.87 1.14 5.62 3.17 7.65s4.78 3.17 7.65 3.17c3.98 0 7.74-2.14 9.77-5.59.35-.6.54-1.28.56-1.98.02-.7-.14-1.39-.46-2.01-.13-.25-.32-.47-.55-.65z"/>
    </svg>
  ),
  'home-assistant': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L2 11h3v10h6v-6h2v6h6V11h3L12 2zm0 3.2l5 4.5v9.3h-2v-6H9v6H7V9.7l5-4.5z"/>
    </svg>
  ),
  portainer: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8-3.4 1.9-3.4-1.9-3.4 1.9-3.4-1.9L12 4.2zm-7 5.7l3 1.7v4.6l-3-1.7V9.9zm4 7.2v-4.6l3 1.7v4.6l-3-1.7zm7 0l-3-1.7v-4.6l3-1.7v8zm4-2.3l-3 1.7v-4.6l3-1.7v4.6z"/>
    </svg>
  ),
  grafana: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  ),
  pihole: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  jellyfin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm-2 13.5V8l6 4Z"/>
    </svg>
  ),
  nextcloud: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 3a6 6 0 0 0-5.8 4.5A4.5 4.5 0 0 0 3 12a4.5 4.5 0 0 0 3.2 4.3A6 6 0 0 0 12 21a6 6 0 0 0 5.8-4.7A4.5 4.5 0 0 0 21 12a4.5 4.5 0 0 0-3.2-4.3A6 6 0 0 0 12 3zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm-6 4.5a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5zm12 0a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5z"/>
    </svg>
  ),
  wireguard: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.09-2.73 7.89-6 8.87-3.27-.98-6-4.78-6-8.87V6.43l6-2.25zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z"/>
    </svg>
  ),
  asustor: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v4h16V6H4zm0 6v6h16v-6H4zm13 2h2v2h-2v-2zm-4 0h2v2h-2v-2z"/>
    </svg>
  ),
  router: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20 13H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm-1 5h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H9v-2h2v2zM6 9h2v2H6V9zm5-4h2v6h-2V5zm5 2h2v4h-2V7z"/>
    </svg>
  ),
  'uptime-kuma': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.59L8.71 12.3a1 1 0 1 1 1.41-1.41L13 13.76l4.88-4.88a1 1 0 0 1 1.41 1.41z"/>
    </svg>
  ),
};

function resolveLucide(name) {
  if (!name) return null;
  if (LucideIcons[name]) return LucideIcons[name];
  const pascal = name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  return LucideIcons[pascal] || null;
}

export default function BrandIcon({ name, color, className = "w-6 h-6", fallbackText = "" }) {
  if (!name && !fallbackText) {
    return <LucideIcons.Globe className={className} />;
  }

  const normalized = (name || '').toLowerCase().trim();

  // 1. Check custom branded SVGs
  if (BRAND_SVGS[normalized]) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ color }}>
        {BRAND_SVGS[normalized]}
      </div>
    );
  }

  // 2. Check Lucide library
  const LucideComponent = resolveLucide(name);
  if (LucideComponent) {
    return <LucideComponent className={className} style={{ color }} />;
  }

  // 3. Fallback initials
  const initials = (fallbackText || name || 'SV').substring(0, 2).toUpperCase();
  return (
    <span className="font-bold text-xs tracking-wider" style={{ color: color || '#fff' }}>
      {initials}
    </span>
  );
}
