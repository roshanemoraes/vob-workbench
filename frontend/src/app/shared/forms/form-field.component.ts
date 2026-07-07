import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="form-field">
      <label class="form-field__label">
        {{ label }}
        @if (required) {
          <span class="form-field__required" aria-hidden="true">*</span>
        }
      </label>
      <ng-content></ng-content>
      @if (error) {
        <span class="form-field__error" role="alert">{{ error }}</span>
      } @else if (hint) {
        <span class="form-field__hint">{{ hint }}</span>
      }
    </div>
  `,
  styles: `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-field__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text);
    }

    .form-field__required {
      color: var(--color-danger);
      margin-left: 2px;
    }

    .form-field__hint {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .form-field__error {
      font-size: 12px;
      color: var(--color-danger);
    }
  `
})
export class FormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() required = false;
}
