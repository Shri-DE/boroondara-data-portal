import axios, { AxiosInstance, AxiosError } from 'axios';
import { authService } from './authService';
import { apiConfig, apiEndpoints } from '../config/apiConfig';
import { Agent, AgentQueryRequest, AgentQueryResponse, ChatSession } from '../types/agent.types';

/**
 * Agent Service
 * Handles all agent-related API calls
 */
class AgentService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // ✅ Skip auth when using local mock API
        const baseUrl = (config.baseURL || '').toString();
        if (baseUrl.includes('localhost:3001')) {
          return config;
        }

        try {
          const token = await authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get access token:', error);
          // Do not force login here; allow the request to fail and UI can handle it
        }
        return config;
      },
      (error) => Promise.reject(error)
    );


    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // ✅ Don't force a login loop from API calls.
        // Let the UI decide what to do when unauthorized.
        return Promise.reject(error);
      }
    );

  }

  /**
   * Get all available agents
   */
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.axiosInstance.get<Agent[]>(apiEndpoints.agents.list);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      throw error;
    }
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<Agent> {
    try {
      const response = await this.axiosInstance.get<Agent>(apiEndpoints.agents.get(agentId));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Query an agent
   */
  async queryAgent(request: AgentQueryRequest): Promise<AgentQueryResponse> {
    try {
      const response = await this.axiosInstance.post<AgentQueryResponse>(
        apiEndpoints.agents.query(request.agentId),
        {
          query: request.query,
          sessionId: request.sessionId,
          context: request.context,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to query agent:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(agentId: string, sessionId: string): Promise<ChatSession> {
    try {
      const response = await this.axiosInstance.get<ChatSession>(
        apiEndpoints.agents.history(agentId, sessionId)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
      throw error;
    }
  }

  /**
   * General chat (no agent required) — for file analysis and general questions
   */
  async chatGeneral(query: string, fileContext?: string, sessionId?: string): Promise<AgentQueryResponse> {
    try {
      const response = await this.axiosInstance.post<AgentQueryResponse>(
        '/api/chat',
        { query, fileContext, sessionId }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to chat:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for a message
   */
  async submitFeedback(
    agentId: string,
    sessionId: string,
    messageId: string,
    feedback: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    try {
      await this.axiosInstance.post(`/agents/${agentId}/feedback`, {
        sessionId,
        messageId,
        feedback,
        comment,
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }
}

// Export singleton instance
// Export singleton instance
export const agentService = new AgentService();


