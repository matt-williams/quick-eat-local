import { Injectable } from '@angular/core';
import { Menu } from './menu';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';

@Injectable()
export class MenuService {
  private API_BASE_URL = '/api/v1';

  constructor(private http: HttpClient) { }

  getMenu(vendorId: number): Observable<Menu> {
    var promise = this.http.get<Menu>(`${this.API_BASE_URL}/vendors/${vendorId}/menu`);
    return promise;
  }
}
