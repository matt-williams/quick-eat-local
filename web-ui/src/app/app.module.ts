import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule }   from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatToolbarModule, MatProgressSpinnerModule, MatInputModule, MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { AppComponent } from './app.component';
import { LocatingStatusComponent } from './locating-status/locating-status.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { MenuComponent } from './menu/menu.component';
import { VendorService } from './vendor.service';
import { MenuService } from './menu.service';

const appRoutes: Routes = [
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
  //{
  //  path: 'locations/:locationId/store/:storeId',
  //  component: StoreComponent
  //},
  { path: '',
    redirectTo: '/locating',
    pathMatch: 'full'
  },
  //{ path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LocatingStatusComponent,
    VendorListComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true }
    ),
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  providers: [VendorService, MenuService],
  bootstrap: [AppComponent]
})
export class AppModule { }
