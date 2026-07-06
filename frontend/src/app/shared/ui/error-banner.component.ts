import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from './app-button.component';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#fecdd3] bg-[#fff1f3] px-4 py-3 text-sm text-[#d4183d]" role="alert">
      <span class="flex-1">{{ message }}</span>
      @if (showRetry) {
        <app-button variant="secondary" (click)="retry.emit()">Retry</app-button>
      }
    </div>
  `
})
export class ErrorBannerComponent {
  @Input({ required: true }) message!: string;
  @Input() showRetry = false;
  @Output() retry = new EventEmitter<void>();
}
