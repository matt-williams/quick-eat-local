import { Injectable } from '@angular/core';
import { Vendor } from './vendor';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';

class Vendors {
  vendors: Vendor[];
}

@Injectable()
export class VendorService {
  private vendorsUrl = 'http://quick.eat.local.uk.to:8081/api/v1/vendors';

  constructor(private http: HttpClient) { }

  getVendors(location: string): Observable<Vendor[]> {
    var promise = this.http.get<Vendors>(this.vendorsUrl).map(o => {
      console.log(o);
      return o.vendors;
    });
    return promise;
  }
}

