import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Menu, Item } from '../menu';
import { MenuService } from '../menu.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  displayedColumns = ['name', 'price', 'order', 'totalPrice'];
  dataSource: MatTableDataSource<Item>;
  vendorId: string = "";
  private sub: any;
  model = []; 

  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute, private menuService: MenuService) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vendorId = params['vendorId'];
    
      this.menuService.getMenu(this.vendorId).subscribe(menu => {
        this.dataSource = new MatTableDataSource(menu.menu);
        this.model = menu.menu.map(o => {return {id: o.id, quantity: 0};});
      });
    });
  }

  onSubmit() {
    console.log(this.model.filter(o => o.quantity > 0));
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
