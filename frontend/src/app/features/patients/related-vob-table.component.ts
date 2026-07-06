import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vob } from '../../core/models/vob.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-related-vob-table',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent, EmptyStateComponent],
  template: `
    @if (vobs.length === 0) {
      <app-empty-state
        title="No VOBs"
        message="No verification requests exist for this patient yet."
      />
    } @else {
      <div class="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>VOB ID</th>
              <th>Payer</th>
              <th>Date of service</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            @for (vob of vobs; track vob.id) {
              <tr class="clickable-row" [routerLink]="['/app/vob', vob.id]">
                <td>{{ vob.id }}</td>
                <td>{{ vob.insurance.payerName }}</td>
                <td>{{ vob.dateOfService | date: 'mediumDate' }}</td>
                <td>{{ vob.priority }}</td>
                <td><app-status-badge [status]="vob.status" /></td>
                <td>{{ vob.createdAt | date: 'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .table-wrap { padding: 0; overflow-x: auto; }
    .clickable-row { cursor: pointer; }
  `
})
export class RelatedVobTableComponent {
  @Input({ required: true }) vobs!: Vob[];
}
