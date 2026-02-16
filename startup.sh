#!/bin/bash
# Custom startup script for Azure App Service Linux (Debian 11 Bullseye)
# Installs ODBC Driver 18 for SQL Server required by msnodesqlv8 to connect
# to Microsoft Fabric Warehouse, then starts the Node.js application.

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

# Start the Node.js application
cd /home/site/wwwroot
node server.js
