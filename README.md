# Enterprise Data Portal - City of Boroondara

A modern React + TypeScript portal for discovering and interacting with enterprise data via AI-powered agents, self-serve datasets, dashboards, reports and geospatial views.

This repo runs as a **single Express server**:
- Serves the React build (`/build`)
- Serves API routes under `/api/*`
- Uses port **3000** by default

---

## Features

- Azure Entra ID Authentication (MSAL v3 redirect)
- Role-Based Access Control
- AI-Powered Data Agents (Finance, Asset Management)
- Self-Serve Dataset Explorer with Data Preview
- Interactive Dashboards with Real-Time KPIs
- Custom Report Builder
- Geospatial Data Viewer (Leaflet maps)
- Self-Service Onboarding Flow
- Admin Panel for User and Permission Management
- Microsoft Fabric Warehouse Backend (T-SQL)
- Fluent UI v8 Design System

---

## Prerequisites

- Node.js 18+
- npm
- Azure Entra ID App Registration (SPA)
- Microsoft Fabric Warehouse with SQL endpoint
- ODBC Driver 18 for SQL Server (required by msnodesqlv8)
- Azure AI Foundry resource (GPT-4.1 deployment)

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.template` to `.env.local` and fill in your values:

```bash
cp .env.template .env.local
```

### 3) Development

```bash
npm run dev    # React dev server (port 3000)
npm start      # Production Express server
```

### 4) Build

```bash
npm run build
```

---

## Deployment

Deployed to Azure App Service via GitHub Actions CI/CD.
See `.github/workflows/deploy.yml` for the pipeline configuration.

---

## Architecture

```
server.js              → Express entry point
agentsRoutes.js        → AI agent query pipeline
datasetRoutes.js       → Self-serve dataset API
dashboardRoutes.js     → Dashboard KPI aggregation
reportRoutes.js        → Custom report builder API
geospatialRoutes.js    → Spatial data GeoJSON API
onboardRoutes.js       → Self-service onboarding
admin/                 → User management & auth middleware
services/
  fabricService.js     → Microsoft Fabric Warehouse connection
  aiFoundryService.js  → Azure AI Foundry (SQL generation)
  sqlValidator.js      → SQL security validation
  responseFormatter.js → Query result formatting
  chatService.js       → General chat (file analysis)
  emailService.js      → SMTP email notifications
src/                   → React frontend (TypeScript)
```
