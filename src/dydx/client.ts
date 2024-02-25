import config from 'config';
import { WebhookEvent, Position, PositionSide, DydxOrderParams, DydxConfig } from '../types';
import { 
    IndexerConfig, 
    IndexerClient, 
    SubaccountClient,
    LocalWallet,
    BECH32_PREFIX,
    DenomConfig,
    BroadcastOptions,
    ValidatorConfig,
    CompositeClient, 
    Network, 
    OrderType,
    PositionStatus,
    OrderSide
} from "@dydxprotocol/v4-client-js";

declare global {
    var indexerClient: IndexerClient | undefined;
    var compositeClient: CompositeClient | undefined;
    var wallet: LocalWallet | undefined;
    var subAccount: SubaccountClient | undefined;
}

const dydxConfig: DydxConfig = config.get('dydx');

export const initializeDydxClients = async () => {
    console.log('initializing dydx clients with config', dydxConfig);

    const indexerConfig = new IndexerConfig(
        dydxConfig.indexerRestEndpoint,
        dydxConfig.indexerWebsocketEndpoint
    );

    const network = new Network(
        dydxConfig.networkName,
        indexerConfig,
        new ValidatorConfig(
            dydxConfig.validatorRestEndpoint,
            dydxConfig.chainId,
            {
                USDC_DENOM: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
                USDC_DECIMALS: 6,
                USDC_GAS_DENOM: 'uusdc',
                CHAINTOKEN_DENOM: 'USDC',
                CHAINTOKEN_DECIMALS: 6
            } as DenomConfig,
            {
                broadcastPollIntervalMs: 1000,
                broadcastTimeoutMs: 1000
            } as BroadcastOptions
        )
    );

    global.wallet = await LocalWallet.fromMnemonic(dydxConfig.mnemonic, BECH32_PREFIX);
    global.subAccount = new SubaccountClient(global.wallet, 0);
    global.indexerClient = new IndexerClient(indexerConfig);
    global.compositeClient = await CompositeClient.connect(network);

    console.log('dydx clients initialized', {global});
    return;
}

export const createOrder = async (orderParams: DydxOrderParams) => {
    console.log("createOrder received orderParams: ", {orderParams});

    if (!global.compositeClient || !global.subAccount) {
        console.error("compositeClient and/or subAccount undefined", {global});
        return;
    }

    try {
        const tx = await global.compositeClient.placeOrder(
            global.subAccount,
            orderParams.market,
            orderParams.type,
            orderParams.side,
            orderParams.price,
            orderParams.size,
            dydxConfig.clientId,
            undefined,
            undefined,
            undefined,
            undefined,
            orderParams.reduceOnly,
            undefined
        );

        console.log("transaction result", tx);
    } catch (error) {
        console.error("Failed to create order", {error});
    }
};

export const getAllOpenPositions = async (): Promise<Position[]> => {
    if (!global.indexerClient) {
        console.error("indexer client undefined");
        return []
    }
    try {
        const response = await global.indexerClient.account.getSubaccountPerpetualPositions(dydxConfig.walletAddress, dydxConfig.subAccount);
        const positions: Position[] = response.positions;
        return positions.filter(p => p.status === PositionStatus.OPEN);
    } catch (error) {
        console.error("Error fetching open positions", {error});
    }
    return []
};

export const getOpenPositionForMarket = async (market: string): Promise<Position|undefined> => {
    const allPositions = await getAllOpenPositions();
    return allPositions.find(p => p.market == market);
};

export const buildOrderParams = async (event: WebhookEvent): Promise<DydxOrderParams|undefined> => {
    console.log("WebhookEvent", {event});

    // default order params match webhook event exactly
    let orderParams: DydxOrderParams = {
        market: event.market,
        side: event.side as OrderSide,
        type: OrderType.MARKET,
        size: parseInt(event.size),
        price: parseFloat(event.price),
        reduceOnly: false
    }
    console.log("orderParams initially", {orderParams});

    // obtain current/open position for the given market, if it exists
    const currPosition = await getOpenPositionForMarket(event.market);
    console.log("currPosition", {currPosition});

    // if the incoming order is 'flat', then the strategy is indicating that we should not have any positions open for this market
    if (event.position === PositionSide.FLAT) {
        // if there is an active position for this market, then configure this order to negate it (close it)
        // else return early which will result in no order placed
        if (currPosition) {
            console.log(`strategy side is ${PositionSide.FLAT} so will close the existing position`);
            orderParams.side = currPosition.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY;
            orderParams.size = parseInt(currPosition.size);
            orderParams.reduceOnly = true;
        } else {
            console.log(`strategy side is ${PositionSide.FLAT} and no existing position so will not place any order`);
            return;
        }
    }

    // If the Side has changed we must reverse the current position
    if (currPosition && (currPosition.side.toLowerCase() !== event.position.toLowerCase())) {
        console.log(`strategy side has changed from ${currPosition.side} to ${event.side} so position will be reversed`);
        orderParams.size += Math.abs(parseInt(currPosition.size));
    }

    // If none of the above modifications occurred, then either there is no current/open position 
    // for the given market OR there is one but it has the same Side as the incoming order.
    // In either case, the orderParams returned here are the default which match the webhook event.
    console.log("orderParams after", {orderParams});
    return orderParams;
};