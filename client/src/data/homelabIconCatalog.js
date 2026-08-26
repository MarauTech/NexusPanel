/**
 * Central Homelab Icon Catalog for NexusPanel
 * Contains curated metadata, canonical slugs, categories, aliases, and search keywords for homelab services.
 */

export const ICON_CATEGORIES = [
  { id: 'all', label: 'Wszystkie', labelEn: 'All' },
  { id: 'media', label: 'Media', labelEn: 'Media' },
  { id: 'storage', label: 'Storage / NAS', labelEn: 'Storage / NAS' },
  { id: 'virtualization', label: 'Wirtualizacja', labelEn: 'Virtualization' },
  { id: 'containers', label: 'Kontenery', labelEn: 'Containers' },
  { id: 'network', label: 'Sieć & VPN', labelEn: 'Network & VPN' },
  { id: 'proxy', label: 'Proxy / Web', labelEn: 'Proxy / Web' },
  { id: 'monitoring', label: 'Monitoring', labelEn: 'Monitoring' },
  { id: 'smarthome', label: 'Smart Home & IoT', labelEn: 'Smart Home & IoT' },
  { id: 'development', label: 'Development', labelEn: 'Development' },
  { id: 'databases', label: 'Bazy danych', labelEn: 'Databases' },
  { id: 'security', label: 'Bezpieczeństwo', labelEn: 'Security' },
  { id: 'automation', label: 'Automatyzacja', labelEn: 'Automation' },
  { id: 'dashboards', label: 'Dashboardy', labelEn: 'Dashboards' },
  { id: 'documents', label: 'Dokumenty & Wiki', labelEn: 'Documents & Wiki' },
  { id: 'backup', label: 'Backup', labelEn: 'Backup' },
  { id: 'ai', label: 'Sztuczna inteligencja (AI)', labelEn: 'Artificial Intelligence' },
  { id: 'games', label: 'Gry & Serwery', labelEn: 'Games' }
];

