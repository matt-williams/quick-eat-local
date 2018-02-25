export class Order {
  timestamp: number;
  id: number;
  number: number;
  items: OrderItem[];
  ready: boolean;
  complete: boolean;
}

export class OrderItem {
  qty_ordered: number;
  id: number;
  description: string;
  qty_ready: number;
}
