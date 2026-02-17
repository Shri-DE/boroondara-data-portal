#!/bin/bash
# Custom startup script for Azure App Service Linux (Debian 11 Bullseye)
# Installs ODBC Driver 18 for SQL Server required by msnodesqlv8 to connect
# to Microsoft Fabric Warehouse, then starts the Node.js application.
#
# msnodesqlv8 is a native C++ addon. The prebuilt binary (from prebuild-install)
# segfaults on Debian 11 due to glibc mismatch with Ubuntu 22.04 (CI).
# We compile from source on the container and cache the result in /home/site/
# which persists across restarts (but not across container re-provisioning).

set -e

# Install ODBC Driver 18 if not already present
if ! dpkg -s msodbcsql18 > /dev/null 2>&1; then
  echo "Installing ODBC Driver 18 for SQL Server..."
  apt-get update -qq
  apt-get install -y -qq curl gnupg2 apt-utils > /dev/null 2>&1
  curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | apt-key add - 2>/dev/null
  curl -fsSL https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list
  apt-get update -qq
  ACCEPT_EULA=Y apt-get install -y -qq msodbcsql18 unixodbc-dev > /dev/null 2>&1
  echo "ODBC Driver 18 installed successfully"
else
  echo "ODBC Driver 18 already installed"
fi

cd /home/site/wwwroot

# ── msnodesqlv8 native module handling ──
# The prebuilt binary from npm segfaults on Debian 11. We need to compile
# from source using node-gyp. The compiled binary is cached in /home/site/
# so we only compile once per deploy (not on every container restart).

MSNODESQLV8_DIR="$(node -e "console.log(require.resolve('msnodesqlv8/package.json').replace('/package.json',''))")"
DEPLOY_STAMP=$(stat -c %Y /home/site/wwwroot/package.json 2>/dev/null || echo "0")
CACHE_DIR="/home/site/.msnodesqlv8-cache"
CACHE_MARKER="$CACHE_DIR/.built-${DEPLOY_STAMP}"

if [ -f "$CACHE_MARKER" ] && [ -d "$CACHE_DIR/build" ]; then
  # Restore cached compiled binary
  echo "Restoring cached msnodesqlv8 native module..."
  rm -rf "$MSNODESQLV8_DIR/build" 2>/dev/null || true
  rm -rf "$MSNODESQLV8_DIR/prebuilds" 2>/dev/null || true
  cp -r "$CACHE_DIR/build" "$MSNODESQLV8_DIR/build"
  echo "msnodesqlv8 restored from cache"
else
  # Need to compile from source
  echo "Compiling msnodesqlv8 from source (first run for this deploy)..."

  # Install build tools if needed
  if ! command -v g++ > /dev/null 2>&1; then
    echo "  Installing build tools..."
    apt-get install -y -qq build-essential python3 > /dev/null 2>&1
    echo "  Build tools installed"
  fi

  # Remove prebuilt binaries so node-gyp must compile fresh
  rm -rf "$MSNODESQLV8_DIR/prebuilds" 2>/dev/null || true
  rm -rf "$MSNODESQLV8_DIR/build" 2>/dev/null || true

  # Compile from source using node-gyp
  cd "$MSNODESQLV8_DIR"
  npx node-gyp rebuild 2>&1
  cd /home/site/wwwroot

  # Cache the compiled binary for future restarts
  rm -rf "$CACHE_DIR" 2>/dev/null || true
  mkdir -p "$CACHE_DIR"
  cp -r "$MSNODESQLV8_DIR/build" "$CACHE_DIR/build"
  touch "$CACHE_MARKER"
  echo "msnodesqlv8 compiled and cached successfully"
fi

# Start the Node.js application
node server.js
