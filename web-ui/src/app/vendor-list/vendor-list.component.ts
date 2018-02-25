import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Vendor } from '../vendor';
import { VendorService } from '../vendor.service';

@Component({
  selector: 'app-vendor-list',
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.css']
})
export class VendorListComponent implements OnInit {
  displayedColumns = ['name', 'cuisine', 'link'];
  dataSource: MatTableDataSource<Vendor>;
  location: string = "";

  @ViewChild(MatSort) sort: MatSort;

  constructor(private vendorService: VendorService) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.vendorService.getVendors(this.location).subscribe(vendors => {
      console.log(vendors);
      this.dataSource = new MatTableDataSource(vendors);
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
