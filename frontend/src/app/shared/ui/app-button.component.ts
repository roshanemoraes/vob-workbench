import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      class="btn"
      [class.btn--primary]="variant === 'primary'"
      [class.btn--secondary]="variant === 'secondary'"
      [class.btn--ghost]="variant === 'ghost'"
      [class.btn--danger]="variant === 'danger'"
      [disabled]="disabled || loading"
    >
      @if (loading) {
        <span class="btn__spinner" aria-hidden="true"></span>
      }
      <span class="btn__label"><ng-content></ng-content></span>
    </button>
  `,
  styles: `
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-width: 88px;
      min-height: 36px;
      padding: 0 var(--space-4);
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, opacity 0.15s;
      white-space: nowrap;

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }

    .btn--primary {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);

      &:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }
    }

    .btn--secondary {
      background: var(--color-surface);
      color: var(--color-text);
      border-color: var(--color-border);

      &:hover:not(:disabled) {
        background: var(--color-bg);
      }
    }

    .btn--ghost {
      background: transparent;
      color: var(--color-text-muted);
      border-color: transparent;

      &:hover:not(:disabled) {
        background: var(--color-bg);
        color: var(--color-text);
      }
    }

    .btn--danger {
      background: var(--color-danger);
      color: #fff;
      border-color: var(--color-danger);
    }

    .btn__spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .btn__label {
      display: inline-flex;
      align-items: center;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class AppButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
}
