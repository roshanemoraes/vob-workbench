import {
  AfterViewInit,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';

@Component({
  selector: 'app-date-picker-input',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="date-picker-control" [class.date-picker-control--disabled]="disabled">
      <input
        #dateInput
        class="date-picker-input"
        type="text"
        [attr.placeholder]="placeholder"
        [disabled]="disabled"
        (input)="onManualInput($event)"
        (blur)="onTouched()"
      />
      <button
        class="date-picker-button"
        type="button"
        aria-label="Open calendar"
        [disabled]="disabled"
        (click)="openPicker()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      </button>
    </div>
  `,
  styles: `
    .date-picker-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 44px;
      align-items: center;
      width: 100%;
      height: 48px;
      border: 1px solid transparent;
      border-radius: 10px;
      background: #f4f4f4;
      overflow: hidden;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .date-picker-control:focus-within {
      border-color: #40c7b5;
      background: #fbfff8;
      box-shadow: 0 0 0 3px rgba(64, 199, 181, 0.12);
    }

    .date-picker-control--disabled {
      color: #8b9499;
      cursor: not-allowed;
    }

    .date-picker-input {
      width: 100%;
      height: 100%;
      padding: 0 var(--space-4);
      border: 0;
      border-radius: 0;
      background: transparent;
      color: #273238;
      font: inherit;
      font-weight: 500;
    }

    .date-picker-input::placeholder {
      color: #8b9499;
      font-weight: 500;
    }

    .date-picker-input:focus {
      outline: none;
    }

    .date-picker-input:disabled {
      color: #8b9499;
      cursor: not-allowed;
    }

    .date-picker-button {
      display: grid;
      place-items: center;
      width: 44px;
      height: 100%;
      border: 0;
      border-left: 1px solid #dddfdf;
      background: transparent;
      color: #5d666b;
      cursor: pointer;
      transition: color 160ms ease, background 160ms ease;
    }

    .date-picker-button:hover:not(:disabled) {
      background: rgba(64, 199, 181, 0.08);
      color: #1f8e80;
    }

    .date-picker-button:disabled {
      color: #a9b0b4;
      cursor: not-allowed;
    }

    .date-picker-button svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .flatpickr-calendar {
      border: 1px solid #e3e7e8;
      border-radius: 14px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
      font-family: inherit;
      overflow: hidden;
    }

    .flatpickr-months {
      padding: 8px 8px 0;
    }

    .flatpickr-current-month {
      font-size: 15px;
      font-weight: 700;
    }

    .flatpickr-monthDropdown-months,
    .flatpickr-current-month input.cur-year {
      font-weight: 700;
      color: #273238;
    }

    .flatpickr-weekday {
      color: #6f7a80;
      font-size: 12px;
      font-weight: 700;
    }

    .flatpickr-day {
      border-radius: 8px;
      color: #273238;
      font-weight: 500;
    }

    .flatpickr-day:hover {
      border-color: #d7f2ee;
      background: #eafaf7;
    }

    .flatpickr-day.today {
      border-color: #40c7b5;
    }

    .flatpickr-day.selected,
    .flatpickr-day.startRange,
    .flatpickr-day.endRange {
      border-color: #30a999;
      background: #30a999;
      color: #fff;
    }
  `
})
export class DatePickerInputComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder = 'Select date';
  @Input() maxDate?: string;
  @Input() minDate?: string;

  @ViewChild('dateInput', { static: true }) private readonly dateInput!: ElementRef<HTMLInputElement>;

  disabled = false;
  private value = '';
  private picker?: Instance;
  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.picker = flatpickr(this.dateInput.nativeElement, {
      dateFormat: 'Y-m-d',
      allowInput: true,
      minDate: this.minDate,
      maxDate: this.maxDate,
      defaultDate: this.value || undefined,
      disableMobile: true,
      monthSelectorType: 'dropdown',
      position: 'below left',
      onChange: (_selectedDates, dateStr) => {
        this.updateValue(dateStr);
      },
      onClose: (_selectedDates, dateStr) => {
        this.updateValue(dateStr);
        this.onTouched();
      }
    });

    if (this.disabled) {
      this.setDisabledState(true);
    }
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }

  writeValue(value: string): void {
    this.value = value ?? '';
    if (this.picker) {
      this.picker.setDate(this.value, false);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    const input = this.dateInput?.nativeElement;
    if (input) {
      input.disabled = isDisabled;
    }
  }

  onManualInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateValue(input.value);
  }

  openPicker(): void {
    if (!this.disabled) {
      this.picker?.open();
    }
  }

  private updateValue(value: string): void {
    this.value = value;
    this.onChangeFn(value);
  }
}
