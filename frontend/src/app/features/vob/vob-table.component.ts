import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patient } from '../../core/models/patient.models';
import { Vob } from '../../core/models/vob.models';
import { PermissionGateDirective } from '../../shared/ui/permission-gate.directive';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

export type VobTableColumn =
  | 'select'
  | 'vobId'
  | 'patient'
  | 'payer'
  | 'plan'
  | 'dateOfService'
  | 'priority'
  | 'status'
  | 'created'
  | 'actions';

@Component({
  selector: 'app-vob-table',
  standalone: true,
  imports: [DatePipe, RouterLink, PermissionGateDirective, StatusBadgeComponent],
  template: `
    <div class="vob-table-wrap">
      <table class="vob-table">
        <colgroup>
          <col [style.width.%]="widthFor('select')" />
          <col [style.width.%]="widthFor('vobId')" />
          <col [style.width.%]="widthFor('patient')" />
          <col [style.width.%]="widthFor('payer')" />
          <col [style.width.%]="widthFor('plan')" />
          <col [style.width.%]="widthFor('dateOfService')" />
          <col [style.width.%]="widthFor('priority')" />
          <col [style.width.%]="widthFor('status')" />
          <col [style.width.%]="widthFor('created')" />
          @if (showActions) {
            <col [style.width.%]="widthFor('actions')" />
          }
        </colgroup>
        <thead>
          <tr>
            <th class="check-col">
              @if (selectable) {
                <input
                  type="checkbox"
                  class="select-box"
                  aria-label="Select all VOB rows"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (click)="$event.stopPropagation()"
                  (change)="toggleAll($any($event.target).checked)"
                />
              }
            </th>
            <th>VOB ID</th>
            <th class="patient-col">Patient</th>
            <th class="payer-col">Payer</th>
            <th>Plan</th>
            <th class="service-date-col">Date of Service</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            @if (showActions) {
              <th class="actions-col">Actions</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (vob of vobs; track vob.id) {
            <tr
              class="data-row"
              [class.is-selected]="isSelected(vob.id)"
              (click)="view.emit(vob.id)"
            >
              <td class="check-col" (click)="$event.stopPropagation()">
                @if (selectable) {
                  <input
                    type="checkbox"
                    class="select-box"
                    [attr.aria-label]="'Select ' + vob.id"
                    [checked]="isSelected(vob.id)"
                    (change)="toggleSelection(vob.id, $any($event.target).checked)"
                  />
                }
              </td>
              <td class="vob-id">{{ vob.id }}</td>
              <td class="patient-col">
                @if (patientLookup[vob.patientId]; as patient) {
                  <a [routerLink]="['/app/patients', vob.patientId]" (click)="$event.stopPropagation()">
                    <span class="patient-name">{{ patient.lastName }}, {{ patient.firstName }}</span>
                    <span class="patient-mrn">{{ patient.mrn }}</span>
                  </a>
                } @else {
                  <a [routerLink]="['/app/patients', vob.patientId]" (click)="$event.stopPropagation()">
                    <span class="patient-name">{{ vob.patientId }}</span>
                    <span class="patient-mrn">Patient ID</span>
                  </a>
                }
              </td>
              <td class="payer-col">
                <span class="payer-name">{{ vob.insurance.payerName }}</span>
                <span class="payer-sub">{{ vob.insurance.memberId }}</span>
              </td>
              <td class="enum-cell">
                <span class="plan-badge">{{ vob.insurance.planType }}</span>
              </td>
              <td class="service-date-col">{{ vob.dateOfService | date: 'mediumDate' }}</td>
              <td class="enum-cell">
                @if (vob.priority === 'URGENT') {
                  <span class="priority priority--urgent">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    Urgent
                  </span>
                } @else {
                  <span class="priority-routine">Routine</span>
                }
              </td>
              <td class="enum-cell"><app-status-badge [status]="vob.status" /></td>
              <td>{{ vob.createdAt | date: 'mediumDate' }}</td>
              @if (showActions) {
                <td class="actions" (click)="$event.stopPropagation()">
                  @if (allowClaim && vob.status === 'QUEUED') {
                    <ng-container *appHasPermission="'VOB_CLAIM'">
                      <button type="button" class="action-primary" (click)="claim.emit(vob.id)">Claim</button>
                    </ng-container>
                  } @else {
                    <span class="no-action">-</span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .vob-table-wrap {
      overflow-x: auto;
    }

    .vob-table {
      width: 100%;
      min-width: 1160px;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .vob-table th {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      background: #f7f7f5;
      color: #8a8983;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-align: center;
      text-transform: uppercase;
    }

    .vob-table td {
      padding: 16px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      color: #1a1a18;
      font-size: 13.5px;
      text-align: center;
      vertical-align: middle;
    }

    .vob-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .data-row {
      cursor: pointer;
    }

    .data-row:hover td {
      background: #fafaf9;
    }

    .data-row.is-selected td {
      background: #f3f8f6;
    }

    .check-col {
      min-width: 44px;
    }

    .patient-col {
      min-width: 180px;
    }

    .payer-col {
      min-width: 190px;
    }

    .service-date-col {
      min-width: 128px;
    }

    .actions-col {
      min-width: 88px;
    }

    .select-box {
      width: 16px;
      height: 16px;
      accent-color: #168a74;
      cursor: pointer;
    }

    .enum-cell {
      text-align: center;
    }

    .vob-id {
      overflow-wrap: anywhere;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      font-size: 12.5px;
      font-weight: 400;
    }

    .patient-name,
    .payer-name {
      color: #1a1a18;
      font-weight: 400;
    }

    .payer-name {
      font-weight: 400;
    }

    .patient-mrn,
    .payer-sub {
      display: block;
      margin-top: 2px;
      color: #8a8983;
      font-size: 12px;
      font-weight: 500;
    }

    .patient-mrn,
    .payer-sub {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    }

    .vob-table a {
      color: inherit;
      text-decoration: none;
    }

    .plan-badge {
      display: inline-flex;
      justify-content: center;
      min-width: 64px;
      padding: 3px 9px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 6px;
      color: #5f5e5a;
      font-size: 11.5px;
      font-weight: 700;
    }

    .priority-routine {
      display: inline-flex;
      justify-content: center;
      min-width: 78px;
      padding: 3px 8px;
      border-radius: 6px;
      color: #8a8983;
      font-size: 12.5px;
      font-weight: 500;
    }

    .priority {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 78px;
      margin-top: 0 !important;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11.5px !important;
      font-weight: 700;
    }

    .priority--urgent {
      background: #ffe9ec;
      color: #b4233d;
    }

    .priority svg {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .actions {
      width: 88px;
      min-width: 88px;
      text-align: center;
      white-space: nowrap;
    }

    .actions button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 4px;
      border: 0;
      border-radius: 7px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }

    .no-action {
      color: #8a8983;
      font-size: 13px;
    }

    .actions .action-primary {
      padding: 7px 14px;
      background: #168a74;
      color: #fff;
      font-weight: 700;
    }

    .actions .action-primary:hover {
      background: #0c7561;
    }

  `
})
export class VobTableComponent {
  private readonly defaultColumnWidths: Record<VobTableColumn, number> = {
    select: 3,
    vobId: 15,
    patient: 14,
    payer: 14,
    plan: 7,
    dateOfService: 10,
    priority: 9,
    status: 10,
    created: 10,
    actions: 8
  };

  @Input({ required: true }) vobs: Vob[] = [];
  @Input() patientLookup: Record<string, Patient> = {};
  @Input() selectedIds: string[] = [];
  @Input() selectable = true;
  @Input() showActions = true;
  @Input() allowClaim = true;
  @Input() columnWidths: Partial<Record<VobTableColumn, number>> = {};
  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() view = new EventEmitter<string>();
  @Output() claim = new EventEmitter<string>();

  widthFor(column: VobTableColumn): number {
    return this.columnWidths[column] ?? this.defaultColumnWidths[column];
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  allSelected(): boolean {
    return this.vobs.length > 0 && this.vobs.every((vob) => this.selectedIds.includes(vob.id));
  }

  someSelected(): boolean {
    return this.selectedIds.length > 0 && !this.allSelected();
  }

  toggleSelection(id: string, selected: boolean): void {
    const next = selected
      ? Array.from(new Set([...this.selectedIds, id]))
      : this.selectedIds.filter((selectedId) => selectedId !== id);
    this.selectionChange.emit(next);
  }

  toggleAll(selected: boolean): void {
    this.selectionChange.emit(selected ? this.vobs.map((vob) => vob.id) : []);
  }
}
