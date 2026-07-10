import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vob } from '../../core/models/vob.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

export type RelatedVobTableColumn =
  | 'vobId'
  | 'payer'
  | 'dateOfService'
  | 'priority'
  | 'status'
  | 'created';

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
          <colgroup>
            <col [style.width.%]="widthFor('vobId')" />
            <col [style.width.%]="widthFor('payer')" />
            <col [style.width.%]="widthFor('dateOfService')" />
            <col [style.width.%]="widthFor('priority')" />
            <col [style.width.%]="widthFor('status')" />
            <col [style.width.%]="widthFor('created')" />
          </colgroup>
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
                <td class="enum-cell"><span class="priority-badge">{{ vob.priority }}</span></td>
                <td class="enum-cell"><app-status-badge [status]="vob.status" /></td>
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
    table { table-layout: fixed; }
    th { text-align: center; }
    td { text-align: center; }
    td:first-child { overflow-wrap: anywhere; }
    .clickable-row { cursor: pointer; }
    .enum-cell { text-align: center; }
    .priority-badge {
      display: inline-flex;
      justify-content: center;
      min-width: 78px;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f0efec;
      color: #5f5e5a;
      font-size: 11.5px;
      font-weight: 600;
    }
  `
})
export class RelatedVobTableComponent {
  private readonly defaultColumnWidths: Record<RelatedVobTableColumn, number> = {
    vobId: 22,
    payer: 22,
    dateOfService: 16,
    priority: 12,
    status: 14,
    created: 14
  };

  @Input({ required: true }) vobs!: Vob[];
  @Input() columnWidths: Partial<Record<RelatedVobTableColumn, number>> = {};

  widthFor(column: RelatedVobTableColumn): number {
    return this.columnWidths[column] ?? this.defaultColumnWidths[column];
  }
}
