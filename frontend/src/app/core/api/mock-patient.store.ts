import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CursorPage, ListQuery } from '../models/pagination.models';
import { CreatePatientRequest, Patient } from '../models/patient.models';

const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class MockPatientStore {
  private patients: Patient[] = [
    {
      id: 'pat-001',
      mrn: 'MRN-10001',
      firstName: 'Maria',
      lastName: 'Garcia',
      dateOfBirth: '1985-03-12',
      gender: 'FEMALE',
      phone: '555-0101',
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z'
    },
    {
      id: 'pat-002',
      mrn: 'MRN-10002',
      firstName: 'James',
      lastName: 'Wilson',
      dateOfBirth: '1972-11-28',
      gender: 'MALE',
      phone: '555-0102',
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-02T14:30:00Z',
      updatedAt: '2026-06-02T14:30:00Z'
    },
    {
      id: 'pat-003',
      mrn: 'MRN-10003',
      firstName: 'Priya',
      lastName: 'Patel',
      dateOfBirth: '1990-07-04',
      gender: 'FEMALE',
      phone: '555-0103',
      createdByUserId: 'user-frontdesk',
      createdAt: '2026-06-03T09:15:00Z',
      updatedAt: '2026-06-03T09:15:00Z'
    }
  ];

  list(query: ListQuery = {}): Observable<CursorPage<Patient>> {
    let filtered = [...this.patients];
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.mrn.toLowerCase().includes(term) ||
          p.firstName.toLowerCase().includes(term) ||
          p.lastName.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => {
      const cmp = a.lastName.localeCompare(b.lastName);
      return query.sortOrder === 'desc' ? -cmp : cmp;
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

  getById(id: string): Observable<Patient | null> {
    const patient = this.patients.find((p) => p.id === id) ?? null;
    return of(patient).pipe(delay(150));
  }

  create(request: CreatePatientRequest, createdByUserId: string): Observable<Patient> {
    const now = new Date().toISOString();
    const patient: Patient = {
      id: `pat-${Date.now()}`,
      ...request,
      createdByUserId,
      createdAt: now,
      updatedAt: now
    };
    this.patients.unshift(patient);
    return of(patient).pipe(delay(300));
  }
}
