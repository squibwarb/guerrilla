import { promises as fsPromises } from 'fs';

enum PositionType {
  "long",
  "short"
}

export interface Order {
  id: string;
  position: PositionType;
  amount: number;
}

export class JsonDatabase {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readData(): Promise<Order[]> {
    const data = await fsPromises.readFile(this.filePath, 'utf8');
    return JSON.parse(data);
  }

  async writeData(orders: Order[]): Promise<void> {
    const data = JSON.stringify(orders, null, 2);
    await fsPromises.writeFile(this.filePath, data, 'utf8');
  }

  async createOrder(order: Order): Promise<void> {
    const orders = await this.readData();
    orders.push(order);
    await this.writeData(orders);
  }

  async updateOrder(updatedOrder: Order): Promise<void> {
    const orders = await this.readData();
    const updatedOrders = orders.map(order => order.id === updatedOrder.id ? updatedOrder : order);
    await this.writeData(updatedOrders);
  }

  async deleteOrder(orderId: string): Promise<void> {
    const orders = await this.readData();
    const filteredOrders = orders.filter(order => order.id !== orderId);
    await this.writeData(filteredOrders);
  }
}
