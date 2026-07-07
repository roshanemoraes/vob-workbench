import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Audit" subtitle="Activity history" />
    <div class="panel">
      <p class="filters-placeholder">Filters will be added when audit integration is available.</p>
      <app-empty-state
        title="Audit log"
        message="Audit history will appear here once backend integration is complete."
      />
    </div>
  `,
  styles: `
    .filters-placeholder {
      font-size: 13px;
      color: var(--color-text-muted);
      margin: 0 0 var(--space-4);
    }
  `
})
export class AuditPageComponent {}
