import express, { Request, Response } from 'express';
import { JsonDatabase, Order } from './db';
import { DydxOrderParams, createOrder } from './dydx/client'

const NODE_ENV = process.env.NODE_ENV;
const PORT = 3000;
const MARKET_ORDER_TYPE = "MARKET";

// Incoming TradingView Webhook event structure
interface WebhookEvent {
	market: string;     // 'SOL_USD' ... etc
	position: string;   // 'long', 'flat', or 'short' {{strategy.market_position}}
    side: string;       // 'buy' or 'sell' {{strategy.order.action}}
	price: string;      // {{strategy.order.price}}
	size: string;
}

// In-memory DB tracks active positions
const db = new JsonDatabase(`./data/${NODE_ENV}.json`);

// Initialize the Express application + middleware to parse POST request bodies
const app = express().use(express.json());

app.get('/', async (req: Request, res: Response) => {
    const orders = await db.readData();
    res.send(`DB: ${JSON.stringify(orders)}`);
});

app.post('/data', async (req: Request, res: Response) => {
    let order = req.body as Order;
    await db.createOrder(order);
    res.send(`created data: ${JSON.stringify(order)}`);
});

app.post('/order', async (req: Request, res: Response) => {
    let order = req.body as WebhookEvent;
    const orderParams: DydxOrderParams = {
        market: order.market,
        side: order.side,
        type: MARKET_ORDER_TYPE,
        size: order.size,
        price: order.price
    }
    await createOrder(orderParams);
    res.send(`created order: ${JSON.stringify(order)}`);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`, {NODE_ENV});
});