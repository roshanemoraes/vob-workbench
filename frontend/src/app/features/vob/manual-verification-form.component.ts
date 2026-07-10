import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { VobApiService } from '../../core/api/vob-api.service';
import { ToastService } from '../../core/api/toast.service';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { Vob } from '../../core/models/vob.models';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { DateInputComponent } from '../../shared/forms/date-input.component';
import { MoneyInputComponent } from '../../shared/forms/money-input.component';
import { PercentInputComponent } from '../../shared/forms/percent-input.component';
import { SelectInputComponent } from '../../shared/forms/select-input.component';
import { TextInputComponent } from '../../shared/forms/text-input.component';

@Component({
  selector: 'app-manual-verification-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    SelectInputComponent,
    TextInputComponent,
    MoneyInputComponent,
    PercentInputComponent,
    AppButtonComponent
  ],
  template: `
    <app-page-header title="Manual Verification" [subtitle]="'VOB: ' + vobId" />

    <form [formGroup]="form" (ngSubmit)="submit()" class="panel">
      <div class="form-grid">
          <app-select-input
            label="Result"
            formControlName="result"
            [options]="resultOptions"
            [required]="true"
            [error]="errorFor('result')"
          />

        @if (form.value.result === 'VERIFIED') {
          <app-select-input
            label="Coverage active"
            formControlName="coverageActive"
            [options]="boolOptions"
            [error]="errorFor('coverageActive')"
          />
          <app-select-input
            label="Network status"
            formControlName="networkStatus"
            [options]="networkOptions"
            [error]="errorFor('networkStatus')"
          />
          <app-money-input label="Copay" formControlName="copay" [error]="errorFor('copay')" />
          <app-percent-input label="Coinsurance" formControlName="coinsurancePercent" [error]="errorFor('coinsurancePercent')" />
          <app-money-input label="Deductible total" formControlName="deductibleTotal" [error]="errorFor('deductibleTotal')" />
          <app-money-input label="Deductible met" formControlName="deductibleMet" [error]="errorFor('deductibleMet')" />
          <app-money-input label="Out-of-pocket max" formControlName="oopMax" [error]="errorFor('oopMax')" />
          <app-money-input label="Out-of-pocket met" formControlName="oopMet" [error]="errorFor('oopMet')" />
          <app-text-input label="Reference number" formControlName="referenceNumber" [error]="errorFor('referenceNumber')" />
        }

        @if (form.value.result === 'FAILED_TO_VERIFY') {
          <app-text-input label="Failure reason" formControlName="failureReason" [required]="true" [error]="errorFor('failureReason')" />
        }

        <app-text-input label="Notes" formControlName="notes" [error]="errorFor('notes')" />
      </div>

      <div class="form-actions">
        <app-button variant="secondary" type="button" (click)="cancel()">Cancel</app-button>
        <app-button type="submit" variant="primary" [loading]="saving()" [disabled]="form.invalid">
          Save Result
        </app-button>
      </div>
    </form>
  `
})
export class ManualVerificationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vobStore = inject(VobApiService);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  vobId = '';
  readonly saving = signal(false);
  readonly vob = signal<Vob | null>(null);

  readonly resultOptions = [
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'FAILED_TO_VERIFY', label: 'Failed to verify' }
  ];

  readonly boolOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ];

  readonly networkOptions = [
    { value: 'IN_NETWORK', label: 'In network' },
    { value: 'OUT_OF_NETWORK', label: 'Out of network' },
    { value: 'UNKNOWN', label: 'Unknown' }
  ];

  readonly form = this.fb.nonNullable.group({
    result: ['VERIFIED', [
      Validators.required,
      oneOfValidator(this.resultOptions.map((option) => option.value))
    ]],
    coverageActive: ['true', oneOfValidator(this.boolOptions.map((option) => option.value))],
    networkStatus: ['IN_NETWORK', oneOfValidator(this.networkOptions.map((option) => option.value))],
    copay: [null as number | null, [Validators.min(0)]],
    coinsurancePercent: [null as number | null, [Validators.min(0), Validators.max(100)]],
    deductibleTotal: [null as number | null, [Validators.min(0)]],
    deductibleMet: [null as number | null, [Validators.min(0)]],
    oopMax: [null as number | null, [Validators.min(0)]],
    oopMet: [null as number | null, [Validators.min(0)]],
    referenceNumber: ['', [Validators.maxLength(60), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
    failureReason: ['', [Validators.maxLength(240)]],
    notes: ['', [Validators.maxLength(500)]]
  }, { validators: manualVerificationRuleValidator() });

  ngOnInit(): void {
    this.vobId = this.route.snapshot.paramMap.get('id')!;
    this.vobStore.getById(this.vobId).subscribe({
      next: (vob) => {
        if (!vob) {
          this.toast.error('VOB not found.');
          this.router.navigate(['/app/vob/list']);
          return;
        }
        this.vob.set(vob);
      },
      error: () => {
        this.toast.error('Failed to load VOB.');
        this.router.navigate(['/app/vob/list']);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/app/vob', this.vobId]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vob = this.vob();
    if (!vob) {
      this.toast.error('VOB is still loading. Please try again.');
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const userId = this.userStore.currentUser()?.id ?? 'unknown';

    this.vobStore
      .verifyVobManually(
        this.vobId,
        {
          version: vob.version,
          result: raw.result as 'VERIFIED' | 'FAILED_TO_VERIFY',
          coverageActive: raw.coverageActive === 'true' ? true : raw.coverageActive === 'false' ? false : null,
          networkStatus: raw.networkStatus as 'IN_NETWORK' | 'OUT_OF_NETWORK' | 'UNKNOWN',
          copay: raw.copay,
          coinsurancePercent: raw.coinsurancePercent,
          deductibleTotal: raw.deductibleTotal,
          deductibleMet: raw.deductibleMet,
          oopMax: raw.oopMax,
          oopMet: raw.oopMet,
          referenceNumber: raw.referenceNumber || null,
          failureReason: raw.failureReason || null,
          notes: raw.notes || null
        },
        userId
      )
      .subscribe({
        next: () => {
          this.toast.success('Manual verification saved.');
          this.router.navigate(['/app/vob', this.vobId]);
        },
        error: () => this.saving.set(false),
        complete: () => this.saving.set(false)
      });
  }

  errorFor(controlName: keyof typeof this.form.controls): string | undefined {
    const control = this.form.controls[controlName];
    if (!control || !(control.touched || control.dirty)) {
      return undefined;
    }
    if (control.hasError('required')) return 'Required';
    if (control.hasError('min')) return 'Must be 0 or greater';
    if (control.hasError('max')) return 'Must be 100 or less';
    if (control.hasError('maxlength')) return 'Too long';
    if (control.hasError('pattern')) return 'Use letters, numbers, or hyphens';
    if (control.hasError('notAllowed')) return 'Choose a valid option';
    if (controlName === 'failureReason' && this.form.hasError('failureReasonRequired')) return 'Required';
    return undefined;
  }
}

function oneOfValidator(allowedValues: string[]): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return allowedValues.includes(value) ? null : { notAllowed: true };
  };
}

function manualVerificationRuleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = control.get('result')?.value;
    const failureReason = String(control.get('failureReason')?.value ?? '').trim();
    return result === 'FAILED_TO_VERIFY' && !failureReason
      ? { failureReasonRequired: true }
      : null;
  };
}
