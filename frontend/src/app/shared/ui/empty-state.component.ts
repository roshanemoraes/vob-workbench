import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from './app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="rounded-xl border border-dashed border-black/10 bg-[#fafafa] px-4 py-10 text-center text-[#717182]">
      <h3 class="mb-2 text-base font-medium text-[#030213]">{{ title }}</h3>
      <p class="mb-4 text-sm">{{ message }}</p>
      @if (actionLabel) {
        <app-button variant="primary" (click)="action.emit()">{{ actionLabel }}</app-button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
