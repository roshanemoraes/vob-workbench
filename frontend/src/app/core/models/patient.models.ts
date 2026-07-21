export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export interface Patient {
  id: string;
  publicId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  createdByUserId: string;
  createdByUserPublicId: string;
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
