import { Routes } from '@angular/router';
import { HomeComponent } from './features/home-component/home-component';
import { RegisterOrganization } from './features/auth/register-organization/register-organization';
import { LoginComponent } from './features/auth/login-component/login-component';
import { AdminDashboardComponent } from './features/bank-admin/admin-dashboard-component/admin-dashboard-component';
import { OrgAdminDashboardComponent } from './features/organization/org-admin-dashboard-component/org-admin-dashboard-component';
import { EmployeeDashboardComponent } from './features/employee/employee-dashboard-component/employee-dashboard-component';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'organization/register', component: RegisterOrganization },
  { path: 'auth/login', component: LoginComponent },
  { path: 'BANK_ADMIN', component: AdminDashboardComponent },
  { path: 'ORG_ADMIN', component: OrgAdminDashboardComponent },
  {path: 'EMPLOYEE', component: EmployeeDashboardComponent},
  { path: '**', redirectTo: 'home' }
];
