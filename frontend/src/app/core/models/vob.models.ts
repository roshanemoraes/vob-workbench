export type VobStatus = 'QUEUED' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED_TO_VERIFY';

export type VobPriority = 'ROUTINE' | 'URGENT';

export type NetworkStatus = 'IN_NETWORK' | 'OUT_OF_NETWORK' | 'UNKNOWN';

export type RelationshipToSubscriber =
  | 'SELF'
  | 'SPOUSE'
  | 'CHILD'
  | 'OTHER';

export interface InsurancePolicy {
  payerName: string;
  memberId: string;
  groupNumber: string;
  planType: string;
  relationshipToSubscriber: RelationshipToSubscriber;
  coverageStart: string;
  coverageEnd: string;
}

export interface EligibilityResult {
  coverageActive: boolean | null;
  networkStatus: NetworkStatus | null;
  copay: number | null;
  coinsurancePercent: number | null;
  deductibleTotal: number | null;
  deductibleMet: number | null;
  oopMax: number | null;
  oopMet: number | null;
  notes: string | null;
  referenceNumber: string | null;
  failureReason: string | null;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
  verificationMethod: 'API' | 'MANUAL' | null;
}

export interface Vob {
  id: string;
  publicId: string;
  version: number;
  patientId: string;
  insurance: InsurancePolicy;
  dateOfService: string;
  priority: VobPriority;
  status: VobStatus;
  assignedToUserId: string | null;
  eligibilityResult: EligibilityResult | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVobRequest {
  patientId: string;
  insurance: InsurancePolicy;
  dateOfService: string;
  priority: VobPriority;
}

export interface ManualVerificationRequest {
  version: number;
  result: 'VERIFIED' | 'FAILED_TO_VERIFY';
  coverageActive: boolean | null;
  networkStatus: NetworkStatus | null;
  copay: number | null;
  coinsurancePercent: number | null;
  deductibleTotal: number | null;
  deductibleMet: number | null;
  oopMax: number | null;
  oopMet: number | null;
  referenceNumber: string | null;
  failureReason: string | null;
  notes: string | null;
}
