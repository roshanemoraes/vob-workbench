import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class PermissionGateDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly userStore = inject(MockCurrentUserStore);

  @Input({ required: true, alias: 'appHasPermission' }) permission!: string;

  constructor() {
    effect(() => {
      this.userStore.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    this.viewContainer.clear();
    if (this.userStore.hasPermission(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
