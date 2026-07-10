import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { VobApiService } from '../../core/api/vob-api.service';
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
    <ng-container *appHasPermission="'VOB_VERIFY_API'">
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
  @Input({ required: true }) vob!: Vob;
  @Output() verified = new EventEmitter<Vob>();
  @Output() verificationStarted = new EventEmitter<void>();
  @Output() verificationFailed = new EventEmitter<void>();

  private readonly vobStore = inject(VobApiService);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly state = signal<VerifyState>('idle');

  get buttonLabel(): string {
    switch (this.state()) {
      case 'loading': return 'Verifying...';
      case 'success': return 'Verified';
      case 'failed': return 'Verification failed';
      default: return 'Verify API';
    }
  }

  run(): void {
    const userId = this.userStore.currentUser()?.id;
    if (!userId) return;
    this.state.set('loading');
    this.verificationStarted.emit();
    this.vobStore.verifyVobWithApi(this.vob.id, userId, this.vob.version).subscribe({
      next: ({ vob, unavailable }) => {
        if (unavailable) {
          this.state.set('unavailable');
          this.toast.error('Verification API is unavailable.');
          this.verificationFailed.emit();
          return;
        }
        this.state.set('success');
        this.toast.success('VOB verified via API.');
        if (vob) {
          this.verified.emit(vob);
        }
      },
      error: () => {
        this.state.set('failed');
        this.toast.error('API verification failed.');
        this.verificationFailed.emit();
      }
    });
  }
}
