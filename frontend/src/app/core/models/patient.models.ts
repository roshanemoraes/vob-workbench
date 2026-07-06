export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
}
