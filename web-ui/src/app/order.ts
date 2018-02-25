export class Order {
  timestamp: number;
  vendor_id: number;
  order_id: number;
  pickup_id: number;
  items: OrderItem[];
  ready: boolean;
  complete: boolean;
}

export class OrderItem {
  qty_ordered: number;
  item_id: number;
  item_name: string;
  qty_ready: number;
}
