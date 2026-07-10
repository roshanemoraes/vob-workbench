import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditEventPage, AuditEventQuery } from '../models/audit.models';

const API_BASE_URL = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);

  list(query: AuditEventQuery = {}): Observable<AuditEventPage> {
    let params = new HttpParams().set('limit', String(query.limit ?? 50));

    if (query.action && query.action !== 'ALL') {
      params = params.set('action', query.action);
    }

    if (query.entityType && query.entityType !== 'ALL') {
      params = params.set('entityType', query.entityType);
    }

    if (query.entityId?.trim()) {
      params = params.set('entityId', query.entityId.trim());
    }

    if (query.actorUserId?.trim()) {
      params = params.set('actorUserId', query.actorUserId.trim());
    }

    if (query.outcome && query.outcome !== 'ALL') {
      params = params.set('outcome', query.outcome);
    }

    if (query.createdAfter) {
      params = params.set('createdAfter', query.createdAfter);
    }

    return this.http.get<AuditEventPage>(`${API_BASE_URL}/audit-events`, { params });
  }
}
