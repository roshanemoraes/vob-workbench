import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading" [class.loading--inline]="inline">
      <span class="loading__spinner" aria-hidden="true"></span>
      @if (message) {
        <span class="loading__message">{{ message }}</span>
      }
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-6);
      color: var(--color-text-muted);
    }

    .loading--inline {
      flex-direction: row;
      padding: var(--space-4);
    }

    .loading__spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .loading__message {
      font-size: 14px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
  @Input() inline = false;
}
