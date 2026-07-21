import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { CursorPage, ListQuery } from '../models/pagination.models';
import {
  CreateVobRequest,
  ManualVerificationRequest,
  Vob,
  VobStatus
} from '../models/vob.models';

const API_BASE_URL = 'http://localhost:8080/api';
const PAGE_SIZE = 10;

interface VobPageResponse {
  items: VobApiResponse[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number;
}

type VobApiResponse = Omit<Vob, 'publicId'> & {
  publicId?: string | null;
};

type VobListQuery = ListQuery & {
  status?: VobStatus | 'ALL';
  patientId?: string;
};

@Injectable({ providedIn: 'root' })
export class VobApiService {
  private readonly http = inject(HttpClient);

  list(query: VobListQuery = {}): Observable<CursorPage<Vob>> {
    let params = new HttpParams()
      .set('limit', String(PAGE_SIZE))
      .set('sortOrder', query.sortOrder ?? 'desc');

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }

    if (query.status && query.status !== 'ALL') {
      params = params.set('status', query.status);
    }

    if (query.patientId) {
      params = params.set('patientId', query.patientId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<VobPageResponse>(`${API_BASE_URL}/vob`, { params }).pipe(
      map((page) => ({
        items: page.items.map((vob) => this.toVob(vob)),
        nextCursor: page.nextCursor,
        hasMore: page.hasNext,
        totalCount: page.totalCount
      }))
    );
  }

  listByStatus(status: VobStatus, query: ListQuery = {}): Observable<CursorPage<Vob>> {
    return this.list({ ...query, status });
  }

  listByPatientId(patientId: string): Observable<Vob[]> {
    return this.list({ patientId, sortOrder: 'desc' }).pipe(
      map((page) => page.items)
    );
  }

  getById(id: string): Observable<Vob | null> {
    return this.http.get<VobApiResponse>(`${API_BASE_URL}/vob/${id}`).pipe(
      map((vob) => this.toVob(vob)),
      catchError((error) => {
        if (error?.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  countByStatus(): Observable<Record<VobStatus, number>> {
    const statuses: VobStatus[] = ['QUEUED', 'IN_PROGRESS', 'VERIFIED', 'FAILED_TO_VERIFY'];

    return forkJoin(statuses.map((status) => this.list({ status, sortOrder: 'desc' }))).pipe(
      map((pages) => ({
        QUEUED: pages[0].totalCount,
        IN_PROGRESS: pages[1].totalCount,
        VERIFIED: pages[2].totalCount,
        FAILED_TO_VERIFY: pages[3].totalCount
      }))
    );
  }

  create(request: CreateVobRequest, _createdByUserId: string): Observable<Vob> {
    return this.http.post<VobApiResponse>(`${API_BASE_URL}/vob`, request).pipe(
      map((vob) => this.toVob(vob))
    );
  }

  claimVob(id: string, _userId: string): Observable<Vob> {
    return this.http.post<VobApiResponse>(`${API_BASE_URL}/vob/${id}/claim`, {}).pipe(
      map((vob) => this.toVob(vob))
    );
  }

  verifyVobWithApi(
    id: string,
    _userId: string,
    version: number
  ): Observable<{ vob: Vob | null; unavailable?: boolean }> {
    return this.http.post<VobApiResponse>(`${API_BASE_URL}/vob/${id}/verify-api`, {}, {
      headers: new HttpHeaders({ 'If-Match': String(version) })
    }).pipe(
      map((updated) => ({ vob: this.toVob(updated) })),
      catchError((error) => {
        if (error?.status === 503) {
          return of({ vob: null, unavailable: true });
        }
        return throwError(() => error);
      })
    );
  }

  verifyVobManually(
    id: string,
    request: ManualVerificationRequest,
    _userId: string
  ): Observable<Vob> {
    return this.http.post<VobApiResponse>(`${API_BASE_URL}/vob/${id}/verify-manual`, request).pipe(
      map((vob) => this.toVob(vob))
    );
  }

  private toVob(vob: VobApiResponse): Vob {
    return {
      ...vob,
      publicId: vob.publicId ?? vob.id
    };
  }
}
