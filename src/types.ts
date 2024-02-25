import { OrderSide, OrderType } from "@dydxprotocol/v4-client-js";

// The following two config types are determined by the prod/dev config files in the config dir
export interface ServerConfig {
    port: number;
}
export interface DydxConfig {
    validatorRestEndpoint: string;
    indexerRestEndpoint: string;
    indexerWebsocketEndpoint: string;
    chainId: string;
    walletAddress: string;
    mnemonic: string;
    subAccount: number;
    clientId: number;
    networkName: string;
}

// Incoming TradingView Webhook event structure
export interface WebhookEvent {
	market: string;     // 'SOL-USD' ... etc
	position: string;   // 'long', 'flat', or 'short' {{strategy.market_position}}
    side: string;       // 'buy' or 'sell' {{strategy.order.action}}
	price: string;      // {{strategy.order.price}}
	size: string;
}

// Outgoing Dydx order config
export interface DydxOrderParams {
    market: string;
    side: OrderSide;
    type: OrderType;
    size: number;
    price: number;
    reduceOnly: boolean;
}

// Active Dydx Position
export interface Position {
    market: string;
    status: string;
    side: string;
    size: string;
    maxSize: string;
    entryPrice: string;
    exitPrice: string;
    realizedPnl: string;
    unrealizedPnl: string;
    createdAt: string;
    createdAtHeight: string;
    closedAt: string;
    sumOpen: string;
    sumClose: string;
    netFunding: string;
}

export const enum PositionSide {
    LONG = 'long',
    SHORT = 'short',
    FLAT = 'flat'
}