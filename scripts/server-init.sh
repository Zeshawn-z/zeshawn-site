#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="${3:-/var/www/zeshawn-site}"
SERVICE_NAME="${4:-zeshawn-next}"
WORK_DIR=""
LAYOUT=""

usage() {
  cat <<EOF
Usage:
  sudo bash scripts/server-init.sh <domain> <email> [app_dir] [service_name]

Example:
  sudo bash scripts/server-init.sh zeshawn.me admin@example.com
EOF
}

detect_runtime_layout() {
  # Prefer standalone layout to align with release deploy behavior.
  if [[ -f "$APP_DIR/.next/standalone/server.js" ]]; then
    WORK_DIR="$APP_DIR/.next/standalone"
    LAYOUT="standalone"
    return
  fi

  if [[ -f "$APP_DIR/server.js" ]]; then
    WORK_DIR="$APP_DIR"
    LAYOUT="root"
    return
  fi

  echo "ERROR: standalone server not found."
  echo "Checked:"
  echo "  - $APP_DIR/.next/standalone/server.js"
  echo "  - $APP_DIR/server.js"
  echo "Deploy app artifacts first, then run this init script."
  exit 1
}

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  usage
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: please run as root (use sudo)."
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: app dir not found: $APP_DIR"
  exit 1
fi

detect_runtime_layout

echo "Detected layout: $LAYOUT"
echo "Detected server entry: $WORK_DIR/server.js"

echo "[1/6] Installing nginx and certbot..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx curl

echo "[2/6] Preparing app data symlink..."
mkdir -p "$APP_DIR/data"
mkdir -p "$WORK_DIR"
if [[ "$LAYOUT" == "root" ]]; then
  if [[ -L "$APP_DIR/data" ]]; then
    rm -f "$APP_DIR/data"
    mkdir -p "$APP_DIR/data"
  fi
  echo "Root layout detected, using real data directory: $APP_DIR/data"
else
  rm -rf "$WORK_DIR/data"
  ln -sfn "$APP_DIR/data" "$WORK_DIR/data"
  if [[ ! -L "$WORK_DIR/data" ]]; then
    echo "ERROR: failed to create data symlink at $WORK_DIR/data"
    exit 1
  fi
fi

echo "[3/6] Writing systemd service..."
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [[ -x /root/.nvm/versions/node/v20.20.1/bin/node ]]; then
  NODE_BIN="/root/.nvm/versions/node/v20.20.1/bin/node"
else
  echo "ERROR: node executable not found."
  exit 1
fi

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Next.js standalone server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORK_DIR
ExecStart=$NODE_BIN server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME"

echo "[4/6] Writing nginx HTTP config..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static/ {
        alias $APP_DIR/.next/static/;
    }
}
EOF

ln -sfn "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl reload nginx

echo "[5/6] Requesting HTTPS certificate with certbot..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "[6/6] Verifying status..."
systemctl is-active --quiet "$SERVICE_NAME"
nginx -t >/dev/null
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN")"
echo "service=$SERVICE_NAME active"
echo "https_status=$HTTP_CODE"
echo "runtime_layout=$LAYOUT"
if [[ "$LAYOUT" == "root" ]]; then
  echo "warning=root layout detected; ensure your upgrade script also updates $APP_DIR/server.js"
fi
echo "init_done=true"
