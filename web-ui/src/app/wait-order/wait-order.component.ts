import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { switchMap } from 'rxjs/operators';
import 'rxjs/add/operator/switchMap';
import { Order, OrderItem } from '../order';
import { OrderService } from '../order.service';

@Component({
  selector: 'app-wait-order',
  templateUrl: './wait-order.component.html',
  styleUrls: ['./wait-order.component.css']
})
export class WaitOrderComponent implements OnInit {
  displayedColumns = ['name', 'order'];
  dataSource: MatTableDataSource<OrderItem>;
  vendorId: number;
  orderId: number;
  private sub: any;
  private poll: any;
  order: Order;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private orderService: OrderService) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vendorId = params['vendorId'];
      this.orderId = params['orderId'];
    
      if (this.poll) {
        this.poll.unsubscribe();
      }
      this.orderService.getOrder(this.vendorId, this.orderId).subscribe(order => {
        console.log(order);
        this.order = order;
        this.dataSource = new MatTableDataSource(order.items);
      });
      this.poll = Observable.interval(5000).switchMap((_1, _2) => {
        return this.orderService.getOrder(this.vendorId, this.orderId);
      }).subscribe(order => {
        console.log(order);
        this.order = order;
        this.dataSource = new MatTableDataSource(order.items);
      });
    });
  }

  ngOnDestroy() {
    if (this.poll) {
      this.poll.unsubscribe();
    }
    this.sub.unsubscribe();
  }

  get readyOrders(): number {
    return (this.order != null) ? this.order.items.reduce((a, o) => a + o.qty_ready, 0) : 1;
  }

  get totalOrders(): number {
    return (this.order != null) ? this.order.items.reduce((a, o) => a + o.qty_ordered, 0) : 1;
  }
}
