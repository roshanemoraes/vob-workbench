import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientApiService } from '../../core/api/patient-api.service';
import { VobApiService } from '../../core/api/vob-api.service';
import { Patient } from '../../core/models/patient.models';
import { Vob } from '../../core/models/vob.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { VobActionBarComponent } from './vob-action-bar.component';
import { VobTableComponent } from './vob-table.component';

type VobDetailTab = 'GENERAL' | 'PATIENT_HISTORY' | 'INFO';

@Component({
  selector: 'app-vob-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    VobActionBarComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    VobTableComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-state />
    } @else if (vob()) {
      <section class="vob-detail-shell">
        <button type="button" class="back-link" (click)="back()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Go back to VOB list
        </button>

        @if (showApiFailureBanner()) {
          <div class="banner" id="verifyBanner" role="alert">
            <div class="banner-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div class="banner-body">
              <div class="banner-title">API verification failed</div>
              <div class="banner-desc">
                The payer did not return an eligibility response (<strong>timeout after 12s</strong>).
                Please proceed with manual verification.
              </div>
            </div>
            <div class="banner-actions">
              <button class="banner-close" type="button" aria-label="Dismiss" (click)="dismissApiFailureBanner()">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        }

        <header class="vob-hero">
          <div class="vob-hero-left">
            <div class="vob-avatar" aria-hidden="true">
              {{ vob()!.id.slice(0, 1).toUpperCase() }}
            </div>
            <div class="vob-title-block">
              <h1>{{ vob()!.id }}</h1>
              <div class="vob-pills">
                <span class="badge badge--priority">{{ vob()!.priority }}</span>
                <app-status-badge [status]="vob()!.status" />
              </div>
            </div>
          </div>

          <app-vob-action-bar
            class="vob-hero-actions"
            [vob]="vob()!"
            (actionStarted)="clearApiFailureBanner()"
            (apiVerificationFailed)="showApiFailureBanner.set(true)"
            (updated)="onVobUpdated($event)"
            (verified)="onVobUpdated($event)"
          />
        </header>

        <nav class="tabs" aria-label="VOB detail sections">
          <button
            type="button"
            [class.tabs__button--active]="activeTab() === 'GENERAL'"
            (click)="activeTab.set('GENERAL')"
          >
            General
          </button>
          <button
            type="button"
            [class.tabs__button--active]="activeTab() === 'PATIENT_HISTORY'"
            (click)="activeTab.set('PATIENT_HISTORY')"
          >
            Patient History
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
                      <dd>
                        @if (patient()) {
                          <a class="value value--link value--name" [routerLink]="['/app/patients', patient()!.id]">
                            {{ patient()!.lastName }}, {{ patient()!.firstName }}
                          </a>
                        } @else {
                          {{ vob()!.patientId }}
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>MRN</dt>
                      <dd class="value value--mono">{{ patient()?.mrn ?? '-' }}</dd>
                    </div>
                    <div>
                      <dt>Date of Birth</dt>
                      <dd>{{ patient()?.dateOfBirth ? (patient()!.dateOfBirth | date: 'mediumDate') : '-' }}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{{ patient()?.phone ?? '-' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--blue" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>
                      </span>
                      <h2>Insurance Policy</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Payer</dt>
                      <dd class="value value--strong">{{ vob()!.insurance.payerName }}</dd>
                    </div>
                    <div>
                      <dt>Member ID</dt>
                      <dd class="value value--mono">{{ vob()!.insurance.memberId }}</dd>
                    </div>
                    <div>
                      <dt>Group Number</dt>
                      <dd class="value value--mono">{{ vob()!.insurance.groupNumber }}</dd>
                    </div>
                    <div>
                      <dt>Plan Type</dt>
                      <dd>{{ vob()!.insurance.planType }}</dd>
                    </div>
                    <div>
                      <dt>Relationship</dt>
                      <dd>{{ vob()!.insurance.relationshipToSubscriber }}</dd>
                    </div>
                    <div>
                      <dt>Coverage</dt>
                      <dd>
                        {{ vob()!.insurance.coverageStart | date: 'mediumDate' }}
                        -
                        {{ vob()!.insurance.coverageEnd | date: 'mediumDate' }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--coral" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
                      </span>
                      <h2>Service Info</h2>
                    </div>
                    <app-status-badge [status]="vob()!.status" />
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Date of Service</dt>
                      <dd>{{ vob()!.dateOfService | date: 'mediumDate' }}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{{ vob()!.status }}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{{ vob()!.createdAt | date: 'short' }}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{{ vob()!.updatedAt | date: 'short' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--purple" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M9 5h6"/><path d="M9 3h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2Z"/><path d="m9 14 2 2 4-5"/></svg>
                      </span>
                      <h2>Eligibility Result</h2>
                    </div>
                  </div>
                  @if (vob()!.eligibilityResult; as result) {
                    <dl class="rows">
                      <div>
                        <dt>Coverage Active</dt>
                        <dd>
                          @if (result.coverageActive === true) {
                            <span class="active-flag">
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 12 2 2 4-5"/><circle cx="12" cy="12" r="10"/></svg>
                              Active
                            </span>
                          } @else if (result.coverageActive === false) {
                            <span class="inactive-flag">Inactive</span>
                          } @else {
                            -
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>Network Status</dt>
                        <dd>
                          @if (result.networkStatus) {
                            <span class="pill pill--accent">{{ result.networkStatus }}</span>
                          } @else {
                            -
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>Reference</dt>
                        <dd class="reference-value">
                          <span class="value value--mono">{{ result.referenceNumber ?? '-' }}</span>
                          @if (result.referenceNumber) {
                            <button
                              type="button"
                              class="copy-btn"
                              aria-label="Copy reference"
                              (click)="copyReference(result.referenceNumber)"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="8" y="8" width="12" height="12" rx="2" />
                                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                              </svg>
                            </button>
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>Notes</dt>
                        <dd>{{ result.notes ?? '-' }}</dd>
                      </div>
                      <p class="divider-note">
                        {{ result.verificationMethod ? 'Verified via ' + result.verificationMethod : 'Verification method not recorded.' }}
                      </p>
                    </dl>
                  } @else {
                    <p class="muted">No eligibility result recorded yet.</p>
                  }
                </section>
              </div>
            }

            @case ('PATIENT_HISTORY') {
              <section class="history-table-card">
                <div class="card-head">
                  <div class="card-head-left">
                    <span class="icon-circle icon-circle--blue" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.64-7.36L3 8"/><path d="M12 7v5l3 2"/></svg>
                    </span>
                    <h2>Patient VOB History</h2>
                  </div>
                  <span class="pill pill--muted">{{ patientHistory().length }} records</span>
                </div>

                @if (patientHistory().length > 0) {
                  <app-vob-table
                    [vobs]="patientHistory()"
                    [selectable]="false"
                    [allowClaim]="false"
                    (view)="viewHistoryVob($event)"
                  />
                } @else {
                  <p class="muted">No previous VOBs found for this patient.</p>
                }
              </section>
            }

            @case ('INFO') {
              <div class="section-grid section-grid--info">
                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--teal" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
                      </span>
                      <h2>Receptionist</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Created By</dt>
                      <dd class="value value--strong">{{ userDisplayName(vob()!.createdByUserId) }}</dd>
                    </div>
                    <div>
                      <dt>User ID</dt>
                      <dd class="value value--mono">{{ vob()!.createdByUserId }}</dd>
                    </div>
                    <div>
                      <dt>Created At</dt>
                      <dd>{{ vob()!.createdAt | date: 'short' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--blue" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-5"/></svg>
                      </span>
                      <h2>Specialist</h2>
                    </div>
                    @if (vob()!.assignedToUserId) {
                      <span class="pill pill--neutral">Assigned</span>
                    } @else {
                      <span class="pill pill--muted">Unassigned</span>
                    }
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Assigned To</dt>
                      <dd class="value value--strong">
                        {{ vob()!.assignedToUserId ? userDisplayName(vob()!.assignedToUserId!) : 'Unassigned' }}
                      </dd>
                    </div>
                    <div>
                      <dt>User ID</dt>
                      <dd class="value value--mono">{{ vob()!.assignedToUserId ?? '-' }}</dd>
                    </div>
                    <div>
                      <dt>Verified By</dt>
                      <dd class="value value--strong">
                        {{ vob()!.eligibilityResult?.verifiedByUserId ? userDisplayName(vob()!.eligibilityResult!.verifiedByUserId!) : '-' }}
                      </dd>
                    </div>
                    <div>
                      <dt>Verified At</dt>
                      <dd>
                        {{ vob()!.eligibilityResult?.verifiedAt ? (vob()!.eligibilityResult!.verifiedAt | date: 'short') : '-' }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--coral" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                      </span>
                      <h2>Workflow</h2>
                    </div>
                  </div>
                  <dl class="rows">
                    <div>
                      <dt>Current Status</dt>
                      <dd><app-status-badge [status]="vob()!.status" /></dd>
                    </div>
                    <div>
                      <dt>Priority</dt>
                      <dd><span class="badge badge--priority">{{ vob()!.priority }}</span></dd>
                    </div>
                    <div>
                      <dt>Last Updated</dt>
                      <dd>{{ vob()!.updatedAt | date: 'short' }}</dd>
                    </div>
                  </dl>
                </section>

                <section class="detail-card">
                  <div class="card-head">
                    <div class="card-head-left">
                      <span class="icon-circle icon-circle--purple" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      </span>
                      <h2>Verification Metadata</h2>
                    </div>
                  </div>
                  @if (vob()!.eligibilityResult; as result) {
                    <dl class="rows">
                      <div>
                        <dt>Method</dt>
                        <dd>{{ result.verificationMethod ?? '-' }}</dd>
                      </div>
                      <div>
                        <dt>Reference</dt>
                        <dd class="reference-value">
                          <span class="value value--mono">{{ result.referenceNumber ?? '-' }}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Failure Reason</dt>
                        <dd>{{ result.failureReason ?? '-' }}</dd>
                      </div>
                    </dl>
                  } @else {
                    <p class="muted">No verification metadata recorded yet.</p>
                  }
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

    .vob-detail-shell {
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
      cursor: pointer;
      font-weight: 400;
    }

    .back-link:hover {
      color: #030213;
    }

    .back-link svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 860px;
      margin: -12px 0 28px;
      padding: 14px 16px;
      border: 1px solid #f1d5a5;
      border-radius: 12px;
      background: #fff8ed;
      color: #5f3b05;
      box-shadow: 0 10px 24px rgba(146, 92, 16, 0.06);
    }

    .banner-icon {
      display: grid;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 999px;
      background: #ffe8c2;
      color: #b66a00;
    }

    .banner-icon svg,
    .banner-close svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .banner-body {
      min-width: 0;
      flex: 1;
    }

    .banner-title {
      color: #3f2600;
      font-size: 14px;
      font-weight: 700;
    }

    .banner-desc {
      margin-top: 3px;
      color: #7a4c08;
      font-size: 13px;
      line-height: 1.45;
    }

    .banner-actions {
      flex-shrink: 0;
    }

    .banner-close {
      display: inline-grid;
      width: 28px;
      height: 28px;
      place-items: center;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #9a6718;
      cursor: pointer;
    }

    .banner-close:hover {
      background: #ffe8c2;
      color: #5f3b05;
    }

    .vob-hero {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }

    .vob-hero-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      min-width: 0;
    }

    .vob-hero-actions {
      flex-shrink: 0;
      margin-top: 6px;
    }

    .vob-avatar {
      display: grid;
      width: 56px;
      height: 56px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(180deg, #f0dfd5, #ead3c6);
      color: #111;
      font-size: 28px;
      font-weight: 600;
    }

    .vob-title-block h1 {
      margin: 0 0 8px;
      color: #161616;
      font-size: 28px;
      font-weight: 400;
      letter-spacing: 0;
      line-height: 1.1;
    }

    .vob-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
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

    .badge--priority {
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

    .section-grid--info {
      grid-template-columns: repeat(2, minmax(280px, 1fr));
    }

    .detail-card {
      padding: 20px 22px;
      border: 1px solid #dedfdc;
      border-radius: 12px;
      background: #fff;
    }

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

    .icon-circle svg,
    .active-flag svg,
    .copy-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .active-flag svg {
      fill: #16a34a;
      stroke: #fff;
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

    .detail-card h2 {
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

    .detail-list {
      display: grid;
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

    .detail-list div {
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

    .detail-list dt {
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

    .detail-list dd {
      margin: 0;
      color: #262b2f;
      font-size: 13px;
      font-weight: 400;
      text-align: right;
      word-break: break-word;
    }

    .value--name {
      font-size: 15px;
      font-weight: 400;
    }

    .value--link {
      color: #166a64;
      text-decoration: none;
    }

    .value--link:hover {
      text-decoration: underline;
    }

    .value--strong {
      font-weight: 400;
    }

    .value--mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      letter-spacing: 0;
    }

    .active-flag,
    .inactive-flag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
    }

    .active-flag {
      color: #16823f;
    }

    .inactive-flag {
      color: #b42318;
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

    .pill--accent {
      background: #f3e9ff;
      color: #6d3fc4;
    }

    .pill--neutral {
      background: #edf8f1;
      color: #16823f;
    }

    .pill--muted {
      background: #f0efec;
      color: #687079;
    }

    .reference-value {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .copy-btn {
      display: inline-flex;
      border: 0;
      background: transparent;
      color: #82878d;
      cursor: pointer;
      padding: 0;
    }

    .copy-btn:hover {
      color: #1f2528;
    }

    .divider-note {
      margin: 2px 0 0;
      padding-top: 8px;
      border-top: 1px solid #e4e5e2;
      color: #7a8187;
      font-size: 13px;
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

      .vob-hero {
        flex-direction: column;
        margin-bottom: 20px;
      }

      .vob-hero-actions {
        width: 100%;
        margin-top: 0;
      }

      .tabs {
        gap: 18px;
      }

      .detail-grid,
      .section-grid,
      .section-grid--info {
        grid-template-columns: 1fr;
      }

      .history-table-card {
        padding: 16px;
      }
    }
  `
})
export class VobDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vobStore = inject(VobApiService);
  private readonly patientStore = inject(PatientApiService);

  readonly loading = signal(true);
  readonly vob = signal<Vob | null>(null);
  readonly patient = signal<Patient | null>(null);
  readonly patientHistory = signal<Vob[]>([]);
  readonly activeTab = signal<VobDetailTab>('GENERAL');
  readonly showApiFailureBanner = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.vobStore.getById(id).subscribe((vob) => {
      this.vob.set(vob);
      if (vob) {
        this.patientStore.getById(vob.patientId).subscribe((p) => {
          this.patient.set(p);
          this.vobStore.listByPatientId(vob.patientId).subscribe((history) => {
            this.patientHistory.set(
              history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
            this.loading.set(false);
          });
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  back(): void {
    const status = this.vob()?.status ?? 'QUEUED';
    this.router.navigate(['/app/vob/list'], { queryParams: { status } });
  }

  onVobUpdated(vob: Vob): void {
    this.clearApiFailureBanner();
    this.vob.set(vob);
    this.vobStore.listByPatientId(vob.patientId).subscribe((history) => {
      this.patientHistory.set(
        history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    });
  }

  viewHistoryVob(id: string): void {
    this.router.navigate(['/app/vob', id]);
  }

  copyReference(referenceNumber: string): void {
    navigator.clipboard?.writeText(referenceNumber);
  }

  clearApiFailureBanner(): void {
    this.showApiFailureBanner.set(false);
  }

  dismissApiFailureBanner(): void {
    this.showApiFailureBanner.set(false);
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
