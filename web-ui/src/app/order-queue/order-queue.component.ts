import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { switchMap } from 'rxjs/operators';
import 'rxjs/add/operator/switchMap';
import { Order, OrderItem } from '../order';
import { OrderService } from '../order.service';

@Component({
  selector: 'app-order-queue',
  templateUrl: './order-queue.component.html',
  styleUrls: ['./order-queue.component.css']
})
export class OrderQueueComponent implements OnInit {
  displayedColumns = ['time', 'pickup', 'order', 'actions'];
  dataSource: MatTableDataSource<Order>;
  vendorId: number;
  private sub: any;
  private poll: any;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private orderService: OrderService) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vendorId = params['vendorId'];
    
      this.doQuery();
      this.doPoll();
    });
  }

  doQuery() {
    return this.orderService.getOrders(this.vendorId).subscribe(orders => {
      console.log(orders);
      this.dataSource = new MatTableDataSource(orders);
    });
  }

  doPoll() {
    if (this.poll) {
      this.poll.unsubscribe();
    }
    this.poll = Observable.interval(4000).switchMap((_1, _2) => {
      return this.orderService.getOrders(this.vendorId);
    }).subscribe(orders => {
      if (orders) {
        console.log(orders);
        this.dataSource = new MatTableDataSource(orders);
      }
    }, (e) => {
      console.log("Got error - trying again", e);
      this.doPoll();
    });
  }

  ngOnDestroy() {
    if (this.poll) {
      this.poll.unsubscribe();
    }
    this.sub.unsubscribe();
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  } 

  onItemReady(order: Order, item: OrderItem) {
    this.orderService.setItemReady(this.vendorId, order.order_id, item.item_id, item.qty_ordered).subscribe(_ => {
      console.log("Item set ready");
      this.doQuery();
    });
  }

  onOrderComplete(order: Order, item: OrderItem) {
    this.orderService.setOrderComplete(this.vendorId, order.order_id).subscribe(_ => {
      console.log("Order set complete");
      this.doQuery();
    });
  }
}
