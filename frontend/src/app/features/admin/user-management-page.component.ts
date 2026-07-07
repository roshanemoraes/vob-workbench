import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-user-management-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  template: `
    <app-page-header title="User Management" subtitle="Administration" />
    <div class="panel">
      <app-empty-state
        title="Coming soon"
        message="User management will be added later."
      />
    </div>
  `
})
export class UserManagementPageComponent {}
