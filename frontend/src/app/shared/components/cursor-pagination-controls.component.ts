import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from '../ui/app-button.component';

@Component({
  selector: 'app-cursor-pagination',
  standalone: true,
  imports: [AppButtonComponent],
  template: `
    <div class="pagination">
      <app-button variant="secondary" [disabled]="!hasMore" (click)="next.emit()">
        Load more
      </app-button>
      @if (totalShown) {
        <span class="pagination__info">Showing {{ totalShown }} items</span>
      }
    </div>
  `,
  styles: `
    .pagination {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    .pagination__info {
      font-size: 13px;
      color: var(--color-text-muted);
    }
  `
})
export class CursorPaginationControlsComponent {
  @Input() hasMore = false;
  @Input() totalShown = 0;
  @Output() next = new EventEmitter<void>();
}
