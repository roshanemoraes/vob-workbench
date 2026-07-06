import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { FormFieldComponent } from '../../shared/forms/form-field.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, AppButtonComponent, ErrorBannerComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white p-4">
      <div class="w-full max-w-md rounded-xl border border-black/10 bg-white p-6">
        <div class="mb-6 flex flex-col items-center text-center">
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#030213] text-sm font-medium text-white">VB</div>
          <h1 class="text-2xl font-medium text-[#030213]">VOB Workbench</h1>
          <p class="mt-1 text-sm text-[#717182]">Sign in to continue</p>
        </div>

        @if (error()) {
          <app-error-banner [message]="error()!" />
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-col gap-4">
            <app-form-field label="Username" [required]="true">
              <input class="h-10 w-full rounded-md border border-black/10 bg-[#f3f3f5] px-3 text-sm outline-none focus:border-[#030213]/40 focus:ring-3 focus:ring-[#030213]/10" type="text" formControlName="username" />
            </app-form-field>
            <app-form-field label="Password" [required]="true">
              <input class="h-10 w-full rounded-md border border-black/10 bg-[#f3f3f5] px-3 text-sm outline-none focus:border-[#030213]/40 focus:ring-3 focus:ring-[#030213]/10" type="password" formControlName="password" />
            </app-form-field>
            <app-button
              type="submit"
              variant="primary"
              [loading]="loading()"
              [disabled]="form.invalid"
            >
              Sign in
            </app-button>
          </div>
        </form>

        <p class="mt-4 text-center text-xs text-[#717182]">
          Dev users: admin/admin, frontdesk/frontdesk, specialist/specialist
        </p>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    const success = this.userStore.login(username, password);
    this.loading.set(false);
    if (success) {
      this.router.navigate(['/app/dashboard']);
    } else {
      this.error.set('Invalid username or password.');
    }
  }
}
