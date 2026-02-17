#!/bin/bash
# Custom startup script for Azure App Service Linux
# -----------------------------------------------------------------------
# The prebuilt odbc.node binary (compiled on Ubuntu 22.04 in CI) segfaults
# on the Azure App Service Debian container due to glibc/ABI mismatch.
#
# This script compiles the odbc native addon FROM SOURCE on the actual
# runtime container, caches the result in /home/site/ (persistent storage),
# and uses node-pre-gyp rebuild (not install) to skip prebuilt downloads.
#
# NOTE: First startup requires WEBSITES_CONTAINER_START_TIME_LIMIT >= 600
# to allow time for ODBC driver + build-essential + compilation.
# Subsequent restarts use the cache and start in ~30s.
# -----------------------------------------------------------------------

set -e

APP_DIR="/home/site/wwwroot"
CACHE_DIR="/home/site/odbc-cache"
NODE_VER=$(node -v)
CACHE_KEY="${NODE_VER}"

echo "[startup] ============================================"
echo "[startup] Boroondara Data Portal — startup.sh"
echo "[startup] Node: $NODE_VER | $(date -u)"
echo "[startup] ============================================"

# Determine where node_modules actually lives
# Azure extracts to /node_modules/ and symlinks from wwwroot
if [ -d "/node_modules/odbc" ]; then
  ODBC_PKG="/node_modules/odbc"
elif [ -d "$APP_DIR/node_modules/odbc" ]; then
  ODBC_PKG="$APP_DIR/node_modules/odbc"
else
  echo "[startup] ERROR: Cannot find odbc package in node_modules!"
  echo "[startup] Checked: /node_modules/odbc and $APP_DIR/node_modules/odbc"
  echo "[startup] Starting server without Fabric connection..."
  cd "$APP_DIR"
  exec node server.js
fi
echo "[startup] odbc package at: $ODBC_PKG"

# Find the napi binding directory
NAPI_DIR=$(ls -d "$ODBC_PKG/lib/bindings/napi-v"* 2>/dev/null | head -1)
if [ -z "$NAPI_DIR" ]; then
  NAPI_DIR="$ODBC_PKG/lib/bindings/napi-v8"
fi
echo "[startup] NAPI binding dir: $NAPI_DIR"

CACHED_BINDING="$CACHE_DIR/$CACHE_KEY/odbc.node"

# ── Step 1: Install ODBC Driver 18 if not present ──
if ! dpkg -s msodbcsql18 > /dev/null 2>&1; then
  echo "[startup] [1/3] Installing ODBC Driver 18..."
  START_T=$(date +%s)
  apt-get update -qq
  apt-get install -y -qq curl gnupg2 apt-utils > /dev/null 2>&1

  # Detect Debian version
  DEBIAN_VER=$(cat /etc/debian_version 2>/dev/null | cut -d. -f1)
  echo "[startup]   Detected Debian $DEBIAN_VER"

  # Use gpg --dearmor method (works on both Debian 11 and 12)
  # apt-key is deprecated on Debian 12+
  curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --batch --yes --dearmor -o /usr/share/keyrings/microsoft-prod.gpg

  if [ "$DEBIAN_VER" = "12" ]; then
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list
  else
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list
  fi

  apt-get update -qq
  ACCEPT_EULA=Y apt-get install -y -qq msodbcsql18 unixodbc-dev > /dev/null 2>&1
  END_T=$(date +%s)
  echo "[startup] [1/3] ODBC Driver 18 installed ($(( END_T - START_T ))s)"
else
  echo "[startup] [1/3] ODBC Driver 18 already present ✓"
fi

# ── Step 2: Get the correct native binding ──
if [ -f "$CACHED_BINDING" ]; then
  # Fast path: restore cached binding
  echo "[startup] [2/3] Restoring cached odbc binding ($CACHE_KEY)..."
  mkdir -p "$NAPI_DIR"
  cp "$CACHED_BINDING" "$NAPI_DIR/odbc.node"
  echo "[startup] [2/3] Cached binding restored ✓"
else
  # Slow path: compile from source
  echo "[startup] [2/3] Compiling odbc from source (first run)..."
  START_T=$(date +%s)

  # Install build tools
  if ! command -v g++ > /dev/null 2>&1; then
    echo "[startup]   Installing build-essential python3..."
    apt-get install -y -qq build-essential python3 > /dev/null 2>&1
  fi
  if [ ! -f /usr/include/sql.h ]; then
    echo "[startup]   Installing unixodbc-dev..."
    apt-get install -y -qq unixodbc-dev > /dev/null 2>&1
  fi

  cd "$ODBC_PKG"

  # Remove the Ubuntu-compiled prebuilt binary that causes segfault
  rm -f lib/bindings/*/odbc.node 2>/dev/null || true
  rm -rf build 2>/dev/null || true

  # Use node-pre-gyp REBUILD — this forces source compilation
  # (unlike "install" which downloads a prebuilt binary first)
  NODE_PRE_GYP="$(dirname "$ODBC_PKG")/@mapbox/node-pre-gyp/bin/node-pre-gyp"
  if [ ! -f "$NODE_PRE_GYP" ]; then
    # Try the global modules path
    for DIR in /node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp \
               "$APP_DIR/node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp"; do
      if [ -f "$DIR" ]; then
        NODE_PRE_GYP="$DIR"
        break
      fi
    done
  fi

  if [ -f "$NODE_PRE_GYP" ]; then
    echo "[startup]   Running: node-pre-gyp rebuild (from $NODE_PRE_GYP)..."
    node "$NODE_PRE_GYP" rebuild 2>&1
  else
    echo "[startup]   node-pre-gyp not found, using node-gyp directly..."
    npx --yes node-gyp rebuild 2>&1 || true
  fi

  # Verify the binding was placed correctly by node-pre-gyp
  # node-pre-gyp rebuild copies odbc.node to lib/bindings/napi-v8/ automatically
  BINDING_FILE="$NAPI_DIR/odbc.node"
  if [ ! -f "$BINDING_FILE" ]; then
    # Fallback: find it wherever it ended up
    BUILT=$(find "$ODBC_PKG" -name "odbc.node" -type f 2>/dev/null | head -1)
    if [ -n "$BUILT" ]; then
      mkdir -p "$NAPI_DIR"
      cp "$BUILT" "$BINDING_FILE" 2>/dev/null || true
    fi
  fi

  if [ -f "$BINDING_FILE" ]; then
    # Cache for future restarts (use cat to avoid cp "same file" error with hardlinks)
    mkdir -p "$(dirname "$CACHED_BINDING")"
    cat "$BINDING_FILE" > "$CACHED_BINDING"
    END_T=$(date +%s)
    echo "[startup] [2/3] Compiled and cached ✓ ($(( END_T - START_T ))s)"
  else
    END_T=$(date +%s)
    echo "[startup] [2/3] WARNING: compilation produced no odbc.node ($(( END_T - START_T ))s)"
    echo "[startup]   Server will start but Fabric queries will fail."
  fi
fi

# ── Step 3: Start Node.js ──
cd "$APP_DIR"
echo "[startup] [3/3] Starting Node.js application..."
exec node server.js
