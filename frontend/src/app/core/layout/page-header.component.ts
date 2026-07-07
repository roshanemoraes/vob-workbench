import { Component, Input } from '@angular/core';
import { AppButtonComponent } from '../../shared/ui/app-button.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <header class="mb-6 flex items-start justify-between gap-4 max-sm:flex-col">
      <div>
        <h1 class="text-2xl font-medium leading-tight text-[#030213]">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-sm text-[#717182]">{{ subtitle }}</p>
        }
      </div>
      @if (actionLabel) {
        <app-button variant="primary" (click)="onAction()">{{ actionLabel }}</app-button>
      }
    </header>
  `
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() actionLabel?: string;
  @Input() action?: () => void;

  onAction(): void {
    this.action?.();
  }
}
