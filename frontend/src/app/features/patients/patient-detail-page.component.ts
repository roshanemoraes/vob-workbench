import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientApiService } from '../../core/api/patient-api.service';
import { VobApiService } from '../../core/api/vob-api.service';
import { Patient } from '../../core/models/patient.models';
import { Vob } from '../../core/models/vob.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { VobTableComponent } from '../vob/vob-table.component';

type PatientDetailTab = 'GENERAL' | 'VOB_HISTORY' | 'INFO';

@Component({
  selector: 'app-patient-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    LoadingStateComponent,
    StatusBadgeComponent,
    VobTableComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-state />
    } @else if (patient()) {
      <section class="patient-detail-shell">
        <button type="button" class="back-link" (click)="back()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Go back to patient list
        </button>

        <header class="patient-hero">
          <div class="patient-hero-left">
            <div class="patient-avatar" aria-hidden="true">
              {{ patientInitials() }}
            </div>
            <div class="patient-title-block">
              <h1>{{ patient()!.lastName }}, {{ patient()!.firstName }}</h1>
              <div class="patient-pills">
                <span class="badge badge--mrn">{{ patient()!.mrn }}</span>
                <span class="badge badge--gender">{{ formatGender(patient()!.gender) }}</span>
              </div>
            </div>
          </div>

          <button type="button" class="primary-action" (click)="createVob()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create VOB
          </button>
        </header>

        <nav class="tabs" aria-label="Patient detail sections">
          <button
            type="button"
            [class.tabs__button--active]="activeTab() === 'GENERAL'"
            (click)="activeTab.set('GENERAL')"
          >
            General
          </button>
          <button
            type="button"
            [class.tabs__button--active]="activeTab() === 'VOB_HISTORY'"
            (click)="activeTab.set('VOB_HISTORY')"
          >
            VOB History
          </button>
          <button
            type="button"
            [class.tabs__button--active]="activeTab() === 'INFO'"
            (click)="activeTab.set('INFO')"
          >
            Info
          </button>
        </nav>

        <section class="tab-panel">
          @switch (activeTab()) {
            @case ('GENERAL') {
              <div class="detail-grid">
                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--teal" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      <h2>Patient Detail</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div class="row row--single">
                      <dd class="value value--name">{{ patient()!.lastName }}, {{ patient()!.firstName }}</dd>
                    </div>
                    <div>
                      <dt>MRN</dt>
                      <dd class="value value--mono">{{ patient()!.mrn }}</dd>
                    </div>
                    <div>
                      <dt>Date of Birth</dt>
                      <dd>{{ patient()!.dateOfBirth | date: 'mediumDate' }}</dd>
                    </div>
                    <div>
                      <dt>Gender</dt>
                      <dd><span class="pill pill--neutral">{{ formatGender(patient()!.gender) }}</span></dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{{ patient()!.phone }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--blue" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M3 11h18"/><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M7 15h4"/></svg>
                      </span>
                      <h2>Registration</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Created</dt>
                      <dd>{{ patient()!.createdAt | date: 'short' }}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{{ patient()!.updatedAt | date: 'short' }}</dd>
                    </div>
                    <div>
                      <dt>Created By</dt>
                      <dd class="value value--strong">{{ userDisplayName(patient()!.createdByUserId) }}</dd>
                    </div>
                    <div>
                      <dt>User ID</dt>
                      <dd class="value value--mono">{{ patient()!.createdByUserId }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--coral" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                      </span>
                      <h2>VOB Summary</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Total VOBs</dt>
                      <dd class="value value--strong">{{ vobs().length }}</dd>
                    </div>
                    <div>
                      <dt>Queued</dt>
                      <dd>{{ countByStatus('QUEUED') }}</dd>
                    </div>
                    <div>
                      <dt>In Progress</dt>
                      <dd>{{ countByStatus('IN_PROGRESS') }}</dd>
                    </div>
                    <div>
                      <dt>Verified</dt>
                      <dd>{{ countByStatus('VERIFIED') }}</dd>
                    </div>
                    <div>
                      <dt>Failed</dt>
                      <dd>{{ countByStatus('FAILED_TO_VERIFY') }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--purple" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.64-7.36L3 8"/><path d="M12 7v5l3 2"/></svg>
                      </span>
                      <h2>Latest VOB</h2>
                    </div>
                    @if (latestVob(); as latest) {
                      <app-status-badge [status]="latest.status" />
                    }
                  </div>
                  @if (latestVob(); as latest) {
                    <dl class="rows">
                      <div>
                        <dt>VOB ID</dt>
                        <dd class="value value--mono">{{ latest.id }}</dd>
                      </div>
                      <div>
                        <dt>Payer</dt>
                        <dd class="value value--strong">{{ latest.insurance.payerName }}</dd>
                      </div>
                      <div>
                        <dt>Date of Service</dt>
                        <dd>{{ latest.dateOfService | date: 'mediumDate' }}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{{ latest.createdAt | date: 'short' }}</dd>
                      </div>
                    </dl>
                  } @else {
                    <p class="muted">No VOBs have been created for this patient yet.</p>
                  }
                </section>
              </div>
            }

            @case ('VOB_HISTORY') {
              <section class="history-table-card">
                <div class="card-head">
                  <div class="card-head-left">
                    <span class="icon-circle icon-circle--blue" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.64-7.36L3 8"/><path d="M12 7v5l3 2"/></svg>
                    </span>
                    <h2>Patient VOB History</h2>
                  </div>
                  <span class="pill pill--muted">{{ vobs().length }} records</span>
                </div>

                @if (vobs().length > 0) {
                  <app-vob-table
                    [vobs]="vobs()"
                    [patientLookup]="patientLookup()"
                    [selectable]="false"
                    [allowClaim]="false"
                    (view)="viewVob($event)"
                  />
                } @else {
                  <p class="muted">No verification requests exist for this patient yet.</p>
                }
              </section>
            }

            @case ('INFO') {
              <div class="section-grid">
                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--teal" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
                      </span>
                      <h2>Front Desk Intake</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Created By</dt>
                      <dd class="value value--strong">{{ userDisplayName(patient()!.createdByUserId) }}</dd>
                    </div>
                    <div>
                      <dt>User ID</dt>
                      <dd class="value value--mono">{{ patient()!.createdByUserId }}</dd>
                    </div>
                    <div>
                      <dt>Created At</dt>
                      <dd>{{ patient()!.createdAt | date: 'short' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--blue" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      </span>
                      <h2>Patient Record</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Patient ID</dt>
                      <dd class="value value--mono">{{ patient()!.id }}</dd>
                    </div>
                    <div>
                      <dt>MRN</dt>
                      <dd class="value value--mono">{{ patient()!.mrn }}</dd>
                    </div>
                    <div>
                      <dt>Last Updated</dt>
                      <dd>{{ patient()!.updatedAt | date: 'short' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--coral" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-5"/></svg>
                      </span>
                      <h2>Specialist Activity</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Assigned VOBs</dt>
                      <dd>{{ assignedVobCount() }}</dd>
                    </div>
                    <div>
                      <dt>Verified VOBs</dt>
                      <dd>{{ countByStatus('VERIFIED') }}</dd>
                    </div>
                    <div>
                      <dt>Latest Specialist</dt>
                      <dd class="value value--strong">{{ latestSpecialistName() }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--purple" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>
                      </span>
                      <h2>Verification Status</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Has Active Queue Item</dt>
                      <dd>{{ countByStatus('QUEUED') > 0 ? 'Yes' : 'No' }}</dd>
                    </div>
                    <div>
                      <dt>Has Failed VOB</dt>
                      <dd>{{ countByStatus('FAILED_TO_VERIFY') > 0 ? 'Yes' : 'No' }}</dd>
                    </div>
                    <div>
                      <dt>Latest Verification</dt>
                      <dd>{{ latestVerifiedAt() }}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            }
          }
        </section>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      min-height: calc(100vh - 57px);
      margin: -24px;
      padding: 40px 24px;
      background: #f7f7f5;
    }

    .patient-detail-shell {
      max-width: 1180px;
      color: #1f2528;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 26px;
      border: 0;
      background: transparent;
      color: #6b6f74;
      font: inherit;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
    }

    .back-link:hover {
      color: #030213;
    }

    .back-link svg,
    .primary-action svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .patient-hero {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }

    .patient-hero-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      min-width: 0;
    }

    .patient-avatar {
      display: grid;
      width: 56px;
      height: 56px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(180deg, #e3f4ef, #d4eee6);
      color: #143d38;
      font-size: 22px;
      font-weight: 700;
    }

    .patient-title-block h1 {
      margin: 0 0 8px;
      color: #161616;
      font-size: 28px;
      font-weight: 400;
      letter-spacing: 0;
      line-height: 1.1;
    }

    .patient-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .primary-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 40px;
      padding: 0 16px;
      border: 0;
      border-radius: 9px;
      background: #030213;
      color: #fff;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .primary-action:hover {
      background: #171627;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge--mrn {
      background: #f0efec;
      color: #41464c;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      letter-spacing: 0;
    }

    .badge--gender {
      background: #fff1dc;
      color: #a35600;
    }

    .tabs {
      display: flex;
      gap: 28px;
      margin-top: 28px;
      border-bottom: 1px solid #dadbd8;
      overflow-x: auto;
    }

    .tabs button {
      height: 40px;
      padding: 0;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: #687079;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }

    .tabs__button--active {
      border-bottom-color: #1a1a18 !important;
      color: #1a1a18 !important;
    }

    .tab-panel {
      margin-top: 28px;
    }

    .detail-grid,
    .section-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .detail-card,
    .history-table-card {
      padding: 20px 22px;
      border: 1px solid #dedfdc;
      border-radius: 12px;
      background: #fff;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .card-head-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .icon-circle {
      display: grid;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 999px;
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
      background: #e8f8f4;
      color: #136f63;
    }

    .icon-circle--blue {
      background: #eef4ff;
      color: #2454a6;
    }

    .icon-circle--coral {
      background: #fff0e7;
      color: #a34d22;
    }

    .icon-circle--purple {
      background: #f3edff;
      color: #6d3fc4;
    }

    .detail-card h2,
    .history-table-card h2 {
      margin: 0;
      color: #222528;
      font-size: 15px;
      font-weight: 400;
    }

    .rows {
      display: flex;
      flex-direction: column;
      gap: 11px;
      margin: 0;
    }

    .rows div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
    }

    .rows .row--single {
      justify-content: flex-start;
    }

    .rows dt {
      color: #7a8187;
      font-size: 13px;
      font-weight: 400;
    }

    .rows dd {
      margin: 0;
      color: #262b2f;
      font-size: 13px;
      font-weight: 400;
      text-align: right;
      word-break: break-word;
    }

    .value--name {
      font-size: 15px !important;
      font-weight: 400 !important;
      text-align: left !important;
    }

    .value--strong {
      font-weight: 400;
    }

    .value--mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      letter-spacing: 0;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 20px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .pill--neutral {
      background: #edf8f1;
      color: #16823f;
    }

    .pill--muted {
      background: #f0efec;
      color: #687079;
    }

    .muted {
      margin: 0;
      color: #7a8187;
      font-size: 13px;
      font-weight: 400;
    }

    @media (max-width: 900px) {
      :host {
        margin: -12px;
        padding: 24px 12px;
      }

      .patient-hero {
        flex-direction: column;
        margin-bottom: 20px;
      }

      .primary-action {
        width: 100%;
      }

      .tabs {
        gap: 18px;
      }

      .detail-grid,
      .section-grid {
        grid-template-columns: 1fr;
      }

      .history-table-card {
        padding: 16px;
      }
    }
  `
})
export class PatientDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientStore = inject(PatientApiService);
  private readonly vobStore = inject(VobApiService);

  readonly loading = signal(true);
  readonly patient = signal<Patient | null>(null);
  readonly vobs = signal<Vob[]>([]);
  readonly activeTab = signal<PatientDetailTab>('GENERAL');
  readonly patientLookup = signal<Record<string, Patient>>({});

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.patientStore.getById(id).subscribe((patient) => {
      this.patient.set(patient);
      if (patient) {
        this.patientLookup.set({ [patient.id]: patient });
        this.vobStore.listByPatientId(patient.id).subscribe((vobs) => {
          this.vobs.set(
            vobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          );
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  back(): void {
    this.router.navigate(['/app/patients/list']);
  }

  createVob(): void {
    const id = this.patient()?.id;
    if (id) {
      this.router.navigate(['/app/vob/add'], { queryParams: { patientId: id } });
    }
  }

  viewVob(id: string): void {
    this.router.navigate(['/app/vob', id]);
  }

  patientInitials(): string {
    const patient = this.patient();
    if (!patient) {
      return '';
    }
    return `${patient.firstName.slice(0, 1)}${patient.lastName.slice(0, 1)}`.toUpperCase();
  }

  formatGender(gender: Patient['gender']): string {
    return gender
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  countByStatus(status: Vob['status']): number {
    return this.vobs().filter((vob) => vob.status === status).length;
  }

  latestVob(): Vob | null {
    return this.vobs()[0] ?? null;
  }

  assignedVobCount(): number {
    return this.vobs().filter((vob) => Boolean(vob.assignedToUserId)).length;
  }

  latestSpecialistName(): string {
    const assigned = this.vobs().find((vob) => Boolean(vob.assignedToUserId));
    return assigned?.assignedToUserId ? this.userDisplayName(assigned.assignedToUserId) : '-';
  }

  latestVerifiedAt(): string {
    const verified = this.vobs().find((vob) => Boolean(vob.eligibilityResult?.verifiedAt));
    if (!verified?.eligibilityResult?.verifiedAt) {
      return '-';
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(verified.eligibilityResult.verifiedAt));
  }

  userDisplayName(userId: string): string {
    const names: Record<string, string> = {
      'user-frontdesk': 'Jamie Front Desk',
      'user-specialist': 'Sam Specialist',
      'user-admin': 'Alex Admin'
    };
    return names[userId] ?? userId;
  }
}
