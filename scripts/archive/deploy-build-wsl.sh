#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-}"
if [ -z "$WORKDIR" ]; then
  echo "ERROR: missing workspace path"
  exit 1
fi

cd "$WORKDIR"

if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
  echo "Installing nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi

# shellcheck disable=SC1090
. "$HOME/.nvm/nvm.sh"
nvm install 20.20.1 >/dev/null
nvm use 20.20.1 >/dev/null

NODE_PATH="$(command -v node || true)"
NPM_PATH="$(command -v npm || true)"
if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Linux Node not found in WSL."
  exit 2
fi

if [ -z "$NPM_PATH" ]; then
  echo "ERROR: Linux npm not found in WSL."
  exit 4
fi

case "$NODE_PATH" in
  /mnt/c/*)
    echo "ERROR: WSL is using Windows Node."
    exit 3
    ;;
esac

case "$NPM_PATH" in
  /mnt/c/*)
    echo "ERROR: WSL is using Windows npm."
    exit 5
    ;;
esac

echo "WSL-node: $(node -v)"
echo "WSL-node-path: $NODE_PATH"
echo "WSL-npm-path: $NPM_PATH"
echo "WSL-npm: $(npm -v)"

export npm_config_disturl="https://npmmirror.com/mirrors/node"
export npm_config_fetch_retries=5
export npm_config_fetch_retry_mintimeout=20000
export npm_config_fetch_retry_maxtimeout=120000

rm -rf node_modules .next
npm ci
npm run build

tar -czf next-standalone.tar.gz .next/standalone .next/static public
