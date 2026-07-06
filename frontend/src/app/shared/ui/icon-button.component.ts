import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="icon-btn"
      [attr.aria-label]="label"
      [title]="label"
      [disabled]="disabled"
      (click)="clicked.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: `
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 16px;
      transition: background 0.15s, color 0.15s;

      &:hover:not(:disabled) {
        background: var(--color-bg);
        color: var(--color-text);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `
})
export class IconButtonComponent {
  @Input({ required: true }) label!: string;
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
