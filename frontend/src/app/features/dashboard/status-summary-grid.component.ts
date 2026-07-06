import { Component, Input } from '@angular/core';
import { MetricTileComponent } from './metric-tile.component';
import { VobStatus } from '../../core/models/vob.models';

interface StatusMetric {
  status: VobStatus;
  label: string;
  count: number;
  symbol: string;
}

@Component({
  selector: 'app-status-summary-grid',
  standalone: true,
  imports: [MetricTileComponent],
  template: `
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      @for (metric of metrics; track metric.status) {
        <app-metric-tile
          [label]="metric.label"
          [count]="metric.count"
          [symbol]="metric.symbol"
          link="/app/vob"
          [queryParams]="{ status: metric.status }"
        />
      }
    </div>
  `
})
export class StatusSummaryGridComponent {
  @Input({ required: true }) counts!: Record<VobStatus, number>;

  get metrics(): StatusMetric[] {
    return [
      { status: 'QUEUED', label: 'Queued', count: this.counts.QUEUED, symbol: 'Q' },
      { status: 'IN_PROGRESS', label: 'In Progress', count: this.counts.IN_PROGRESS, symbol: 'IP' },
      { status: 'VERIFIED', label: 'Verified', count: this.counts.VERIFIED, symbol: 'OK' },
      { status: 'FAILED_TO_VERIFY', label: 'Failed', count: this.counts.FAILED_TO_VERIFY, symbol: '!' }
    ];
  }
}
