import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EligibilityResult } from '../../core/models/vob.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-eligibility-result-panel',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
  template: `
    @if (!result) {
      <app-empty-state
        title="No eligibility result"
        message="No eligibility result recorded yet."
      />
    } @else {
      <dl class="detail-grid">
        <div class="detail-item"><dt>Verification method</dt><dd>{{ result.verificationMethod ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Coverage active</dt><dd>{{ formatBool(result.coverageActive) }}</dd></div>
        <div class="detail-item"><dt>Network status</dt><dd>{{ result.networkStatus ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Copay</dt><dd>{{ formatMoney(result.copay) }}</dd></div>
        <div class="detail-item"><dt>Coinsurance</dt><dd>{{ formatPercent(result.coinsurancePercent) }}</dd></div>
        <div class="detail-item"><dt>Deductible total</dt><dd>{{ formatMoney(result.deductibleTotal) }}</dd></div>
        <div class="detail-item"><dt>Deductible met</dt><dd>{{ formatMoney(result.deductibleMet) }}</dd></div>
        <div class="detail-item"><dt>OOP max</dt><dd>{{ formatMoney(result.oopMax) }}</dd></div>
        <div class="detail-item"><dt>OOP met</dt><dd>{{ formatMoney(result.oopMet) }}</dd></div>
        <div class="detail-item"><dt>Reference number</dt><dd>{{ result.referenceNumber ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Failure reason</dt><dd>{{ result.failureReason ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Notes</dt><dd>{{ result.notes ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Verified by</dt><dd>{{ result.verifiedByUserId ?? '-' }}</dd></div>
        <div class="detail-item"><dt>Verified at</dt><dd>{{ result.verifiedAt ? (result.verifiedAt | date: 'short') : '-' }}</dd></div>
      </dl>
    }
  `
})
export class EligibilityResultPanelComponent {
  @Input() result: EligibilityResult | null = null;

  formatBool(value: boolean | null): string {
    if (value === null) return '-';
    return value ? 'Yes' : 'No';
  }

  formatMoney(value: number | null): string {
    if (value === null) return '-';
    return `$${value.toFixed(2)}`;
  }

  formatPercent(value: number | null): string {
    if (value === null) return '-';
    return `${value}%`;
  }
}
