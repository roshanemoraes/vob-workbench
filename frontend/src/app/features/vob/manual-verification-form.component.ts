import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { ToastService } from '../../core/api/toast.service';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
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
        />

        @if (form.value.result === 'VERIFIED') {
          <app-select-input
            label="Coverage active"
            formControlName="coverageActive"
            [options]="boolOptions"
          />
          <app-select-input
            label="Network status"
            formControlName="networkStatus"
            [options]="networkOptions"
          />
          <app-money-input label="Copay" formControlName="copay" />
          <app-percent-input label="Coinsurance" formControlName="coinsurancePercent" />
          <app-money-input label="Deductible total" formControlName="deductibleTotal" />
          <app-money-input label="Deductible met" formControlName="deductibleMet" />
          <app-money-input label="Out-of-pocket max" formControlName="oopMax" />
          <app-money-input label="Out-of-pocket met" formControlName="oopMet" />
          <app-text-input label="Reference number" formControlName="referenceNumber" />
        }

        @if (form.value.result === 'FAILED_TO_VERIFY') {
          <app-text-input label="Failure reason" formControlName="failureReason" [required]="true" />
        }

        <app-text-input label="Notes" formControlName="notes" />
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
  private readonly vobStore = inject(MockVobStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  vobId = '';
  readonly saving = signal(false);

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
    result: ['VERIFIED', Validators.required],
    coverageActive: ['true'],
    networkStatus: ['IN_NETWORK'],
    copay: [null as number | null],
    coinsurancePercent: [null as number | null],
    deductibleTotal: [null as number | null],
    deductibleMet: [null as number | null],
    oopMax: [null as number | null],
    oopMet: [null as number | null],
    referenceNumber: [''],
    failureReason: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.vobId = this.route.snapshot.paramMap.get('id')!;
  }

  cancel(): void {
    this.router.navigate(['/app/vob', this.vobId]);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const userId = this.userStore.currentUser()?.id ?? 'unknown';

    this.vobStore
      .verifyVobManually(
        this.vobId,
        {
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
}
