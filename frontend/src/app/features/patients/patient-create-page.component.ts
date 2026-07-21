import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { PatientApiService } from '../../core/api/patient-api.service';
import { ToastService } from '../../core/api/toast.service';
import { Gender } from '../../core/models/patient.models';
import { DatePickerInputComponent } from '../../shared/forms/date-picker-input.component';

@Component({
  selector: 'app-patient-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePickerInputComponent
  ],
  template: `
    <section class="patient-create-page">
      <header class="page-header">
        <h1>Patient Intake Details</h1>
        <p>Provide essential patient demographics for benefit verification intake.</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="patient-create-panel">
        <section class="form-section">
          <div class="section-head">
            <span class="icon-circle icon-circle--teal" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h2>Patient Details</h2>
          </div>

          <div class="form-grid form-grid--2 form-grid--identity">
            <label class="field">
              <span>MRN</span>
              <input
                type="text"
                formControlName="mrn"
                placeholder="e.g. MRN-10004"
                maxlength="30"
                [class.input-invalid]="isInvalid('mrn')"
              />
              @if (errorFor('mrn')) {
                <small class="field-error">{{ errorFor('mrn') }}</small>
              }
            </label>

            <label class="field">
              <span>Date of birth</span>
              <app-date-picker-input
                formControlName="dateOfBirth"
                placeholder="Select date of birth"
                [maxDate]="today"
              />
              @if (errorFor('dateOfBirth')) {
                <small class="field-error">{{ errorFor('dateOfBirth') }}</small>
              }
            </label>
          </div>

          <div class="form-grid form-grid--2 form-grid--name">
            <label class="field">
              <span>First name</span>
              <input
                type="text"
                formControlName="firstName"
                placeholder="e.g. Maria"
                maxlength="60"
                [class.input-invalid]="isInvalid('firstName')"
              />
              @if (errorFor('firstName')) {
                <small class="field-error">{{ errorFor('firstName') }}</small>
              }
            </label>

            <label class="field">
              <span>Last name</span>
              <input
                type="text"
                formControlName="lastName"
                placeholder="e.g. Garcia"
                maxlength="60"
                [class.input-invalid]="isInvalid('lastName')"
              />
              @if (errorFor('lastName')) {
                <small class="field-error">{{ errorFor('lastName') }}</small>
              }
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-head">
            <span class="icon-circle icon-circle--blue" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.91.33 1.8.62 2.65a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6 6l1.24-1.24a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.65.62A2 2 0 0 1 22 16.92Z" />
              </svg>
            </span>
            <h2>Contact Information</h2>
          </div>

          <div class="form-grid form-grid--2 form-grid--contact">
            <label class="field">
              <span>Gender</span>
              <select formControlName="gender">
                <option value="" disabled>Select gender</option>
                @for (option of genderOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
              @if (errorFor('gender')) {
                <small class="field-error">{{ errorFor('gender') }}</small>
              }
            </label>

            <label class="field">
              <span>Phone number</span>
              <div class="phone-control">
                <div class="phone-control__prefix">
                  <img [src]="selectedCountryFlagSrc()" alt="" aria-hidden="true" />
                  <select class="phone-control__code" formControlName="phoneCountryCode" aria-label="Country code">
                    @for (option of countryCodeOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
                <input
                  class="phone-control__number"
                  type="tel"
                  formControlName="phone"
                  placeholder="555 0104"
                  inputmode="tel"
                  maxlength="20"
                />
              </div>
              @if (errorFor('phone')) {
                <small class="field-error">{{ errorFor('phone') }}</small>
              }
            </label>
          </div>
        </section>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Creating...' : 'Create Patient' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .patient-create-page {
      max-width: 900px;
      margin: 0;
      color: #1a1a18;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 6px;
      color: #1a1a18;
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0;
    }

    .page-header p {
      margin: 0;
      color: #8a8983;
      font-size: 13.5px;
      font-weight: 400;
    }

    .patient-create-panel {
      padding: 8px 28px 28px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 14px;
      background: #fff;
    }

    .form-section {
      padding: 24px 0;
    }

    .form-section + .form-section {
      border-top: 1px solid rgba(0, 0, 0, 0.09);
    }

    .section-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .section-head h2 {
      margin: 0;
      color: #1a1a18;
      font-size: 15px;
      font-weight: 400;
    }

    .icon-circle {
      display: flex;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .icon-circle svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .icon-circle--teal {
      background: #e1f5ee;
      color: #085041;
    }

    .icon-circle--blue {
      background: #e6f1fb;
      color: #0c447c;
    }

    .form-grid {
      display: grid;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-grid:last-child {
      margin-bottom: 0;
    }

    .form-grid--2 {
      grid-template-columns: 1fr 1fr;
    }

    .form-grid--identity {
      grid-template-columns: minmax(240px, 0.9fr) minmax(260px, 1.1fr);
    }

    .form-grid--name {
      grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.1fr);
    }

    .form-grid--contact {
      grid-template-columns: minmax(190px, 0.7fr) minmax(320px, 1.3fr);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: #5f5e5a;
      font-size: 12.5px;
      font-weight: 500;
    }

    .field input,
    .field select {
      width: 100%;
      min-height: 42px;
      padding: 10px 12px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 8px;
      background: #fff;
      color: #1a1a18;
      font: inherit;
      font-size: 13.5px;
      font-weight: 400;
    }

    .field select {
      padding-right: 36px;
      background-position: right 12px center;
    }

    .field input::placeholder {
      color: #8a8983;
    }

    .field input:focus,
    .field select:focus {
      outline: 2px solid #e4f5f0;
      border-color: #0f8a72;
    }

    .field input.input-invalid,
    .field select.input-invalid,
    .field:has(.field-error) .phone-control {
      border-color: #d93025;
    }

    .field-error {
      color: #b42318;
      font-size: 11.5px;
      font-weight: 400;
    }

    .phone-control {
      display: grid;
      grid-template-columns: 158px minmax(0, 1fr);
      align-items: center;
      min-height: 42px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 8px;
      background: #fff;
      overflow: hidden;
    }

    .phone-control:focus-within {
      outline: 2px solid #e4f5f0;
      border-color: #0f8a72;
    }

    .phone-control__prefix {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      align-items: center;
      height: 100%;
      padding-left: 12px;
      border-right: 1px solid rgba(0, 0, 0, 0.09);
    }

    .phone-control__prefix img {
      width: 24px;
      height: 18px;
      object-fit: cover;
      border-radius: 2px;
      box-shadow: 0 0 0 1px rgba(39, 50, 56, 0.08);
    }

    .field .phone-control__code,
    .field .phone-control__number {
      min-height: 40px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .field .phone-control__code {
      padding: 0 28px 0 8px;
      background-position: right 8px center;
      cursor: pointer;
    }

    .field .phone-control__number {
      padding-left: 12px;
    }

    .phone-control__code:focus,
    .phone-control__number:focus {
      outline: none;
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.09);
    }

    .btn-primary,
    .btn-secondary {
      min-height: 40px;
      border-radius: 8px;
      font: inherit;
      font-size: 13.5px;
      cursor: pointer;
    }

    .btn-primary {
      padding: 0 20px;
      border: 0;
      background: #1a1a18;
      color: #fff;
      font-weight: 600;
    }

    .btn-primary:hover {
      background: #000;
    }

    .btn-primary:disabled {
      background: #c8c7c1;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0 18px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      background: #fff;
      color: #1a1a18;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #f5f4f2;
    }

    @media (max-width: 760px) {
      .patient-create-page {
        max-width: none;
      }

      .patient-create-panel {
        padding: 4px 18px 22px;
      }

      .form-grid,
      .form-grid--2,
      .form-grid--identity,
      .form-grid--name,
      .form-grid--contact {
        grid-template-columns: 1fr;
      }

      .phone-control {
        grid-template-columns: 150px minmax(0, 1fr);
      }

      .form-actions {
        flex-direction: column-reverse;
      }
    }
  `
})
export class PatientCreatePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientStore = inject(PatientApiService);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'UNKNOWN', label: 'Unknown' }
  ];

  readonly countryCodeOptions = [
    { value: '+1', label: 'US +1', flagCode: 'us' },
    { value: '+94', label: 'LK +94', flagCode: 'lk' },
    { value: '+62', label: 'ID +62', flagCode: 'id' },
    { value: '+44', label: 'UK +44', flagCode: 'gb' },
    { value: '+91', label: 'IN +91', flagCode: 'in' }
  ];

  readonly form = this.fb.nonNullable.group({
    mrn: ['', [
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9-]{3,30}$/)
    ]],
    firstName: ['', [
      Validators.required,
      Validators.maxLength(60),
      Validators.pattern(/^[A-Za-z][A-Za-z .'-]*$/)
    ]],
    lastName: ['', [
      Validators.required,
      Validators.maxLength(60),
      Validators.pattern(/^[A-Za-z][A-Za-z .'-]*$/)
    ]],
    dateOfBirth: ['', [Validators.required, isoDateValidator(), dateBeforeTodayValidator()]],
    gender: ['' as Gender | '', Validators.required],
    phoneCountryCode: ['+1', Validators.required],
    phone: ['', [
      Validators.required,
      Validators.pattern(/^[0-9 ()-]{7,20}$/)
    ]]
  });

  cancel(): void {
    this.router.navigate(['/app/patients/list']);
  }

  selectedCountryFlagSrc(): string {
    const selectedCode = this.form.controls.phoneCountryCode.value;
    const selectedCountry = this.countryCodeOptions.find((option) => option.value === selectedCode);
    return `/assets/flags/${selectedCountry?.flagCode ?? 'us'}.svg`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const userId = this.userStore.currentUser()?.id ?? 'unknown';
    const { phoneCountryCode, ...patient } = this.form.getRawValue();
    const request: Parameters<PatientApiService['create']>[0] = {
      ...patient,
      gender: patient.gender as Gender,
      phone: `${phoneCountryCode} ${patient.phone}`.trim()
    };
    this.patientStore.create(request, userId).subscribe({
      next: (patient) => {
        this.toast.success('Patient created successfully.');
        this.router.navigate(['/app/patients', patient.publicId]);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  errorFor(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];
    if (!control || !this.isInvalid(controlName)) {
      return null;
    }
    if (control.hasError('required')) return 'Required';
    if (control.hasError('pattern')) return this.patternMessage(controlName);
    if (control.hasError('invalidDate')) return 'Use YYYY-MM-DD';
    if (control.hasError('notPastDate')) return 'Must be before today';
    return 'Invalid value';
  }

  private patternMessage(controlName: keyof typeof this.form.controls): string {
    if (controlName === 'mrn') return 'Use 3-30 letters, numbers, or hyphens';
    if (controlName === 'phone') return 'Use a valid phone number';
    return 'Use letters, spaces, apostrophes, periods, or hyphens';
  }
}

function isoDateValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return isValidIsoDate(value) ? null : { invalidDate: true };
  };
}

function dateBeforeTodayValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value || isoDateValidator()(control)) return null;
    const today = new Date().toISOString().slice(0, 10);
    return value < today ? null : { notPastDate: true };
  };
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
