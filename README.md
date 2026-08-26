<p align="center">
  <h1 align="center">🔗 NexusPanel</h1>
  <p align="center"><strong>Ekran startowy dla Twojego homelabu wraz z aplikacją mobilną i 6 widżetami na pulpit Androida.</strong></p>
  <p align="center">
    Self-hosted • Proxmox VE • Docker • Auto Subnet Discovery • Health Status & Ping • Android Widgets & Mobile App
  </p>
  <p align="center">
    🌐 <strong>Strona projektu i prezentacja na żywo:</strong> <a href="https://marautech.github.io/NexusPanel/">https://marautech.github.io/NexusPanel/</a>
  </p>
</p>

---

## ⚡ Instalacja 1 poleceniem

### 🖥️ Proxmox VE (Automatyczny dedykowany kontener LXC):
Wklej poniższe polecenie w konsoli węzła Proxmox VE (**PVE Node Shell**):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/MarauTech/NexusPanel/main/install.sh)"
```

> **Działanie skryptu instalatora:**
> 1. Konfiguruje parametry kontenera *(Domyślnie: 512 MB RAM, 1 vCPU, 4 GB SSD, DHCP)*.
> 2. Pobiera oficjalny szablon **Debian 12** i tworzy zoptymalizowany kontener LXC.
> 3. Instaluje Node.js 20, pobiera najnowszą wersję NexusPanel i kompiluje aplikację.
> 4. Konfiguruje usługę autostartu **`systemd`** (`nexuspanel.service`).
> 5. Wyświetla gotowy adres URL panelu: `http://192.168.XX.XX:3000`.

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

# 2. Skonfiguruj środowisko (.env)
cp .env.example .env
# Wygeneruj silny klucz JWT_SECRET poleceniem: openssl rand -hex 32
# i wklej go do pliku .env

# 3. Uruchom w tle
docker compose up -d --build

