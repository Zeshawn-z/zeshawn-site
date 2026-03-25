#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="${3:-/var/www/zeshawn-site}"
SERVICE_NAME="${4:-zeshawn-next}"
AUTH_INPUT_FILE="${5:-}"
WORK_DIR=""
LAYOUT=""
NODE_BIN=""
NPM_BIN=""

usage() {
  cat <<EOF
Usage:
  sudo bash scripts/server-init.sh <domain> <email> [app_dir] [service_name] [auth_input_file]

Example:
  sudo bash scripts/server-init.sh zeshawn.me admin@example.com
EOF
}

ensure_nvm_and_nodes() {
  local nvm_dir="/root/.nvm"

  if [[ ! -s "$nvm_dir/nvm.sh" ]]; then
    echo "Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi

  # Install Node 20 (preferred) and Node 18 (compat fallback).
  bash -lc "source $nvm_dir/nvm.sh; nvm install 20 >/dev/null; nvm install 18 >/dev/null"
}

select_runtime_node() {
  local nvm_dir="/root/.nvm"
  local node20
  local node18

  node20="$(bash -lc "source $nvm_dir/nvm.sh; nvm which 20")"
  node18="$(bash -lc "source $nvm_dir/nvm.sh; nvm which 18")"

  # Prefer Node 20, but fallback to Node 18 if native module ABI requires it.
  if [[ -f "$WORK_DIR/node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]]; then
    if (cd "$WORK_DIR" && "$node20" -e "require('better-sqlite3'); console.log('ok')" >/dev/null 2>&1); then
      NODE_BIN="$node20"
    elif (cd "$WORK_DIR" && "$node18" -e "require('better-sqlite3'); console.log('ok')" >/dev/null 2>&1); then
      NODE_BIN="$node18"
      echo "Warning: selected Node 18 due to better-sqlite3 ABI compatibility."
    else
      NODE_BIN="$node20"
      echo "Warning: better-sqlite3 preload check failed on both Node 20/18, defaulting to Node 20."
    fi
  else
    NODE_BIN="$node20"
  fi

  NPM_BIN="$(dirname "$NODE_BIN")/npm"
}

configure_admin_env_on_server() {
  if [[ -z "$AUTH_INPUT_FILE" || ! -f "$AUTH_INPUT_FILE" ]]; then
    return
  fi

  local admin_user_b64 admin_pass_b64 admin_user admin_pass hash jwt_secret dropin_dir env_file
  admin_user_b64="$(grep '^ADMIN_USERNAME_B64=' "$AUTH_INPUT_FILE" | cut -d'=' -f2-)"
  admin_pass_b64="$(grep '^ADMIN_PASSWORD_B64=' "$AUTH_INPUT_FILE" | cut -d'=' -f2-)"

  # Windows-created files may carry CRLF. Strip CR/LF and spaces before decoding.
  admin_user_b64="$(printf '%s' "$admin_user_b64" | tr -d '\r\n[:space:]')"
  admin_pass_b64="$(printf '%s' "$admin_pass_b64" | tr -d '\r\n[:space:]')"

  if [[ -z "$admin_user_b64" || -z "$admin_pass_b64" ]]; then
    echo "ERROR: invalid auth input file format: $AUTH_INPUT_FILE"
    exit 1
  fi

  if ! admin_user="$(printf '%s' "$admin_user_b64" | base64 -d)"; then
    echo "ERROR: failed to decode ADMIN_USERNAME_B64 from $AUTH_INPUT_FILE"
    exit 1
  fi

  if ! admin_pass="$(printf '%s' "$admin_pass_b64" | base64 -d)"; then
    echo "ERROR: failed to decode ADMIN_PASSWORD_B64 from $AUTH_INPUT_FILE"
    exit 1
  fi

  hash="$($NODE_BIN -e "const crypto=require('crypto');const p=process.argv[1];const s=crypto.randomBytes(16).toString('hex');const d=crypto.scryptSync(p,s,64).toString('hex');process.stdout.write('scrypt$'+s+'$'+d);" "$admin_pass")"
  jwt_secret="$("$NODE_BIN" -e "const crypto=require('crypto');process.stdout.write(crypto.randomBytes(48).toString('hex'));")"

  dropin_dir="/etc/systemd/system/${SERVICE_NAME}.service.d"
  env_file="$dropin_dir/env.conf"
  mkdir -p "$dropin_dir"
  cat > "$env_file" <<EOF
[Service]
Environment="ADMIN_USERNAME=$admin_user"
Environment="ADMIN_PASSWORD_HASH=$hash"
Environment="JWT_SECRET=$jwt_secret"
EOF
  chmod 600 "$env_file"
  rm -f "$AUTH_INPUT_FILE"
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

echo "[1/7] Installing nginx and certbot..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx curl

echo "[2/7] Installing nvm + Node runtimes (20 and 18 fallback)..."
ensure_nvm_and_nodes
select_runtime_node
echo "Selected NODE_BIN: $NODE_BIN"

echo "[3/7] Preparing app data symlink..."
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

echo "[4/7] Writing systemd service..."

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

echo "[5/7] Configuring admin auth environment (if provided)..."
configure_admin_env_on_server
systemctl daemon-reload

systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME"

echo "[6/7] Writing nginx HTTP config..."
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

echo "[7/7] Requesting HTTPS certificate with certbot..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "[verify] Verifying status..."
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
