/**
 * Access Control Types
 */

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type AccessDuration = 'permanent' | 'temporary';
export type AccessUrgency = 'low' | 'medium' | 'high';

export interface AccessRequest {
  id: string;
  agentId: string;
  agentName: string;
  userId: string;
  userName: string;
  userEmail: string;
  department?: string;
  justification: string;
  duration: AccessDuration;
  expiryDate?: Date;
  urgency: AccessUrgency;
  managerApproval?: boolean;
  managerName?: string;
  status: AccessRequestStatus;
  requestDate: Date;
  approvalDate?: Date;
  approver?: string;
  approverEmail?: string;
  rejectionReason?: string;
}

export interface AccessRequestForm {
  agentId: string;
  justification: string;
  duration: AccessDuration;
  expiryDate?: Date;
  urgency: AccessUrgency;
  managerApproval: boolean;
  managerName?: string;
}

export interface UserAccess {
  agentId: string;
  agentName: string;
  grantedDate: Date;
  expiryDate?: Date;
  grantedBy: string;
  status: 'active' | 'expired' | 'revoked';
}
