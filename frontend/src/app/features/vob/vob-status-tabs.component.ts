import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VobStatus } from '../../core/models/vob.models';

@Component({
  selector: 'app-vob-status-tabs',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="mb-4 flex w-fit gap-1 rounded-xl border border-black/10 bg-[#ececf0] p-1" role="tablist">
      @for (tab of tabs; track tab.status) {
        <button
          type="button"
          role="tab"
          class="rounded-lg px-4 py-2 text-sm font-medium text-[#717182] transition-all hover:bg-white/70 hover:text-[#030213]"
          [ngClass]="status === tab.status ? ['bg-white', 'text-[#030213]', 'shadow-sm'] : []"
          [attr.aria-selected]="status === tab.status"
          (click)="statusChange.emit(tab.status)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `
})
export class VobStatusTabsComponent {
  @Input({ required: true }) status!: VobStatus;
  @Output() statusChange = new EventEmitter<VobStatus>();

  readonly tabs: { status: VobStatus; label: string }[] = [
    { status: 'QUEUED', label: 'Queued' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'VERIFIED', label: 'Verified' },
    { status: 'FAILED_TO_VERIFY', label: 'Failed' }
  ];
}
