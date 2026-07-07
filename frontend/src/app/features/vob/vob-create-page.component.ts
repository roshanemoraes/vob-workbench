import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { ToastService } from '../../core/api/toast.service';
import { Patient } from '../../core/models/patient.models';
import { CreateVobRequest, RelationshipToSubscriber, VobPriority } from '../../core/models/vob.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { DatePickerInputComponent } from '../../shared/forms/date-picker-input.component';

@Component({
  selector: 'app-vob-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LoadingStateComponent,
    DatePickerInputComponent
  ],
  template: `
    <section class="vob-create-page">
      <header class="page-header">
        <h1>VOB Request Details</h1>
        <p>Select a registered patient and provide insurance details for benefits verification</p>
      </header>

      @if (loadingPatients()) {
        <app-loading-state />
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="vob-create-panel">
          <section class="form-section">
            <div class="section-head">
              <span class="icon-circle icon-circle--teal" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                </svg>
              </span>
              <h2>Patient Selection</h2>
            </div>

            <div class="form-grid form-grid--patient-search">
              <label class="field">
                <span>Search patient</span>
                <div class="patient-lookup">
                  <div class="search-box">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                    </svg>
                    <input
                      type="search"
                      placeholder="Search by name or MRN"
                      [(ngModel)]="patientSearchTerm"
                      [ngModelOptions]="{ standalone: true }"
                      (ngModelChange)="searchPatients()"
                    />
                  </div>

                  @if (searchingPatients()) {
                    <div class="patient-lookup__message">Searching patients...</div>
                  } @else if (patientSearchTerm.trim().length > 0 && patientSearchTerm.trim().length < 2) {
                    <div class="patient-lookup__message">Enter at least 2 characters</div>
                  } @else if (patientSearchResults().length > 0) {
                    <div class="patient-lookup__results">
                      @for (patient of patientSearchResults(); track patient.id) {
                        <button type="button" (click)="selectPatient(patient)">
                          <strong>{{ patient.lastName }}, {{ patient.firstName }}</strong>
                          <small>{{ patient.mrn }} - DOB {{ patient.dateOfBirth }}</small>
                        </button>
                      }
                    </div>
                  } @else if (patientSearchTerm.trim().length >= 2 && !selectedPatient()) {
                    <div class="patient-lookup__message">No matching patient found</div>
                  }
                </div>
              </label>
            </div>
          </section>

          @if (selectedPatient(); as patient) {
            <section class="form-section">
              <div class="section-head">
                <span class="icon-circle icon-circle--teal" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <h2>Registered Patient</h2>
              </div>

              <div class="patient-card">
                <div class="patient-card-head">
                  <div>
                    <div class="patient-name">{{ patient.lastName }}, {{ patient.firstName }}</div>
                    <div class="patient-mrn">{{ patient.mrn }}</div>
                  </div>
                  <button type="button" class="btn-change" (click)="clearSelectedPatient()">Change</button>
                </div>
                <dl class="patient-meta">
                  <div>
                    <dt class="meta-label">Date of birth</dt>
                    <dd class="meta-value">{{ patient.dateOfBirth }}</dd>
                  </div>
                  <div>
                    <dt class="meta-label">Gender</dt>
                    <dd><span class="gender-badge">{{ formatGender(patient.gender) }}</span></dd>
                  </div>
                  <div>
                    <dt class="meta-label">Phone</dt>
                    <dd class="meta-value">{{ patient.phone }}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section class="form-section" formGroupName="insurance">
              <div class="section-head">
                <span class="icon-circle icon-circle--blue" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-5" />
                  </svg>
                </span>
                <h2>Insurance Policy</h2>
              </div>

              <div class="form-grid form-grid--2">
                <label class="field">
                  <span>Payer name</span>
                  <input type="text" formControlName="payerName" placeholder="e.g. Aetna" />
                </label>

                <label class="field">
                  <span>Member ID</span>
                  <input type="text" formControlName="memberId" placeholder="e.g. MBR-284910" />
                </label>
              </div>

              <div class="form-grid form-grid--3">
                <label class="field">
                  <span>Group number</span>
                  <input type="text" formControlName="groupNumber" placeholder="e.g. GRP-2026" />
                </label>

                <label class="field">
                  <span>Plan type</span>
                  <input type="text" formControlName="planType" placeholder="e.g. PPO" />
                </label>

                <label class="field">
                  <span>Relationship</span>
                  <select formControlName="relationshipToSubscriber">
                    @for (option of relationshipOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </label>
              </div>

              <div class="form-grid form-grid--2">
                <label class="field">
                  <span>Coverage start</span>
                  <app-date-picker-input formControlName="coverageStart" placeholder="Select start date" />
                </label>

                <label class="field">
                  <span>Coverage end</span>
                  <app-date-picker-input formControlName="coverageEnd" placeholder="Select end date" />
                </label>
              </div>
            </section>

            <section class="form-section">
              <div class="section-head">
                <span class="icon-circle icon-circle--blue" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 2v4M16 2v4M3 10h18" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                  </svg>
                </span>
                <h2>Service Details</h2>
              </div>

              <div class="form-grid form-grid--2">
                <label class="field">
                  <span>Date of service</span>
                  <app-date-picker-input formControlName="dateOfService" placeholder="Select service date" />
                </label>

                <label class="field">
                  <span>Priority</span>
                  <select formControlName="priority">
                    @for (option of priorityOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </label>
              </div>
            </section>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Creating...' : 'Create VOB' }}
              </button>
            </div>
          }
        </form>
      }
    </section>
  `,
  styles: `
    .vob-create-page {
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
      font-weight: 700;
      letter-spacing: 0;
    }

    .page-header p {
      margin: 0;
      color: #8a8983;
      font-size: 13.5px;
      font-weight: 500;
    }

    .vob-create-panel {
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
      font-weight: 600;
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

    .icon-circle svg,
    .search-box svg {
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

    .form-grid--patient-search {
      max-width: 560px;
    }

    .form-grid--2 {
      grid-template-columns: 1fr 1fr;
    }

    .form-grid--3 {
      grid-template-columns: 1fr 1fr 1fr;
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
      font-weight: 500;
    }

    .field input::placeholder {
      color: #8a8983;
    }

    .field input:focus,
    .field select:focus {
      outline: 2px solid #e4f5f0;
      border-color: #0f8a72;
    }

    .patient-lookup {
      position: relative;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 12px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 8px;
      background: #fff;
      color: #8a8983;
    }

    .search-box input {
      min-height: 40px;
      padding: 0;
      border: 0;
      border-radius: 0;
    }

    .search-box:focus-within {
      outline: 2px solid #e4f5f0;
      border-color: #0f8a72;
    }

    .search-box input:focus {
      outline: none;
    }

    .patient-lookup__message,
    .patient-lookup__results {
      position: absolute;
      z-index: 20;
      top: calc(100% + 8px);
      left: 0;
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
    }

    .patient-lookup__message {
      padding: 12px;
      color: #8a8983;
      font-size: 13px;
      font-weight: 500;
    }

    .patient-lookup__results {
      display: grid;
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }

    .patient-lookup__results button {
      display: grid;
      gap: 2px;
      width: 100%;
      padding: 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #1a1a18;
      text-align: left;
      cursor: pointer;
    }

    .patient-lookup__results button:hover {
      background: #e4f5f0;
    }

    .patient-lookup__results strong {
      font-size: 14px;
      font-weight: 700;
    }

    .patient-lookup__results small {
      color: #5f5e5a;
      font-size: 12px;
      font-weight: 500;
    }

    .patient-card {
      padding: 16px 18px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 10px;
      background: #f7f7f5;
    }

    .patient-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }

    .patient-name {
      color: #1a1a18;
      font-size: 15px;
      font-weight: 600;
    }

    .patient-mrn {
      margin-top: 2px;
      color: #8a8983;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12.5px;
      letter-spacing: 0;
    }

    .btn-change {
      padding: 6px 14px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 7px;
      background: #fff;
      color: #1a1a18;
      font: inherit;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-change:hover {
      background: #f0efec;
    }

    .patient-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 0;
    }

    .patient-meta dd {
      margin: 0;
    }

    .meta-label {
      margin-bottom: 4px;
      color: #8a8983;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .meta-value {
      color: #1a1a18;
      font-size: 13.5px;
      font-weight: 500;
    }

    .gender-badge {
      display: inline-block;
      padding: 3px 9px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 6px;
      color: #5f5e5a;
      font-size: 11.5px;
      font-weight: 600;
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

    @media (max-width: 860px) {
      .vob-create-page {
        max-width: none;
      }

      .vob-create-panel {
        padding: 4px 18px 22px;
      }

      .form-grid,
      .form-grid--2,
      .form-grid--3 {
        grid-template-columns: 1fr;
      }

      .patient-meta {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }
    }
  `
})
export class VobCreatePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientStore = inject(MockPatientStore);
  private readonly vobStore = inject(MockVobStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly loadingPatients = signal(true);
  readonly saving = signal(false);
  readonly searchingPatients = signal(false);
  readonly patientSearchResults = signal<Patient[]>([]);
  readonly selectedPatient = signal<Patient | null>(null);
  patientSearchTerm = '';
  private patientSearchRequestId = 0;

  readonly relationshipOptions = [
    { value: 'SELF', label: 'Self' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'CHILD', label: 'Child' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly priorityOptions = [
    { value: 'ROUTINE', label: 'Routine' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    insurance: this.fb.nonNullable.group({
      payerName: ['', Validators.required],
      memberId: ['', Validators.required],
      groupNumber: ['', Validators.required],
      planType: ['', Validators.required],
      relationshipToSubscriber: ['SELF', Validators.required],
      coverageStart: ['', Validators.required],
      coverageEnd: ['', Validators.required]
    }),
    dateOfService: ['', Validators.required],
    priority: ['ROUTINE', Validators.required]
  });

  ngOnInit(): void {
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (!patientId) {
      this.loadingPatients.set(false);
      return;
    }

    this.patientStore.getById(patientId).subscribe((patient) => {
      if (patient) {
        this.selectPatient(patient, false);
      }
      this.loadingPatients.set(false);
    });
  }

  searchPatients(): void {
    const term = this.patientSearchTerm.trim().toLowerCase();
    this.patientSearchRequestId += 1;
    const requestId = this.patientSearchRequestId;
    const selected = this.selectedPatient();

    if (selected && term) {
      this.selectedPatient.set(null);
      this.form.patchValue({ patientId: '' });
    }

    if (term.length < 2) {
      this.patientSearchResults.set([]);
      this.searchingPatients.set(false);
      if (!term) {
        this.selectedPatient.set(null);
        this.form.patchValue({ patientId: '' });
      }
      return;
    }

    this.searchingPatients.set(true);
    this.patientStore.list({ search: term }).subscribe((page) => {
      if (requestId !== this.patientSearchRequestId) {
        return;
      }

      this.patientSearchResults.set(page.items);
      this.searchingPatients.set(false);

      if (page.items.length === 1) {
        this.selectPatient(page.items[0]);
      }
    });
  }

  selectPatient(patient: Patient, clearResults = true): void {
    this.selectedPatient.set(patient);
    this.form.patchValue({ patientId: patient.id });
    this.patientSearchTerm = '';
    if (clearResults) {
      this.patientSearchResults.set([]);
    }
  }

  clearSelectedPatient(): void {
    this.selectedPatient.set(null);
    this.patientSearchResults.set([]);
    this.patientSearchTerm = '';
    this.form.patchValue({ patientId: '' });
  }

  cancel(): void {
    this.router.navigate(['/app/vob/list']);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const userId = this.userStore.currentUser()?.id ?? 'unknown';
    const { patientId, insurance, dateOfService, priority } = this.form.getRawValue();
    const request: CreateVobRequest = {
      patientId,
      insurance: {
        ...insurance,
        relationshipToSubscriber: insurance.relationshipToSubscriber as RelationshipToSubscriber
      },
      dateOfService,
      priority: priority as VobPriority
    };
    this.vobStore.create(request, userId)
      .subscribe({
        next: () => {
          this.toast.success('VOB created successfully.');
          this.router.navigate(['/app/vob/list'], { queryParams: { status: 'QUEUED' } });
        },
        error: () => this.saving.set(false),
        complete: () => this.saving.set(false)
      });
  }

  formatGender(gender: Patient['gender']): string {
    return gender
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
