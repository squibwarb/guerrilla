import express, { Request, Response } from 'express';
import config from 'config';
import { buildOrderParams, createOrder, initializeDydxClients } from './dydx/client';
import { WebhookEvent, ServerConfig } from './types';

const serverConfig: ServerConfig = config.get('server');

// Initialize the Express application + middleware to parse POST request bodies
const app = express().use(express.json());

app.post('/order', async (req: Request, res: Response) => {
    const orderParams = await buildOrderParams(req.body as WebhookEvent);
    if (!orderParams) {
        res.send(`did not create order: ${JSON.stringify(orderParams)}`);
        return;
    }
    const orderResult = await createOrder(orderParams);
    res.send(`created order: ${JSON.stringify({orderParams, orderResult})}`);
});

// Start the server
app.listen(serverConfig.port, () => {
    console.log(`server UP`, serverConfig);
});

// Initialize the global dydx clients
initializeDydxClients().catch(error => {
    console.error('Failed to initialize the dydx clients:', error);
});