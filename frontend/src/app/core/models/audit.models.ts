export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export type AuditEntityType =
  | 'AUTH'
  | 'PATIENT'
  | 'VOB_REQUEST'
  | 'ELIGIBILITY_RESULT'
  | 'AUDIT_RECORD'
  | 'SECURITY';

export type AuditAction =
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'PATIENT_VIEWED'
  | 'PATIENT_SEARCHED'
  | 'PATIENT_DEACTIVATED'
  | 'PATIENT_DELETED'
  | 'VOB_REQUEST_CREATED'
  | 'VOB_REQUEST_UPDATED'
  | 'VOB_REQUEST_VIEWED'
  | 'VOB_WORKLIST_VIEWED'
  | 'VOB_REQUEST_ASSIGNED'
  | 'VOB_REQUEST_REASSIGNED'
  | 'VOB_REQUEST_STATUS_CHANGED'
  | 'VOB_REQUEST_LOCKED'
  | 'VOB_REQUEST_VERIFICATION_ATTEMPTED'
  | 'ELIGIBILITY_RESULT_CREATED'
  | 'ELIGIBILITY_RESULT_UPDATED'
  | 'ELIGIBILITY_RESULT_VIEWED'
  | 'ELIGIBILITY_RESULT_SUBMITTED'
  | 'ELIGIBILITY_RESULT_REJECTED'
  | 'INVALID_STATUS_TRANSITION_ATTEMPTED'
  | 'LOCKED_REQUEST_MODIFICATION_ATTEMPTED'
  | 'ACCESS_DENIED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'USER_ROLE_CHANGED'
  | 'DASHBOARD_VIEWED'
  | 'AUDIT_HISTORY_VIEWED'
  | 'WORKLIST_FILTERED'
  | 'REPORT_EXPORTED';

export interface AuditEvent {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  outcome: AuditOutcome;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditEventQuery {
  action?: AuditAction | 'ALL';
  entityType?: AuditEntityType | 'ALL';
  entityId?: string;
  actorUserId?: string;
  outcome?: AuditOutcome | 'ALL';
  createdAfter?: string;
  limit?: number;
}

export interface AuditEventPage {
  items: AuditEvent[];
  totalCount: number;
}
