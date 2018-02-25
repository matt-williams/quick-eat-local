import { Injectable } from '@angular/core';
import { Order } from './order';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';

class Orders {
  orders: Order[];
}

@Injectable()
export class OrderService {
  private API_BASE_URL = 'http://quick.eat.local.uk.to:8081/api/v1';

  constructor(private http: HttpClient) { }

  createOrder(vendorId: number, order): Observable<Order> {
    return this.http.post<Order>(`${this.API_BASE_URL}/vendors/${vendorId}/orders`, order);
  }

  getOrder(vendorId: number, orderId: number): Observable<Order> {
    var promise = this.http.get<Order>(`${this.API_BASE_URL}/vendors/${vendorId}/orders/${orderId}`);
    return promise;
  }

  getOrders(vendorId: number): Observable<Order[]> {
    var promise = this.http.get<Orders>(`${this.API_BASE_URL}/vendors/${vendorId}/orders`).map(o => o.orders);
    return promise;
  }
}
