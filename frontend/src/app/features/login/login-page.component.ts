import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, ErrorBannerComponent],
  template: `
    <div class="login-page">
      <div class="login-card">
        <section class="login-card__form-panel">
          <div class="login-card__form-inner">
            <div class="login-card__brand">
              <span class="login-card__brand-icon">VB</span>
              <span>VOB Workbench</span>
            </div>

            <h1>Welcome back!</h1>
            <p class="login-card__subtitle">Enter your credentials to access your account</p>

            @if (error()) {
              <app-error-banner [message]="error()!" />
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
              <label class="login-form__field">
                <span>Email address</span>
                <input type="text" placeholder="Enter your email" formControlName="username" />
              </label>

              <label class="login-form__field">
                <span>Password</span>
                <input type="password" placeholder="Name" formControlName="password" />
                <button type="button" class="login-form__link">Forgot password?</button>
              </label>

              <label class="login-form__remember">
                <input type="checkbox" formControlName="remember" />
                Remember for 30 days
              </label>

              <button class="login-form__submit" type="submit" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Signing in...' : 'Login' }}
              </button>
            </form>

            <div class="login-card__divider"><span>Or</span></div>

            <div class="login-card__socials">
              <button type="button">
                <span class="login-card__google">G</span>
                Sign in with Google
              </button>
              <button type="button">
                <span class="login-card__apple">●</span>
                Sign in with Apple
              </button>
            </div>

            <p class="login-card__signup">
              Don't have an account?
              <button type="button">Sign Up</button>
            </p>

            <p class="login-card__hint">
              Dev users: admin/admin, frontdesk/frontdesk, specialist/specialist
            </p>
          </div>
        </section>

        <section class="login-card__image-panel" aria-label="Green tropical leaves"></section>
      </div>
    </div>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      padding: var(--space-2);
      background: #f4f4f2;
    }

    .login-card {
      display: grid;
      grid-template-columns: 1fr 1.04fr;
      min-height: calc(100vh - 16px);
      background: #fff;
      overflow: hidden;
    }

    .login-card__form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(32px, 7vw, 96px);
    }

    .login-card__form-inner {
      width: min(100%, 420px);
    }

    .login-card__brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      color: var(--color-text);
      font-weight: 700;
    }

    .login-card__brand-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: var(--color-primary);
      color: #fff;
      font-size: 12px;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.15;
      color: #08080d;
    }

    .login-card__subtitle {
      margin: var(--space-2) 0 var(--space-6);
      color: #252936;
      font-size: 14px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .login-form__field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      color: #12131a;
      font-size: 12px;
      font-weight: 600;
    }

    .login-form__field input {
      height: 34px;
      padding: 0 var(--space-3);
      border: 1px solid #d8dce3;
      border-radius: 9px;
      background: #fff;
      font: inherit;
      font-weight: 400;
      color: var(--color-text);
    }

    .login-form__field input::placeholder {
      color: #b9bec8;
    }

    .login-form__field input:focus {
      outline: none;
      border-color: #426c2a;
      box-shadow: 0 0 0 3px rgba(66, 108, 42, 0.12);
    }

    .login-form__link,
    .login-card__signup button {
      border: 0;
      background: transparent;
      color: #173be8;
      font: inherit;
      font-size: 11px;
      cursor: pointer;
    }

    .login-form__link {
      align-self: flex-end;
      padding: 2px 0 0;
    }

    .login-form__remember {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: #161922;
      font-size: 11px;
    }

    .login-form__remember input {
      width: 12px;
      height: 12px;
      accent-color: #426c2a;
    }

    .login-form__submit {
      height: 36px;
      border: 0;
      border-radius: 9px;
      background: #426c2a;
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .login-form__submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-card__divider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-6) 0;
      color: #1d2028;
      font-size: 10px;
    }

    .login-card__divider::before,
    .login-card__divider::after {
      content: '';
      height: 1px;
      flex: 1;
      background: #e2e5ea;
    }

    .login-card__socials {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    }

    .login-card__socials button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      height: 34px;
      border: 1px solid #d8dce3;
      border-radius: 9px;
      background: #fff;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }

    .login-card__google {
      color: #1a73e8;
      font-size: 18px;
      font-weight: 800;
    }

    .login-card__apple {
      color: #111;
      font-size: 16px;
    }

    .login-card__signup,
    .login-card__hint {
      margin: var(--space-4) 0 0;
      text-align: center;
      color: #11131a;
      font-size: 12px;
    }

    .login-card__hint {
      color: var(--color-text-muted);
      font-size: 11px;
    }

    .login-card__image-panel {
      margin: var(--space-2) var(--space-2) var(--space-2) 0;
      border-radius: 44px 0 0 44px;
      background: url('/login-leaves.svg') center / cover no-repeat;
      min-height: calc(100vh - 32px);
    }

    @media (max-width: 900px) {
      .login-card {
        grid-template-columns: 1fr;
      }

      .login-card__image-panel {
        display: none;
      }

      .login-card__form-panel {
        padding: var(--space-6) var(--space-4);
      }
    }
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
    password: ['', Validators.required],
    remember: [false]
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
