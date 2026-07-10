import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { VobApiService } from '../../core/api/vob-api.service';
import { ToastService } from '../../core/api/toast.service';
import { Vob } from '../../core/models/vob.models';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { PermissionGateDirective } from '../../shared/ui/permission-gate.directive';
import { VerifyApiButtonComponent } from './verify-api-button.component';

@Component({
  selector: 'app-vob-action-bar',
  standalone: true,
  imports: [AppButtonComponent, PermissionGateDirective, VerifyApiButtonComponent],
  template: `
    <div class="action-bar">
      @switch (vob.status) {
        @case ('QUEUED') {
          <ng-container *appHasPermission="'VOB_CLAIM'">
            <app-button variant="primary" [loading]="claiming" (click)="claim()">Claim</app-button>
          </ng-container>
        }
        @case ('IN_PROGRESS') {
          <app-verify-api-button
            [vob]="vob"
            (verificationStarted)="actionStarted.emit()"
            (verificationFailed)="apiVerificationFailed.emit()"
            (verified)="verified.emit($event)"
          />
          <ng-container *appHasPermission="'VOB_VERIFY_MANUAL'">
            <app-button variant="secondary" (click)="goManual()">Verify Manually</app-button>
          </ng-container>
        }
      }
    </div>
  `,
  styles: `
    .action-bar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    @media (max-width: 900px) {
      .action-bar {
        justify-content: flex-start;
      }
    }
  `
})
export class VobActionBarComponent {
  @Input({ required: true }) vob!: Vob;
  @Output() updated = new EventEmitter<Vob>();
  @Output() verified = new EventEmitter<Vob>();
  @Output() actionStarted = new EventEmitter<void>();
  @Output() apiVerificationFailed = new EventEmitter<void>();

  private readonly vobStore = inject(VobApiService);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  claiming = false;

  claim(): void {
    const userId = this.userStore.currentUser()?.id;
    if (!userId) return;
    this.claiming = true;
    this.vobStore.claimVob(this.vob.id, userId).subscribe({
      next: (vob) => {
        this.toast.success('VOB claimed.');
        this.updated.emit(vob);
        this.claiming = false;
      },
      error: (err) => {
        this.toast.error(err.message ?? 'Failed to claim.');
        this.claiming = false;
      }
    });
  }

  goManual(): void {
    this.actionStarted.emit();
    this.router.navigate(['/app/vob', this.vob.id, 'verify-manual']);
  }
}
