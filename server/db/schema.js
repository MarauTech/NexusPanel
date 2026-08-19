export function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'folder',
      color TEXT DEFAULT '#6366f1',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      url TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      icon TEXT DEFAULT 'globe',
      icon_type TEXT DEFAULT 'lucide',
      icon_url TEXT DEFAULT '',
      color TEXT DEFAULT '#6366f1',
      sort_order INTEGER DEFAULT 0,
      open_new_tab INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      favorite INTEGER DEFAULT 0,
      health_check_enabled INTEGER DEFAULT 0,
      health_check_url TEXT DEFAULT '',
      health_check_interval INTEGER DEFAULT 60,
      health_check_type TEXT DEFAULT 'http', -- 'http', 'ping', 'tcp'
      health_status TEXT DEFAULT 'unknown',
      health_last_checked TEXT,
      health_response_time INTEGER,
      custom_badge TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_health_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      response_time INTEGER,
      checked_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_health_history_svc ON service_health_history(service_id, checked_at);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS service_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(service_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT DEFAULT '',
      type TEXT DEFAULT 'string'
    );

    CREATE TABLE IF NOT EXISTS widget_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      widget_type TEXT NOT NULL,
      config_json TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1
    );
  `);

  // Migrate missing columns if upgrading existing database
  try {
    const tableInfo = db.prepare("PRAGMA table_info(services)").all();
    const hasCheckType = tableInfo.some(col => col.name === 'health_check_type');
    if (!hasCheckType) {
      db.exec("ALTER TABLE services ADD COLUMN health_check_type TEXT DEFAULT 'http'");
    }
  } catch (e) {
    // Ignore migration error if already exists
  }
}

export function initializeDefaultSettings(db) {
  const defaults = [
    ['dashboard_name', 'NexusPanel', 'string'],
    ['user_name', '', 'string'],
    ['theme', 'dark', 'string'],
    ['theme_preset', 'nexus-dark', 'string'],
    ['accent_color', '#6366f1', 'string'],
    ['tile_style', 'default', 'string'],
    ['tile_size', 'medium', 'string'],
    ['tile_border_radius', '18', 'string'],
    ['grid_gap', '16', 'string'],
    ['grid_columns', '4', 'string'],
    ['background_url', '', 'string'],
    ['background_opacity', '0', 'string'],
    ['background_blur', '0', 'string'],
    ['custom_css', '', 'string'],
    ['language', 'pl', 'string'],
    ['timezone', 'auto', 'string'],
    ['date_format', 'YYYY-MM-DD', 'string'],
    ['time_format', '24h', 'string'],
    ['auth_enabled', 'true', 'string'],
    ['session_timeout', '7d', 'string'],
    ['setup_completed', 'false', 'string'],
    ['health_check_default_interval', '60', 'string'],
    ['health_check_default_enabled', 'false', 'string'],
    ['favicon_url', '', 'string'],
    ['logo_url', '', 'string'],
    ['show_header_clock', 'true', 'string'],
    ['show_status_indicators', 'true', 'string'],
    ['weather_enabled', 'true', 'string'],
    ['weather_city', 'Warszawa', 'string'],
    ['weather_lat', '52.2297', 'string'],
    ['weather_lon', '21.0122', 'string'],
    ['system_monitor_enabled', 'true', 'string'],
    ['camera_enabled', 'false', 'string'],
    ['camera_name', 'Kamera CCTV', 'string'],
    ['camera_url', '', 'string'],
    ['camera_interval', '3', 'string'],
    ['camera_2_enabled', 'false', 'string'],
    ['camera_2_name', 'Drukarka 3D', 'string'],
    ['camera_2_url', '', 'string'],
    ['camera_2_interval', '3', 'string'],
    ['proxmox_enabled', 'false', 'string'],
    ['proxmox_host', '', 'string'],
    ['proxmox_port', '8006', 'string'],
    ['proxmox_node', 'pve', 'string'],
    ['proxmox_token_id', '', 'string'],
    ['proxmox_token_secret', '', 'string'],
    ['proxmox_verify_ssl', 'false', 'string']
  ];

  // Use INSERT OR IGNORE so we never overwrite user configured settings
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value, type) VALUES (?, ?, ?)');
  for (const [key, value, type] of defaults) {
    stmt.run(key, value, type);
  }
}
