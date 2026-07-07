import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { InsurancePolicy } from '../../core/models/vob.models';

@Component({
  selector: 'app-insurance-policy-summary',
  standalone: true,
  imports: [DatePipe],
  template: `
    <dl class="detail-grid">
      <div class="detail-item"><dt>Payer</dt><dd>{{ insurance.payerName }}</dd></div>
      <div class="detail-item"><dt>Member ID</dt><dd>{{ insurance.memberId }}</dd></div>
      <div class="detail-item"><dt>Group number</dt><dd>{{ insurance.groupNumber }}</dd></div>
      <div class="detail-item"><dt>Plan type</dt><dd>{{ insurance.planType }}</dd></div>
      <div class="detail-item"><dt>Relationship</dt><dd>{{ insurance.relationshipToSubscriber }}</dd></div>
      <div class="detail-item"><dt>Coverage start</dt><dd>{{ insurance.coverageStart | date: 'mediumDate' }}</dd></div>
      <div class="detail-item"><dt>Coverage end</dt><dd>{{ insurance.coverageEnd | date: 'mediumDate' }}</dd></div>
    </dl>
  `
})
export class InsurancePolicySummaryComponent {
  @Input({ required: true }) insurance!: InsurancePolicy;
}