export const HOMELAB_CATALOG_ITEMS = [
  // ==========================================
  // MEDIA
  // ==========================================
  {
    name: 'Plex Media Server',
    slug: 'plex',
    category: 'media',
    aliases: ['plex', 'plex media server', 'plex server', 'pms'],
    keywords: ['streaming', 'movies', 'filmy', 'video', 'serial', 'transcode'],
    icon: '/icons/plex.svg',
    color: '#e5a00d',
    source: 'walkxcode/dashboard-icons',
    license: 'Brand Trademark / Apache-2.0'
  },
  {
    name: 'Jellyfin',
    slug: 'jellyfin',
    category: 'media',
    aliases: ['jellyfin', 'jellyfin media server'],
    keywords: ['streaming', 'movies', 'video', 'open source', 'emby fork'],
    icon: '/icons/jellyfin.svg',
    color: '#aa5cc3',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Emby',
    slug: 'emby',
    category: 'media',
    aliases: ['emby', 'emby media server'],
    keywords: ['streaming', 'movies', 'video', 'media server'],
    icon: '/icons/emby.svg',
    color: '#52b54b',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary / Brand Trademark'
  },
  {
    name: 'Kodi',
    slug: 'kodi',
    category: 'media',
    aliases: ['kodi', 'xbmc'],
    keywords: ['home theater', 'htpc', 'player', 'media center'],
    icon: '/icons/kodi.svg',
    color: '#17b2e7',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Immich',
    slug: 'immich',
    category: 'media',
    aliases: ['immich', 'immich photos', 'photos', 'zdjecia'],
    keywords: ['photos', 'backup', 'gallery', 'google photos alternative', 'album'],
    icon: '/icons/immich.svg',
    color: '#4258ff',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'PhotoPrism',
    slug: 'photoprism',
    category: 'media',
    aliases: ['photoprism', 'photo prism'],
    keywords: ['photos', 'gallery', 'ai tagging', 'faces'],
    icon: '/icons/photoprism.svg',
    color: '#2b78e4',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Navidrome',
    slug: 'navidrome',
    category: 'media',
    aliases: ['navidrome', 'subsonic'],
    keywords: ['music', 'audio', 'streaming', 'mp3', 'flac', 'muzyka'],
    icon: '/icons/navidrome.svg',
    color: '#0e65c9',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Audiobookshelf',
    slug: 'audiobookshelf',
    category: 'media',
    aliases: ['audiobookshelf', 'abs', 'audiobooks'],
    keywords: ['audiobooks', 'podcasts', 'audio', 'ksiazki'],
    icon: '/icons/audiobookshelf.svg',
    color: '#935824',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Sonarr',
    slug: 'sonarr',
    category: 'media',
    aliases: ['sonarr', 'nzbdrone'],
    keywords: ['tv', 'series', 'seriale', 'arr', 'torrents', 'usenet', 'download'],
    icon: '/icons/sonarr.svg',
    color: '#00c4ff',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Radarr',
    slug: 'radarr',
    category: 'media',
    aliases: ['radarr'],
    keywords: ['movies', 'filmy', 'arr', 'torrents', 'usenet', 'download'],
    icon: '/icons/radarr.svg',
    color: '#ffc230',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Lidarr',
    slug: 'lidarr',
    category: 'media',
    aliases: ['lidarr'],
    keywords: ['music', 'muzyka', 'albums', 'arr', 'download'],
    icon: '/icons/lidarr.svg',
    color: '#00d084',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Readarr',
    slug: 'readarr',
    category: 'media',
    aliases: ['readarr'],
    keywords: ['books', 'ebooks', 'ksiazki', 'arr', 'download'],
    icon: '/icons/readarr.svg',
    color: '#d44949',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Bazarr',
    slug: 'bazarr',
    category: 'media',
    aliases: ['bazarr'],
    keywords: ['subtitles', 'napisy', 'arr', 'opensubtitles'],
    icon: '/icons/bazarr.svg',
    color: '#bf5d30',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Prowlarr',
    slug: 'prowlarr',
    category: 'media',
    aliases: ['prowlarr'],
    keywords: ['indexers', 'trackers', 'arr', 'jackett', 'torznab'],
    icon: '/icons/prowlarr.svg',
    color: '#e74c3c',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Overseerr',
    slug: 'overseerr',
    category: 'media',
    aliases: ['overseerr'],
    keywords: ['requests', 'plex request', 'movies', 'series'],
    icon: '/icons/overseerr.svg',
    color: '#e5a00d',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Jellyseerr',
    slug: 'jellyseerr',
    category: 'media',
    aliases: ['jellyseerr', 'seerr'],
    keywords: ['requests', 'jellyfin request', 'emby request'],
    icon: '/icons/jellyseerr.svg',
    color: '#aa5cc3',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'qBittorrent',
    slug: 'qbittorrent',
    category: 'media',
    aliases: ['qbittorrent', 'qbit', 'torrent'],
    keywords: ['torrent', 'p2p', 'download', 'pobieranie'],
    icon: '/icons/qbittorrent.svg',
    color: '#2f679f',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Transmission',
    slug: 'transmission',
    category: 'media',
    aliases: ['transmission', 'transmission-daemon'],
    keywords: ['torrent', 'p2p', 'client'],
    icon: '/icons/transmission.svg',
    color: '#cc1111',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'SABnzbd',
    slug: 'sabnzbd',
    category: 'media',
    aliases: ['sabnzbd', 'usenet'],
    keywords: ['usenet', 'nzb', 'download', 'newsgroups'],
    icon: '/icons/sabnzbd.svg',
    color: '#ffc200',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'NZBGet',
    slug: 'nzbget',
    category: 'media',
    aliases: ['nzbget'],
    keywords: ['usenet', 'nzb', 'downloader'],
    icon: '/icons/nzbget.svg',
    color: '#3498db',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'JDownloader',
    slug: 'jdownloader',
    category: 'media',
    aliases: ['jdownloader', 'jdownloader2', 'jd2'],
    keywords: ['direct download', 'rapidgator', 'mega', 'download manager'],
    icon: '/icons/jdownloader.svg',
    color: '#2572b4',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },

  // ==========================================
  // STORAGE / NAS
  // ==========================================
  {
    name: 'TrueNAS',
    slug: 'truenas',
    category: 'storage',
    aliases: ['truenas', 'truenas core', 'truenas scale', 'freenas'],
    keywords: ['nas', 'storage', 'zfs', 'raid', 'dysk', 'macierz'],
    icon: '/icons/truenas.svg',
    color: '#0095d5',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-2-Clause'
  },
  {
    name: 'Unraid',
    slug: 'unraid',
    category: 'storage',
    aliases: ['unraid', 'lime tech'],
    keywords: ['nas', 'storage', 'array', 'docker host', 'vms'],
    icon: '/icons/unraid.svg',
    color: '#f15a24',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'OpenMediaVault',
    slug: 'openmediavault',
    category: 'storage',
    aliases: ['openmediavault', 'omv'],
    keywords: ['nas', 'storage', 'debian nas', 'raid'],
    icon: '/icons/openmediavault.svg',
    color: '#cb3837',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Synology DSM',
    slug: 'synology',
    category: 'storage',
    aliases: ['synology', 'dsm', 'diskstation'],
    keywords: ['nas', 'synology nas', 'dsm 7', 'storage'],
    icon: '/icons/synology.svg',
    color: '#2272b4',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'QNAP QTS',
    slug: 'qnap',
    category: 'storage',
    aliases: ['qnap', 'qts', 'quTS'],
    keywords: ['nas', 'qnap nas', 'storage'],
    icon: '/icons/qnap.svg',
    color: '#0b5299',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'ASUSTOR ADM',
    slug: 'asustor',
    category: 'storage',
    aliases: ['asustor', 'adm', 'asustor nas'],
    keywords: ['nas', 'asustor nas', 'storage'],
    icon: '/icons/asustor.svg',
    color: '#2b79c2',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'Nextcloud',
    slug: 'nextcloud',
    category: 'storage',
    aliases: ['nextcloud', 'nextcloud hub'],
    keywords: ['cloud', 'chmura', 'files', 'sync', 'drive', 'owncloud fork'],
    icon: '/icons/nextcloud.svg',
    color: '#0082c9',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'ownCloud',
    slug: 'owncloud',
    category: 'storage',
    aliases: ['owncloud', 'owncloud infinite scale'],
    keywords: ['cloud', 'chmura', 'files', 'sync', 'storage'],
    icon: '/icons/owncloud.svg',
    color: '#1f2d5a',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Seafile',
    slug: 'seafile',
    category: 'storage',
    aliases: ['seafile'],
    keywords: ['files', 'sync', 'cloud drive', 'storage'],
    icon: '/icons/seafile.svg',
    color: '#e76f51',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Syncthing',
    slug: 'syncthing',
    category: 'storage',
    aliases: ['syncthing'],
    keywords: ['p2p sync', 'continuous sync', 'decentralized', 'synchronizacja'],
    icon: '/icons/syncthing.svg',
    color: '#2681d4',
    source: 'walkxcode/dashboard-icons',
    license: 'MPL-2.0'
  },
  {
    name: 'MinIO',
    slug: 'minio',
    category: 'storage',
    aliases: ['minio', 'min.io', 's3'],
    keywords: ['s3', 'object storage', 'bucket', 'blob'],
    icon: '/icons/minio.svg',
    color: '#c72c48',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'FileBrowser',
    slug: 'filebrowser',
    category: 'storage',
    aliases: ['filebrowser', 'file browser'],
    keywords: ['web file manager', 'explorer', 'pliki'],
    icon: '/icons/filebrowser.svg',
    color: '#2196f3',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },

  // ==========================================
  // VIRTUALIZATION
  // ==========================================
  {
    name: 'Proxmox VE',
    slug: 'proxmox',
    category: 'virtualization',
    aliases: ['proxmox', 'proxmox ve', 'pve', 'hypervisor'],
    keywords: ['virtualization', 'vms', 'lxc', 'kvm', 'cluster', 'node'],
    icon: '/icons/proxmox.svg',
    color: '#e57000',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Proxmox Backup Server',
    slug: 'proxmox-backup-server',
    category: 'virtualization',
    aliases: ['proxmox backup server', 'pbs', 'proxmox backup'],
    keywords: ['backup', 'deduplication', 'pve backup'],
    icon: '/icons/proxmox-backup-server.svg',
    color: '#e57000',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'VMware ESXi / vSphere',
    slug: 'vmware',
    category: 'virtualization',
    aliases: ['vmware', 'esxi', 'vsphere', 'vcenter'],
    keywords: ['hypervisor', 'virtual machine', 'enterprise'],
    icon: '/icons/vmware.svg',
    color: '#607078',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'XCP-ng',
    slug: 'xcp-ng',
    category: 'virtualization',
    aliases: ['xcp-ng', 'xcpng', 'xen server'],
    keywords: ['hypervisor', 'xen', 'vms'],
    icon: '/icons/xcp-ng.svg',
    color: '#1bb3c8',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Xen Orchestra',
    slug: 'xen-orchestra',
    category: 'virtualization',
    aliases: ['xen orchestra', 'xoa'],
    keywords: ['xcp-ng web ui', 'management', 'vms'],
    icon: '/icons/xen-orchestra.svg',
    color: '#2a5b84',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Oracle VirtualBox',
    slug: 'virtualbox',
    category: 'virtualization',
    aliases: ['virtualbox', 'vbox'],
    keywords: ['virtualization', 'desktop vms'],
    icon: '/icons/virtualbox.svg',
    color: '#183a61',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'QEMU',
    slug: 'qemu',
    category: 'virtualization',
    aliases: ['qemu', 'emulator'],
    keywords: ['emulator', 'virtualization', 'kvm'],
    icon: '/icons/qemu.svg',
    color: '#ff6600',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },

  // ==========================================
  // CONTAINERS
  // ==========================================
  {
    name: 'Docker',
    slug: 'docker',
    category: 'containers',
    aliases: ['docker', 'docker engine'],
    keywords: ['containers', 'daemon', 'kontenery', 'dockerfile'],
    icon: '/icons/docker.svg',
    color: '#2496ed',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Docker Compose',
    slug: 'docker-compose',
    category: 'containers',
    aliases: ['docker compose', 'compose'],
    keywords: ['compose', 'yaml', 'stack', 'multi-container'],
    icon: '/icons/docker-compose.svg',
    color: '#2496ed',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Portainer CE',
    slug: 'portainer',
    category: 'containers',
    aliases: ['portainer', 'portainer ce', 'portainer business'],
    keywords: ['docker ui', 'management', 'containers', 'stacks', 'swarms'],
    icon: '/icons/portainer.svg',
    color: '#13bef9',
    source: 'walkxcode/dashboard-icons',
    license: 'Zlib'
  },
  {
    name: 'Dockge',
    slug: 'dockge',
    category: 'containers',
    aliases: ['dockge'],
    keywords: ['docker compose manager', 'louislam', 'stacks'],
    icon: '/icons/dockge.svg',
    color: '#f59e0b',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Yacht',
    slug: 'yacht',
    category: 'containers',
    aliases: ['yacht'],
    keywords: ['docker dashboard', 'container templates'],
    icon: '/icons/yacht.svg',
    color: '#3498db',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Kubernetes',
    slug: 'kubernetes',
    category: 'containers',
    aliases: ['kubernetes', 'k8s'],
    keywords: ['orchestration', 'cluster', 'pods', 'k8s'],
    icon: '/icons/kubernetes.svg',
    color: '#326ce5',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'K3s',
    slug: 'k3s',
    category: 'containers',
    aliases: ['k3s', 'lightweight kubernetes'],
    keywords: ['k8s', 'rancher k3s', 'iot kubernetes'],
    icon: '/icons/k3s.svg',
    color: '#ffc61e',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Rancher',
    slug: 'rancher',
    category: 'containers',
    aliases: ['rancher', 'suse rancher'],
    keywords: ['kubernetes management', 'multi-cluster'],
    icon: '/icons/rancher.svg',
    color: '#0075a8',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Helm',
    slug: 'helm',
    category: 'containers',
    aliases: ['helm', 'helm chart'],
    keywords: ['k8s package manager', 'charts'],
    icon: '/icons/helm.svg',
    color: '#0f1689',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },

  // ==========================================
  // NETWORK & VPN
  // ==========================================
  {
    name: 'UniFi Network',
    slug: 'unifi',
    category: 'network',
    aliases: ['unifi', 'unifi network', 'ubiquiti', 'udm', 'cloud key'],
    keywords: ['router', 'switch', 'access point', 'wifi', 'gateway'],
    icon: '/icons/unifi.svg',
    color: '#006fff',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'MikroTik RouterOS',
    slug: 'mikrotik',
    category: 'network',
    aliases: ['mikrotik', 'routeros', 'winbox', 'router'],
    keywords: ['router', 'firewall', 'switch', 'routing', 'bpg'],
    icon: '/icons/mikrotik.svg',
    color: '#222222',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'OPNsense',
    slug: 'opnsense',
    category: 'network',
    aliases: ['opnsense', 'opn-sense'],
    keywords: ['firewall', 'router', 'freebsd firewall', 'pfsense fork'],
    icon: '/icons/opnsense.svg',
    color: '#d94f00',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-2-Clause'
  },
  {
    name: 'pfSense',
    slug: 'pfsense',
    category: 'network',
    aliases: ['pfsense', 'netgate'],
    keywords: ['firewall', 'router', 'freebsd'],
    icon: '/icons/pfsense.svg',
    color: '#000000',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'OpenWrt',
    slug: 'openwrt',
    category: 'network',
    aliases: ['openwrt', 'luci'],
    keywords: ['router firmware', 'linux router', 'wifi'],
    icon: '/icons/openwrt.svg',
    color: '#00a6e0',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Pi-hole',
    slug: 'pihole',
    category: 'network',
    aliases: ['pihole', 'pi-hole', 'pi hole'],
    keywords: ['dns', 'adblock', 'dhcp', 'sinkhole', 'reklamy'],
    icon: '/icons/pihole.svg',
    color: '#96060c',
    source: 'walkxcode/dashboard-icons',
    license: 'EUPL-1.2'
  },
  {
    name: 'AdGuard Home',
    slug: 'adguard-home',
    category: 'network',
    aliases: ['adguard', 'adguard home', 'agh'],
    keywords: ['dns', 'adblock', 'doh', 'dot', 'privacy', 'prywatnosc'],
    icon: '/icons/adguard-home.svg',
    color: '#68bc71',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Technitium DNS',
    slug: 'technitium-dns',
    category: 'network',
    aliases: ['technitium', 'technitium dns'],
    keywords: ['dns server', 'adblock', 'authoritative dns'],
    icon: '/icons/technitium-dns.svg',
    color: '#1a73e8',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Unbound DNS',
    slug: 'unbound',
    category: 'network',
    aliases: ['unbound'],
    keywords: ['recursive dns', 'validating resolver'],
    icon: '/icons/unbound.svg',
    color: '#004c87',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'Cloudflare',
    slug: 'cloudflare',
    category: 'network',
    aliases: ['cloudflare', 'cf', '1.1.1.1'],
    keywords: ['cdn', 'dns', 'proxy', 'waf', 'tunnel'],
    icon: '/icons/cloudflare.svg',
    color: '#f38020',
    source: 'walkxcode/dashboard-icons',
    license: 'Brand Trademark'
  },
  {
    name: 'Tailscale',
    slug: 'tailscale',
    category: 'network',
    aliases: ['tailscale', 'tailnet'],
    keywords: ['mesh vpn', 'wireguard mesh', 'zero trust'],
    icon: '/icons/tailscale.svg',
    color: '#496bf6',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'Headscale',
    slug: 'headscale',
    category: 'network',
    aliases: ['headscale', 'self hosted tailscale'],
    keywords: ['open source tailscale control server', 'mesh vpn'],
    icon: '/icons/headscale.svg',
    color: '#3472f8',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'ZeroTier',
    slug: 'zerotier',
    category: 'network',
    aliases: ['zerotier', 'zerotier one'],
    keywords: ['sdn', 'mesh vpn', 'virtual switch'],
    icon: '/icons/zerotier.svg',
    color: '#ffb400',
    source: 'walkxcode/dashboard-icons',
    license: 'BSL-1.1'
  },
  {
    name: 'WireGuard',
    slug: 'wireguard',
    category: 'network',
    aliases: ['wireguard', 'wg', 'wg-easy'],
    keywords: ['vpn', 'fast vpn', 'tunnel', 'szyfrowanie'],
    icon: '/icons/wireguard.svg',
    color: '#88171a',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'OpenVPN',
    slug: 'openvpn',
    category: 'network',
    aliases: ['openvpn', 'ovpn'],
    keywords: ['vpn', 'tunnel', 'ssl vpn'],
    icon: '/icons/openvpn.svg',
    color: '#ea7e20',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'NetBird',
    slug: 'netbird',
    category: 'network',
    aliases: ['netbird'],
    keywords: ['wireguard mesh', 'zero trust network'],
    icon: '/icons/netbird.svg',
    color: '#ff6200',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },

  // ==========================================
  // PROXY / WEB
  // ==========================================
  {
    name: 'Nginx',
    slug: 'nginx',
    category: 'proxy',
    aliases: ['nginx', 'nginx web server'],
    keywords: ['reverse proxy', 'web server', 'load balancer', 'serwer www'],
    icon: '/icons/nginx.svg',
    color: '#009639',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-2-Clause'
  },
  {
    name: 'Nginx Proxy Manager',
    slug: 'nginx-proxy-manager',
    category: 'proxy',
    aliases: ['npm', 'nginx proxy manager'],
    keywords: ['reverse proxy ui', 'ssl', 'letsencrypt', 'certyfikaty'],
    icon: '/icons/nginx-proxy-manager.svg',
    color: '#ea7e20',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Traefik',
    slug: 'traefik',
    category: 'proxy',
    aliases: ['traefik', 'traefik proxy'],
    keywords: ['cloud native proxy', 'docker proxy', 'auto certs'],
    icon: '/icons/traefik.svg',
    color: '#24a1c1',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Caddy',
    slug: 'caddy',
    category: 'proxy',
    aliases: ['caddy', 'caddyserver'],
    keywords: ['automatic https', 'reverse proxy', 'fast web server'],
    icon: '/icons/caddy.svg',
    color: '#22b573',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'HAProxy',
    slug: 'haproxy',
    category: 'proxy',
    aliases: ['haproxy', 'ha proxy'],
    keywords: ['load balancer', 'tcp proxy', 'http proxy'],
    icon: '/icons/haproxy.svg',
    color: '#1a5da7',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Apache HTTP Server',
    slug: 'apache',
    category: 'proxy',
    aliases: ['apache', 'httpd', 'apache2'],
    keywords: ['web server', 'lamp stack', 'serwer'],
    icon: '/icons/apache.svg',
    color: '#d22128',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Cloudflare Tunnel',
    slug: 'cloudflare-tunnel',
    category: 'proxy',
    aliases: ['cloudflared', 'cloudflare tunnel', 'argo tunnel'],
    keywords: ['zero trust tunnel', 'expose local without port forward'],
    icon: '/icons/cloudflare-tunnel.svg',
    color: '#f38020',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'SWAG (LinuxServer)',
    slug: 'swag',
    category: 'proxy',
    aliases: ['swag', 'linuxserver swag'],
    keywords: ['secure web server and gateway', 'nginx certbot fail2ban'],
    icon: '/icons/swag.svg',
    color: '#1877f2',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },

  // ==========================================
  // MONITORING
  // ==========================================
  {
    name: 'Grafana',
    slug: 'grafana',
    category: 'monitoring',
    aliases: ['grafana', 'grafana labs'],
    keywords: ['dashboards', 'metrics', 'charts', 'wykresy', 'influx', 'prometheus'],
    icon: '/icons/grafana.svg',
    color: '#f46800',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Prometheus',
    slug: 'prometheus',
    category: 'monitoring',
    aliases: ['prometheus', 'prom'],
    keywords: ['metrics collection', 'time series database', 'alertmanager'],
    icon: '/icons/prometheus.svg',
    color: '#e6522c',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Uptime Kuma',
    slug: 'uptime-kuma',
    category: 'monitoring',
    aliases: ['uptime kuma', 'kuma'],
    keywords: ['uptime', 'status page', 'ping monitor', 'dostepnosc'],
    icon: '/icons/uptime-kuma.svg',
    color: '#5cd895',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Zabbix',
    slug: 'zabbix',
    category: 'monitoring',
    aliases: ['zabbix'],
    keywords: ['enterprise monitoring', 'agent', 'snmp'],
    icon: '/icons/zabbix.svg',
    color: '#d40000',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Nagios',
    slug: 'nagios',
    category: 'monitoring',
    aliases: ['nagios', 'nagios core'],
    keywords: ['server monitoring', 'alerts'],
    icon: '/icons/nagios.svg',
    color: '#2e7d32',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Checkmk',
    slug: 'checkmk',
    category: 'monitoring',
    aliases: ['checkmk', 'check_mk'],
    keywords: ['infrastructure monitoring', 'snmp'],
    icon: '/icons/checkmk.svg',
    color: '#15967d',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Netdata',
    slug: 'netdata',
    category: 'monitoring',
    aliases: ['netdata'],
    keywords: ['real time monitoring', 'cpu', 'ram', 'per second metrics'],
    icon: '/icons/netdata.svg',
    color: '#00ab44',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'LibreNMS',
    slug: 'librenms',
    category: 'monitoring',
    aliases: ['librenms'],
    keywords: ['network monitoring', 'snmp autodetection'],
    icon: '/icons/librenms.svg',
    color: '#2a5a8a',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'VictoriaMetrics',
    slug: 'victoriametrics',
    category: 'monitoring',
    aliases: ['victoriametrics', 'victoria metrics'],
    keywords: ['fast tsdb', 'prometheus alternative', 'long term storage'],
    icon: '/icons/victoriametrics.svg',
    color: '#c2185b',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Glances',
    slug: 'glances',
    category: 'monitoring',
    aliases: ['glances'],
    keywords: ['system monitoring tool', 'python top alternative'],
    icon: '/icons/glances.svg',
    color: '#10b981',
    source: 'walkxcode/dashboard-icons',
    license: 'LGPL-3.0'
  },
  {
    name: 'Dozzle',
    slug: 'dozzle',
    category: 'monitoring',
    aliases: ['dozzle'],
    keywords: ['docker log viewer', 'live logs', 'logi'],
    icon: '/icons/dozzle.svg',
    color: '#ffc107',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },

  // ==========================================
  // SMART HOME & IOT
  // ==========================================
  {
    name: 'Home Assistant',
    slug: 'home-assistant',
    category: 'smarthome',
    aliases: ['home assistant', 'hass', 'hassio', 'homeassistant', 'ha'],
    keywords: ['smart home', 'automations', 'zigbee', 'zwave', 'matter', 'dom'],
    icon: '/icons/home-assistant.svg',
    color: '#18bcf2',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Homebridge',
    slug: 'homebridge',
    category: 'smarthome',
    aliases: ['homebridge', 'apple homekit bridge'],
    keywords: ['homekit', 'apple home', 'ios'],
    icon: '/icons/homebridge.svg',
    color: '#65239a',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'openHAB',
    slug: 'openhab',
    category: 'smarthome',
    aliases: ['openhab', 'open hab'],
    keywords: ['smart home', 'java home automation'],
    icon: '/icons/openhab.svg',
    color: '#ff7700',
    source: 'walkxcode/dashboard-icons',
    license: 'EPL-2.0'
  },
  {
    name: 'ioBroker',
    slug: 'iobroker',
    category: 'smarthome',
    aliases: ['iobroker', 'io broker'],
    keywords: ['iot platform', 'smart home', 'nodejs'],
    icon: '/icons/iobroker.svg',
    color: '#3399cc',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Node-RED',
    slug: 'node-red',
    category: 'smarthome',
    aliases: ['nodered', 'node-red', 'node red'],
    keywords: ['flow programming', 'mqtt flows', 'automations', 'nodered'],
    icon: '/icons/node-red.svg',
    color: '#8f0000',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'ESPHome',
    slug: 'esphome',
    category: 'smarthome',
    aliases: ['esphome', 'esp8266', 'esp32'],
    keywords: ['esp32', 'esp8266', 'firmware', 'sensors', 'czujniki'],
    icon: '/icons/esphome.svg',
    color: '#000000',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Zigbee2MQTT',
    slug: 'zigbee2mqtt',
    category: 'smarthome',
    aliases: ['zigbee2mqtt', 'z2m'],
    keywords: ['zigbee', 'mqtt coordinator', 'tuya', 'philips hue', 'sonoff'],
    icon: '/icons/zigbee2mqtt.svg',
    color: '#ffb300',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Mosquitto MQTT',
    slug: 'mosquitto',
    category: 'smarthome',
    aliases: ['mosquitto', 'mqtt broker', 'mqtt'],
    keywords: ['mqtt', 'broker', 'pub sub', 'iot messages'],
    icon: '/icons/mosquitto.svg',
    color: '#3d1a45',
    source: 'walkxcode/dashboard-icons',
    license: 'EPL-2.0'
  },
  {
    name: 'Frigate NVR',
    slug: 'frigate',
    category: 'smarthome',
    aliases: ['frigate', 'frigate nvr'],
    keywords: ['cctv', 'nvr', 'cameras', 'coral ai', 'object detection', 'kamery'],
    icon: '/icons/frigate.svg',
    color: '#2898bd',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },

  // ==========================================
  // DEVELOPMENT
  // ==========================================
  {
    name: 'GitLab',
    slug: 'gitlab',
    category: 'development',
    aliases: ['gitlab', 'gitlab ce'],
    keywords: ['git', 'ci cd', 'devops', 'code hosting'],
    icon: '/icons/gitlab.svg',
    color: '#fc6d26',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'GitHub',
    slug: 'github',
    category: 'development',
    aliases: ['github', 'gh'],
    keywords: ['git', 'code', 'repository', 'kod'],
    icon: '/icons/github.svg',
    color: '#f0f6fc',
    source: 'walkxcode/dashboard-icons',
    license: 'Brand Trademark'
  },
  {
    name: 'Gitea',
    slug: 'gitea',
    category: 'development',
    aliases: ['gitea', 'tea'],
    keywords: ['lightweight git', 'self hosted git', 'repozytorium'],
    icon: '/icons/gitea.svg',
    color: '#609926',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Forgejo',
    slug: 'forgejo',
    category: 'development',
    aliases: ['forgejo'],
    keywords: ['codeberg', 'gitea fork', 'git hosting'],
    icon: '/icons/forgejo.svg',
    color: '#fb923c',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Jenkins',
    slug: 'jenkins',
    category: 'development',
    aliases: ['jenkins', 'jenkins ci'],
    keywords: ['ci cd', 'automation server', 'pipelines'],
    icon: '/icons/jenkins.svg',
    color: '#d33833',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Woodpecker CI',
    slug: 'woodpecker-ci',
    category: 'development',
    aliases: ['woodpecker', 'woodpecker-ci'],
    keywords: ['drone ci fork', 'ci cd pipelines'],
    icon: '/icons/woodpecker-ci.svg',
    color: '#2892d7',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'code-server (VS Code)',
    slug: 'code-server',
    category: 'development',
    aliases: ['code-server', 'coder code-server', 'vscode web'],
    keywords: ['ide', 'editor', 'visual studio code in browser', 'programowanie'],
    icon: '/icons/code-server.svg',
    color: '#007acc',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'JupyterLab',
    slug: 'jupyter',
    category: 'development',
    aliases: ['jupyter', 'jupyterlab', 'jupyter notebook'],
    keywords: ['python notebooks', 'data science', 'ai'],
    icon: '/icons/jupyter.svg',
    color: '#f37626',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'Visual Studio Code',
    slug: 'visual-studio-code',
    category: 'development',
    aliases: ['vscode', 'visual studio code'],
    keywords: ['editor', 'ide', 'microsoft'],
    icon: '/icons/visual-studio-code.svg',
    color: '#007acc',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Coder',
    slug: 'coder',
    category: 'development',
    aliases: ['coder', 'cloud development environments'],
    keywords: ['cde', 'remote workspace'],
    icon: '/icons/coder.svg',
    color: '#3451b2',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },

  // ==========================================
  // DATABASES
  // ==========================================
  {
    name: 'PostgreSQL',
    slug: 'postgresql',
    category: 'databases',
    aliases: ['postgres', 'postgresql', 'pgsql'],
    keywords: ['rdbms', 'sql database', 'relacyjna baza danych'],
    icon: '/icons/postgresql.svg',
    color: '#336791',
    source: 'walkxcode/dashboard-icons',
    license: 'PostgreSQL License'
  },
  {
    name: 'MySQL',
    slug: 'mysql',
    category: 'databases',
    aliases: ['mysql'],
    keywords: ['rdbms', 'sql database', 'oracle mysql'],
    icon: '/icons/mysql.svg',
    color: '#00758f',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'MariaDB',
    slug: 'mariadb',
    category: 'databases',
    aliases: ['mariadb'],
    keywords: ['mysql drop in replacement', 'open source sql'],
    icon: '/icons/mariadb.svg',
    color: '#003545',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'MongoDB',
    slug: 'mongodb',
    category: 'databases',
    aliases: ['mongodb', 'mongo'],
    keywords: ['nosql', 'document database', 'json store'],
    icon: '/icons/mongodb.svg',
    color: '#47a248',
    source: 'walkxcode/dashboard-icons',
    license: 'SSPL'
  },
  {
    name: 'Redis',
    slug: 'redis',
    category: 'databases',
    aliases: ['redis'],
    keywords: ['in memory cache', 'key value', 'fast db'],
    icon: '/icons/redis.svg',
    color: '#dc382d',
    source: 'walkxcode/dashboard-icons',
    license: 'RSAL / SSPL'
  },
  {
    name: 'Valkey',
    slug: 'valkey',
    category: 'databases',
    aliases: ['valkey', 'redis fork'],
    keywords: ['open source in memory key value', 'linux foundation'],
    icon: '/icons/valkey.svg',
    color: '#0052cc',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'SQLite',
    slug: 'sqlite',
    category: 'databases',
    aliases: ['sqlite', 'sqlite3'],
    keywords: ['embedded sql', 'single file database'],
    icon: '/icons/sqlite.svg',
    color: '#003b57',
    source: 'walkxcode/dashboard-icons',
    license: 'Public Domain'
  },
  {
    name: 'InfluxDB',
    slug: 'influxdb',
    category: 'databases',
    aliases: ['influxdb', 'influx'],
    keywords: ['time series database', 'iot metrics', 'grafana source'],
    icon: '/icons/influxdb.svg',
    color: '#22adfb',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'TimescaleDB',
    slug: 'timescale',
    category: 'databases',
    aliases: ['timescale', 'timescaledb'],
    keywords: ['time series for postgresql', 'hypertables'],
    icon: '/icons/timescale.svg',
    color: '#fdb515',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0 / TSL'
  },
  {
    name: 'OpenSearch',
    slug: 'opensearch',
    category: 'databases',
    aliases: ['opensearch', 'elasticsearch fork'],
    keywords: ['search engine', 'log analytics', 'lucene'],
    icon: '/icons/opensearch.svg',
    color: '#005ebb',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Neo4j',
    slug: 'neo4j',
    category: 'databases',
    aliases: ['neo4j'],
    keywords: ['graph database', 'cypher'],
    icon: '/icons/neo4j.svg',
    color: '#008cc1',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },

  // ==========================================
  // SECURITY / AUTHENTICATION
  // ==========================================
  {
    name: 'Authentik',
    slug: 'authentik',
    category: 'security',
    aliases: ['authentik', 'goauthentik'],
    keywords: ['sso', 'identity provider', 'idp', 'saml', 'oidc', '2fa', 'autoryzacja'],
    icon: '/icons/authentik.svg',
    color: '#fd4b2d',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Authelia',
    slug: 'authelia',
    category: 'security',
    aliases: ['authelia'],
    keywords: ['2fa portal', 'single sign on', 'forward auth', 'traefik auth'],
    icon: '/icons/authelia.svg',
    color: '#0e7fe1',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Keycloak',
    slug: 'keycloak',
    category: 'security',
    aliases: ['keycloak', 'red hat sso'],
    keywords: ['iam', 'oauth2', 'openid connect', 'identity access management'],
    icon: '/icons/keycloak.svg',
    color: '#008a97',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Vaultwarden',
    slug: 'vaultwarden',
    category: 'security',
    aliases: ['vaultwarden', 'bitwarden rs'],
    keywords: ['password manager', 'hasla', 'bitwarden rust backend', 'vault'],
    icon: '/icons/vaultwarden.svg',
    color: '#175ddc',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Bitwarden',
    slug: 'bitwarden',
    category: 'security',
    aliases: ['bitwarden'],
    keywords: ['password manager', 'vault', 'hasla'],
    icon: '/icons/bitwarden.svg',
    color: '#175ddc',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'HashiCorp Vault',
    slug: 'vault',
    category: 'security',
    aliases: ['vault', 'hashicorp vault'],
    keywords: ['secrets management', 'encryption keys', 'api tokens'],
    icon: '/icons/vault.svg',
    color: '#ffd814',
    source: 'walkxcode/dashboard-icons',
    license: 'BSL-1.1'
  },
  {
    name: 'OpenBao',
    slug: 'openbao',
    category: 'security',
    aliases: ['openbao', 'vault fork'],
    keywords: ['linux foundation secrets manager'],
    icon: '/icons/openbao.svg',
    color: '#2892d7',
    source: 'walkxcode/dashboard-icons',
    license: 'MPL-2.0'
  },
  {
    name: 'CrowdSec',
    slug: 'crowdsec',
    category: 'security',
    aliases: ['crowdsec'],
    keywords: ['ips', 'collaborative firewall', 'fail2ban alternative', 'security'],
    icon: '/icons/crowdsec.svg',
    color: '#162338',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Wazuh',
    slug: 'wazuh',
    category: 'security',
    aliases: ['wazuh', 'siem'],
    keywords: ['siem', 'xdr', 'security monitoring', 'compliance'],
    icon: '/icons/wazuh.svg',
    color: '#0070e0',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Grafana Alloy',
    slug: 'grafana-alloy',
    category: 'security',
    aliases: ['alloy', 'grafana alloy', 'grafana agent'],
    keywords: ['telemetry collector', 'opentelemetry collector', 'prometheus collector'],
    icon: '/icons/grafana-alloy.svg',
    color: '#f46800',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },

  // ==========================================
  // AUTOMATION
  // ==========================================
  {
    name: 'n8n',
    slug: 'n8n',
    category: 'automation',
    aliases: ['n8n', 'n8n.io'],
    keywords: ['workflow automation', 'zapier alternative', 'make alternative', 'api automations'],
    icon: '/icons/n8n.svg',
    color: '#ea4b71',
    source: 'walkxcode/dashboard-icons',
    license: 'Sustainable Use License'
  },
  {
    name: 'Activepieces',
    slug: 'activepieces',
    category: 'automation',
    aliases: ['activepieces'],
    keywords: ['no-code automation', 'open source zapier'],
    icon: '/icons/activepieces.svg',
    color: '#6366f1',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Huginn',
    slug: 'huginn',
    category: 'automation',
    aliases: ['huginn'],
    keywords: ['web scraper agent', 'ifttt alternative'],
    icon: '/icons/huginn.svg',
    color: '#2a5a8a',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Windmill',
    slug: 'windmill',
    category: 'automation',
    aliases: ['windmill'],
    keywords: ['code based automation', 'developer workflows', 'python typescript flows'],
    icon: '/icons/windmill.svg',
    color: '#000000',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Apache Airflow',
    slug: 'apache-airflow',
    category: 'automation',
    aliases: ['airflow', 'apache airflow'],
    keywords: ['dag orchestration', 'data pipelines'],
    icon: '/icons/apache-airflow.svg',
    color: '#017cee',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Kestra',
    slug: 'kestra',
    category: 'automation',
    aliases: ['kestra'],
    keywords: ['declarative orchestrator', 'data workflows'],
    icon: '/icons/kestra.svg',
    color: '#845ef7',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },

  // ==========================================
  // DASHBOARDS
  // ==========================================
  {
    name: 'Homepage',
    slug: 'homepage',
    category: 'dashboards',
    aliases: ['homepage', 'gethomepage'],
    keywords: ['dashboard', 'startpage', 'widgets'],
    icon: '/icons/homepage.svg',
    color: '#e24a4a',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Homarr',
    slug: 'homarr',
    category: 'dashboards',
    aliases: ['homarr'],
    keywords: ['homelab dashboard', 'startpage'],
    icon: '/icons/homarr.svg',
    color: '#ef4444',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Heimdall',
    slug: 'heimdall',
    category: 'dashboards',
    aliases: ['heimdall', 'heimdall dashboard'],
    keywords: ['application dashboard', 'links launcher'],
    icon: '/icons/heimdall.svg',
    color: '#1a5b8c',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Glance',
    slug: 'glance',
    category: 'dashboards',
    aliases: ['glance', 'glance dashboard'],
    keywords: ['feeds dashboard', 'subtle startpage'],
    icon: '/icons/glance.svg',
    color: '#e57000',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },

  // ==========================================
  // DOCUMENTS / KNOWLEDGE
  // ==========================================
  {
    name: 'Paperless-ngx',
    slug: 'paperless-ngx',
    category: 'documents',
    aliases: ['paperless', 'paperless-ngx', 'dms'],
    keywords: ['document management', 'ocr', 'faktury', 'skany', 'dokumenty'],
    icon: '/icons/paperless-ngx.svg',
    color: '#0d7d6c',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'BookStack',
    slug: 'bookstack',
    category: 'documents',
    aliases: ['bookstack'],
    keywords: ['wiki', 'documentation', 'knowledge base', 'baza wiedzy', 'ksiazki'],
    icon: '/icons/bookstack.svg',
    color: '#0288d1',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Wiki.js',
    slug: 'wiki-js',
    category: 'documents',
    aliases: ['wikijs', 'wiki-js', 'wiki'],
    keywords: ['modern wiki', 'markdown wiki', 'baza wiedzy'],
    icon: '/icons/wiki-js.svg',
    color: '#1976d2',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'DokuWiki',
    slug: 'dokuwiki',
    category: 'documents',
    aliases: ['dokuwiki'],
    keywords: ['file based wiki', 'no database wiki'],
    icon: '/icons/dokuwiki.svg',
    color: '#0e7fe1',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'MediaWiki',
    slug: 'mediawiki',
    category: 'documents',
    aliases: ['mediawiki', 'wikipedia engine'],
    keywords: ['wiki', 'encyclopedia'],
    icon: '/icons/mediawiki.svg',
    color: '#3366cc',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-2.0'
  },
  {
    name: 'Outline',
    slug: 'outline',
    category: 'documents',
    aliases: ['outline', 'getoutline'],
    keywords: ['notion alternative', 'team knowledge base', 'fast wiki'],
    icon: '/icons/outline.svg',
    color: '#121212',
    source: 'walkxcode/dashboard-icons',
    license: 'BSL-1.1'
  },
  {
    name: 'Joplin',
    slug: 'joplin',
    category: 'documents',
    aliases: ['joplin', 'joplin server'],
    keywords: ['notes', 'evernote alternative', 'e2ee sync', 'notatki'],
    icon: '/icons/joplin.svg',
    color: '#2479e0',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Memos',
    slug: 'memos',
    category: 'documents',
    aliases: ['memos', 'usememos'],
    keywords: ['microblog', 'quick thoughts', 'flomo alternative'],
    icon: '/icons/memos.svg',
    color: '#4f46e5',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'HedgeDoc',
    slug: 'hedgedoc',
    category: 'documents',
    aliases: ['hedgedoc', 'codimd'],
    keywords: ['collaborative markdown editor', 'live notes'],
    icon: '/icons/hedgedoc.svg',
    color: '#df2c2c',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },
  {
    name: 'Excalidraw',
    slug: 'excalidraw',
    category: 'documents',
    aliases: ['excalidraw'],
    keywords: ['whiteboard', 'diagrams', 'schematy', 'rysunki'],
    icon: '/icons/excalidraw.svg',
    color: '#6965db',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },

  // ==========================================
  // BACKUP
  // ==========================================
  {
    name: 'Kopia',
    slug: 'kopia',
    category: 'backup',
    aliases: ['kopia', 'kopiaui'],
    keywords: ['fast backup', 'deduplication', 'encrypted snapshots'],
    icon: '/icons/kopia.svg',
    color: '#2892d7',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'BorgBackup',
    slug: 'borgbackup',
    category: 'backup',
    aliases: ['borg', 'borgbackup'],
    keywords: ['deduplicating backup', 'linux backup'],
    icon: '/icons/borgbackup.svg',
    color: '#0052cc',
    source: 'walkxcode/dashboard-icons',
    license: 'BSD-3-Clause'
  },
  {
    name: 'Borgmatic',
    slug: 'borgmatic',
    category: 'backup',
    aliases: ['borgmatic'],
    keywords: ['borg wrapper', 'cron backup'],
    icon: '/icons/borgmatic.svg',
    color: '#0052cc',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'Duplicati',
    slug: 'duplicati',
    category: 'backup',
    aliases: ['duplicati', 'duplicati 2'],
    keywords: ['encrypted backup', 'cloud backup', 'kopia zapasowa'],
    icon: '/icons/duplicati.svg',
    color: '#1a5b8c',
    source: 'walkxcode/dashboard-icons',
    license: 'LGPL-2.1'
  },
  {
    name: 'Veeam Backup',
    slug: 'veeam',
    category: 'backup',
    aliases: ['veeam', 'veeam backup & replication', 'veeam agent'],
    keywords: ['enterprise backup', 'vm backup'],
    icon: '/icons/veeam.svg',
    color: '#00b336',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },

  // ==========================================
  // AI
  // ==========================================
  {
    name: 'Ollama',
    slug: 'ollama',
    category: 'ai',
    aliases: ['ollama', 'ollama ai'],
    keywords: ['local llm', 'llama3', 'mistral', 'deepseek', 'gemma', 'ai runner'],
    icon: '/icons/ollama.svg',
    color: '#000000',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Open WebUI',
    slug: 'open-webui',
    category: 'ai',
    aliases: ['open webui', 'openwebui', 'ollama webui'],
    keywords: ['chatgpt interface', 'ollama frontend', 'rag', 'voice'],
    icon: '/icons/open-webui.svg',
    color: '#000000',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'ComfyUI',
    slug: 'comfyui',
    category: 'ai',
    aliases: ['comfyui', 'comfy ui'],
    keywords: ['stable diffusion nodes', 'image generation', 'flux'],
    icon: '/icons/comfyui.svg',
    color: '#3498db',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'LibreChat',
    slug: 'librechat',
    category: 'ai',
    aliases: ['librechat'],
    keywords: ['multi ai chat', 'chatgpt clone', 'claude', 'gemini'],
    icon: '/icons/librechat.svg',
    color: '#6366f1',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'AnythingLLM',
    slug: 'anything-llm',
    category: 'ai',
    aliases: ['anythingllm', 'anything-llm'],
    keywords: ['document rag', 'local ai chatbot', 'enterprise chat'],
    icon: '/icons/anything-llm.svg',
    color: '#ffc107',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'SearXNG',
    slug: 'searxng',
    category: 'ai',
    aliases: ['searxng', 'searx'],
    keywords: ['metasearch engine', 'private search', 'wyszukiwarka'],
    icon: '/icons/searxng.svg',
    color: '#2a5a8a',
    source: 'walkxcode/dashboard-icons',
    license: 'AGPL-3.0'
  },

  // ==========================================
  // GAMES & SERVERS
  // ==========================================
  {
    name: 'Pterodactyl Panel',
    slug: 'pterodactyl',
    category: 'games',
    aliases: ['pterodactyl', 'wings'],
    keywords: ['game server management', 'minecraft host', 'valheim'],
    icon: '/icons/pterodactyl.svg',
    color: '#1a95e0',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'Pelican Panel',
    slug: 'pelican',
    category: 'games',
    aliases: ['pelican', 'pelican panel'],
    keywords: ['pterodactyl fork', 'game server manager'],
    icon: '/icons/pelican.svg',
    color: '#3498db',
    source: 'walkxcode/dashboard-icons',
    license: 'MIT'
  },
  {
    name: 'CubeCoders AMP',
    slug: 'amp',
    category: 'games',
    aliases: ['amp', 'cubecoders amp'],
    keywords: ['game server control panel'],
    icon: '/icons/amp.svg',
    color: '#0052cc',
    source: 'walkxcode/dashboard-icons',
    license: 'Proprietary'
  },
  {
    name: 'Crafty Controller',
    slug: 'crafty-controller',
    category: 'games',
    aliases: ['crafty', 'crafty controller'],
    keywords: ['minecraft server manager', 'bedrock', 'java'],
    icon: '/icons/crafty-controller.svg',
    color: '#00b336',
    source: 'walkxcode/dashboard-icons',
    license: 'GPL-3.0'
  },
  {
    name: 'PufferPanel',
    slug: 'pufferpanel',
    category: 'games',
    aliases: ['pufferpanel'],
    keywords: ['game server management'],
    icon: '/icons/pufferpanel.svg',
    color: '#2892d7',
    source: 'walkxcode/dashboard-icons',
    license: 'Apache-2.0'
  },
  {
    name: 'Minecraft Server',
    slug: 'minecraft',
    category: 'games',
    aliases: ['minecraft', 'spigot', 'paper', 'forge', 'fabric'],
    keywords: ['minecraft', 'game server', 'serwer minecraft'],
    icon: '/icons/minecraft.svg',
    color: '#629340',
    source: 'walkxcode/dashboard-icons',
    license: 'Brand Trademark'
  }
];

