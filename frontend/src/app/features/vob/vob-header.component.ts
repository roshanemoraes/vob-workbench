import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vob } from '../../core/models/vob.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  selector: 'app-vob-header',
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `
    <div class="vob-header">
      <div>
        <h1 class="vob-header__id">{{ vob.id }}</h1>
        <div class="vob-header__meta">
          <app-status-badge [status]="vob.status" />
          <span class="vob-header__priority">{{ vob.priority }} priority</span>
          @if (vob.assignedToUserId) {
            <span class="vob-header__assigned">Assigned: {{ vob.assignedToUserId }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .vob-header__id {
      font-size: 24px;
      margin-bottom: var(--space-2);
    }

    .vob-header__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .vob-header__priority {
      font-weight: 500;
    }
  `
})
export class VobHeaderComponent {
  @Input({ required: true }) vob!: Vob;
}
