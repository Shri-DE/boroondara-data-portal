import { useQuery, useMutation, useQueryClient } from 'react-query';
import { agentService } from '../services/agentService';
import { AgentQueryRequest } from '../types/agent.types';

/**
 * Custom hook for fetching agents
 */
export const useAgents = () => {
  return useQuery('agents', () => agentService.getAgents(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Custom hook for fetching a single agent
 */
export const useAgent = (agentId: string) => {
  return useQuery(
    ['agent', agentId],
    () => agentService.getAgent(agentId),
    {
      enabled: !!agentId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Custom hook for querying an agent
 */
export const useAgentQuery = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (request: AgentQueryRequest) => agentService.queryAgent(request),
    {
      onSuccess: () => {
        // Invalidate conversation history cache
        queryClient.invalidateQueries('conversationHistory');
      },
    }
  );
};

/**
 * Custom hook for conversation history
 */
export const useConversationHistory = (agentId: string, sessionId: string) => {
  return useQuery(
    ['conversationHistory', agentId, sessionId],
    () => agentService.getConversationHistory(agentId, sessionId),
    {
      enabled: !!agentId && !!sessionId,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
};

/**
 * Custom hook for submitting feedback
 */
export const useFeedback = () => {
  return useMutation(
    ({
      agentId,
      sessionId,
      messageId,
      feedback,
      comment,
    }: {
      agentId: string;
      sessionId: string;
      messageId: string;
      feedback: 'positive' | 'negative';
      comment?: string;
    }) => agentService.submitFeedback(agentId, sessionId, messageId, feedback, comment)
  );
};