# 4. Otwórz w przeglądarce
# http://localhost:3000 (lub IP_SERWERA:3000)
```

---

## 📱 Aplikacja mobilna & Widżety na pulpit Androida

NexusPanel zawiera dedykowaną aplikację mobilną dla systemu Android z obsługą **6 natywnych widżetów na ekran główny telefonu**:

<p align="center">
  <img src="https://raw.githubusercontent.com/MarauTech/NexusPanel/main/client/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" width="96" alt="NexusPanel Icon" />
</p>

### 📥 Pobierz aplikację na Androida:
Pobierz plik instalacyjny **[`NexusPanel.apk`](NexusPanel.apk)** (11.1 MB) i zainstaluj na telefonie z systemem Android 8.0+.

### 🧩 6 Dedykowanych Widżetów Android:
1. **⭐ Ulubione Aplikacje (2x2)**:
   * 4 najważniejsze usługi homelaba w czytelnych kartach.
   * **Prawdziwe logotypy marek** (Proxmox, ASUSTOR, Plex, Immich, Umbrel, Home Assistant, Pi-hole itp.).
   * Duża, czytelna czcionka nazwy usługi i adresu IP oraz kropka stanu na żywo.
   * **Bezpośrednie otwieranie**: kliknięcie w kartę usługi natychmiast przenosi do właściwego portu w domyślnej przeglądarce telefonu.
2. **🎯 Monitoring Konkretnej Usługi (2x2)**:
   * Karta z logo, adresem IP, wskaźnikiem dostępności Uptime oraz czasem odpowiedzi w milisekundach (**Ping ms**).
3. **🖥️ Status Serwera Host (4x2 / 4x1)**:
   * Wykres obciążenia procesora (**CPU %**), pamięci RAM (**RAM %**), temperatury oraz czasu pracy serwera (**Uptime**).
4. **📊 Podsumowanie Wszystkich Usług (4x1)**:
   * Liczniki usług w stanie **Online (zielony)**, **Warning (żółty)** oraz **Offline (czerwony)**.
5. **⏱️ Dostępność Uptime (2x2)**:
   * Wskaźnik SLA i średniej dostępności usług z ostatnich 24 godzin, 7 dni oraz 30 dni.
6. **🌐 Nexus Overview (4x2)**:
   * Zbiorcze podsumowanie stanu całego homelaba w jednym kafelku.

### 🎨 Studio Widżetów w aplikacji:
W zakładce **Ustawienia ➔ Studio Widżetów** możesz:
* Wybierać i układać kolejność aplikacji w widżecie Ulubionych.
* Wskazywać usługę do monitorowania na żywo.
* Podglądać widżety na wiernym ekranie testowym w trybie jasnym lub ciemnym.
* Kliknąć **„🔄 Wymuś synchronizację wszystkich widżetów”**, aby natychmiast zaktualizować dane na pulpicie telefonu.

---

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Główne funkcje](#-główne-funkcje)
- [Aplikacja Mobilna i Widżety](#-aplikacja-mobilna--widżety-na-pulpit-androida)
- [Wymagania systemowe](#-wymagania-systemowe)
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
- 🎨 **Czysty interfejs & Ponad 900 Ikon**: Tryb ciemny/jasny z biblioteką 900+ oryginalnych logotypów homelabowych.
- 📱 **Natywne Widżety Android**: Prawdziwe dane z Twojego serwera, bezpośrednie skróty do usług i telemetria hosta.
- 🔒 **Self-contained**: Wszystko działa w jednym procesie z lokalną bazą SQLite — zero zewnętrznych zależności i telemetrii.

---

## ✨ Główne funkcje

### 🖥️ Ekran Startowy (Speed-Dial)
- 🔲 **Kafelki usług**: Dedykowane logotypy marek, hosty, plakietki portów i wskaźniki SLA.
- ⭐ **Przypięte Ulubione**: Oznaczanie gwiazdką i sekcja ulubionych na samej górze.
- 🔍 **Wyszukiwarka Spotlight**: Szybkie szukanie i filtrowanie pod skrótem `Ctrl + K` (lub `⌘K`).
- ⛅ **Lokalna Pogoda & Geodekcja**: Pogoda dopasowana do lokalnego adresu IP z temperaturą, wilgotnością i wiatrem.
- 🌐 **Wielojęzyczność**: Pełne wsparcie dla języka polskiego i angielskiego (przełącznik PL/EN).
- 📱 **100% Responsywność**: Czysty widok na komputerze, tablecie i smartfonie.

### ⚙️ Panel Administracyjny
- ➕ **Wybór ikon z biblioteki**: Ponad 900 wbudowanych ikon homelabowych i pełna biblioteka wektorowa Lucide z wyszukiwarką.
- 📁 **Kategorie i tagi**: Własne grupowanie usług z filtrami segmentowymi.
- 🖱️ **Drag & Drop**: Zmiana kolejności kafelków i kategorii metodą przeciągnij i upuść.
- 💾 **Kopia zapasowa i Przywracanie fabryczne**: Eksport/import do pliku JSON oraz bezpieczny 1-klikowy Factory Reset.

---

## 📦 Wymagania systemowe

- **Pamięć RAM**: ~60–128 MB RAM
- **Procesor**: 1 vCPU
- **Dysk**: 100 MB wolnego miejsca
- **System**: Proxmox VE 7/8, Debian, Ubuntu, Alpine, Docker, Windows / macOS / Android

---

## 📡 Skaner Sieci LAN (Pełna podsieć 1..254)

Wbudowany skaner automatycznie rozpoznaje Twoją podsieć (np. `192.168.10.x`) i skanuje równolegle w paczkach po 160 połączeń socket wszystkie 254 adresy IP pod kątem popularnych usług:
- **Wirtualizacja & Zarządzanie**: Proxmox VE (8006), Portainer (9000/9443), Webmin (10000), Docker (2375).
- **Smart Home & Monitoring**: Home Assistant (8123), Uptime Kuma (3001), Grafana (3000), Netdata (19999), Prometheus (9090).
- **Multimedia & Storage**: Plex (32400), Jellyfin (8096), Synology DSM (5000/5001), ASUSTOR (8001), Nextcloud (8443), Immich (2283), qBittorrent (8085), Transmission (9091), Sonarr/Radarr (8989/7878).
- **Sieć & Bezpieczeństwo**: Router Gateway (80/443), Nginx Proxy Manager (8181), Syncthing (8384), WireGuard, AdGuard Home (3000), Pi-hole.

---

## 🔄 Aktualizacja aplikacji

### Przez Proxmox / Linux (systemd):
```bash
cd /opt/nexuspanel
git checkout package-lock.json
git pull
npm install
npm run build
systemctl restart nexuspanel
```

### Przez Docker:
```bash
cd nexuspanel
git checkout package-lock.json
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 👨‍💻 Dla developerów

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/MarauTech/NexusPanel.git
cd NexusPanel

# 2. Zainstaluj zależności
npm install

# 3. Uruchom w trybie dev (React Vite + Node backend równolegle)
npm run dev

# 4. Kompilacja klienta produkcyjnego
npm run build

# 5. Kompilacja aplikacji Android (Wymaga JDK 17 i Android SDK)
cd client
npm run build
npx cap sync android
cd android
./gradlew assembleRelease # na Windows: .\gradlew.bat assembleRelease
```

---

## 📄 Licencja

Projekt udostępniony na licencji **MIT** — w pełni darmowy i otwartoźródłowy (Open Source).

<p align="center">
  Stworzone z pasją dla społeczności Homelab & Self-Hosted ❤️
</p>
