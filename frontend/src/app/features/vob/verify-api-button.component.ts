import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { ToastService } from '../../core/api/toast.service';
import { Vob } from '../../core/models/vob.models';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { PermissionGateDirective } from '../../shared/ui/permission-gate.directive';

type VerifyState = 'idle' | 'loading' | 'success' | 'failed' | 'unavailable';

@Component({
  selector: 'app-verify-api-button',
  standalone: true,
  imports: [AppButtonComponent, PermissionGateDirective],
  template: `
    <ng-container *appHasPermission="'VOB_VERIFY'">
      @if (state() === 'unavailable') {
        <span class="verify-msg">API unavailable — use manual verification.</span>
      }
      <app-button
        variant="primary"
        [loading]="state() === 'loading'"
        [disabled]="state() === 'loading'"
        (click)="run()"
      >
        {{ buttonLabel }}
      </app-button>
    </ng-container>
  `,
  styles: `
    .verify-msg {
      display: block;
      font-size: 13px;
      color: var(--color-warning);
      margin-bottom: var(--space-2);
    }
  `
})
export class VerifyApiButtonComponent {
  @Input({ required: true }) vobId!: string;
  @Output() verified = new EventEmitter<Vob>();

  private readonly vobStore = inject(MockVobStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly state = signal<VerifyState>('idle');

  get buttonLabel(): string {
    switch (this.state()) {
      case 'loading': return 'Verifying…';
      case 'success': return 'Verified';
      case 'failed': return 'Verification failed';
      default: return 'Verify API';
    }
  }

  run(): void {
    const userId = this.userStore.currentUser()?.id;
    if (!userId) return;
    this.state.set('loading');
    this.vobStore.verifyVobWithApi(this.vobId, userId).subscribe({
      next: ({ vob, unavailable }) => {
        if (unavailable) {
          this.state.set('unavailable');
          this.toast.error('Verification API is unavailable.');
          return;
        }
        this.state.set('success');
        this.toast.success('VOB verified via API.');
        this.verified.emit(vob);
      },
      error: () => {
        this.state.set('failed');
        this.toast.error('API verification failed.');
      }
    });
  }
}
