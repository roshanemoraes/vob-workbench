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
      <div class="table-wrap panel">
        <table>
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
              <tr class="clickable-row" [routerLink]="['/app/patients', patient.id]">
                <td>{{ patient.mrn }}</td>
                <td>{{ patient.lastName }}, {{ patient.firstName }}</td>
                <td>{{ patient.dateOfBirth | date: 'mediumDate' }}</td>
                <td>{{ patient.gender }}</td>
                <td>{{ patient.phone }}</td>
                <td>{{ patient.createdAt | date: 'short' }}</td>
                <td (click)="$event.stopPropagation()">
                  <a
                    class="action-link"
                    [routerLink]="['/app/vob/new']"
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

    .clickable-row {
      cursor: pointer;
    }

    .action-link {
      font-size: 13px;
      font-weight: 500;
    }
  `
})
export class PatientTableComponent {
  @Input({ required: true }) patients!: Patient[];
  @Output() createPatient = new EventEmitter<void>();
}
