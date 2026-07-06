import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-recent-activity-list',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
  template: `
    @if (items.length === 0) {
      <app-empty-state
        title="No recent activity"
        message="VOB activity will appear here as work progresses."
      />
    } @else {
      <ul class="activity-list">
        @for (item of items; track item.id) {
          <li class="activity-list__item">
            <span class="activity-list__desc">{{ item.description }}</span>
            <time class="activity-list__time">{{ item.timestamp | date: 'short' }}</time>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .activity-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .activity-list__item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      font-size: 13px;
    }

    .activity-list__desc {
      color: var(--color-text);
    }

    .activity-list__time {
      color: var(--color-text-muted);
      white-space: nowrap;
      font-size: 12px;
    }
  `
})
export class RecentActivityListComponent {
  @Input() items: ActivityItem[] = [];
}
