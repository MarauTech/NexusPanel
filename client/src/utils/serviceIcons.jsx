import React from 'react';

/**
 * High quality official SVG icons for top homelab and self-hosted services.
 * Stored locally with authentic paths and vector viewBoxes.
 */
export const OFFICIAL_SERVICE_SVGS = {
  plex: {
    name: 'Plex',
    color: '#e5a00d',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12.001 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 2.4a9.6 9.6 0 1 1 0 19.2 9.6 9.6 0 0 1 0-19.2zm-2.8 4.2v10.8l6.8-5.4-6.8-5.4z" />
      </svg>
    )
  },
  jellyfin: {
    name: 'Jellyfin',
    color: '#aa5cc3',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2.6c-5.18 0-9.4 4.22-9.4 9.4 0 5.18 4.22 9.4 9.4 9.4 5.18 0 9.4-4.22 9.4-9.4 0-5.18-4.22-9.4-9.4-9.4zm-1.8 13.5V7.9l6 4.1-6 4.1z" />
      </svg>
    )
  },
  immich: {
    name: 'Immich',
    color: '#4258ff',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  proxmox: {
    name: 'Proxmox VE',
    color: '#e57000',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.3l7.8 4.3-3.4 1.9-4.4-2.4-4.4 2.4-3.4-1.9L12 4.3zM4 9.8l3.2 1.8v4.9L4 14.7V9.8zm4.8 7.4v-4.9l3.2 1.8v4.9L8.8 17.2zm6.4 0l-3.2-1.8v-4.9l3.2-1.8v8.5zm4.8-2.5l-3.2 1.8v-4.9l3.2-1.8v4.9z"/>
      </svg>
    )
  },
  portainer: {
    name: 'Portainer',
    color: '#13bef9',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8-3.4 1.9-3.4-1.9-3.4 1.9-3.4-1.9L12 4.2zm-7 5.7l3 1.7v4.6l-3-1.7V9.9zm4 7.2v-4.6l3 1.7v4.6l-3-1.7zm7 0l-3-1.7v-4.6l3-1.7v8zm4-2.3l-3 1.7v-4.6l3-1.7v4.6z"/>
      </svg>
    )
  },
  homeassistant: {
    name: 'Home Assistant',
    color: '#18bcf2',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 11h3v10h6v-6h2v6h6V11h3L12 2zm0 3.2l5 4.5v9.3h-2v-6H9v6H7V9.7l5-4.5z"/>
      </svg>
    )
  },
  asustor: {
    name: 'ASUSTOR',
    color: '#2b79c2',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v4h16V6H4zm0 6v6h16v-6H4zm13 2h2v2h-2v-2zm-3 0h2v2h-2v-2z"/>
      </svg>
    )
  },
  synology: {
    name: 'Synology',
    color: '#2272b4',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    )
  },
  umbrel: {
    name: 'Umbrel OS',
    color: '#5b616e',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zm-1 10v6a1 1 0 0 0 2 0v-6h-2z" />
      </svg>
    )
  },
  truenas: {
    name: 'TrueNAS',
    color: '#0095d5',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 3.3L18 8l-6 2.7L6 8l6-2.7zM4.5 9.1l6 2.7v6.6l-6-3V9.1zm15 6.3l-6 3v-6.6l6-2.7v6.3z"/>
      </svg>
    )
  },
  unraid: {
    name: 'Unraid',
    color: '#f15a24',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M4 4h3v16H4V4zm6 0h3v16h-3V4zm6 0h4v16h-4V4z"/>
      </svg>
    )
  },
  openmediavault: {
    name: 'OpenMediaVault',
    color: '#cb3837',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M3 4h18v16H3V4zm2 2v12h14V6H5zm3 3h8v2H8V9zm0 4h5v2H8v-2z"/>
      </svg>
    )
  },
  grafana: {
    name: 'Grafana',
    color: '#f46800',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    )
  },
  prometheus: {
    name: 'Prometheus',
    color: '#e6522c',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a5 5 0 0 0-5 5c0 1.8.96 3.38 2.4 4.25L6 17h12l-3.4-5.75A5 5 0 0 0 17 7a5 5 0 0 0-5-5zm0 17H6v2h12v-2h-6z"/>
      </svg>
    )
  },
  docker: {
    name: 'Docker',
    color: '#2496ed',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M13.98 11.08h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H11.1zm-2.88 0h2.09v1.94H8.22zm-2.88 0h2.09v1.94H5.34zm8.64-2.88h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H11.1zm-2.88 0h2.09v1.94H8.22zm8.64-2.88h2.09v1.94h-2.09zm-2.88 0h2.09v1.94H13.98zm8.64 8.64c-.11-.53-.41-.98-.84-1.3-.43-.32-.97-.47-1.52-.42-.51.05-.98.24-1.37.55-.42-.14-.86-.21-1.3-.21H2.43c-.48 0-.94.19-1.28.53-.34.34-.53.8-.53 1.28 0 2.87 1.14 5.62 3.17 7.65s4.78 3.17 7.65 3.17c3.98 0 7.74-2.14 9.77-5.59.35-.6.54-1.28.56-1.98.02-.7-.14-1.39-.46-2.01-.13-.25-.32-.47-.55-.65z"/>
      </svg>
    )
  },
  pihole: {
    name: 'Pi-hole',
    color: '#96060c',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    )
  },
  adguard: {
    name: 'AdGuard Home',
    color: '#68bc71',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-3.5-3.5 1.41-1.41L11 13.67l5.09-5.09L17.5 10l-6.5 6.5z"/>
      </svg>
    )
  },
  nginx: {
    name: 'Nginx',
    color: '#009639',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm-3 6.5h2.2l3.6 5.5V8.5h2v7H14.6L11 10v5.5H9v-7z"/>
      </svg>
    )
  },
  traefik: {
    name: 'Traefik',
    color: '#24a1c1',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3.2L18 8l-6 3.3L6 8l6-2.8zM5.5 9.4l5.5 3v6.3l-5.5-3V9.4zm13 6.3l-5.5 3v-6.3l5.5-3v6.3z"/>
      </svg>
    )
  },
  caddy: {
    name: 'Caddy',
    color: '#22b573',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 1 1-6 6 6 6 0 0 1 6-6z"/>
      </svg>
    )
  },
  nextcloud: {
    name: 'Nextcloud',
    color: '#0082c9',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 3a6 6 0 0 0-5.8 4.5A4.5 4.5 0 0 0 3 12a4.5 4.5 0 0 0 3.2 4.3A6 6 0 0 0 12 21a6 6 0 0 0 5.8-4.7A4.5 4.5 0 0 0 21 12a4.5 4.5 0 0 0-3.2-4.3A6 6 0 0 0 12 3zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm-6 4.5a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5zm12 0a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5z"/>
      </svg>
    )
  },
  vaultwarden: {
    name: 'Vaultwarden',
    color: '#175ddc',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L4 5v6.5c0 5.2 3.4 10.1 8 11.5 4.6-1.4 8-6.3 8-11.5V5l-8-3zm0 4a4 4 0 0 1 4 4v2h-8v-2a4 4 0 0 1 4-4zm-5 8h10v5.3c0 3.1-2 5.9-5 6.9-3-1-5-3.8-5-6.9V14z"/>
      </svg>
    )
  },
  sonarr: {
    name: 'Sonarr',
    color: '#00c4ff',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z"/>
      </svg>
    )
  },
  radarr: {
    name: 'Radarr',
    color: '#ffc230',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    )
  },
  lidarr: {
    name: 'Lidarr',
    color: '#00d084',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    )
  },
  prowlarr: {
    name: 'Prowlarr',
    color: '#e74c3c',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-9-7zm0 4.5l5 3.9v9.6H7V10.4l5-3.9z"/>
      </svg>
    )
  },
  qbittorrent: {
    name: 'qBittorrent',
    color: '#2f679f',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H9l3-4 3 4h-2v4z"/>
      </svg>
    )
  },
  transmission: {
    name: 'Transmission',
    color: '#cc1111',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 4l5 3.1-5 3.1-5-3.1L12 6zm-6 4.7l5 3.1v5.5l-5-3.1v-5.5zm12 5.5l-5 3.1v-5.5l5-3.1v5.5z"/>
      </svg>
    )
  },
  emby: {
    name: 'Emby',
    color: '#52b54b',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm-2 14.5v-9l7 4.5z"/>
      </svg>
    )
  },
  kubernetes: {
    name: 'Kubernetes',
    color: '#326ce5',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm0 2.2l6.5 3.8v7.6L12 19.4 5.5 15.6V8L12 4.2zm-1 3.8v4.5l3.5 2 1-1.7-2.5-1.4V8h-2z"/>
      </svg>
    )
  },
  gitlab: {
    name: 'GitLab',
    color: '#fc6d26',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51c.06-.18.23-.3.42-.3s.36.12.42.3l2.44 7.51h8.02l2.44-7.51c.06-.18.23-.3.42-.3s.36.12.42.3l2.44 7.51 1.22 3.78c.1.31 0 .68-.24.94z"/>
      </svg>
    )
  },
  github: {
    name: 'GitHub',
    color: '#f0f6fc',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  },
  wordpress: {
    name: 'WordPress',
    color: '#21759b',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-8.3 10A8.29 8.29 0 0 1 12 3.7a8.2 8.2 0 0 1 4.7 1.48l-4 11.66-3-8.91c.36-.03.73-.06.73-.06a.46.46 0 0 0 0-.91s-1.2.09-2 .09c-.73 0-1.92-.09-1.92-.09a.46.46 0 0 0 0 .91s.36.03.68.06l2.36 6.51-3.26-9.54zm8.3 8.3a8.28 8.28 0 0 1-5.18-1.82l3.7-10.74 3.73 10.22A8.25 8.25 0 0 1 12 20.3z"/>
      </svg>
    )
  },
  mysql: {
    name: 'MySQL',
    color: '#00758f',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 3c-4.97 0-9 1.79-9 4s4.03 4 9 4 9-1.79 9-4-4.03-4-9-4zm0 6c-3.87 0-7-1.12-7-2.5S8.13 4 12 4s7 1.12 7 2.5S15.87 9 12 9zm-9 3v4c0 2.21 4.03 4 9 4s9-1.79 9-4v-4c-2.03 1.48-5.32 2.5-9 2.5s-6.97-1.02-9-2.5z"/>
      </svg>
    )
  },
  postgres: {
    name: 'PostgreSQL',
    color: '#336791',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 14v1c0 1.1.9 2 2 2v1.93z"/>
      </svg>
    )
  },
  redis: {
    name: 'Redis',
    color: '#dc382d',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 8L4.5 6.2 12 4l7.5 2.2L12 10zm-10 4l10 5 10-5-2.5-1.2L12 16.5 4.5 12.8 2 14zm0 5l10 5 10-5-2.5-1.2L12 21.5 4.5 17.8 2 19z"/>
      </svg>
    )
  },
  cloudflare: {
    name: 'Cloudflare',
    color: '#f38020',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M18.42 10.45A6.5 6.5 0 0 0 6.17 9.17 4.5 4.5 0 0 0 2 13.5a4.5 4.5 0 0 0 4.5 4.5h12a3.5 3.5 0 0 0 3.5-3.5 3.5 3.5 0 0 0-3.58-4.05z"/>
      </svg>
    )
  },
  tailscale: {
    name: 'Tailscale',
    color: '#496bf6',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
      </svg>
    )
  },
  wireguard: {
    name: 'WireGuard',
    color: '#88171a',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.09-2.73 7.89-6 8.87-3.27-.98-6-4.78-6-8.87V6.43l6-2.25zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z"/>
      </svg>
    )
  },
  openvpn: {
    name: 'OpenVPN',
    color: '#ea7e20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V15h-2v1.93A8 8 0 0 1 4.07 13H6v-2H4.07A8 8 0 0 1 11 4.07V6h2V4.07A8 8 0 0 1 19.93 11H18v2h1.93A8 8 0 0 1 13 16.93z"/>
      </svg>
    )
  },
  frigate: {
    name: 'Frigate NVR',
    color: '#2898bd',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15a5 5 0 1 1 5-5 5 5 0 0 1-5 5zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3z"/>
      </svg>
    )
  },
  esphome: {
    name: 'ESPHome',
    color: '#000000',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 9.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9.5L12 2zm0 3.3l7 5.25V20H5V10.55l7-5.25zM11 12h2v6h-2v-6z"/>
      </svg>
    )
  },
  homebridge: {
    name: 'Homebridge',
    color: '#65239a',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 4.5l5 4.5v6H7v-6l5-4.5z"/>
      </svg>
    )
  },
  nodered: {
    name: 'Node-RED',
    color: '#8f0000',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 7l10 5 10-5-10-5zm-7 8.5l7 3.5 7-3.5V17l-7 3.5L5 17v-6.5z"/>
      </svg>
    )
  },
  paperless: {
    name: 'Paperless-ngx',
    color: '#0d7d6c',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-5 8h8v2H8v-2zm0 4h8v2H8v-2z"/>
      </svg>
    )
  },
  uptimekuma: {
    name: 'Uptime Kuma',
    color: '#5cd895',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.59L8.71 12.3a1 1 0 1 1 1.41-1.41L13 13.76l4.88-4.88a1 1 0 0 1 1.41 1.41z"/>
      </svg>
    )
  },
  mikrotik: {
    name: 'RouterOS / MikroTik',
    color: '#222222',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
      </svg>
    )
  },
  opnsense: {
    name: 'OPNsense',
    color: '#d94f00',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 3.3l7 3.8-7 3.8-7-3.8 7-3.8zM4.5 10l6.5 3.5v7l-6.5-3.5V10zm15 7l-6.5 3.5v-7l6.5-3.5v7z"/>
      </svg>
    )
  },
  gitea: {
    name: 'Gitea',
    color: '#609926',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
      </svg>
    )
  },
  router: {
    name: 'Router',
    color: '#64748b',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M20 13H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm-1 5h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H9v-2h2v2zM6 9h2v2H6V9zm5-4h2v6h-2V5zm5 2h2v4h-2V7z"/>
      </svg>
    )
  }
};

