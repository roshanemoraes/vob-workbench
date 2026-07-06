import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MockCurrentUserStore } from '../auth/mock-current-user.store';
import { UserRole } from '../models/auth.models';

interface NavItem {
  label: string;
  route: string;
  roles: UserRole[];
  symbol: string;
}

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar">
      <ul class="sidebar__list">
        @for (item of visibleItems(); track item.route) {
          <li>
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__link--active"
              class="sidebar__link"
              [title]="item.label"
            >
              <span class="sidebar__icon">{{ item.symbol }}</span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    .sidebar {
      width: var(--sidebar-width);
      background: #fafafa;
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      transition: width 0.2s;
      flex-shrink: 0;
    }

    .sidebar__list {
      list-style: none;
      margin: 0;
      padding: var(--space-4);
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: var(--space-1);

      &:hover {
        background: rgba(233, 235, 239, 0.7);
        color: var(--color-text);
        text-decoration: none;
      }
    }

    .sidebar__link--active {
      background: var(--color-primary-light);
      color: var(--color-text);
    }

    .sidebar__icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      flex-shrink: 0;
    }

    .sidebar__link--active .sidebar__icon {
      background: var(--color-surface);
      color: var(--color-text);
    }

    .sidebar__label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
      }

      .sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--color-border);
      }

      .sidebar__list {
        display: flex;
        gap: var(--space-1);
        overflow-x: auto;
      }

      .sidebar__link {
        margin-bottom: 0;
      }
    }
  `
})
export class SidebarNavigationComponent {
  private readonly userStore = inject(MockCurrentUserStore);

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/app/dashboard', roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'], symbol: 'DB' },
    { label: 'Patients', route: '/app/patients', roles: ['ADMIN', 'FRONT_DESK_OPERATOR'], symbol: 'PT' },
    { label: 'VOB Workbench', route: '/app/vob', roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'], symbol: 'VB' },
    { label: 'Admin', route: '/app/admin/users', roles: ['ADMIN'], symbol: 'AD' },
    { label: 'Audit', route: '/app/audit', roles: ['ADMIN'], symbol: 'AU' }
  ];

  visibleItems(): NavItem[] {
    const role = this.userStore.currentUser()?.role ?? 'ADMIN';
    return this.navItems.filter((item) => item.roles.includes(role));
  }
}
