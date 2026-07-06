import { Component, Input } from '@angular/core';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-vob-timeline-panel',
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state
      title="Timeline"
      message="Activity timeline will be added when audit integration is available."
    />
  `
})
export class VobTimelinePanelComponent {}
