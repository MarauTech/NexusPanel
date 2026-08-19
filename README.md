<p align="center">
  <h1 align="center">🔗 NexusPanel</h1>
  <p align="center"><strong>Nowoczesny, błyskawiczny i w pełni konfigurowalny ekran startowy dla Twojego homelabu.</strong></p>
  <p align="center">
    Self-hosted • Proxmox VE • Docker • Auto Subnet Discovery • Health Status & Ping • Tryb Kiosk
  </p>
</p>

---

## ⚡ Błyskawiczna instalacja 1 poleceniem

### 🖥️ Proxmox VE (Automatyczne utworzenie dedykowanego kontenera LXC):
Wklej poniższe polecenie w konsoli Proxmox VE (**PVE Node Shell**):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/MarauTech/NexusPanel/main/install.sh)"
```

> **Co robi ten skrypt?**
> 1. Pyta o parametry instalacji *(Domyślnie: 512 MB RAM, 1 vCPU, 4 GB dysk, DHCP)*.
> 2. Pobiera czysty szablon **Debian 12** i tworzy zoptymalizowany kontener LXC.
> 3. Instaluje Node.js 20, pobiera najnowszą wersję NexusPanel i buduje aplikację.
> 4. Konfiguruje usługę autostartu **`systemd`** (`nexuspanel.service`).
> 5. Wyświetla gotowy adres URL: `http://192.168.XX.XX:3000`.

---

### 🐧 Istniejący system Linux / Kontener LXC / Raspberry Pi:
Wklej w terminalu jako `root` lub przez `sudo`:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/MarauTech/NexusPanel/main/install.sh)"
```

---

### 🐳 Docker & Docker Compose:

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/MarauTech/NexusPanel.git nexuspanel
cd nexuspanel

# 2. Uruchom w tle
docker compose up -d --build

# 3. Otwórz w przeglądarce
# http://localhost:3000 (lub IP_SERWERA:3000)
```

