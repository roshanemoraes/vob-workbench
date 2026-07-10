import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MockCurrentUserStore } from '../auth/mock-current-user.store';
import { UserRole } from '../models/auth.models';

interface NavItem {
  label: string;
  route: string;
  roles: UserRole[];
  icon: string;
  children?: Omit<NavItem, 'children'>[];
}

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__brand-icon">
          <img src="/assets/icons/app-icon.png" alt="" aria-hidden="true" />
        </div>
        <div>
          <div class="sidebar__brand-title">VOB Workbench</div>
          <div class="sidebar__brand-subtitle">Benefits verification</div>
        </div>
      </div>

      <ul class="sidebar__list">
        @for (item of visibleItems(); track item.route) {
          <li class="sidebar__item" [class.sidebar__item--expanded]="isExpanded(item)">
            @if (visibleChildren(item).length) {
              <button
                type="button"
                class="sidebar__link"
                [title]="item.label"
                (click)="toggleGroup(item.label)"
              >
                <span class="sidebar__link-left">
                  <span class="sidebar__icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path [attr.d]="iconPath(item.icon)"></path>
                    </svg>
                  </span>
                  <span class="sidebar__label">{{ item.label }}</span>
                </span>
                <span class="sidebar__chevron">
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M2.1 5.1 8 10.5l5.9-5.4" />
                  </svg>
                </span>
              </button>

              <ul class="sidebar__sublist">
                @for (child of visibleChildren(item); track child.route) {
                  <li>
                    <a
                      [routerLink]="child.route"
                      [class.sidebar__sublink--active]="isRouteActive(child.route)"
                      class="sidebar__sublink"
                      [title]="child.label"
                    >
                      <span class="sidebar__subicon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path [attr.d]="iconPath(child.icon)"></path>
                        </svg>
                      </span>
                      {{ child.label }}
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <a
                [routerLink]="item.route"
                [class.sidebar__link--active]="isRouteActive(item.route)"
                class="sidebar__link"
                [title]="item.label"
              >
                <span class="sidebar__link-left">
                  <span class="sidebar__icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path [attr.d]="iconPath(item.icon)"></path>
                    </svg>
                  </span>
                  <span class="sidebar__label">{{ item.label }}</span>
                </span>
              </a>
            }
          </li>
          @if (item.label === 'Dashboard' || item.label === 'VOB Workbench') {
            <hr class="sidebar__divider" />
          }
        }
      </ul>
    </nav>
  `,
  styles: `
    .sidebar {
      width: 260px;
      height: 100%;
      padding: 20px 12px;
      background: #fff;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px 20px;
    }

    .sidebar__brand-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #1a1a18;
      color: #fff;
      flex-shrink: 0;
    }

    .sidebar__brand-icon img,
    .sidebar__brand-icon svg,
    .sidebar__icon svg,
    .sidebar__subicon svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .sidebar__brand-icon img,
    .sidebar__brand-icon svg {
      width: 22px;
      height: 22px;
    }

    .sidebar__brand-title {
      color: #1a1a18;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
    }

    .sidebar__brand-subtitle {
      margin-top: 2px;
      color: #8a8983;
      font-size: 12px;
    }

    .sidebar__list {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
    }

    .sidebar__item {
      margin-bottom: 2px;
    }

    .sidebar__divider {
      margin: 12px 8px;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      border: 0;
      border-left: 3px solid transparent;
      border-radius: 8px;
      background: transparent;
      color: #5f5e5a;
      text-decoration: none;
      font-size: 14px;
      font: inherit;
      cursor: pointer;
      position: relative;
    }

    .sidebar__link:hover {
      background: #f5f4f2;
      text-decoration: none;
    }

    .sidebar__link--active {
      border-left-color: #1a1a18;
      background: #ecebe7;
      color: #1a1a18;
      font-weight: 600;
    }

    .sidebar__link-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .sidebar__icon {
      display: flex;
      flex-shrink: 0;
    }

    .sidebar__label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar__chevron {
      display: flex;
      flex-shrink: 0;
      color: #8a8983;
      transition: transform 0.18s ease;
    }

    .sidebar__chevron svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .sidebar__item--expanded > .sidebar__link .sidebar__chevron {
      transform: rotate(180deg);
    }

    .sidebar__sublist {
      list-style: none;
      margin: 2px 0 6px;
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease;
    }

    .sidebar__item--expanded .sidebar__sublist {
      max-height: 200px;
    }

    .sidebar__sublink {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px 8px 34px;
      border-left: 3px solid transparent;
      border-radius: 8px;
      color: #5f5e5a;
      font-size: 13.5px;
      text-decoration: none;
    }

    .sidebar__sublink:hover {
      background: #f5f4f2;
      text-decoration: none;
    }

    .sidebar__subicon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidebar__subicon svg {
      width: 15px;
      height: 15px;
      stroke-width: 2;
    }

    .sidebar__sublink--active {
      border-left-color: #1a1a18;
      background: #ecebe7;
      color: #1a1a18;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        min-height: auto;
        height: auto;
        padding: 8px 12px;
      }

      .sidebar {
        border-right: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .sidebar__brand {
        display: none;
      }

      .sidebar__list {
        display: flex;
        gap: 4px;
        overflow-x: auto;
      }

      .sidebar__divider {
        display: none;
      }

      .sidebar__sublist {
        display: none;
      }
    }
  `
})
export class SidebarNavigationComponent {
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly router = inject(Router);
  readonly expandedGroups = signal<Record<string, boolean>>({
    Patients: true,
    'VOB Workbench': true
  });

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/app/dashboard', roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'], icon: 'dashboard' },
    {
      label: 'Patients',
      route: '/app/patients/list',
      roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'],
      icon: 'patients',
      children: [
        { label: 'List Patients', route: '/app/patients/list', roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'], icon: 'list' },
        { label: 'Add Patient', route: '/app/patients/add', roles: ['ADMIN', 'FRONT_DESK_OPERATOR'], icon: 'add' }
      ]
    },
    {
      label: 'VOB Workbench',
      route: '/app/vob/list',
      roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'],
      icon: 'workbench',
      children: [
        { label: 'List VOB', route: '/app/vob/list', roles: ['ADMIN', 'SPECIALIST'], icon: 'list' },
        { label: 'Add VOB', route: '/app/vob/add', roles: ['ADMIN', 'FRONT_DESK_OPERATOR', 'SPECIALIST'], icon: 'add' }
      ]
    },
    { label: 'Admin', route: '/app/admin/users', roles: ['ADMIN'], icon: 'admin' },
    { label: 'Audit', route: '/app/audit', roles: ['ADMIN'], icon: 'audit' }
  ];

  visibleItems(): NavItem[] {
    const role = this.userStore.currentUser()?.role ?? 'ADMIN';
    return this.navItems.filter((item) => item.roles.includes(role));
  }

  visibleChildren(item: NavItem): Omit<NavItem, 'children'>[] {
    const role = this.userStore.currentUser()?.role ?? 'ADMIN';
    return item.children?.filter((child) => child.roles.includes(role)) ?? [];
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update((groups) => ({
      ...groups,
      [label]: !groups[label]
    }));
  }

  isExpanded(item: NavItem): boolean {
    return Boolean(this.expandedGroups()[item.label]) || this.isGroupActive(item);
  }

  isGroupActive(item: NavItem): boolean {
    return this.isRouteActive(item.route) || this.visibleChildren(item).some((child) => this.isRouteActive(child.route));
  }

  isRouteActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  iconPath(icon: string): string {
    const paths: Record<string, string> = {
      dashboard: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
      patients: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
      workbench: 'M6 3h9l3 3v15H6z M14 3v4h4 M9 12h6 M9 16h6',
      admin: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
      audit: 'M9 3h6l2 2h3v16H4V5h3z M9 3v4h6V3 M8 12h8 M8 16h5',
      list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
      add: 'M12 5v14 M5 12h14'
    };
    return paths[icon] ?? paths['list'];
  }
}
