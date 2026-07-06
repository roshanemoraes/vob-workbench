import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VobStatus } from '../../core/models/vob.models';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      class="flex min-h-32 flex-col gap-1 rounded-xl border border-black/10 bg-white p-6 text-[#030213] no-underline transition-all hover:-translate-y-0.5 hover:border-[#030213]/25 hover:shadow-md hover:no-underline"
      [routerLink]="link"
      [queryParams]="queryParams"
    >
      <span class="mb-2 flex items-center justify-between">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e9ebef] text-xs font-semibold text-[#030213]">{{ symbol }}</span>
        <span class="text-base text-[#717182]">></span>
      </span>
      <span class="text-3xl font-semibold leading-tight">{{ count }}</span>
      <span class="text-sm font-medium text-[#717182]">{{ label }}</span>
    </a>
  `
})
export class MetricTileComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) count!: number;
  @Input({ required: true }) symbol!: string;
  @Input({ required: true }) link!: string;
  @Input() queryParams: { status?: VobStatus } = {};
}
