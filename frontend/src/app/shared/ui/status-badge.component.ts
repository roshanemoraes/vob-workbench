import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { VobStatus } from '../../core/models/vob.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex min-w-[96px] items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap"
      [ngClass]="badgeClasses"
    >
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: VobStatus;

  get label(): string {
    const labels: Record<VobStatus, string> = {
      QUEUED: 'Queued',
      IN_PROGRESS: 'In Progress',
      VERIFIED: 'Verified',
      FAILED_TO_VERIFY: 'Failed'
    };
    return labels[this.status];
  }

  get badgeClasses(): string[] {
    const classes: Record<VobStatus, string[]> = {
      QUEUED: ['bg-[#ececf0]', 'text-[#52525b]', 'border-black/10'],
      IN_PROGRESS: ['bg-[#fffbeb]', 'text-[#a16207]', 'border-[#fde68a]'],
      VERIFIED: ['bg-[#ecfdf3]', 'text-[#15803d]', 'border-[#bbf7d0]'],
      FAILED_TO_VERIFY: ['bg-[#fff1f3]', 'text-[#d4183d]', 'border-[#fecdd3]']
    };
    return classes[this.status];
  }
}
