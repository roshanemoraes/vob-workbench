import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldComponent } from './form-field.component';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormsModule, FormFieldComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true
    }
  ],
  template: `
    <app-form-field [label]="label" [error]="error" [hint]="hint" [required]="required">
      <select
        class="select"
        [disabled]="disabled"
        [(ngModel)]="value"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
      >
        @if (placeholder) {
          <option value="" disabled>{{ placeholder }}</option>
        }
        @for (opt of options; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
    </app-form-field>
  `,
  styles: `
    .select {
      width: 100%;
      height: 40px;
      padding: 0 var(--space-3);
      font-size: 14px;
      font-family: inherit;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-input-bg);
      color: var(--color-text);

      &:focus {
        outline: none;
        border-color: rgba(3, 2, 19, 0.4);
        box-shadow: 0 0 0 3px rgba(3, 2, 19, 0.08);
      }

      &:disabled {
        background: var(--color-bg);
        cursor: not-allowed;
      }
    }
  `
})
export class SelectInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) options!: SelectOption[];
  @Input() error?: string;
  @Input() hint?: string;
  @Input() required = false;
  @Input() placeholder = '';

  value = '';
  disabled = false;

  private onChangeFn: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(value: string): void {
    this.onChangeFn(value);
  }
}