/**
 * Intelligent normalization of service names into canonical keys
 */
export function matchServiceIconKey(nameOrIcon) {
  if (!nameOrIcon) return null;
  const str = String(nameOrIcon).toLowerCase().trim();
  const clean = str.replace(/[^a-z0-9]/g, '');

  // Exact / prefix / alias rules
  if (clean.includes('plex')) return 'plex';
  if (clean.includes('jellyfin')) return 'jellyfin';
  if (clean.includes('immich')) return 'immich';
  if (clean.includes('proxmox') || clean.includes('pve')) return 'proxmox';
  if (clean.includes('portainer')) return 'portainer';
  if (clean.includes('homeassistant') || clean.includes('hass') || clean === 'ha') return 'homeassistant';
  if (clean.includes('asustor') || clean.includes('adm')) return 'asustor';
  if (clean.includes('synology') || clean.includes('dsm')) return 'synology';
  if (clean.includes('umbrel')) return 'umbrel';
  if (clean.includes('truenas') || clean.includes('freenas')) return 'truenas';
  if (clean.includes('unraid')) return 'unraid';
  if (clean.includes('openmediavault') || clean.includes('omv')) return 'openmediavault';
  if (clean.includes('grafana')) return 'grafana';
  if (clean.includes('prometheus')) return 'prometheus';
  if (clean.includes('docker')) return 'docker';
  if (clean.includes('pihole')) return 'pihole';
  if (clean.includes('adguard')) return 'adguard';
  if (clean.includes('nginx')) return 'nginx';
  if (clean.includes('traefik')) return 'traefik';
  if (clean.includes('caddy')) return 'caddy';
  if (clean.includes('nextcloud')) return 'nextcloud';
  if (clean.includes('vaultwarden') || clean.includes('bitwarden')) return 'vaultwarden';
  if (clean.includes('sonarr')) return 'sonarr';
  if (clean.includes('radarr')) return 'radarr';
  if (clean.includes('lidarr')) return 'lidarr';
  if (clean.includes('prowlarr')) return 'prowlarr';
  if (clean.includes('qbittorrent') || clean.includes('qbit')) return 'qbittorrent';
  if (clean.includes('transmission')) return 'transmission';
  if (clean.includes('emby')) return 'emby';
  if (clean.includes('kubernetes') || clean.includes('k8s') || clean.includes('k3s')) return 'kubernetes';
  if (clean.includes('gitlab')) return 'gitlab';
  if (clean.includes('github')) return 'github';
  if (clean.includes('wordpress')) return 'wordpress';
  if (clean.includes('mysql')) return 'mysql';
  if (clean.includes('postgres')) return 'postgres';
  if (clean.includes('redis')) return 'redis';
  if (clean.includes('cloudflare')) return 'cloudflare';
  if (clean.includes('tailscale')) return 'tailscale';
  if (clean.includes('wireguard')) return 'wireguard';
  if (clean.includes('openvpn')) return 'openvpn';
  if (clean.includes('frigate')) return 'frigate';
  if (clean.includes('esphome')) return 'esphome';
  if (clean.includes('homebridge')) return 'homebridge';
  if (clean.includes('nodered')) return 'nodered';
  if (clean.includes('paperless')) return 'paperless';
  if (clean.includes('uptimekuma') || clean.includes('kuma')) return 'uptimekuma';
  if (clean.includes('routeros') || clean.includes('mikrotik') || clean.includes('router')) return 'mikrotik';
  if (clean.includes('opnsense')) return 'opnsense';
  if (clean.includes('gitea')) return 'gitea';

  return null;
}