---

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Główne funkcje](#-główne-funkcje)
- [📺 Tryb Kiosk i Panel Ścienny](#-tryb-kiosk-i-panel-ścienny-wall-dashboard)
- [Wymagania systemowe](#-wymagania-systemowe)
- [Pierwszy start i kreator powitalny](#-pierwszy-start-i-kreator-powitalny)
- [Skaner Sieci LAN (Pełna podsieć 1..254)](#-skaner-sieci-lan-pełna-podsieć-1254)
- [Panel administracyjny i konfiguracja](#-panel-administracyjny-i-konfiguracja)
- [Kopia zapasowa i reset fabryczny](#-kopia-zapasowa-i-reset-fabryczny)
- [Aktualizacja aplikacji](#-aktualizacja-aplikacji)
- [Dla developerów](#-dla-developerów)
- [Licencja](#-licencja)

---

## 🏠 O projekcie

**NexusPanel** to centralny, minimalistyczny pulpit startowy dla Twojego domowego serwera i homelabu.

Zamiast zapamiętywać dziesiątki adresów IP, portów i zakładek w przeglądarce, otrzymujesz czysty, responsywny panel ze statusem dostępności każdej usługi w czasie rzeczywistym.

- ⚡ **Auto-Discovery**: Automatyczne wykrywanie podsieci LAN (`192.168.10.x`, `192.168.1.x`, `10.0.0.x`) i równoległe skanowanie wszystkich 254 adresów IP na popularnych portach homelabu (Proxmox, Home Assistant, Portainer, NAS, Plex, Grafana, Jellyfin, Webmin).
- 🟢 **Live Health Check & Ping**: Monitorowanie dostępności usług w czasie rzeczywistym z historią SLA (ms).
- 📺 **Tryb Kiosk / Ekran Ścienny**: Dedykowany widok na tablet/iPad powieszony na ścianie bez konieczności przewijania strony.
- 🎨 **Liquid Glassmorphism**: Czysty interfejs z trybem ciemnym/jasnym, płynnymi animacjami i pełną personalizacją.
- 🔒 **Self-contained**: Wszystko działa w jednym procesie z bazą SQLite — zero zewnętrznych zależności.

---

## ✨ Główne funkcje

### 🖥️ Ekran Startowy (Speed-Dial)
- 🔲 **Nowoczesne kafelki usług**: Dedykowane logotypy marek, hosty, plakietki portów i wskaźniki SLA.
- ⭐ **Przypięte Ulubione**: Błyskawiczne oznaczanie gwiazdką i sekcja ulubionych na samej górze.
- 🔍 **Wyszukiwarka Spotlight**: Błyskawiczne szukanie i filtrowanie pod skrótem `Ctrl + K` (lub `⌘K`).
- ⛅ **Lokalna Pogoda & Geodekcja**: Pogoda na żywo dopasowana do Twojego adresu IP z temperaturą, wilgotnością i wiatrem.
- 📱 **100% Responsywność**: Idealny widok na komputerze, tablecie i smartfonie.

### ⚙️ Panel Administracyjny
- ➕ **Wybór ikon z biblioteki**: Ponad 60 wbudowanych ikon homelabowych i pełna biblioteka Lucide z wyszukiwarką.
- 📁 **Kategorie i tagi**: Własne grupowanie usług z filtrami segmentowymi.
- 🖱️ **Drag & Drop**: Zmiana kolejności kafelków i kategorii metodą przeciągnij i upuść.
- 💾 **Kopia zapasowa i Przywracanie fabryczne**: Eksport/import do pliku JSON oraz bezpieczny 1-klikowy Factory Reset.

---

## 📺 Tryb Kiosk i Panel Ścienny (Wall Dashboard)

Dedykowany widok pod adresem **`/kiosk`** stworzony z myślą o tabletach (iPad, Android), Raspberry Pi z dotykowym ekranem lub drugim monitorze.

- **🚫 Zero Scroll (100vh)**: Cały panel mieści się w wysokości ekranu bez konieczności przewijania strony.
- **🕒 Duży Zegar Ścienny & Data**: Czytelny zegar cyfrowy z pulsującymi sekundami i pełną polską datą.
- **📊 Telemetria Serwera Host na żywo**: Paski obciążenia procesora (**CPU %**) i pamięci (**RAM %**) w czasie rzeczywistym.
- **📈 Tabela Monitoringu Dostępności (NOC)**: Lista wszystkich usług z dokładnym czasem odpowiedzi (ping w ms).
- **📷 Podgląd Kamery CCTV / Drukarki 3D**: Kafelek z odświeżanym na żywo obrazem ze snapshotu kamery IP, OctoPrint, BambuLab, Frigate lub Home Assistant z możliwością powiększenia na pełny ekran.
- **🌙 Głęboki Sen (0% OLED Blackout)**: Przycisk ⏻, który całkowicie wygasza ekran do czerni (idealne na noc), a dotknięcie w dowolnym miejscu natychmiast wybudza panel.
- **🔒 Screen Wake Lock API**: Zapobiega samoczynnemu wygaszaniu ekranu tabletu.

---

## 📦 Wymagania systemowe

- **Pamięć RAM**: Zaledwie ~60–128 MB RAM
- **Procesor**: 1 vCPU
- **Dysk**: 100 MB wolnego miejsca
- **System**: Proxmox VE 7/8, Debian, Ubuntu, Alpine, Docker, Windows / macOS

---

## 📡 Skaner Sieci LAN (Pełna podsieć 1..254)

Wbudowany skaner automatycznie rozpoznaje Twoją podsieć (np. `192.168.10.x`) i skanuje równolegle w paczkach po 160 połączeń socket wszystkie 254 adresy IP pod kątem popularnych usług:
- **Wirtualizacja & Zarządzanie**: Proxmox VE (8006), Portainer (9000/9443), Webmin (10000), Docker (2375).
- **Smart Home & Monitoring**: Home Assistant (8123), Uptime Kuma (3001), Grafana (3000), Netdata (19999), Prometheus (9090).
- **Multimedia & Storage**: Plex (32400), Jellyfin (8096), Synology DSM (5000/5001), ASUSTOR (8001), Nextcloud (8443), qBittorrent (8085), Transmission (9091), Sonarr/Radarr (8989/7878).
- **Sieć & Bezpieczeństwo**: Router Gateway (80/443), Nginx Proxy Manager (8181), Syncthing (8384), WireGuard.

---

## 🔄 Aktualizacja aplikacji

### Przez Proxmox / Linux (systemd):
```bash
cd /opt/nexuspanel
git pull
npm install
npm run build
systemctl restart nexuspanel
```

### Przez Docker:
```bash
docker compose pull && docker compose up -d --build
```

---

## 👨‍💻 Dla developerów

```bash
# Sklonuj repozytorium
git clone https://github.com/MarauTech/NexusPanel.git
cd NexusPanel

# Zainstaluj zależności
npm install

# Uruchom w trybie dev (React Vite + Node backend równolegle)
npm run dev
```

---

## 📄 Licencja

Projekt udostępniony na licencji **MIT** — w pełni darmowy i otwartoźródłowy (Open Source).

<p align="center">
  Stworzone z pasją dla społeczności Homelab & Self-Hosted ❤️
</p>
