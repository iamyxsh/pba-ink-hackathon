import { Injectable, Logger } from '@nestjs/common';
import { OrderData } from '../interfaces/blockchain.interface';
import { BlockPriceService } from '../blockchain/block-price.service';

export interface Order {
  orderId: string;
  user: string;
  tokenPair: string;
  orderType: 'buy' | 'sell';
  amount: number;
  price: number;
  remainingAmount: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  timestamp: Date;
  blockNumber: number;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
  orders: Order[];
}

export interface Orderbook {
  bids: OrderbookLevel[]; // Buy orders (descending price)
  asks: OrderbookLevel[]; // Sell orders (ascending price)
  tokenPair: string;
  lastUpdated: Date;
}

export interface MatchResult {
  buyOrder: Order;
  sellOrder: Order;
  matchedAmount: number;
  matchedPrice: number;
  timestamp: Date;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Map<string, Order> = new Map();
  private orderbooks: Map<string, Orderbook> = new Map();

  constructor(private readonly blockPriceService: BlockPriceService) {}

  async processBlockOrder(orderData: OrderData): Promise<void> {
    try {
      // Convert to internal order format
      const order: Order = {
        orderId: orderData.orderId,
        user: orderData.user,
        tokenPair: orderData.tokenPair,
        orderType: orderData.orderType,
        amount: orderData.amount,
        price: orderData.price,
        remainingAmount: orderData.amount,
        status: 'open',
        timestamp: orderData.timestamp,
        blockNumber: orderData.blockNumber
      };

      // Validate order price against block price
      const isValidPrice = this.validateOrderPrice(order);
      if (!isValidPrice) {
        this.logger.warn(`Order ${order.orderId} rejected - price outside valid range or no block price available`);
        return;
      }

      // Store order
      this.orders.set(order.orderId, order);

      // Add to orderbook
      this.addToOrderbook(order);

      this.logger.debug(`Processed order: ${order.orderType} ${order.amount} ${order.tokenPair} @ ${order.price}`);
    } catch (error) {
      this.logger.error('Error processing block order:', error);
    }
  }

  private validateOrderPrice(order: Order): boolean {
    try {
      const blockPrice = this.blockPriceService.getCurrentBlockPrice(order.tokenPair);
      if (!blockPrice) {
        this.logger.warn(`No block price available for ${order.tokenPair}, rejecting order`);
        return false;
      }

      const priceDeviation = Math.abs(order.price - blockPrice.price) / blockPrice.price;
      const maxDeviation = 0.05; // 5% max deviation

      if (priceDeviation > maxDeviation) {
        this.logger.warn(`Order price ${order.price} deviates ${(priceDeviation * 100).toFixed(2)}% from block price ${blockPrice.price}`);
        return false;
      }

      this.logger.debug(`✅ Order price validated against block price: ${order.price} vs ${blockPrice.price}`);
      return true;
    } catch (error) {
      this.logger.error('Error validating order price:', error);
      return false; // Reject order if validation fails
    }
  }

  private addToOrderbook(order: Order): void {
    let orderbook = this.orderbooks.get(order.tokenPair);
    if (!orderbook) {
      orderbook = {
        bids: [],
        asks: [],
        tokenPair: order.tokenPair,
        lastUpdated: new Date()
      };
      this.orderbooks.set(order.tokenPair, orderbook);
    }

    if (order.orderType === 'buy') {
      this.addToBids(orderbook, order);
    } else {
      this.addToAsks(orderbook, order);
    }

    orderbook.lastUpdated = new Date();
  }

  private addToBids(orderbook: Orderbook, order: Order): void {
    let level = orderbook.bids.find(l => l.price === order.price);
    if (!level) {
      level = { price: order.price, quantity: 0, orders: [] };
      orderbook.bids.push(level);
      // Sort bids in descending order (highest price first)
      orderbook.bids.sort((a, b) => b.price - a.price);
    }
    level.orders.push(order);
    level.quantity += order.remainingAmount;
  }

  private addToAsks(orderbook: Orderbook, order: Order): void {
    let level = orderbook.asks.find(l => l.price === order.price);
    if (!level) {
      level = { price: order.price, quantity: 0, orders: [] };
      orderbook.asks.push(level);
      // Sort asks in ascending order (lowest price first)
      orderbook.asks.sort((a, b) => a.price - b.price);
    }
    level.orders.push(order);
    level.quantity += order.remainingAmount;
  }

  async runOrderbookMatching(): Promise<void> {
    for (const [tokenPair, orderbook] of this.orderbooks) {
      await this.matchOrderbook(tokenPair, orderbook);
    }
  }

  private async matchOrderbook(tokenPair: string, orderbook: Orderbook): Promise<void> {
    const matches: MatchResult[] = [];

    // Simple matching: match highest bid with lowest ask if bid >= ask
    while (orderbook.bids.length > 0 && orderbook.asks.length > 0) {
      const bestBid = orderbook.bids[0];
      const bestAsk = orderbook.asks[0];

      if (bestBid.price < bestAsk.price) {
        break; // No more matches possible
      }

      // Get the first order from each level
      const buyOrder = bestBid.orders[0];
      const sellOrder = bestAsk.orders[0];

      if (!buyOrder || !sellOrder) {
        break;
      }

      // Calculate match details
      const matchedAmount = Math.min(buyOrder.remainingAmount, sellOrder.remainingAmount);
      const matchedPrice = sellOrder.price; // Price priority to seller

      // Create match result
      const match: MatchResult = {
        buyOrder,
        sellOrder,
        matchedAmount,
        matchedPrice,
        timestamp: new Date()
      };

      matches.push(match);

      // Update order amounts
      buyOrder.remainingAmount -= matchedAmount;
      sellOrder.remainingAmount -= matchedAmount;

      // Update orderbook levels
      bestBid.quantity -= matchedAmount;
      bestAsk.quantity -= matchedAmount;

      // Remove completed orders
      if (buyOrder.remainingAmount === 0) {
        buyOrder.status = 'filled';
        bestBid.orders.shift();
        if (bestBid.orders.length === 0) {
          orderbook.bids.shift();
        }
      } else {
        buyOrder.status = 'partially_filled';
      }

      if (sellOrder.remainingAmount === 0) {
        sellOrder.status = 'filled';
        bestAsk.orders.shift();
        if (bestAsk.orders.length === 0) {
          orderbook.asks.shift();
        }
      } else {
        sellOrder.status = 'partially_filled';
      }
    }

    if (matches.length > 0) {
      this.logger.log(`Matched ${matches.length} orders for ${tokenPair}`);
      // Here you would send these matches to the blockchain simulator
      await this.sendMatchesToBlockchain(matches);
    }
  }

  private async sendMatchesToBlockchain(matches: MatchResult[]): Promise<void> {
    // For now, just log the matches
    // In a real implementation, this would send transaction data back to the blockchain
    for (const match of matches) {
      this.logger.log(`Match: ${match.matchedAmount} ${match.buyOrder.tokenPair} @ ${match.matchedPrice} (Buy: ${match.buyOrder.user}, Sell: ${match.sellOrder.user})`);
    }
  }

  getOrderbook(tokenPair: string): Orderbook | undefined {
    return this.orderbooks.get(tokenPair);
  }

  getAllOrderbooks(): Map<string, Orderbook> {
    return this.orderbooks;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }
}