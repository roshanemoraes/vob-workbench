import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { CursorPage, ListQuery } from '../models/pagination.models';
import { CreatePatientRequest, Patient } from '../models/patient.models';

const PAGE_SIZE = 10;
const API_BASE_URL = 'http://localhost:8080/api';

interface PatientPageResponse {
  items: PatientApiResponse[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number;
}

type PatientApiResponse = Omit<Patient, 'publicId'> & {
  publicId?: string | null;
  createdByUserPublicId?: string | null;
};

@Injectable({ providedIn: 'root' })
export class PatientApiService {
  private readonly http = inject(HttpClient);

  list(query: ListQuery = {}): Observable<CursorPage<Patient>> {
    let params = new HttpParams().set('limit', String(PAGE_SIZE));

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<PatientPageResponse>(`${API_BASE_URL}/patients`, { params }).pipe(
      map((page) => ({
        items: page.items.map((patient) => this.toPatient(patient)),
        nextCursor: page.nextCursor,
        hasMore: page.hasNext,
        totalCount: page.totalCount
      }))
    );
  }

  getById(id: string): Observable<Patient | null> {
    return this.http.get<PatientApiResponse>(`${API_BASE_URL}/patients/${id}`).pipe(
      map((patient) => this.toPatient(patient)),
      catchError(() => of(null))
    );
  }

  create(request: CreatePatientRequest, _createdByUserId: string): Observable<Patient> {
    return this.http.post<PatientApiResponse>(`${API_BASE_URL}/patients`, request).pipe(
      map((patient) => this.toPatient(patient))
    );
  }

  private toPatient(patient: PatientApiResponse): Patient {
    return {
      ...patient,
      publicId: patient.publicId ?? patient.id,
      createdByUserPublicId: patient.createdByUserPublicId ?? patient.createdByUserId
    };
  }
}
