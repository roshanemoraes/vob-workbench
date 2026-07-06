import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vob, VobStatus } from '../../core/models/vob.models';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PermissionGateDirective } from '../../shared/ui/permission-gate.directive';

@Component({
  selector: 'app-vob-table',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    AppButtonComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PermissionGateDirective
  ],
  template: `
    @if (vobs.length === 0) {
      <app-empty-state
        title="No VOBs"
        [message]="emptyMessage"
      />
    } @else {
      <div class="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Payer</th>
              <th>Member ID</th>
              <th>Date of service</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned to</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (vob of vobs; track vob.id) {
              <tr>
                <td>
                  <a [routerLink]="['/app/patients', vob.patientId]">{{ vob.patientId }}</a>
                </td>
                <td>{{ vob.insurance.payerName }}</td>
                <td>{{ vob.insurance.memberId }}</td>
                <td>{{ vob.dateOfService | date: 'mediumDate' }}</td>
                <td>{{ vob.priority }}</td>
                <td><app-status-badge [status]="vob.status" /></td>
                <td>{{ vob.assignedToUserId ?? '-' }}</td>
                <td>{{ vob.createdAt | date: 'short' }}</td>
                <td class="actions">
                  <app-button variant="ghost" (click)="view.emit(vob.id)">View</app-button>
                  @if (vob.status === 'QUEUED') {
                    <ng-container *appHasPermission="'VOB_CLAIM'">
                      <app-button variant="primary" (click)="claim.emit(vob.id)">Claim</app-button>
                    </ng-container>
                  }
                  @if (vob.status === 'IN_PROGRESS') {
                    <ng-container *appHasPermission="'VOB_VERIFY'">
                      <app-button variant="secondary" (click)="verifyApi.emit(vob.id)">Verify API</app-button>
                      <app-button variant="secondary" (click)="verifyManual.emit(vob.id)">Verify Manual</app-button>
                    </ng-container>
                  }
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

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      min-width: 240px;
    }
  `
})
export class VobTableComponent {
  @Input({ required: true }) vobs!: Vob[];
  @Input() status: VobStatus = 'QUEUED';
  @Output() view = new EventEmitter<string>();
  @Output() claim = new EventEmitter<string>();
  @Output() verifyApi = new EventEmitter<string>();
  @Output() verifyManual = new EventEmitter<string>();

  get emptyMessage(): string {
    const messages: Record<VobStatus, string> = {
      QUEUED: 'No queued VOBs at this time.',
      IN_PROGRESS: 'No VOBs currently in progress.',
      VERIFIED: 'No verified VOBs yet.',
      FAILED_TO_VERIFY: 'No failed verifications.'
    };
    return messages[this.status];
  }
}
