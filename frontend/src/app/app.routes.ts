import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'app',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent)
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patient-list-page.component').then((m) => m.PatientListPageComponent)
      },
      {
        path: 'patients/new',
        loadComponent: () =>
          import('./features/patients/patient-create-page.component').then((m) => m.PatientCreatePageComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./features/patients/patient-detail-page.component').then((m) => m.PatientDetailPageComponent)
      },
      {
        path: 'vob',
        loadComponent: () =>
          import('./features/vob/vob-list-page.component').then((m) => m.VobListPageComponent)
      },
      {
        path: 'vob/new',
        loadComponent: () =>
          import('./features/vob/vob-create-page.component').then((m) => m.VobCreatePageComponent)
      },
      {
        path: 'vob/:id/verify-manual',
        loadComponent: () =>
          import('./features/vob/manual-verification-form.component').then(
            (m) => m.ManualVerificationFormComponent
          )
      },
      {
        path: 'vob/:id',
        loadComponent: () =>
          import('./features/vob/vob-detail-page.component').then((m) => m.VobDetailPageComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/user-management-page.component').then(
            (m) => m.UserManagementPageComponent
          )
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit-page.component').then((m) => m.AuditPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
