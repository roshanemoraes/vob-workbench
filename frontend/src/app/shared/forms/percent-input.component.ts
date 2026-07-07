import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldComponent } from './form-field.component';

@Component({
  selector: 'app-percent-input',
  standalone: true,
  imports: [FormsModule, FormFieldComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PercentInputComponent),
      multi: true
    }
  ],
  template: `
    <app-form-field [label]="label" [error]="error" [hint]="hint" [required]="required">
      <div class="percent-input">
        <input
          class="input"
          type="number"
          step="1"
          min="0"
          max="100"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [ngModel]="displayValue"
          (ngModelChange)="onInputChange($event)"
          (blur)="onTouched()"
        />
        <span class="percent-input__suffix">%</span>
      </div>
    </app-form-field>
  `,
  styles: `
    .percent-input {
      display: flex;
      align-items: center;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-input-bg);
      overflow: hidden;

      &:focus-within {
        border-color: rgba(3, 2, 19, 0.4);
        box-shadow: 0 0 0 3px rgba(3, 2, 19, 0.08);
      }
    }

    .input {
      flex: 1;
      height: 40px;
      padding: 0 var(--space-3);
      font-size: 14px;
      font-family: inherit;
      border: none;
      background: transparent;
      color: var(--color-text);

      &:focus {
        outline: none;
      }
    }

    .percent-input__suffix {
      padding: 0 var(--space-3);
      color: var(--color-text-muted);
      font-size: 14px;
    }
  `
})
export class PercentInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label!: string;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() required = false;
  @Input() placeholder = '0';

  displayValue: number | null = null;
  disabled = false;

  private onChangeFn: (v: number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.displayValue = value;
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(value: number | null): void {
    this.displayValue = value;
    this.onChangeFn(value);
  }
}
