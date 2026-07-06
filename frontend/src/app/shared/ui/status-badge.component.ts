import { Component, Input } from '@angular/core';
import { VobStatus } from '../../core/models/vob.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'badge--' + status.toLowerCase()">
      {{ label }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      text-transform: capitalize;
      white-space: nowrap;
    }

    .badge--queued {
      background: var(--color-neutral-bg);
      color: var(--color-neutral);
    }

    .badge--in_progress {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .badge--verified {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .badge--failed_to_verify {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }
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
}
