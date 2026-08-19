<p align="center">
  <h1 align="center">🔗 NexusPanel</h1>
  <p align="center"><strong>Nowoczesny, szybki i w pełni konfigurowalny ekran startowy dla Twojego homelabu.</strong></p>
  <p align="center">
    Self-hosted • Proxmox VE • Docker • Auto Subnet Discovery • Health Status & Ping
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
# http://localhost:3000 (lub IP serwera:3000)
```

---

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Główne funkcje](#-główne-funkcje)
- [Wymagania systemowe](#-wymagania-systemowe)
- [Pierwszy start i kreator powitalny](#-pierwszy-start-i-kreator-powitalny)
- [Dodawanie usług i Skaner LAN](#-dodawanie-usług-i-skaner-lan)
- [Panel administracyjny i konfiguracja](#-panel-administracyjny-i-konfiguracja)
- [Kopia zapasowa i reset fabryczny](#-kopia-zapasowa-i-reset-fabryczny)
- [Aktualizacja aplikacji](#-aktualizacja-aplikacji)
- [Dla developerów](#-dla-developerów)
- [Licencja](#-licencja)

---

## 🏠 O projekcie

**NexusPanel** to centralny, minimalistyczny pulpit startowy dla Twojego domowego serwera i homelabu.

Zamiast zapamiętywać dziesiątki adresów IP, portów i zakładek w przeglądarce, otrzymujesz czysty, responsywny panel ze statusem dostępności każdej usługi w czasie rzeczywistym.

- ⚡ **Auto-Discovery**: Automatyczne wykrywanie podsieci LAN (`192.168.10.x`, `192.168.1.x`, `10.0.0.x`) i skanowanie popularnych portów homelabu (Proxmox, Home Assistant, Portainer, NAS, Plex, Grafana).
- 🟢 **Live Health Check & Ping**: Monitorowanie dostępności usług co określony czas z historią SLA (ms).
- 🎨 **Minimalistyczny Design**: Czysty interfejs z trybem ciemnym/jasnym, płynnymi animacjami i pełną personalizacją.
- 🔒 **Self-contained**: Wszystko działa w jednym lekkim procesie z bazą SQLite — zero zewnętrznych zależności.

---

## ✨ Główne funkcje

### 🖥️ Ekran Startowy (Speed-Dial)
- 🔲 **Nowoczesne kafelki usług**: Dedykowane logotypy marek, hosty, plakietki portów i wskaźniki SLA.
- ⭐ **Przypięte Ulubione**: Twoje najważniejsze serwisy na samej górze.
- 🔍 **Wyszukiwarka Spotlight**: Błyskawiczne szukanie i filtrowanie pod skrótem `Ctrl + K` (lub `⌘K`).
- ⛅ **Lokalna Pogoda & Geodekcja**: Pogoda na żywo dopasowana do Twojego adresu IP.
- 📱 **100% Responsywność**: Idealny widok na komputerze, tablecie i smartfonie.

### ⚙️ Panel Administracyjny
- ➕ **Formularz usług**: Ponad 50 wbudowanych ikon (Proxmox, Docker, Jellyfin, Pi-hole itd.) i paleta kolorów.
- 📁 **Kategorie i tagi**: Własne grupowanie usług z filtrami segmentowymi.
- 🖱️ **Drag & Drop**: Zmiana kolejności kafelków i kategorii metodą przeciągnij i upuść.
- 💾 **Kopia zapasowa i Przywracanie fabryczne**: Eksport/import do pliku JSON oraz bezpieczny 1-klikowy Factory Reset.

---

## 📦 Wymagania systemowe

- **Pamięć RAM**: Zaledwie ~60–128 MB RAM
- **Procesor**: 1 vCPU
- **Dysk**: 100 MB wolnego miejsca
- **System**: Proxmox VE 7/8, Debian, Ubuntu, Alpine, Docker, Windows / macOS

---

## 🚀 Pierwszy start i kreator powitalny

Po otwarciu panelu po raz pierwszy (`http://IP:3000`):
1. Widzisz czysty ekran powitalny bez zbędnych pasków.
2. Wybierasz **⚡ Skaner Sieci LAN** lub **➕ Dodaj ręcznie**.
3. Podajesz swoje imię w kroku personalizacji (*„Jak mamy się do Ciebie zwracać?”*).
4. Twój pulpit wita Cię spersonalizowanym nagłówkiem: **`Witaj, <Twoje Imię>`**!

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
