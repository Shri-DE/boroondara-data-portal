import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { apiConfig, apiEndpoints } from '../config/apiConfig';
import type {
  DepartmentSummary,
  DepartmentDetail,
  PreviewResult,
  SampleValuesResult,
} from '../types/dataset.types';

/**
 * Dataset Service
 * Handles all dataset-related API calls (follows agentService pattern)
 */
class DatasetService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const baseUrl = (config.baseURL || '').toString();
        if (baseUrl.includes('localhost:3001')) return config;

        try {
          const token = await authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
  }

  /**
   * List all departments with summary metadata
   */
  async getDatasets(): Promise<DepartmentSummary[]> {
    const response = await this.axiosInstance.get<DepartmentSummary[]>(
      apiEndpoints.datasets.list
    );
    return response.data;
  }

  /**
   * Get single department detail with table + column info
   */
  async getDataset(id: string): Promise<DepartmentDetail> {
    const response = await this.axiosInstance.get<DepartmentDetail>(
      apiEndpoints.datasets.get(id)
    );
    return response.data;
  }

  /**
   * Preview first 10 rows of a table
   */
  async getPreview(datasetId: string, table: string): Promise<PreviewResult> {
    const response = await this.axiosInstance.get<PreviewResult>(
      apiEndpoints.datasets.preview(datasetId, table)
    );
    return response.data;
  }

  /**
   * Get 5 sample values per column
   */
  async getSampleValues(datasetId: string, table: string): Promise<SampleValuesResult> {
    const response = await this.axiosInstance.get<SampleValuesResult>(
      apiEndpoints.datasets.sampleValues(datasetId, table)
    );
    return response.data;
  }

  /**
   * Get smart aggregated chart data for a table
   */
  async getChartData(datasetId: string, table: string): Promise<PreviewResult> {
    const response = await this.axiosInstance.get<PreviewResult>(
      apiEndpoints.datasets.chartData(datasetId, table)
    );
    return response.data;
  }

  /**
   * Download table as CSV (triggers browser download)
   */
  async exportTable(datasetId: string, table: string): Promise<void> {
    const response = await this.axiosInstance.get(
      apiEndpoints.datasets.export(datasetId, table),
      { responseType: 'blob' }
    );

    // Trigger browser download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const datasetService = new DatasetService();
