import { Component, inject } from '@angular/core';
import { ToastService } from '../api/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type" (click)="toastService.dismiss(toast.id)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-width: 360px;
    }

    .toast {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      cursor: pointer;
      border: 1px solid transparent;
    }

    .toast--success {
      background: var(--color-success-bg);
      color: var(--color-success);
      border-color: #b8dfc4;
    }

    .toast--error {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      border-color: #f5c6cb;
    }

    .toast--info {
      background: var(--color-surface);
      color: var(--color-text);
      border-color: var(--color-border);
    }
  `
})
export class ToastOutletComponent {
  readonly toastService = inject(ToastService);
}
