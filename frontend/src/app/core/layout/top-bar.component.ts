import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../auth/mock-current-user.store';
import { UserRole } from '../models/auth.models';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `
    <header class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-black/10 bg-white px-6 max-md:h-auto max-md:flex-wrap max-md:px-3 max-md:py-2">
      <div class="flex items-center gap-3 whitespace-nowrap">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#030213] text-sm font-medium text-white">
          VB
        </div>
        <div>
          <div class="font-medium text-[#030213]">VOB Workbench</div>
          <div class="text-xs text-[#717182]">Benefits verification</div>
        </div>
      </div>
      <div class="max-w-sm flex-1 max-md:order-3 max-md:basis-full max-md:max-w-none">
        <input type="search" placeholder="Search..." disabled class="h-9 w-full rounded-md border border-black/10 bg-[#f3f3f5] px-3 text-sm text-[#717182]" />
      </div>
      <div class="ml-auto flex items-center gap-3 max-md:gap-2">
        <select
          class="h-9 rounded-md border border-black/10 bg-[#f3f3f5] px-2 text-xs text-[#717182]"
          [value]="userStore.currentUser()?.role"
          (change)="onRoleChange($event)"
          title="Dev role selector"
        >
          <option value="ADMIN">Admin</option>
          <option value="FRONT_DESK_OPERATOR">Front Desk</option>
          <option value="SPECIALIST">Specialist</option>
        </select>
        <div class="relative">
          <button type="button" class="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm transition-colors hover:bg-[#e9ebef]" (click)="menuOpen.set(!menuOpen())">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#ececf0] text-xs text-[#030213]">U</span>
            <span class="max-sm:hidden">{{ userStore.currentUser()?.displayName ?? 'User' }}</span>
            <span class="text-xs text-[#717182] max-sm:hidden">({{ roleLabel }})</span>
          </button>
          @if (menuOpen()) {
            <div class="absolute right-0 top-[calc(100%+4px)] z-50 min-w-36 rounded-md border border-black/10 bg-white shadow-md">
              <button type="button" class="block w-full px-3 py-2 text-left text-sm text-[#717182]" disabled>Profile</button>
              <button type="button" class="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#e9ebef]" (click)="logout()">Logout</button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class TopBarComponent {
  readonly userStore = inject(MockCurrentUserStore);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  get roleLabel(): string {
    const role = this.userStore.currentUser()?.role;
    const labels: Record<UserRole, string> = {
      ADMIN: 'Admin',
      FRONT_DESK_OPERATOR: 'Front Desk',
      SPECIALIST: 'Specialist'
    };
    return role ? labels[role] : '';
  }

  onRoleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as UserRole;
    this.userStore.setRole(value);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.userStore.logout();
    this.router.navigate(['/login']);
  }
}
