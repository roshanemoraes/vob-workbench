import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-bar">
      <input
        type="search"
        class="search-bar__input"
        placeholder="Search by MRN or name…"
        [(ngModel)]="term"
        (ngModelChange)="onSearch()"
      />
    </div>
  `,
  styles: `
    .search-bar__input {
      width: 100%;
      max-width: 360px;
      height: 36px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      font-family: inherit;
    }
  `
})
export class PatientSearchBarComponent {
  term = '';
  @Output() search = new EventEmitter<string>();

  onSearch(): void {
    this.search.emit(this.term);
  }
}
