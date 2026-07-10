import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../auth/mock-current-user.store';
import { UserRole } from '../models/auth.models';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `
    <header class="sticky top-0 z-20 flex h-12 items-center border-b border-black/10 bg-white px-6 max-md:px-3">
      <div class="ml-auto flex items-center gap-3 max-md:gap-2">
        <div class="relative">
          <button type="button" class="flex h-8 items-center gap-2 rounded-md border border-transparent bg-white px-3 text-sm transition-colors hover:bg-[#e9ebef] focus:outline-none focus:ring-0" (click)="menuOpen.set(!menuOpen())">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#ececf0] text-xs text-[#030213]">{{ userInitial }}</span>
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

  get userInitial(): string {
    return this.userStore.currentUser()?.displayName.slice(0, 1).toUpperCase() ?? 'U';
  }

  logout(): void {
    this.menuOpen.set(false);
    this.userStore.logout();
    this.router.navigate(['/login']);
  }
}
