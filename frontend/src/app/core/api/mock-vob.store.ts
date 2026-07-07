import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { CursorPage, ListQuery } from '../models/pagination.models';
import {
  CreateVobRequest,
  ManualVerificationRequest,
  Vob,
  VobStatus
} from '../models/vob.models';

const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class MockVobStore {
  private vobs: Vob[] = [
    {
      id: 'vob-001',
      patientId: 'pat-001',
      insurance: {
        payerName: 'BlueCross PPO',
        memberId: 'BC123456',
        groupNumber: 'GRP-100',
        planType: 'PPO',
        relationshipToSubscriber: 'SELF',
        coverageStart: '2026-01-01',
        coverageEnd: '2026-12-31'
      },
      dateOfService: '2026-07-15',
      priority: 'URGENT',
      status: 'QUEUED',
      assignedToUserId: null,
      eligibilityResult: null,
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-28T08:00:00Z',
      updatedAt: '2026-06-28T08:00:00Z'
    },
    {
      id: 'vob-002',
      patientId: 'pat-002',
      insurance: {
        payerName: 'Aetna HMO',
        memberId: 'AE789012',
        groupNumber: 'GRP-200',
        planType: 'HMO',
        relationshipToSubscriber: 'SELF',
        coverageStart: '2026-01-01',
        coverageEnd: '2026-12-31'
      },
      dateOfService: '2026-07-10',
      priority: 'ROUTINE',
      status: 'IN_PROGRESS',
      assignedToUserId: 'user-specialist',
      eligibilityResult: null,
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-25T11:00:00Z',
      updatedAt: '2026-06-26T09:30:00Z'
    },
    {
      id: 'vob-003',
      patientId: 'pat-003',
      insurance: {
        payerName: 'UnitedHealthcare',
        memberId: 'UH345678',
        groupNumber: 'GRP-300',
        planType: 'EPO',
        relationshipToSubscriber: 'SELF',
        coverageStart: '2026-01-01',
        coverageEnd: '2026-12-31'
      },
      dateOfService: '2026-06-20',
      priority: 'ROUTINE',
      status: 'VERIFIED',
      assignedToUserId: 'user-specialist',
      eligibilityResult: {
        coverageActive: true,
        networkStatus: 'IN_NETWORK',
        copay: 25,
        coinsurancePercent: 20,
        deductibleTotal: 1500,
        deductibleMet: 500,
        oopMax: 5000,
        oopMet: 800,
        notes: 'Verified via API',
        referenceNumber: 'REF-998877',
        failureReason: null,
        verifiedByUserId: 'user-specialist',
        verifiedAt: '2026-06-22T16:00:00Z',
        verificationMethod: 'API'
      },
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-22T16:00:00Z'
    },
    {
      id: 'vob-004',
      patientId: 'pat-001',
      insurance: {
        payerName: 'Cigna',
        memberId: 'CI112233',
        groupNumber: 'GRP-400',
        planType: 'PPO',
        relationshipToSubscriber: 'SPOUSE',
        coverageStart: '2025-06-01',
        coverageEnd: '2025-12-31'
      },
      dateOfService: '2026-05-01',
      priority: 'ROUTINE',
      status: 'FAILED_TO_VERIFY',
      assignedToUserId: 'user-specialist',
      eligibilityResult: {
        coverageActive: false,
        networkStatus: null,
        copay: null,
        coinsurancePercent: null,
        deductibleTotal: null,
        deductibleMet: null,
        oopMax: null,
        oopMet: null,
        notes: 'Coverage expired',
        referenceNumber: null,
        failureReason: 'Coverage not active for date of service',
        verifiedByUserId: 'user-specialist',
        verifiedAt: '2026-05-02T12:00:00Z',
        verificationMethod: 'MANUAL'
      },
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-05-02T12:00:00Z'
    }
  ];

  list(query: ListQuery & { status?: VobStatus | 'ALL' } = {}): Observable<CursorPage<Vob>> {
    let filtered = [...this.vobs];
    if (query.status && query.status !== 'ALL') {
      filtered = filtered.filter((v) => v.status === query.status);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter((v) => {
        const fields: Record<string, string> = {
          id: v.id,
          patientId: v.patientId,
          payerName: v.insurance.payerName,
          memberId: v.insurance.memberId,
          groupNumber: v.insurance.groupNumber,
          planType: v.insurance.planType,
          priority: v.priority,
          assignedToUserId: v.assignedToUserId ?? ''
        };
        if (query.searchField && query.searchField !== 'all') {
          return fields[query.searchField]?.toLowerCase().includes(term) ?? false;
        }
        return Object.values(fields).some((value) => value.toLowerCase().includes(term));
      });
    }
    filtered.sort((a, b) => {
      const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return query.sortOrder === 'asc' ? cmp : -cmp;
    });
    const start = query.cursor ? parseInt(query.cursor, 10) : 0;
    const items = filtered.slice(start, start + PAGE_SIZE);
    const nextStart = start + PAGE_SIZE;
    return of({
      items,
      nextCursor: nextStart < filtered.length ? String(nextStart) : null,
      hasMore: nextStart < filtered.length
    }).pipe(delay(200));
  }

  listByStatus(status: VobStatus, query: ListQuery = {}): Observable<CursorPage<Vob>> {
    return this.list({ ...query, status });
  }

  listByPatientId(patientId: string): Observable<Vob[]> {
    const items = this.vobs.filter((v) => v.patientId === patientId);
    return of(items).pipe(delay(150));
  }

  getById(id: string): Observable<Vob | null> {
    const vob = this.vobs.find((v) => v.id === id) ?? null;
    return of(vob).pipe(delay(150));
  }

  countByStatus(): Observable<Record<VobStatus, number>> {
    const counts: Record<VobStatus, number> = {
      QUEUED: 0,
      IN_PROGRESS: 0,
      VERIFIED: 0,
      FAILED_TO_VERIFY: 0
    };
    for (const vob of this.vobs) {
      counts[vob.status]++;
    }
    return of(counts).pipe(delay(100));
  }

  create(request: CreateVobRequest, createdByUserId: string): Observable<Vob> {
    const now = new Date().toISOString();
    const vob: Vob = {
      id: `vob-${Date.now()}`,
      ...request,
      status: 'QUEUED',
      assignedToUserId: null,
      eligibilityResult: null,
      createdByUserId,
      createdAt: now,
      updatedAt: now
    };
    this.vobs.unshift(vob);
    return of(vob).pipe(delay(300));
  }

  claimVob(id: string, userId: string): Observable<Vob> {
    const vob = this.vobs.find((v) => v.id === id);
    if (!vob) {
      return throwError(() => new Error('VOB not found'));
    }
    if (vob.status !== 'QUEUED') {
      return throwError(() => new Error('VOB is not queued'));
    }
    vob.status = 'IN_PROGRESS';
    vob.assignedToUserId = userId;
    vob.updatedAt = new Date().toISOString();
    return of({ ...vob }).pipe(delay(300));
  }

  verifyVobWithApi(id: string, userId: string): Observable<{ vob: Vob; unavailable?: boolean }> {
    const vob = this.vobs.find((v) => v.id === id);
    if (!vob) {
      return throwError(() => new Error('VOB not found'));
    }
    if (vob.id === 'vob-002') {
      return of({ vob: { ...vob }, unavailable: true }).pipe(delay(800));
    }
    const now = new Date().toISOString();
    vob.status = 'VERIFIED';
    vob.eligibilityResult = {
      coverageActive: true,
      networkStatus: 'IN_NETWORK',
      copay: 30,
      coinsurancePercent: 15,
      deductibleTotal: 2000,
      deductibleMet: 750,
      oopMax: 6000,
      oopMet: 900,
      notes: 'Auto-verified via mock API',
      referenceNumber: `API-${Date.now()}`,
      failureReason: null,
      verifiedByUserId: userId,
      verifiedAt: now,
      verificationMethod: 'API'
    };
    vob.updatedAt = now;
    return of({ vob: { ...vob } }).pipe(delay(800));
  }

  verifyVobManually(
    id: string,
    request: ManualVerificationRequest,
    userId: string
  ): Observable<Vob> {
    const vob = this.vobs.find((v) => v.id === id);
    if (!vob) {
      return throwError(() => new Error('VOB not found'));
    }
    const now = new Date().toISOString();
    vob.status = request.result;
    vob.eligibilityResult = {
      coverageActive: request.coverageActive,
      networkStatus: request.networkStatus,
      copay: request.copay,
      coinsurancePercent: request.coinsurancePercent,
      deductibleTotal: request.deductibleTotal,
      deductibleMet: request.deductibleMet,
      oopMax: request.oopMax,
      oopMet: request.oopMet,
      notes: request.notes,
      referenceNumber: request.referenceNumber,
      failureReason: request.failureReason,
      verifiedByUserId: userId,
      verifiedAt: now,
      verificationMethod: 'MANUAL'
    };
    vob.updatedAt = now;
    return of({ ...vob }).pipe(delay(300));
  }
}
