import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule }   from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatToolbarModule, MatProgressSpinnerModule, MatInputModule, MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AppComponent } from './app.component';
import { LocatingStatusComponent } from './locating-status/locating-status.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { MenuComponent } from './menu/menu.component';
import { VendorService } from './vendor.service';
import { MenuService } from './menu.service';
import { OrderService } from './order.service';
import { WaitOrderComponent } from './wait-order/wait-order.component';
import { OrderQueueComponent } from './order-queue/order-queue.component';
import { SplashComponent } from './splash/splash.component';

const appRoutes: Routes = [
  {
    path: 'splash',
    component: SplashComponent
  },
  {
    path: 'locating',
    component: LocatingStatusComponent
  },
  {
    path: 'locations/:location',
    component: VendorListComponent
  },
  {
    path: 'vendors/:vendorId',
    component: MenuComponent
  },
  {
    path: 'vendors/:vendorId/orders/:orderId',
    component: WaitOrderComponent
  },
  {
    path: 'vendors/:vendorId/orders',
    component: OrderQueueComponent
  },
  //{
  //  path: 'locations/:locationId/store/:storeId',
  //  component: StoreComponent
  //},
  { path: '',
    redirectTo: '/splash',
    pathMatch: 'full'
  },
  //{ path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LocatingStatusComponent,
    VendorListComponent,
    MenuComponent,
    WaitOrderComponent,
    OrderQueueComponent,
    SplashComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(
      appRoutes,
      { useHash: true }
    ),
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  exports: [
    RouterModule
  ],
  providers: [VendorService, MenuService, OrderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
