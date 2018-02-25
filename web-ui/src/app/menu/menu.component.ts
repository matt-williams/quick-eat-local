import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Menu, Item } from '../menu';
import { MenuService } from '../menu.service';
import { OrderService } from '../order.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  displayedColumns = ['name', 'price', 'order', 'totalPrice'];
  dataSource: MatTableDataSource<Item>;
  vendorId: number;
  private sub: any;
  model = []; 

  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private menuService: MenuService,
              private orderService: OrderService) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vendorId = params['vendorId'];
    
      this.menuService.getMenu(this.vendorId).subscribe(menu => {
        this.dataSource = new MatTableDataSource(menu.menu);
        this.model = menu.menu.map(o => {return {item_id: o.id, qty_ordered: 0};});
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onSubmit() {
    this.orderService.createOrder(this.vendorId, this.model.filter(o => o.qty_ordered > 0)).subscribe(order => {
      this.router.navigate(["orders", order.order_id], {relativeTo: this.route});
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
