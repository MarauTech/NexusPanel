#!/usr/bin/env bash

# ============================================
# NexusPanel - 1-Line Proxmox VE / Linux Installer
# ============================================
#
# Usage in Proxmox VE Node Shell (Creates new dedicated LXC container):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/MarauTech/NexusPanel/main/install.sh)"
#
# Usage inside existing Debian / Ubuntu / Alpine / Raspberry Pi:
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/MarauTech/NexusPanel/main/install.sh)"
# ============================================

set -e

# Detect if running on Proxmox VE Host or inside a normal Linux Container/VM
if [ -f "/etc/pve/pve-root-ca.pem" ] || command -v pvesm >/dev/null 2>&1; then
  IS_PVE_HOST=true
else
  IS_PVE_HOST=false
fi

# Color codes
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m")
BGN=$(echo "\033[4;92m")
GN=$(echo "\033[1;92m")
DGN=$(echo "\033[32m")
CL=$(echo "\033[m")

clear
echo -e "${BL}
  _   _                       ____                  _ 
 | \ | | _____  ___   _ ___  |  _ \ __ _ _ __   ___| |
 |  \| |/ _ \ \/ / | | / __| | |_) / _\` | '_ \ / _ \ |
 | |\  |  __/>  <| |_| \__ \ |  __/ (_| | | | |  __/ |
 |_| \_|\___/_/\_\\\\__,_|___/ |_|   \__,_|_| |_|\___|_|
                                                      
${CL}"
echo -e "${GN}NexusPanel — Nowoczesny i szybki ekran startowy homelabu${CL}\n"

# ==============================================================================
# SCENARIO 1: RUNNING DIRECTLY ON PROXMOX VE HOST (Auto-create dedicated LXC)
# ==============================================================================
if [ "$IS_PVE_HOST" = true ]; then
  echo -e "${YW}Wykryto środowisko: Serwer Proxmox VE Host!${CL}"
  echo -e "Kreator automatycznie utworzy lekki kontener LXC (Debian 12) z NexusPanel.\n"

  # Auto-detect available rootdir storages
  mapfile -t STORAGES < <(pvesm status -content rootdir 2>/dev/null | awk 'NR>1 && $2=="active" {print $1}')
  if [ ${#STORAGES[@]} -eq 0 ]; then
    mapfile -t STORAGES < <(pvesm status 2>/dev/null | awk 'NR>1 && $2=="active" {print $1}')
  fi
  DEFAULT_STORAGE=${STORAGES[0]:-local-lvm}

  # Auto-detect template storage
  mapfile -t TMPL_STORAGES < <(pvesm status -content vztmpl 2>/dev/null | awk 'NR>1 && $2=="active" {print $1}')
  DEFAULT_TMPL_STORAGE=${TMPL_STORAGES[0]:-local}

  # Next available CTID
  NEXT_ID=$(pvesh get /cluster/nextid 2>/dev/null || echo "102")

  # Ask user for installation type
  echo -e "${BL}[1] Instalacja automatyczna (Domyślna: 512MB RAM, 1 vCPU, 4GB Dysk na ${DEFAULT_STORAGE})${CL}"
  echo -e "${BL}[2] Instalacja zaawansowana (Własne parametry CT ID / RAM / Dysk / Storage)${CL}"
  read -p "Wybierz opcję [1-2] (Domyślnie: 1): " CHOICE
  CHOICE=${CHOICE:-1}

  if [ "$CHOICE" == "2" ]; then
    read -p "Podaj CT ID (Domyślnie: $NEXT_ID): " CT_ID
    CT_ID=${CT_ID:-$NEXT_ID}
    read -p "Nazwa hosta (Domyślnie: nexuspanel): " CT_NAME
    CT_NAME=${CT_NAME:-nexuspanel}
    read -p "Ilość pamięci RAM w MB (Domyślnie: 512): " CT_RAM
    CT_RAM=${CT_RAM:-512}
    read -p "Ilość rdzeni CPU (Domyślnie: 1): " CT_CORES
    CT_CORES=${CT_CORES:-1}
    read -p "Rozmiar dysku w GB (Domyślnie: 4): " CT_DISK
    CT_DISK=${CT_DISK:-4}

    # Numbered Storage Selection
    echo -e "\nDostępne magazyny pamięci masowej (Storage):"
    for i in "${!STORAGES[@]}"; do
      echo -e "  [${BL}$((i+1))${CL}] ${STORAGES[$i]}"
    done
    read -p "Wybierz magazyn [1-${#STORAGES[@]}] (Domyślnie: 1 - $DEFAULT_STORAGE): " S_INPUT
    S_INPUT=${S_INPUT:-1}

    # Handle numeric or text input
    if [[ "$S_INPUT" =~ ^[0-9]+$ ]] && [ "$S_INPUT" -ge 1 ] && [ "$S_INPUT" -le "${#STORAGES[@]}" ]; then
      CT_STORAGE="${STORAGES[$((S_INPUT-1))]}"
    elif [ -n "$S_INPUT" ] && [[ " ${STORAGES[*]} " =~ " ${S_INPUT} " ]]; then
      CT_STORAGE="$S_INPUT"
    else
      CT_STORAGE="$DEFAULT_STORAGE"
    fi
  else
    CT_ID=$NEXT_ID
    CT_NAME="nexuspanel"
    CT_RAM=512
    CT_CORES=1
    CT_DISK=4
    CT_STORAGE="$DEFAULT_STORAGE"
  fi

  echo -e "\n${YW}--> Pobieranie oficjalnego szablonu Debian 12 (${DEFAULT_TMPL_STORAGE})...${CL}"
  pveam update >/dev/null 2>&1 || true
  TEMPLATE=$(pveam available -section system | grep "debian-12-standard" | head -n1 | awk '{print $2}')
  if [ -z "$TEMPLATE" ]; then
    TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"
  fi
  pveam download "$DEFAULT_TMPL_STORAGE" "$TEMPLATE" >/dev/null 2>&1 || true

  echo -e "${YW}--> Tworzenie kontenera LXC ($CT_ID: $CT_NAME na $CT_STORAGE)...${CL}"
  pct create "$CT_ID" "${DEFAULT_TMPL_STORAGE}:vztmpl/$TEMPLATE" \
    --hostname "$CT_NAME" \
    --cores "$CT_CORES" \
    --memory "$CT_RAM" \
    --swap 512 \
    --rootfs "$CT_STORAGE:$CT_DISK" \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=0 \
    --ostype debian \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --start 1

  echo -e "${YW}--> Czekam na uruchomienie sieci i przydział IP z DHCP...${CL}"
  for i in {1..15}; do
    sleep 2
    IP_ADDR=$(pct exec "$CT_ID" -- ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n1 || echo "")
    if [ -n "$IP_ADDR" ]; then
      break
    fi
  done
  
  echo -e "${YW}--> Instalowanie środowiska Node.js 20 wewnątrz kontenera...${CL}"
  pct exec "$CT_ID" -- bash -c "
    export DEBIAN_FRONTEND=noninteractive
    echo 'nameserver 1.1.1.1' > /etc/resolv.conf
    echo 'nameserver 8.8.8.8' >> /etc/resolv.conf
    apt-get update -y
    apt-get install -y curl git sudo ca-certificates openssl
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  "

  # Clean clone and build
  echo -e "${YW}--> Pobieranie kodu i budowanie aplikacji NexusPanel...${CL}"
  pct exec "$CT_ID" -- bash -c "
    set -e
    rm -rf /opt/nexuspanel
    git clone --depth 1 https://github.com/MarauTech/NexusPanel.git /opt/nexuspanel
    cd /opt/nexuspanel
    npm install
    npm run build
    mkdir -p /opt/nexuspanel/data /opt/nexuspanel/uploads
  "

  # Generate a cryptographically secure random JWT secret (64 hex characters)
  GEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)

  # Create Systemd Service for Auto-start with secure environment
  echo -e "${YW}--> Konfiguracja usługi autostartu systemd...${CL}"
  pct exec "$CT_ID" -- bash -c "
    cat << EOF > /etc/systemd/system/nexuspanel.service
[Unit]
Description=NexusPanel Homelab Startpage
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nexuspanel
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=JWT_SECRET=${GEN_SECRET}
Environment=JWT_EXPIRY=24h
Environment=DB_PATH=/opt/nexuspanel/data/nexuspanel.db

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable --now nexuspanel.service
  "

  sleep 2

  echo -e "\n${GN}======================================================${CL}"
  echo -e "${GN}🎉 NexusPanel został pomyślnie zainstalowany w Proxmox!${CL}"
  echo -e "${GN}======================================================${CL}\n"
  if [ -n "$IP_ADDR" ]; then
    echo -e "👉 Otwórz panel w przeglądarce: ${BL}http://$IP_ADDR:3000${CL}\n"
  else
    echo -e "👉 Otwórz panel w przeglądarce: ${BL}http://ADRES_IP_KONTENERA:3000${CL}\n"
  fi
  echo -e "ID Kontenera: ${YW}$CT_ID${CL}"
  echo -e "Zarządzanie usługą: ${YW}pct enter $CT_ID${CL} (lub systemctl status nexuspanel)\n"
  exit 0
fi

# ==============================================================================
# SCENARIO 2: RUNNING INSIDE EXISTING LINUX / DEBIAN / UBUNTU / CONTAINER
# ==============================================================================
echo -e "${YW}Wykryto instalację lokalną w systemie Linux / LXC Container.${CL}"
echo -e "Instalacja zależności (Node.js 20, npm, systemd service)...\n"

# Check root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RD}Uruchom skrypt jako root lub za pomocą sudo!${CL}"
  exit 1
fi

echo -e "${YW}--> Aktualizacja pakietów i instalacja Node.js 20...${CL}"
apt-get update -y
apt-get install -y curl git sudo ca-certificates openssl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

INSTALL_DIR="/opt/nexuspanel"
rm -rf "$INSTALL_DIR"
git clone --depth 1 https://github.com/MarauTech/NexusPanel.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${YW}--> Budowanie aplikacji...${CL}"
npm install
npm run build
mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/uploads"

# Generate a cryptographically secure random JWT secret (64 hex characters)
GEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)

echo -e "${YW}--> Konfiguracja usługi systemowej autostartu (systemd)...${CL}"
cat << EOF > /etc/systemd/system/nexuspanel.service
[Unit]
Description=NexusPanel Homelab Startpage
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nexuspanel
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=JWT_SECRET=${GEN_SECRET}
Environment=JWT_EXPIRY=24h
Environment=DB_PATH=/opt/nexuspanel/data/nexuspanel.db

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nexuspanel.service

MY_IP=$(hostname -I | awk '{print $1}')

echo -e "\n${GN}======================================================${CL}"
echo -e "${GN}🎉 NexusPanel został pomyślnie zainstalowany i uruchomiony!${CL}"
echo -e "${GN}======================================================${CL}\n"
echo -e "👉 Otwórz panel w przeglądarce: ${BL}http://$MY_IP:3000${CL}\n"
echo -e "Status usługi: ${YW}systemctl status nexuspanel${CL}"
echo -e "Restart usługi: ${YW}systemctl restart nexuspanel${CL}\n"