/**
 * Normalizes an arbitrary input string for resilient fuzzy matching.
 */
function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Intelligent icon suggestion based on service name or url.
 */
export function suggestIconForServiceName(input) {
  if (!input || typeof input !== 'string') return null;
  const cleanInput = input.toLowerCase().trim();
  const normalized = normalizeStr(input);
  if (!normalized) return null;

  // 1. Exact match on slug
  const exactSlug = HOMELAB_CATALOG_ITEMS.find(item => item.slug.toLowerCase() === cleanInput);
  if (exactSlug) return exactSlug;

  // 2. Exact match on normalized alias or name
  for (const item of HOMELAB_CATALOG_ITEMS) {
    if (normalizeStr(item.name) === normalized) return item;
    if (item.aliases.some(alias => normalizeStr(alias) === normalized)) return item;
  }

  // 3. Substring match on name, aliases or keywords
  for (const item of HOMELAB_CATALOG_ITEMS) {
    if (normalized.includes(normalizeStr(item.slug)) || normalizeStr(item.slug).includes(normalized)) {
      return item;
    }
    if (item.aliases.some(alias => {
      const normAlias = normalizeStr(alias);
      return normalized.includes(normAlias) || normAlias.includes(normalized);
    })) {
      return item;
    }
  }

  return null;
}

/**
 * Filter icons by query string across name, slug, aliases, category, and keywords.
 */
export function searchIconCatalog(query, categoryFilter = 'all') {
  let list = HOMELAB_CATALOG_ITEMS;

  if (categoryFilter && categoryFilter !== 'all') {
    list = list.filter(item => item.category.toLowerCase() === categoryFilter.toLowerCase());
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = query.toLowerCase().trim();
  const normQ = normalizeStr(q);

  return list.filter(item => {
    // 1. Name match
    if (item.name.toLowerCase().includes(q)) return true;
    // 2. Slug match
    if (item.slug.toLowerCase().includes(q)) return true;
    // 3. Category match
    if (item.category.toLowerCase().includes(q)) return true;
    // 4. Aliases match
    if (item.aliases.some(a => a.toLowerCase().includes(q) || normalizeStr(a).includes(normQ))) return true;
    // 5. Keywords match
    if (item.keywords.some(k => k.toLowerCase().includes(q) || normalizeStr(k).includes(normQ))) return true;

    return false;
  });
}
