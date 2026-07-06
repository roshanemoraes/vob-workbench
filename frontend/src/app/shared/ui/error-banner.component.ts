import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from './app-button.component';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="error-banner" role="alert">
      <span class="error-banner__message">{{ message }}</span>
      @if (showRetry) {
        <app-button variant="secondary" (click)="retry.emit()">Retry</app-button>
      }
    </div>
  `,
  styles: `
    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-danger-bg);
      border: 1px solid #f5c6cb;
      border-radius: var(--radius-md);
      color: var(--color-danger);
      font-size: 14px;
      margin-bottom: var(--space-4);
    }

    .error-banner__message {
      flex: 1;
    }
  `
})
export class ErrorBannerComponent {
  @Input({ required: true }) message!: string;
  @Input() showRetry = false;
  @Output() retry = new EventEmitter<void>();
}
