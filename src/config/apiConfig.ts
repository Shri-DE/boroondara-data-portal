/**
 * API Configuration
 * Configure your API endpoints here
 */

export const apiConfig = {
  baseUrl: '',
  timeout: 30000, // 30 seconds
  retries: 3,
};

/**
 * API Endpoints
 */
export const apiEndpoints = {
  // Agent endpoints
  agents: {
    list: '/api/agents',
    get: (id: string) => `/api/agents/${id}`,
    query: (id: string) => `/api/agents/${id}/query`,
    history: (id: string, sessionId: string) => `/api/agents/${id}/sessions/${sessionId}/history`,
  },
  
  // Access management endpoints
  access: {
    request: '/api/access/request',
    myAccess: '/api/access/my-access',
    pending: '/api/access/pending',
    approve: (requestId: string) => `/api/access/requests/${requestId}/approve`,
    reject: (requestId: string) => `/api/access/requests/${requestId}/reject`,
  },
  
  // Analytics endpoints
  analytics: {
    usage: '/api/analytics/usage',
    myUsage: '/api/analytics/my-usage',
    performance: '/api/analytics/performance',
  },
  
  // Dataset endpoints
  datasets: {
    list: '/api/datasets',
    get: (id: string) => `/api/datasets/${id}`,
    preview: (id: string, table: string) => `/api/datasets/${id}/preview/${table}`,
    sampleValues: (id: string, table: string) => `/api/datasets/${id}/sample-values/${table}`,
    chartData: (id: string, table: string) => `/api/datasets/${id}/chart-data/${table}`,
    export: (id: string, table: string) => `/api/datasets/${id}/export/${table}`,
  },

  // Dashboard endpoints
  dashboard: {
    summary: '/api/dashboard/summary',
  },

  // Report endpoints
  reports: {
    query: '/api/reports/query',
    export: '/api/reports/export',
  },

  // Current user profile
  me: '/api/me',

  // Admin endpoints
  admin: {
    datasets: '/api/admin/datasets',
    datasetById: (id: string) => `/api/admin/datasets/${id}`,
    tables: '/api/admin/tables',
  },

  // User endpoints
  user: {
    profile: '/api/user/profile',
    preferences: '/api/user/preferences',
  },
};