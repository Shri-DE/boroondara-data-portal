#!/bin/bash
# Custom startup script for Azure App Service Linux (Debian 11 Bullseye)
# -----------------------------------------------------------------------
# 1. Installs ODBC Driver 18 for SQL Server (required by the 'odbc' npm package).
# 2. Rebuilds the 'odbc' native N-API addon FROM SOURCE on this container,
#    because the prebuilt binary shipped by npm was compiled on Ubuntu 22.04
#    and segfaults on Debian 11 due to glibc / ABI mismatch.
# 3. Caches the compiled binary in /home/site/odbc-cache/ so subsequent
#    container restarts skip the ~15-second compilation step.
# 4. Starts the Node.js application.
# -----------------------------------------------------------------------

set -e

APP_DIR="/home/site/wwwroot"
CACHE_DIR="/home/site/odbc-cache"
NODE_VER=$(node -v)
CACHE_KEY="${NODE_VER}"

# ── 1. Install ODBC Driver 18 if not already present ──
if ! dpkg -s msodbcsql18 > /dev/null 2>&1; then
  echo "[startup] Installing ODBC Driver 18 for SQL Server..."
  apt-get update -qq
  apt-get install -y -qq curl gnupg2 apt-utils > /dev/null 2>&1
  curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | apt-key add - 2>/dev/null
  curl -fsSL https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list
  apt-get update -qq
  ACCEPT_EULA=Y apt-get install -y -qq msodbcsql18 unixodbc-dev > /dev/null 2>&1
  echo "[startup] ODBC Driver 18 installed"
else
  echo "[startup] ODBC Driver 18 already installed"
fi

# ── 2. Rebuild 'odbc' native addon from source (or restore from cache) ──
ODBC_BINDING="$APP_DIR/node_modules/odbc/lib/bindings/napi-v8/odbc.node"
CACHED_BINDING="$CACHE_DIR/$CACHE_KEY/odbc.node"

if [ -f "$CACHED_BINDING" ]; then
  echo "[startup] Restoring cached odbc native binding ($CACHE_KEY)..."
  mkdir -p "$(dirname "$ODBC_BINDING")"
  cp "$CACHED_BINDING" "$ODBC_BINDING"
  echo "[startup] Cached binding restored"
else
  echo "[startup] Rebuilding odbc native addon from source (first run for $CACHE_KEY)..."

  # Install build tools if missing
  if ! command -v g++ > /dev/null 2>&1; then
    echo "[startup] Installing build-essential and python3..."
    apt-get install -y -qq build-essential python3 > /dev/null 2>&1
  fi

  # Ensure unixodbc-dev headers are present (needed for compilation)
  if [ ! -f /usr/include/sql.h ]; then
    apt-get install -y -qq unixodbc-dev > /dev/null 2>&1
  fi

  cd "$APP_DIR"

  # Force rebuild from source — delete any prebuilt binaries first
  rm -f "$ODBC_BINDING" 2>/dev/null || true
  rm -rf node_modules/odbc/build 2>/dev/null || true

  echo "[startup] Running npm rebuild odbc --build-from-source..."
  npm rebuild odbc --build-from-source 2>&1

  # Verify the binding was created
  if [ -f "$ODBC_BINDING" ]; then
    echo "[startup] odbc native addon rebuilt successfully"
    # Cache it for next restart
    mkdir -p "$(dirname "$CACHED_BINDING")"
    cp "$ODBC_BINDING" "$CACHED_BINDING"
    echo "[startup] Binding cached at $CACHED_BINDING"
  else
    # Check if it was built in the build/ directory instead
    BUILT_BINDING=$(find node_modules/odbc/build -name "odbc.node" 2>/dev/null | head -1)
    if [ -n "$BUILT_BINDING" ]; then
      echo "[startup] Found built binding at $BUILT_BINDING, copying to expected location..."
      mkdir -p "$(dirname "$ODBC_BINDING")"
      cp "$BUILT_BINDING" "$ODBC_BINDING"
      mkdir -p "$(dirname "$CACHED_BINDING")"
      cp "$BUILT_BINDING" "$CACHED_BINDING"
      echo "[startup] Binding copied and cached"
    else
      echo "[startup] WARNING: odbc native addon rebuild may have failed"
      echo "[startup] The server will start but database queries will not work"
    fi
  fi
fi

# ── 3. Start the Node.js application ──
cd "$APP_DIR"
echo "[startup] Starting Node.js application..."
exec node server.js
