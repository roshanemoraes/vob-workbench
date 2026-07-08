import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MockCurrentUserStore } from '../auth/mock-current-user.store';
import { SidebarNavigationComponent } from '../navigation/sidebar-navigation.component';
import { ToastOutletComponent } from './toast-outlet.component';
import { TopBarComponent } from './top-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarNavigationComponent, TopBarComponent, ToastOutletComponent],
  template: `
    <div class="flex h-screen flex-col overflow-hidden bg-white text-[#030213]">
      <app-top-bar />
      <div class="flex min-h-0 flex-1 items-stretch overflow-hidden max-md:flex-col">
        <app-sidebar-navigation />
        <main class="min-w-0 flex-1 overflow-auto bg-[#f7f7f5] p-6 max-md:p-3">
          <router-outlet />
        </main>
      </div>
      <app-toast-outlet />
    </div>
  `
})
export class AppShellComponent implements OnInit {
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.userStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userStore.loadCurrentUser().subscribe((authenticated) => {
      if (!authenticated) {
        this.router.navigate(['/login']);
      }
    });
  }
}
