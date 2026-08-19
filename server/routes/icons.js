import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    selfhosted: [
      { name: 'proxmox', label: 'Proxmox' },
      { name: 'docker', label: 'Docker' },
      { name: 'portainer', label: 'Portainer' },
      { name: 'home-assistant', label: 'Home Assistant' },
      { name: 'grafana', label: 'Grafana' },
      { name: 'uptime-kuma', label: 'Uptime Kuma' },
      { name: 'pihole', label: 'Pi-hole' },
      { name: 'adguard-home', label: 'AdGuard Home' },
      { name: 'plex', label: 'Plex' },
      { name: 'jellyfin', label: 'Jellyfin' },
      { name: 'nextcloud', label: 'Nextcloud' },
      { name: 'truenas', label: 'TrueNAS' },
      { name: 'asustor', label: 'ASUSTOR' },
      { name: 'synology', label: 'Synology' },
      { name: 'nginx', label: 'Nginx' },
      { name: 'traefik', label: 'Traefik' },
      { name: 'gitea', label: 'Gitea' },
      { name: 'github', label: 'GitHub' },
      { name: 'gitlab', label: 'GitLab' },
      { name: 'wireguard', label: 'WireGuard' },
      { name: 'openvpn', label: 'OpenVPN' },
      { name: 'wordpress', label: 'WordPress' },
      { name: 'bitwarden', label: 'Bitwarden' },
      { name: 'vaultwarden', label: 'Vaultwarden' },
      { name: 'unraid', label: 'Unraid' },
      { name: 'proxmox-backup', label: 'Proxmox Backup' },
      { name: 'emby', label: 'Emby' },
      { name: 'sonarr', label: 'Sonarr' },
      { name: 'radarr', label: 'Radarr' },
      { name: 'qbittorrent', label: 'qBittorrent' },
      { name: 'transmission', label: 'Transmission' },
      { name: 'homebridge', label: 'Homebridge' },
      { name: 'zigbee2mqtt', label: 'Zigbee2MQTT' },
      { name: 'mosquitto', label: 'Mosquitto' },
      { name: 'nodered', label: 'Node-RED' },
      { name: 'esphome', label: 'ESPHome' },
      { name: 'frigate', label: 'Frigate' },
      { name: 'paperless', label: 'Paperless-ngx' },
      { name: 'immich', label: 'Immich' },
      { name: 'photoprism', label: 'PhotoPrism' }
    ],
    lucide: [
      'globe', 'server', 'database', 'hard-drive', 'monitor', 'shield', 'wifi',
      'router', 'cloud', 'code', 'terminal', 'cpu', 'memory-stick', 'network',
      'lock', 'key', 'eye', 'camera', 'home', 'settings', 'folder', 'file',
      'mail', 'message-square', 'bell', 'calendar', 'clock', 'search',
      'download', 'upload', 'link', 'external-link', 'activity', 'bar-chart',
      'pie-chart', 'trending-up', 'zap', 'box', 'package', 'layers',
      'git-branch', 'git-commit', 'git-merge', 'git-pull-request',
      'container', 'smartphone', 'tablet', 'tv', 'speaker', 'radio',
      'thermometer', 'sun', 'moon', 'cloud-rain', 'wind'
    ]
  });
});

export default router;
