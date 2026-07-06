import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="type"
      class="inline-flex min-h-9 min-w-22 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50"
      [ngClass]="variantClasses"
      [disabled]="disabled || loading"
    >
      @if (loading) {
        <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true"></span>
      }
      <span class="inline-flex items-center"><ng-content></ng-content></span>
    </button>
  `
})
export class AppButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;

  get variantClasses(): string[] {
    const variants: Record<typeof this.variant, string[]> = {
      primary: ['bg-[#030213]', 'text-white', 'border-[#030213]', 'hover:bg-[#242331]'],
      secondary: ['bg-white', 'text-[#030213]', 'border-black/10', 'hover:bg-[#e9ebef]'],
      ghost: ['bg-transparent', 'text-[#717182]', 'border-transparent', 'hover:bg-[#e9ebef]', 'hover:text-[#030213]'],
      danger: ['bg-[#d4183d]', 'text-white', 'border-[#d4183d]']
    };
    return variants[this.variant];
  }
}
