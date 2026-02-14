/**
 * Agent Types
 */

export type AgentCategory = 
  | 'Finance' 
  | 'Asset Management' 
  | 'Customer Service' 
  | 'HR' 
  | 'Planning' 
  | 'Compliance';

export type AgentStatus = 'active' | 'beta' | 'maintenance' | 'deprecated';

export type DataClassification = 
  | 'OFFICIAL' 
  | 'OFFICIAL: Sensitive' 
  | 'PROTECTED';

export interface Agent {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: AgentCategory;
  icon: string;
  status: AgentStatus;
  requiredRoles: string[];
  hasAccess: boolean;
  rating: number;
  usageCount: number;
  features: string[];
  dataClassification: DataClassification;
  owner: string;
  ownerEmail: string;
  approvers: string[];
  version: string;
  lastUpdated: string;
  capabilities?: string[];
  limitations?: string[];
  exampleQueries?: string[];
}

export interface ChartData {
  rows: Record<string, any>[];
  fields: { name: string; dataType: string | number }[];
  rowCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  attachments?: Attachment[];
  feedback?: 'positive' | 'negative';
  chartData?: ChartData;
}

export interface Citation {
  id: string;
  source: string;
  url?: string;
  excerpt: string;
  timestamp?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface ChatSession {
  sessionId: string;
  agentId: string;
  userId: string;
  messages: Message[];
  metadata: {
    startTime: Date;
    lastActivity: Date;
    tokensUsed: number;
    cost?: number;
  };
  title?: string;
}

export interface AgentQueryRequest {
  agentId: string;
  query: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface AgentQueryResponse {
  response: string;
  sessionId: string;
  citations?: Citation[];
  suggestions?: string[];
  metadata: {
    tokensUsed: number;
    responseTime: number;
    model?: string;
  };
  chartData?: ChartData;
}
