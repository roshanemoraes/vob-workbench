import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from './app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="empty-state">
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__message">{{ message }}</p>
      @if (actionLabel) {
        <app-button variant="primary" (click)="action.emit()">{{ actionLabel }}</app-button>
      }
    </div>
  `,
  styles: `
    .empty-state {
      text-align: center;
      padding: var(--space-6) var(--space-4);
      color: var(--color-text-muted);
    }

    .empty-state__title {
      font-size: 16px;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .empty-state__message {
      margin: 0 0 var(--space-4);
      font-size: 14px;
    }
  `
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
