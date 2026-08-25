import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Server } from 'lucide-react';

function resolveLucide(name) {
  if (!name) return null;
  if (LucideIcons[name]) return LucideIcons[name];
  const pascal = name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  return LucideIcons[pascal] || null;
}

export default function BrandIcon({ name, color, className = "w-5 h-5", fallbackText = "" }) {
  const [imgError, setImgError] = useState(false);

  if (!name) {
    return <Server className={className} style={{ color: color || '#64748b' }} />;
  }

  const rawName = String(name).trim();

  // 1. Direct URL (Uploads, external or explicit path)
  const isDirectUrl = rawName.startsWith('/') || rawName.startsWith('http://') || rawName.startsWith('https://') || rawName.startsWith('data:image/');
  
  if (isDirectUrl) {
    if (imgError) {
      return <Server className={className} style={{ color: color || '#64748b' }} />;
    }
    return (
      <div className={`${className} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={rawName}
          alt={fallbackText || 'Icon'}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  const cleanSlug = rawName.toLowerCase().replace(/\.svg$/, '').replace(/\s+/g, '-');

  // 2. Local SVG icon file (/icons/{slug}.svg)
  if (!imgError && cleanSlug && cleanSlug !== 'globe' && cleanSlug !== 'server' && cleanSlug !== 'folder') {
    return (
      <div className={`${className} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={`/icons/${cleanSlug}.svg`}
          alt={fallbackText || cleanSlug}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Lucide Icon Fallback
  const LucideComponent = resolveLucide(name);
  if (LucideComponent) {
    return <LucideComponent className={className} style={{ color: color || '#94a3b8' }} />;
  }

  // 4. Default Calm Sysadmin Icon
  return <Server className={className} style={{ color: color || '#64748b' }} />;
}
