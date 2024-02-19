import express, { Request, Response } from 'express';
import { JsonDatabase, Order } from './db';

const app = express();
const PORT = 3000;
const ENVIRONMENT = "production";
const db = new JsonDatabase(`./data/${ENVIRONMENT}.json`);

// Middleware to parse the body of POST requests
app.use(express.json());

app.get('/', async (req: Request, res: Response) => {
    const orders = await db.readData();
    res.send(`DB: ${JSON.stringify(orders)}`);
});

app.post('/order', async (req: Request, res: Response) => {
    let order = req.body as Order;
    await db.createOrder(order);
    res.send(`created order: ${JSON.stringify(order)}`);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});