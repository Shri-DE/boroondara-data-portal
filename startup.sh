#!/bin/bash
# Custom startup script for Azure App Service Linux
# Just start the Node.js application. ODBC driver and native module
# compilation happen lazily on first Fabric query, not at startup.
cd /home/site/wwwroot
echo "[startup] Starting Node.js application..."
exec node server.js
