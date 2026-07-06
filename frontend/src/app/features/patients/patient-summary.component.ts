import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Patient } from '../../core/models/patient.models';

@Component({
  selector: 'app-patient-summary',
  standalone: true,
  imports: [DatePipe],
  template: `
    <dl class="detail-grid">
      <div class="detail-item">
        <dt>MRN</dt>
        <dd>{{ patient.mrn }}</dd>
      </div>
      <div class="detail-item">
        <dt>Name</dt>
        <dd>{{ patient.lastName }}, {{ patient.firstName }}</dd>
      </div>
      <div class="detail-item">
        <dt>Date of birth</dt>
        <dd>{{ patient.dateOfBirth | date: 'mediumDate' }}</dd>
      </div>
      <div class="detail-item">
        <dt>Gender</dt>
        <dd>{{ patient.gender }}</dd>
      </div>
      <div class="detail-item">
        <dt>Phone</dt>
        <dd>{{ patient.phone }}</dd>
      </div>
      <div class="detail-item">
        <dt>Created</dt>
        <dd>{{ patient.createdAt | date: 'short' }}</dd>
      </div>
    </dl>
  `
})
export class PatientSummaryComponent {
  @Input({ required: true }) patient!: Patient;
}
