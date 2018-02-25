import { Injectable } from '@angular/core';
import { Vendor } from './vendor';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';

@Injectable()
export class VendorService {
  private API_BASE_URL = '/api/v1';

  constructor(private http: HttpClient) { }

  getVendors(location: string): Observable<Vendor[]> {
    var promise = this.http.get<Vendor[]>(this.API_BASE_URL + '/vendors');
    return promise;
  }
}

