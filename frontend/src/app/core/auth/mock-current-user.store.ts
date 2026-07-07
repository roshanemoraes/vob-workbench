import { Injectable, signal } from '@angular/core';
import { CurrentUser, UserRole } from '../models/auth.models';

const SEED_USERS: Record<string, { password: string; user: CurrentUser }> = {
  admin: {
    password: 'admin',
    user: {
      id: 'user-admin',
      username: 'admin',
      displayName: 'Alex Admin',
      role: 'ADMIN'
    }
  },
  frontdesk: {
    password: 'frontdesk',
    user: {
      id: 'user-frontdesk',
      username: 'frontdesk',
      displayName: 'Jamie Front Desk',
      role: 'FRONT_DESK_OPERATOR'
    }
  },
  specialist: {
    password: 'specialist',
    user: {
      id: 'user-specialist',
      username: 'specialist',
      displayName: 'Sam Specialist',
      role: 'SPECIALIST'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class MockCurrentUserStore {
  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isAuthenticated = signal(false);

  login(username: string, password: string): boolean {
    const entry = SEED_USERS[username.toLowerCase()];
    if (!entry || entry.password !== password) {
      return false;
    }
    this.currentUser.set({ ...entry.user });
    this.isAuthenticated.set(true);
    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  setRole(role: UserRole): void {
    const user = this.currentUser();
    if (user) {
      this.currentUser.set({ ...user, role });
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    const rolePermissions: Record<UserRole, string[]> = {
      ADMIN: ['*'],
      FRONT_DESK_OPERATOR: ['PATIENT_CREATE', 'PATIENT_VIEW', 'VOB_CREATE', 'VOB_VIEW'],
      SPECIALIST: ['VOB_VIEW', 'VOB_CLAIM', 'VOB_VERIFY']
    };
    const perms = rolePermissions[user.role];
    return perms.includes('*') || perms.includes(permission);
  }
}
