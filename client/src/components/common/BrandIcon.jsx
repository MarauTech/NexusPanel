import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { OFFICIAL_SERVICE_SVGS, matchServiceIconKey } from '../../utils/serviceIcons';

function resolveLucide(name) {
  if (!name) return null;
  if (LucideIcons[name]) return LucideIcons[name];
  const pascal = name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  return LucideIcons[pascal] || null;
}

export default function BrandIcon({ name, color, className = "w-5 h-5", fallbackText = "" }) {
  const [imgError, setImgError] = useState(false);

  // Clean the icon identifier
  const cleanName = name ? String(name).toLowerCase().trim().replace(/\.svg$/, '') : '';
  const iconKey = matchServiceIconKey(cleanName) || matchServiceIconKey(fallbackText);

  // 1. Try public SVG icon asset (/icons/{name}.svg)
  const candidateFile = cleanName || iconKey;
  if (candidateFile && !imgError && candidateFile !== 'globe' && candidateFile !== 'server') {
    return (
      <div className={`${className} flex items-center justify-center flex-shrink-0`}>
        <img
          src={`/icons/${candidateFile}.svg`}
          alt={fallbackText || candidateFile}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Try inline official SVG icon map
  if (iconKey && OFFICIAL_SERVICE_SVGS[iconKey]) {
    const brand = OFFICIAL_SERVICE_SVGS[iconKey];
    return (
      <div 
        className={`${className} flex items-center justify-center flex-shrink-0 transition-opacity`}
        style={{ color: brand.color || color || 'currentColor' }}
        title={brand.name}
      >
        {brand.svg}
      </div>
    );
  }

  // 3. Try Lucide Icon by name
  const LucideComponent = resolveLucide(name);
  if (LucideComponent) {
    return <LucideComponent className={className} style={{ color: color || '#94a3b8' }} />;
  }

  // 4. Fallback: Calm, neutral, monochromatic sysadmin icon (Server/Globe)
  return <LucideIcons.Server className={className} style={{ color: color || '#64748b' }} />;
}
