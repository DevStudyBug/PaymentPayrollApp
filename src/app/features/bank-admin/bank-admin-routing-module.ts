// bank-admin-routing.module.ts

import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard-component/admin-dashboard-component';


const routes: Routes = [

  {
    path: '',
    component: AdminDashboardComponent,
    data: { title: 'Bank Admin Dashboard' }
  }

];

@NgModule({

  imports: [RouterModule.forChild(routes)],

  exports: [RouterModule]

})

export class BankAdminRoutingModule { }


export const BANK_ADMIN_ROUTES: Routes = [

  {

    path: '',

    component: AdminDashboardComponent,

    data: { title: 'Bank Admin Dashboard' }

  }

];