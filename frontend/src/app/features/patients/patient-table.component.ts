import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patient } from '../../core/models/patient.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-patient-table',
  standalone: true,
  imports: [DatePipe, RouterLink, EmptyStateComponent],
  template: `
    @if (patients.length === 0) {
      <app-empty-state
        title="No patients found"
        message="Try adjusting your search or create a new patient."
        actionLabel="New Patient"
        (action)="createPatient.emit()"
      />
    } @else {
      <div class="table-wrap">
        <table class="patient-table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Name</th>
              <th>Date of birth</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (patient of patients; track patient.id) {
              <tr class="data-row" [routerLink]="['/app/patients', patient.id]">
                <td class="mrn">{{ patient.mrn }}</td>
                <td class="patient-name">{{ patient.lastName }}, {{ patient.firstName }}</td>
                <td>{{ patient.dateOfBirth | date: 'mediumDate' }}</td>
                <td><span class="gender-badge">{{ formatGender(patient.gender) }}</span></td>
                <td>{{ patient.phone }}</td>
                <td>{{ patient.createdAt | date: 'short' }}</td>
                <td (click)="$event.stopPropagation()">
                  <a
                    class="action-link"
                    [routerLink]="['/app/vob/add']"
                    [queryParams]="{ patientId: patient.id }"
                  >
                    Create VOB
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .table-wrap {
      padding: 0;
      overflow-x: auto;
    }

    .patient-table {
      width: 100%;
      min-width: 980px;
      border-collapse: collapse;
    }

    .patient-table th {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      background: #f7f7f5;
      color: #8a8983;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-align: left;
      text-transform: uppercase;
    }

    .patient-table td {
      padding: 16px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      color: #1a1a18;
      font-size: 13.5px;
      vertical-align: middle;
    }

    .patient-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .data-row {
      cursor: pointer;
    }

    .data-row:hover td {
      background: #fafaf9;
    }

    .mrn {
      color: #0f8a72;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      font-size: 12.5px;
      font-weight: 700;
    }

    .patient-name {
      color: #1a1a18;
      font-weight: 700;
    }

    .gender-badge {
      display: inline-block;
      padding: 3px 9px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 6px;
      color: #5f5e5a;
      font-size: 11.5px;
      font-weight: 700;
    }

    .action-link {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 7px;
      color: #5f5e5a;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }

    .action-link:hover {
      background: #f0efec;
      color: #1a1a18;
      text-decoration: none;
    }
  `
})
export class PatientTableComponent {
  @Input({ required: true }) patients!: Patient[];
  @Output() createPatient = new EventEmitter<void>();

  formatGender(gender: Patient['gender']): string {
    const labels: Record<Patient['gender'], string> = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
      UNKNOWN: 'Unknown'
    };
    return labels[gender];
  }
}
