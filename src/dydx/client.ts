import axios from 'axios';
import config from 'config';

interface DydxConfig {
    positionId: string;
    apiUrl: string;
    apiKey: string;
    apiSecret: string;
    passphrase: string;
}

export interface DydxOrderParams {
    market: string;
    side: string;
    type: string;
    size: string;
    price: string;
    positionId?: string;
}

export const createOrder = async (orderParams: DydxOrderParams) => {
    const dydxConfig: DydxConfig = config.get('dydx');
    orderParams.positionId = dydxConfig.positionId;

    try {
        console.log("Attempting to place order", dydxConfig, orderParams);
        const response = await axios.post(dydxConfig.apiUrl, orderParams, {
            headers: {
                'Content-Type': 'application/json',
                'DYDX-API-KEY': dydxConfig.apiKey,
                'DYDX-API-SECRET': dydxConfig.apiSecret,
                'DYDX-PASSPHRASE': dydxConfig.passphrase,
            },
        });

        console.log('Order created successfully:', response.data);
    } catch (error) {
        console.error("Error creating order", error);
    }
};
