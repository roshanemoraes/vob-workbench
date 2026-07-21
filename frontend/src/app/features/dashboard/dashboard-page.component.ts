import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuditApiService } from '../../core/api/audit-api.service';
import { PatientApiService } from '../../core/api/patient-api.service';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { VobApiService } from '../../core/api/vob-api.service';
import { AuditEvent } from '../../core/models/audit.models';
import { Vob, VobStatus } from '../../core/models/vob.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';

type StatCard = {
  title: string;
  value: number;
  total: number;
  unit: string;
  status?: VobStatus;
  highlight?: boolean;
};

type WorkloadBar = {
  label: string;
  value: number;
  height: number;
  active?: boolean;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    LoadingStateComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-state />
    } @else {
      <section class="dashboard">
        <aside class="dashboard-left">
          <section class="card profile-card">
            <div class="profile-visual" aria-hidden="true">
              <div class="profile-avatar">{{ userInitials() }}</div>
              <svg viewBox="0 0 220 130" preserveAspectRatio="none">
                <path d="M0 92 C38 46 76 110 114 54 C148 5 188 22 220 42 L220 130 L0 130 Z" />
                <path d="M0 116 C42 82 78 128 128 84 C164 53 190 62 220 74 L220 130 L0 130 Z" />
              </svg>
            </div>

            <h1 class="profile-name">{{ displayName() }}</h1>
            <p class="profile-role">{{ roleLabel() }}</p>

            <div class="badge-row">
              <span class="badge badge-id">{{ userStore.currentUser()?.id || 'User' }}</span>
              <span class="badge badge-active">Active</span>
            </div>

            <div class="info-box">
              @if (canViewVobQueue()) {
                <div class="info-row"><span class="label">Total VOBs</span><span class="value">{{ totalVobs() }}</span></div>
              }
              @if (canViewPatients()) {
                <div class="info-row"><span class="label">Patients</span><span class="value">{{ totalPatients() }}</span></div>
              }
              @if (canViewVobQueue()) {
                <div class="info-row"><span class="label">Open Work</span><span class="value">{{ openWorkCount() }}</span></div>
              }
            </div>

            <div class="quick-actions">
              @if (canCreatePatient()) {
                <a routerLink="/app/patients/add">New Patient</a>
              }
              @if (canViewPatients()) {
                <a routerLink="/app/patients/list">List Patients</a>
              }
              @if (canCreateVob()) {
                <a routerLink="/app/vob/add">New VOB</a>
              }
              @if (canViewVobQueue()) {
                <a routerLink="/app/vob/list">List VOB</a>
              }
            </div>
          </section>

          <section class="card">
            <div class="card-header"><h2 class="card-title">Operational Info</h2></div>
            <div class="info-list">
              @for (item of operationalInfo(); track item.label) {
                <div class="info-list-row">
                  <span class="info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path [attr.d]="item.icon" /></svg>
                  </span>
                  <div>
                    <span class="info-label">{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              }
            </div>
          </section>
        </aside>

        <main class="dashboard-main">
          @if (isFrontDeskOperator()) {
            <section class="front-desk-grid">
              <a class="card action-card action-card--highlight" routerLink="/app/patients/add">
                <span class="action-icon">+</span>
                <strong>Add Patient</strong>
                <small>Register a patient before starting benefit verification.</small>
              </a>
              <a class="card action-card" routerLink="/app/patients/list">
                <span class="action-icon">≡</span>
                <strong>List Patients</strong>
                <small>Find existing patients and confirm intake details.</small>
              </a>
              <a class="card action-card" routerLink="/app/vob/add">
                <span class="action-icon">↗</span>
                <strong>Add VOB</strong>
                <small>Create a new verification request for specialist processing.</small>
              </a>
            </section>
          } @else {
            <section class="stats-row">
              @for (stat of statCards(); track stat.title) {
                <a
                  class="card stat-card"
                  [class.stat-card--highlight]="stat.highlight"
                  [routerLink]="stat.status ? '/app/vob/list' : '/app/dashboard'"
                  [queryParams]="stat.status ? { status: stat.status } : null"
                >
                  <span class="stat-title">{{ stat.title }}</span>
                  <span class="ring-wrap">
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="42" class="ring-track" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        class="ring-value"
                        [attr.stroke-dasharray]="ringCircumference"
                        [attr.stroke-dashoffset]="ringOffset(stat.value, stat.total)"
                      />
                    </svg>
                    <span class="ring-center">
                      <strong>{{ stat.value }}</strong>
                      <small>{{ stat.total || 0 }} {{ stat.unit }}</small>
                    </span>
                  </span>
                </a>
              }
            </section>

            @if (canViewVerificationOverview()) {
              <section class="card performance-card">
                <div class="card-header">
                  <h2 class="card-title">Verification Overview</h2>
                  <span class="soft-pill">Current data</span>
                </div>

                <div class="performance-figure">
                  <strong>{{ verificationRate() | number: '1.0-1' }}%</strong>
                  <span>{{ counts().VERIFIED }} verified out of {{ totalVobs() }} total VOBs</span>
                </div>

                <div class="chart-wrap">
                  <div class="chart-tooltip">
                    <span>Verification Rate</span>
                    <strong>{{ verificationRate() | number: '1.0-1' }}%</strong>
                  </div>
                  <svg viewBox="0 0 700 210" width="100%" aria-label="Verification trend chart">
                    <defs>
                      <linearGradient id="dashboardAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#1f9e64" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="#1f9e64" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <g class="chart-grid">
                      <line x1="0" y1="20" x2="700" y2="20" />
                      <line x1="0" y1="65" x2="700" y2="65" />
                      <line x1="0" y1="110" x2="700" y2="110" />
                      <line x1="0" y1="155" x2="700" y2="155" />
                      <line x1="0" y1="200" x2="700" y2="200" />
                    </g>
                    <path [attr.d]="chartAreaPath()" fill="url(#dashboardAreaFill)" />
                    <path [attr.d]="chartLinePath()" class="chart-line" />
                    <circle [attr.cx]="chartMarker().x" [attr.cy]="chartMarker().y" r="5" class="chart-marker" />
                  </svg>
                  <div class="chart-months"><span>Queue</span><span>Claim</span><span>Verify</span><span>Close</span></div>
                </div>
              </section>
            }

            <section class="dashboard-grid">
              <section class="card">
                <div class="card-header">
                  <h2 class="card-title">Work Queue</h2>
                  <span class="soft-pill">By status</span>
                </div>
                <div class="hours-figure"><strong>{{ openWorkCount() }}</strong><span>open requests</span></div>
                <div class="bars">
                  @for (bar of workloadBars(); track bar.label) {
                    <a
                      class="bar-col"
                      [class.bar-col--active]="bar.active"
                      routerLink="/app/vob/list"
                      [queryParams]="{ status: bar.label }"
                    >
                      <span class="bar" [style.height.px]="bar.height"></span>
                      <span class="bar-count">{{ bar.value }}</span>
                      <span class="bar-label">{{ shortStatus(bar.label) }}</span>
                    </a>
                  }
                </div>
              </section>

              <section class="card">
                <div class="card-header">
                  <h2 class="card-title">Recent VOBs</h2>
                  <a routerLink="/app/vob/list" class="link-action">View all</a>
                </div>
                <div class="document-list">
                  @for (vob of recentVobs(); track vob.id) {
                    <a class="document-row" [routerLink]="['/app/vob', vob.publicId]">
                      <span class="document-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                      </span>
                      <span>
                        <strong>{{ vob.insurance.payerName || 'Unknown payer' }}</strong>
                        <small>{{ formatStatus(vob.status) }} | DOS {{ vob.dateOfService | date: 'mediumDate' }}</small>
                      </span>
                    </a>
                  } @empty {
                    <p class="empty-text">No VOB requests yet.</p>
                  }
                </div>
              </section>
            </section>
          }

          @if (canViewAudit()) {
            <section class="card">
              <div class="card-header">
                <h2 class="card-title">Recent Audit Activity</h2>
                <a routerLink="/app/audit" class="link-action">Open audit log</a>
              </div>
              <div class="notes-grid">
                @for (event of recentAuditEvents(); track event.id) {
                  <article class="note">
                    <h3>{{ formatAction(event.action) }}</h3>
                    <time>{{ event.createdAt | date: 'medium' }}</time>
                    <p>{{ formatAuditEvent(event) }}</p>
                  </article>
                } @empty {
                  <p class="empty-text">No audit activity found.</p>
                }
              </div>
            </section>
          }
        </main>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      color: #1c2521;
    }

    .dashboard {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 16px;
      max-width: 1260px;
    }

    .dashboard-left,
    .dashboard-main {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .card {
      border: 1px solid rgba(20, 30, 25, 0.07);
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 1px 2px rgba(20, 30, 25, 0.04), 0 8px 24px rgba(20, 30, 25, 0.04);
      padding: 20px;
    }

    .profile-visual {
      position: relative;
      display: grid;
      place-items: center;
      height: 160px;
      margin-bottom: 14px;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(150deg, #dff5e8, #1f9e64);
    }

    .profile-visual svg {
      position: absolute;
      inset: auto 0 0;
      width: 100%;
      height: 76%;
    }

    .profile-visual path:first-child {
      fill: rgba(14, 61, 51, 0.22);
    }

    .profile-visual path:last-child {
      fill: rgba(255, 255, 255, 0.32);
    }

    .profile-avatar {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #0e3d33;
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      box-shadow: 0 14px 30px rgba(14, 61, 51, 0.26);
    }

    .profile-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .profile-role {
      margin: 4px 0 14px;
      color: #6b756f;
      font-size: 13px;
      font-weight: 400;
    }

    .badge-row,
    .quick-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .badge {
      max-width: 100%;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-id {
      overflow: hidden;
      background: #f2f3f2;
      color: #6b756f;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-active {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #000;
      color: rgb(2, 255, 65);
    }

    .badge-active::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: currentColor;
    }

    .info-box {
      margin: 18px 0;
      border: 1px solid #eceeec;
      border-radius: 16px;
      overflow: hidden;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid #eceeec;
      font-size: 13px;
    }

    .info-row:last-child {
      border-bottom: 0;
    }

    .label,
    .info-label {
      color: #6b756f;
      font-weight: 400;
    }

    .value {
      font-weight: 600;
    }

    .quick-actions a,
    .link-action {
      color: #0e3d33;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
    }

    .quick-actions a {
      padding: 8px 12px;
      border-radius: 999px;
      background: #eef8f2;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .card-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    .soft-pill {
      display: inline-flex;
      align-items: center;
      padding: 7px 12px;
      border-radius: 999px;
      background: #eef8f2;
      color: #0e3d33;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .info-list {
      display: grid;
    }

    .info-list-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 0;
      border-top: 1px solid #eceeec;
    }

    .info-list-row:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .info-list-row:last-child {
      padding-bottom: 0;
    }

    .info-list-row > div {
      display: grid;
      gap: 2px;
    }

    .info-list-row strong {
      font-size: 14px;
      font-weight: 600;
    }

    .info-icon,
    .document-icon {
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: #eef8f2;
      color: #0e3d33;
    }

    .info-icon svg,
    .document-icon svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    .front-desk-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .action-card {
      display: grid;
      gap: 8px;
      min-height: 180px;
      color: inherit;
      text-decoration: none;
    }

    .action-card--highlight {
      background: #dcf2e4;
    }

    .action-icon {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #0e3d33;
      color: #fff;
      font-size: 22px;
      font-weight: 600;
    }

    .action-card strong {
      font-size: 18px;
      font-weight: 600;
    }

    .action-card small {
      color: #6b756f;
      font-size: 13px;
      font-weight: 400;
      line-height: 1.45;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 168px;
      color: inherit;
      text-align: center;
      text-decoration: none;
    }

    .stat-card--highlight {
      background: #dcf2e4;
    }

    .stat-title {
      align-self: flex-start;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 600;
    }

    .ring-wrap {
      position: relative;
      width: 92px;
      height: 92px;
      margin-top: 2px;
    }

    .ring-wrap svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .ring-track,
    .ring-value {
      fill: none;
      stroke-width: 9;
    }

    .ring-track {
      stroke: rgba(14, 61, 51, 0.12);
    }

    .ring-value {
      stroke: #1f9e64;
      stroke-linecap: round;
    }

    .ring-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
    }

    .ring-center strong {
      font-size: 20px;
      font-weight: 700;
    }

    .ring-center small {
      color: #6b756f;
      font-size: 10px;
      font-weight: 500;
    }

    .performance-figure {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin: 6px 0 4px;
    }

    .performance-figure strong {
      font-size: 30px;
      font-weight: 800;
    }

    .performance-figure span {
      color: #1f9e64;
      font-size: 12px;
      font-weight: 600;
    }

    .chart-wrap {
      position: relative;
      margin-top: 10px;
    }

    .chart-tooltip {
      position: absolute;
      top: 4px;
      left: min(60%, calc(100% - 150px));
      display: grid;
      gap: 2px;
      padding: 7px 12px;
      border-radius: 10px;
      background: #0e3d33;
      color: #fff;
      font-size: 11px;
      box-shadow: 0 8px 20px rgba(14, 61, 51, 0.28);
    }

    .chart-tooltip strong {
      font-size: 13px;
    }

    .chart-grid line {
      stroke: #eceeec;
    }

    .chart-line {
      fill: none;
      stroke: #1f9e64;
      stroke-width: 2.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chart-marker {
      fill: #0e3d33;
      stroke: #fff;
      stroke-width: 2;
    }

    .chart-months {
      display: flex;
      justify-content: space-between;
      padding: 4px 4px 0;
      color: #9aa39d;
      font-size: 11px;
      font-weight: 500;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 16px;
    }

    .hours-figure {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 4px 0 18px;
    }

    .hours-figure strong {
      font-size: 28px;
      font-weight: 800;
    }

    .hours-figure span {
      color: #6b756f;
      font-size: 14px;
      font-weight: 500;
    }

    .bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      min-height: 148px;
      gap: 10px;
    }

    .bar-col {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 0;
      color: inherit;
      text-decoration: none;
    }

    .bar {
      width: min(100%, 32px);
      min-height: 18px;
      border-radius: 8px;
      background: #dcf2e4;
    }

    .bar-col--active .bar {
      background: #0e3d33;
    }

    .bar-count {
      color: #1c2521;
      font-size: 12px;
      font-weight: 700;
    }

    .bar-label {
      color: #6b756f;
      font-size: 11px;
      font-weight: 600;
    }

    .document-list {
      display: grid;
    }

    .document-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid #eceeec;
      color: inherit;
      text-decoration: none;
    }

    .document-row:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .document-row:last-child {
      padding-bottom: 0;
    }

    .document-row span:last-child {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .document-row strong {
      overflow: hidden;
      font-size: 13px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .document-row small {
      color: #6b756f;
      font-size: 11.5px;
      font-weight: 400;
    }

    .notes-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .note {
      min-width: 0;
      padding: 14px;
      border-radius: 16px;
      background: #eef8f2;
    }

    .note h3 {
      margin: 0 0 6px;
      font-size: 13px;
      font-weight: 700;
    }

    .note time {
      display: block;
      margin-bottom: 8px;
      color: #6b756f;
      font-size: 11px;
    }

    .note p,
    .empty-text {
      margin: 0;
      color: #6b756f;
      font-size: 12.5px;
      font-weight: 400;
      line-height: 1.5;
    }

    @media (max-width: 1180px) {
      .dashboard {
        grid-template-columns: 1fr;
      }

      .dashboard-left {
        display: grid;
        grid-template-columns: minmax(260px, 0.9fr) minmax(280px, 1.1fr);
      }
    }

    @media (max-width: 920px) {
      .stats-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dashboard-grid,
      .front-desk-grid,
      .notes-grid,
      .dashboard-left {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .card {
        padding: 16px;
        border-radius: 14px;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .performance-figure {
        align-items: flex-start;
        flex-direction: column;
        gap: 4px;
      }
    }
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly vobStore = inject(VobApiService);
  private readonly patientStore = inject(PatientApiService);
  private readonly auditStore = inject(AuditApiService);
  readonly userStore = inject(MockCurrentUserStore);

  readonly ringCircumference = 263.89;
  readonly loading = signal(true);
  readonly counts = signal<Record<VobStatus, number>>({
    QUEUED: 0,
    IN_PROGRESS: 0,
    VERIFIED: 0,
    FAILED_TO_VERIFY: 0
  });
  readonly totalPatients = signal(0);
  readonly recentVobs = signal<Vob[]>([]);
  readonly recentAuditEvents = signal<AuditEvent[]>([]);

  readonly totalVobs = computed(() => Object.values(this.counts()).reduce((sum, count) => sum + count, 0));
  readonly openWorkCount = computed(() => this.counts().QUEUED + this.counts().IN_PROGRESS);
  readonly verificationRate = computed(() => {
    const total = this.totalVobs();
    return total === 0 ? 0 : (this.counts().VERIFIED / total) * 100;
  });
  readonly statCards = computed<StatCard[]>(() => {
    const counts = this.counts();
    const total = Math.max(this.totalVobs(), 1);
    return [
      { title: 'All VOBs', value: this.totalVobs(), total, unit: 'total', highlight: true },
      { title: 'Queued', value: counts.QUEUED, total, unit: 'VOBs', status: 'QUEUED' },
      { title: 'In Progress', value: counts.IN_PROGRESS, total, unit: 'VOBs', status: 'IN_PROGRESS' },
      { title: 'Verified', value: counts.VERIFIED, total, unit: 'VOBs', status: 'VERIFIED' }
    ];
  });
  readonly workloadBars = computed<WorkloadBar[]>(() => {
    const counts = this.counts();
    const max = Math.max(...Object.values(counts), 1);
    return (Object.keys(counts) as VobStatus[]).map((status) => ({
      label: status,
      value: counts[status],
      height: 24 + Math.round((counts[status] / max) * 96),
      active: status === 'IN_PROGRESS'
    }));
  });
  readonly operationalInfo = computed(() => [
    ...(this.canViewVobQueue()
      ? [
          { label: 'Verified', value: this.counts().VERIFIED, icon: 'M9 12l2 2 4-5 M20 6 9 17l-5-5' },
          { label: 'In Progress', value: this.counts().IN_PROGRESS, icon: 'M12 8v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' },
          { label: 'Queued', value: this.counts().QUEUED, icon: 'M4 7h16 M4 12h16 M4 17h10' },
          { label: 'Failed', value: this.counts().FAILED_TO_VERIFY, icon: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' }
        ]
      : [
          { label: 'Patient Records', value: this.totalPatients(), icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
          { label: 'Available Actions', value: 3, icon: 'M12 5v14 M5 12h14' }
        ])
  ]);

  ngOnInit(): void {
    const canViewVobQueue = this.canViewVobQueue();
    const canViewAudit = this.canViewAudit();
    forkJoin({
      counts: canViewVobQueue
        ? this.vobStore.countByStatus().pipe(catchError(() => of(this.counts())))
        : of(this.counts()),
      patients: this.patientStore.list().pipe(catchError(() => of({ items: [], totalCount: 0, hasMore: false, nextCursor: null }))),
      recentVobs: canViewVobQueue
        ? this.vobStore.list({ sortOrder: 'desc' }).pipe(catchError(() => of({ items: [], totalCount: 0, hasMore: false, nextCursor: null })))
        : of({ items: [], totalCount: 0, hasMore: false, nextCursor: null }),
      audit: canViewAudit
        ? this.auditStore.list({ limit: 4 }).pipe(catchError(() => of({ items: [], totalCount: 0 })))
        : of({ items: [], totalCount: 0 })
    }).subscribe(({ counts, patients, recentVobs, audit }) => {
      this.counts.set(counts);
      this.totalPatients.set(patients.totalCount);
      this.recentVobs.set(recentVobs.items.slice(0, 4));
      this.recentAuditEvents.set(audit.items.slice(0, 4));
      this.loading.set(false);
    });
  }

  displayName(): string {
    return this.userStore.currentUser()?.displayName || this.userStore.currentUser()?.username || 'Workbench User';
  }

  userInitials(): string {
    return this.displayName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';
  }

  roleLabel(): string {
    const role = this.userStore.currentUser()?.role ?? 'USER';
    return this.formatAction(role);
  }

  isFrontDeskOperator(): boolean {
    return this.userStore.currentUser()?.role === 'FRONT_DESK_OPERATOR';
  }

  canCreatePatient(): boolean {
    return this.userStore.hasPermission('PATIENT_CREATE');
  }

  canViewPatients(): boolean {
    return this.userStore.hasPermission('PATIENT_VIEW');
  }

  canCreateVob(): boolean {
    return this.userStore.hasPermission('VOB_CREATE');
  }

  canViewVobQueue(): boolean {
    return this.userStore.hasPermission('VOB_QUEUE_VIEW');
  }

  canViewVerificationOverview(): boolean {
    return this.userStore.hasPermission('VOB_VERIFY_API') || this.userStore.hasPermission('VOB_VERIFY_MANUAL');
  }

  canViewAudit(): boolean {
    return this.userStore.hasPermission('AUDIT_VIEW');
  }

  ringOffset(value: number, total: number): number {
    if (total <= 0) return this.ringCircumference;
    const percent = Math.min(Math.max(value / total, 0), 1);
    return this.ringCircumference * (1 - percent);
  }

  chartLinePath(): string {
    const counts = this.counts();
    const values = [
      counts.QUEUED + counts.IN_PROGRESS,
      counts.IN_PROGRESS,
      counts.VERIFIED,
      Math.max(counts.VERIFIED - counts.FAILED_TO_VERIFY, 0)
    ];
    const max = Math.max(...values, 1);
    return values
      .map((value, index) => {
        const x = index * (700 / (values.length - 1));
        const y = 190 - (value / max) * 145;
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  chartAreaPath(): string {
    return `${this.chartLinePath()} L700,210 L0,210 Z`;
  }

  chartMarker(): { x: number; y: number } {
    const counts = this.counts();
    const values = [
      counts.QUEUED + counts.IN_PROGRESS,
      counts.IN_PROGRESS,
      counts.VERIFIED,
      Math.max(counts.VERIFIED - counts.FAILED_TO_VERIFY, 0)
    ];
    const max = Math.max(...values, 1);
    return {
      x: 2 * (700 / (values.length - 1)),
      y: 190 - (values[2] / max) * 145
    };
  }

  shortStatus(status: string): string {
    const labels: Record<string, string> = {
      QUEUED: 'Queued',
      IN_PROGRESS: 'Progress',
      VERIFIED: 'Verified',
      FAILED_TO_VERIFY: 'Failed'
    };
    return labels[status] ?? status;
  }

  formatStatus(status: VobStatus): string {
    return this.formatAction(status);
  }

  formatAction(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  formatAuditEvent(event: AuditEvent): string {
    const actor = event.actorRole ? this.formatAction(event.actorRole) : 'System';
    const resource = event.entityType ? this.formatAction(event.entityType) : 'Resource';
    const outcome = event.outcome.toLowerCase();
    return `${actor} performed this ${resource} action with ${outcome} outcome.`;
  }
}
