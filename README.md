<p align="center">
  <h1 align="center">🔗 NexusPanel</h1>
  <p align="center"><strong>One dashboard for your entire homelab.</strong></p>
  <p align="center">
    Self-hosted • Configurable • Modern • Fast
  </p>
</p>

---

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcje](#-funkcje)
- [Wymagania](#-wymagania)
- [Szybki start — Docker](#-szybki-start--docker)
- [Instalacja — LXC / Proxmox](#-instalacja--lxc--proxmox)
- [Instalacja — bez Dockera](#-instalacja--bez-dockera)
- [Pierwszy start](#-pierwszy-start)
- [Dodawanie usług](#-dodawanie-usług)
- [Konfiguracja](#-konfiguracja)
- [Backup i restore](#-backup-i-restore)
- [Aktualizacja](#-aktualizacja)
- [Troubleshooting](#-troubleshooting)
- [Struktura projektu](#-struktura-projektu)
- [API](#-api)
- [Dla developerów](#-dla-developerów)
- [Przyszły rozwój](#-przyszły-rozwój)

---

## 🏠 O projekcie

**NexusPanel** to centralny dashboard do homelaba / domowego serwera.

Zamiast zapamiętywać adresy IP i porty wszystkich usług, masz jeden elegancki panel w przeglądarce z dostępem do wszystkiego.

NexusPanel to **nie jest** statyczna strona z linkami. To **konfigurowalna aplikacja** z panelem administracyjnym, w której:

- dodajesz usługi przez GUI,
- zmieniasz wygląd przez GUI,
- zarządzasz kategoriami, tagami i ustawieniami,
- monitorujesz status usług,
- eksportujesz i importujesz konfigurację.

**Bez edycji plików. Bez przebudowy. Bez restartu.**

---

## ✨ Funkcje

### Dashboard
- 🎨 Nowoczesny, minimalistyczny interfejs dark/light mode
- 🔲 Kafelki usług z ikonami, opisami i statusem
- ⭐ Ulubione usługi na górze dashboardu
- 🔍 Globalna wyszukiwarka (Ctrl+K)
- 🏷️ Kategorie i tagi
- 📱 Responsywny layout (desktop, tablet, telefon)
- 🕐 Zegar czasu rzeczywistego w nagłówku

### Panel administracyjny
- ➕ Dodawanie / edycja / usuwanie usług
- 🖱️ Drag & drop zmiana kolejności
- 🎨 Konfiguracja wyglądu (kolory, rozmiary, tło)
- 📁 Zarządzanie kategoriami i tagami
- 🔒 Ustawienia bezpieczeństwa
- 💾 Eksport / import konfiguracji

### Monitoring
- 🟢 Automatyczny health check usług
- 🟡 Wykrywanie degradacji (wolna odpowiedź)
- 🔴 Wykrywanie offline
- ⚙️ Konfigurowalny interwał per usługa

### Bezpieczeństwo
- 🔐 Hashowanie haseł (bcrypt)
- 🎟️ Tokeny JWT
- 🛡️ Nagłówki bezpieczeństwa (Helmet)
- ⏱️ Rate limiting logowania
- ✅ Walidacja danych wejściowych

---

## 📦 Wymagania

### Docker
- Docker Engine 20+
- Docker Compose v2+

### Bez Dockera
- Node.js 20 LTS
- npm 10+

### Minimalne zasoby
- RAM: 128 MB
- Dysk: 100 MB
- CPU: 1 vCPU

---

## 🐳 Szybki start — Docker

```bash
# 1. Sklonuj repozytorium
git clone <repo-url> nexuspanel
cd nexuspanel

# 2. Skopiuj i skonfiguruj zmienne środowiskowe
cp .env.example .env

# 3. Wygeneruj bezpieczny JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Wklej wynik do .env jako JWT_SECRET

# 4. Uruchom
docker compose up -d

# 5. Otwórz w przeglądarce
# http://localhost:3000
```

### Z danymi demonstracyjnymi

```bash
# W pliku .env ustaw:
SEED_DEMO_DATA=true

# Uruchom
docker compose up -d
```

---

## 🖥️ Instalacja — LXC / Proxmox

### 1. Utwórz kontener LXC

W Proxmox VE:

```bash
# Pobierz template (np. Debian 12)
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Utwórz kontener
pct create 200 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname nexuspanel \
  --memory 512 \
  --cores 2 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1 \
  --unprivileged 1 \
  --start 1

# Wejdź do kontenera
pct enter 200
```

### 2. Zainstaluj Node.js

```bash
apt update && apt upgrade -y
apt install -y curl git wget

# Zainstaluj Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Sprawdź wersję
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 3. Zainstaluj NexusPanel

```bash
# Utwórz katalog
mkdir -p /opt/nexuspanel
cd /opt/nexuspanel

# Skopiuj pliki (lub git clone)
git clone <repo-url> .

# Zainstaluj zależności
npm install

# Zbuduj frontend
npm run build

# Skopiuj i skonfiguruj .env
cp .env.example .env
nano .env
# Ustaw JWT_SECRET na losowy ciąg znaków
```

### 4. Utwórz usługę systemd

```bash
cat > /etc/systemd/system/nexuspanel.service << 'EOF'
[Unit]
Description=NexusPanel Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nexuspanel
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/nexuspanel/.env

[Install]
WantedBy=multi-user.target
EOF
```

### 5. Uruchom

```bash
systemctl daemon-reload
systemctl enable nexuspanel
systemctl start nexuspanel

# Sprawdź status
systemctl status nexuspanel

# Logi
journalctl -u nexuspanel -f
```

### 6. Dostęp

Otwórz w przeglądarce:
```
http://192.168.1.100:3000
```

### 7. Stały IP

Stały IP został ustawiony podczas tworzenia kontenera (`--net0 ... ip=192.168.1.100/24`).

Aby zmienić:
```bash
# Na hoście Proxmox
pct set 200 --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1
```

Lub wewnątrz kontenera edytuj `/etc/network/interfaces`.

### Docker w LXC

Jeśli chcesz uruchomić Docker wewnątrz LXC:

```bash
# Na hoście Proxmox — włącz nesting i keyctl:
pct set 200 --features nesting=1,keyctl=1

# W kontenerze — zainstaluj Docker:
curl -fsSL https://get.docker.com | sh

# Teraz możesz używać docker compose
cd /opt/nexuspanel
docker compose up -d
```

---

## 💻 Instalacja — bez Dockera

```bash
# Sklonuj repozytorium
git clone <repo-url> nexuspanel
cd nexuspanel

# Zainstaluj zależności
npm install

# Zbuduj frontend
npm run build

# Skopiuj .env
cp .env.example .env
# Edytuj .env — ustaw JWT_SECRET

# Uruchom
npm start

# Otwórz: http://localhost:3000
```

---

## 🚀 Pierwszy start

Po pierwszym uruchomieniu NexusPanel pokaże ekran konfiguracji:

1. **Welcome to NexusPanel** — kreator pierwszego uruchomienia
2. Utwórz konto administratora:
   - Username (domyślnie: `admin`)
   - Password (minimum 6 znaków)
3. Opcjonalnie zmień nazwę dashboardu
4. Kliknij **Continue**

Po utworzeniu konta zostaniesz automatycznie zalogowany i przekierowany na pusty dashboard z przyciskiem **+ Add Service**.

---

## ➕ Dodawanie usług

1. Kliknij **⚙ Settings** w nagłówku lub przejdź do `/admin`
2. Wybierz zakładkę **Services**
3. Kliknij **+ Add Service**
4. Wypełnij formularz:
   - **Name**: Nazwa usługi (np. "Proxmox")
   - **URL**: Adres usługi (np. `https://192.168.1.10:8006`)
   - **Category**: Wybierz kategorię
   - **Icon**: Wybierz ikonę
   - **Color**: Wybierz kolor kafelka
   - **Health Check**: Włącz monitorowanie statusu
5. Kliknij **Save**

Usługa natychmiast pojawi się na dashboardzie.

---

## ⚙️ Konfiguracja

Cała konfiguracja odbywa się przez panel administracyjny (`/admin`):

| Zakładka | Co konfiguruje |
|----------|---------------|
| **General** | Nazwa, logo, favicon, język, strefa czasowa, format daty/czasu |
| **Appearance** | Dark/light mode, kolor akcentu, styl kafelków, rozmiar, tło |
| **Services** | Dodawanie, edycja, usuwanie, kolejność usług |
| **Categories** | Zarządzanie kategoriami |
| **Tags** | Zarządzanie tagami |
| **Security** | Zmiana hasła, ustawienia sesji |
| **Backup** | Eksport i import konfiguracji |

### Zmienne środowiskowe (.env)

| Zmienna | Domyślna | Opis |
|---------|----------|------|
| `PORT` | 3000 | Port serwera |
| `NODE_ENV` | production | Tryb (development/production) |
| `JWT_SECRET` | — | **Wymagane!** Klucz do tokenów JWT |
| `JWT_EXPIRY` | 7d | Czas wygaśnięcia tokena |
| `DB_PATH` | ./data/nexuspanel.db | Ścieżka do bazy SQLite |
| `HEALTH_CHECK_INTERVAL` | 60 | Domyślny interwał health check (sekundy) |
| `SEED_DEMO_DATA` | false | Załaduj dane demonstracyjne |

---

## 💾 Backup i restore

### Przez GUI

1. Przejdź do **Settings → Backup**
2. Kliknij **Export Configuration** — pobierze się plik `nexuspanel-backup.json`
3. Aby przywrócić: kliknij **Import Configuration** i wybierz plik

### Przez kopiowanie bazy

```bash
# Backup
cp data/nexuspanel.db data/nexuspanel-backup-$(date +%Y%m%d).db

# Restore
cp data/nexuspanel-backup-20240101.db data/nexuspanel.db
systemctl restart nexuspanel  # lub docker compose restart
```

### Automatyczny backup (cron)

```bash
# Dodaj do crontab:
crontab -e

# Codzienny backup o 3:00
0 3 * * * cp /opt/nexuspanel/data/nexuspanel.db /backup/nexuspanel-$(date +\%Y\%m\%d).db
```

---

## 🔄 Aktualizacja

### Docker

```bash
cd nexuspanel
git pull
docker compose build
docker compose up -d
```

### LXC / bez Dockera

```bash
cd /opt/nexuspanel

# Zatrzymaj usługę
systemctl stop nexuspanel

# Backup bazy
cp data/nexuspanel.db data/nexuspanel-backup.db

# Zaktualizuj kod
git pull

# Zainstaluj zależności
npm install

# Przebuduj frontend
npm run build

# Uruchom
systemctl start nexuspanel
```

---

## 🔧 Troubleshooting

### Aplikacja nie startuje

```bash
# Sprawdź logi
journalctl -u nexuspanel -n 50 --no-pager

# Lub Docker
docker compose logs nexuspanel
```

### Port zajęty

```bash
# Sprawdź co zajmuje port
lsof -i :3000
# Lub zmień port w .env
```

### Brak dostępu z sieci

```bash
# Sprawdź firewall
ufw status
ufw allow 3000/tcp
```

### Zresetuj hasło admina

```bash
# Usuń użytkowników i reset setup
cd /opt/nexuspanel
node -e "
  const Database = require('better-sqlite3');
  const db = new Database('./data/nexuspanel.db');
  db.exec(\"DELETE FROM users\");
  db.prepare(\"UPDATE settings SET value = 'false' WHERE key = 'setup_completed'\").run();
  console.log('Admin reset. Restart the app.');
"
systemctl restart nexuspanel
```

---

## 📁 Struktura projektu

```
nexuspanel/
├── client/                    # Frontend React + Vite
│   ├── public/                # Pliki statyczne
│   ├── src/
│   │   ├── components/        # Komponenty React
│   │   │   ├── admin/         # Panel administracyjny
│   │   │   ├── common/        # Współdzielone (Modal, Toast, Button...)
│   │   │   ├── dashboard/     # Dashboard (ServiceCard, CategorySection...)
│   │   │   ├── layout/        # Header, Layout
│   │   │   └── search/        # Wyszukiwarka
│   │   ├── contexts/          # React Context (Auth, Theme, Toast)
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Strony (Dashboard, Login, Setup, Admin)
│   │   ├── services/          # Klient API (Axios)
│   │   ├── styles/            # Globalne style CSS
│   │   └── utils/             # Helpery, stałe
│   └── package.json
│
├── server/                    # Backend Express
│   ├── config/                # Konfiguracja
│   ├── db/                    # Baza danych SQLite
│   ├── middleware/            # Auth, rate limit, walidacja
│   ├── routes/                # Endpointy API
│   ├── services/              # Health check runner
│   └── package.json
│
├── data/                      # Dane runtime (baza SQLite)
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API

### Autoryzacja

```bash
# Status (czy setup ukończony)
GET /api/auth/status

# Pierwszy setup
POST /api/auth/setup
Body: { "username": "admin", "password": "secret123", "dashboard_name": "NexusPanel" }

# Logowanie
POST /api/auth/login
Body: { "username": "admin", "password": "secret123" }
Response: { "token": "jwt...", "user": { ... } }

# Informacje o użytkowniku
GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Usługi

```bash
# Lista usług
GET /api/services

# Dodaj usługę
POST /api/services
Header: Authorization: Bearer <token>
Body: { "name": "Proxmox", "url": "https://192.168.1.10:8006", "category_id": 1 }

# Edytuj usługę
PUT /api/services/:id

# Usuń usługę
DELETE /api/services/:id

# Zmień kolejność
PUT /api/services/reorder
Body: [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }]
```

### Pozostałe

```bash
GET    /api/categories          # Lista kategorii
POST   /api/categories          # Dodaj kategorię
PUT    /api/categories/:id      # Edytuj kategorię
DELETE /api/categories/:id      # Usuń kategorię

GET    /api/tags                # Lista tagów
POST   /api/tags                # Dodaj tag
DELETE /api/tags/:id            # Usuń tag

GET    /api/settings            # Pobierz ustawienia
PUT    /api/settings            # Zaktualizuj ustawienia

GET    /api/backup/export       # Eksportuj konfigurację
POST   /api/backup/import       # Importuj konfigurację

GET    /api/health              # Health check aplikacji
GET    /api/icons               # Dostępne ikony
```

---

## 👨‍💻 Dla developerów

### Uruchomienie w trybie developerskim

```bash
# Zainstaluj zależności
npm install

# Uruchom backend i frontend równolegle
npm run dev

# Lub osobno:
npm run dev:server   # Express na localhost:3000
npm run dev:client   # Vite na localhost:5173 (proxy do :3000)
```

### Seedowanie danych demo

```bash
npm run seed
```

### Stack technologiczny

| Warstwa | Technologia |
|---------|------------|
| Frontend | React 18, Vite, Tailwind CSS, @dnd-kit, Lucide React |
| Backend | Node.js, Express.js |
| Baza danych | SQLite (better-sqlite3) |
| Autoryzacja | JWT, bcrypt |
| Konteneryzacja | Docker, Docker Compose |

### Architektura

- **Jeden proces** — Express serwuje API + zbudowany frontend React
- **Jeden plik bazy** — SQLite, łatwy backup
- **Brak zewnętrznych serwisów** — działa offline, self-contained
- **REST API** — logicznie podzielone endpointy

---

## 🔮 Przyszły rozwój

NexusPanel jest zaprojektowany z myślą o rozszerzalności:

- [ ] Integracja z Proxmox API (VM/CT status)
- [ ] Integracja z Docker API (kontener status)
- [ ] Integracja z TrueNAS / ASUSTOR API
- [ ] Widgety (CPU, RAM, dysk, sieć, temperatura)
- [ ] System powiadomień
- [ ] Wielu użytkowników z rolami
- [ ] Wiele dashboardów
- [ ] Public / private services
- [ ] Integracja LDAP / OAuth
- [ ] Automatyczne wykrywanie usług
- [ ] Własne motywy (theme editor)
- [ ] Mobilna aplikacja / PWA
- [ ] Wtyczki / plugin system

---

## 📄 Licencja

MIT License

---

<p align="center">
  <strong>NexusPanel</strong> — One dashboard for your entire homelab.
</p>
