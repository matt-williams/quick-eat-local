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
    
      if (this.poll) {
        this.poll.unsubscribe();
      }
      this.orderService.getOrders(this.vendorId).subscribe(orders => {
        this.dataSource = new MatTableDataSource(orders);
      });
      this.poll = Observable.interval(5000).switchMap((_1, _2) => {
        return this.orderService.getOrders(this.vendorId);
      }).subscribe(orders => {
        this.dataSource = new MatTableDataSource(orders);
      });
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
}
