#!/bin/bash
# Custom startup script for Azure App Service Linux (Debian 11 Bullseye)
# Installs ODBC Driver 18 for SQL Server required by msnodesqlv8 to connect
# to Microsoft Fabric Warehouse, then starts the Node.js application.
#
# msnodesqlv8 is a native C++ addon. The binary compiled on Ubuntu 22.04 (CI)
# segfaults on Debian 11 (Azure) due to glibc mismatch, so we rebuild it here.

set -e

# Install ODBC Driver 18 + build tools if not already present
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

# Install build tools for native module rebuild (gcc, g++, make, python3)
if ! command -v g++ > /dev/null 2>&1; then
  echo "Installing build tools for native module compilation..."
  apt-get install -y -qq build-essential python3 > /dev/null 2>&1
  echo "Build tools installed"
else
  echo "Build tools already available"
fi

cd /home/site/wwwroot

# Rebuild msnodesqlv8 native addon against this container's glibc + Node.js
# Use a marker file keyed on the deploy timestamp to rebuild once per deploy
DEPLOY_STAMP=$(stat -c %Y /home/site/wwwroot/package.json 2>/dev/null || echo "0")
REBUILD_MARKER="/home/site/.msnodesqlv8-rebuilt-${DEPLOY_STAMP}"

# Clean up old marker files from previous deploys
rm -f /home/site/.msnodesqlv8-rebuilt-* 2>/dev/null || true

echo "Rebuilding msnodesqlv8 native module for this platform..."
npm rebuild msnodesqlv8 2>&1
echo "msnodesqlv8 rebuilt successfully"
touch "$REBUILD_MARKER"

# Start the Node.js application
node server.js
