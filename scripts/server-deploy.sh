#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/var/www/zeshawn-site}"
ARCHIVE_NAME="${2:-zeshawn-site.tar.gz}"
SERVICE_NAME="${3:-zeshawn-next}"
RESTART_MODE="${4:-restart}"
ARCHIVE_PATH="$APP_DIR/$ARCHIVE_NAME"

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "ERROR: archive not found: $ARCHIVE_PATH"
  exit 1
fi

echo "[1/3] Backing up data..."
ts="$(date +%Y%m%d-%H%M%S)"
backup_dir="$APP_DIR/backups/data-$ts"
mkdir -p "$backup_dir"
if [[ -d "$APP_DIR/data" ]]; then
  cp -a "$APP_DIR/data/." "$backup_dir/"
fi
echo "backup_data_dir=$backup_dir"

echo "[2/3] Extracting archive and preparing runtime layout..."
service_wd="$(systemctl show "$SERVICE_NAME" -p WorkingDirectory --value 2>/dev/null || true)"
mode="auto"
if [[ "$service_wd" == "$APP_DIR" ]]; then
  mode="root"
elif [[ "$service_wd" == "$APP_DIR/.next/standalone" ]]; then
  mode="standalone"
fi

manifest="$(mktemp)"
tar -tzf "$ARCHIVE_PATH" > "$manifest"
has_standalone=0
has_root=0
if grep -q '^./.next/standalone/' "$manifest"; then has_standalone=1; fi
if grep -q '^./server\.js$' "$manifest"; then has_root=1; fi

if [[ "$mode" == "auto" ]]; then
  if [[ "$has_standalone" == "1" ]]; then
    mode="standalone"
  elif [[ "$has_root" == "1" ]]; then
    mode="root"
  else
    echo "ERROR: unknown archive layout"
    rm -f "$manifest"
    exit 6
  fi
fi

echo "deploy_mode=$mode"

if [[ "$mode" == "standalone" ]]; then
  if [[ "$has_standalone" == "1" ]]; then
    rm -rf "$APP_DIR/.next/standalone" "$APP_DIR/.next/static"
    tar -xzf "$ARCHIVE_PATH" -C "$APP_DIR"
  elif [[ "$has_root" == "1" ]]; then
    rm -rf "$APP_DIR/.next/standalone" "$APP_DIR/.next/static"
    mkdir -p "$APP_DIR/.next/standalone"
    tar -xzf "$ARCHIVE_PATH" -C "$APP_DIR/.next/standalone"
    if [[ -d "$APP_DIR/.next/standalone/.next/static" ]]; then
      mkdir -p "$APP_DIR/.next"
      mv "$APP_DIR/.next/standalone/.next/static" "$APP_DIR/.next/static"
    fi
    if [[ -d "$APP_DIR/.next/standalone/public" ]]; then
      rm -rf "$APP_DIR/public"
      mv "$APP_DIR/.next/standalone/public" "$APP_DIR/public"
    fi
    rmdir "$APP_DIR/.next/standalone/.next" 2>/dev/null || true
  else
    echo "ERROR: archive layout incompatible with standalone mode"
    rm -f "$manifest"
    exit 8
  fi
  work_dir="$APP_DIR/.next/standalone"
else
  if [[ "$has_root" == "1" ]]; then
    rm -rf "$APP_DIR/.next/static" "$APP_DIR/public" "$APP_DIR/node_modules"
    rm -f "$APP_DIR/server.js" "$APP_DIR/package.json"
    tar -xzf "$ARCHIVE_PATH" -C "$APP_DIR"
    work_dir="$APP_DIR"
  else
    echo "ERROR: root mode requires archive with ./server.js"
    rm -f "$manifest"
    exit 9
  fi
fi

rm -f "$manifest"
mkdir -p "$APP_DIR/data"
if [[ "$work_dir" == "$APP_DIR" ]]; then
  echo "work_dir=app_root"
  if [[ -L "$APP_DIR/data" ]]; then
    rm -f "$APP_DIR/data"
    mkdir -p "$APP_DIR/data"
  fi
else
  mkdir -p "$work_dir"
  rm -rf "$work_dir/data"
  ln -sfn "$APP_DIR/data" "$work_dir/data"
  if [[ ! -L "$work_dir/data" ]]; then
    echo "ERROR: failed to create data symlink at $work_dir/data"
    exit 10
  fi
fi

sqlite_nodes="$(find "$work_dir" -type f -name 'better_sqlite3.node' || true)"
if [[ -z "$sqlite_nodes" ]]; then
  echo "ERROR: better_sqlite3.node not found."
  exit 4
fi
for f in $sqlite_nodes; do
  file "$f" | grep -q 'ELF' || { echo "ERROR: non-ELF native module: $f"; exit 5; }
done

if [[ "$RESTART_MODE" == "restart" ]]; then
  echo "[3/3] Restarting service..."
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl is-active --quiet "$SERVICE_NAME"
else
  echo "[3/3] Skip restart (mode=$RESTART_MODE)."
fi

echo "deploy_done=true"
