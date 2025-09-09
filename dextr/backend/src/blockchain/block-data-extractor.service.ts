import { Injectable, Logger } from '@nestjs/common';
import { BlockData, BlockTransaction, OrderData, LiquidityPositionData, PriceData } from '../interfaces/blockchain.interface';

@Injectable()
export class BlockDataExtractor {
  private readonly logger = new Logger(BlockDataExtractor.name);

  extractOrders(blockData: BlockData): OrderData[] {
    const orders: OrderData[] = [];
    
    for (const tx of blockData.transactions) {
      if (this.isOrderTransaction(tx)) {
        const order = this.parseOrderFromTransaction(tx, blockData.blockNumber);
        if (order) {
          orders.push(order);
        }
      }
    }
    
    return orders;
  }

  extractLiquidityPositions(blockData: BlockData): LiquidityPositionData[] {
    const positions: LiquidityPositionData[] = [];
    
    for (const tx of blockData.transactions) {
      if (this.isLiquidityTransaction(tx)) {
        const position = this.parseLiquidityFromTransaction(tx, blockData.blockNumber);
        if (position) {
          positions.push(position);
        }
      }
    }
    
    return positions;
  }

  extractPriceUpdates(blockData: BlockData): PriceData[] {
    const priceUpdates: PriceData[] = [];
    
    for (const tx of blockData.transactions) {
      if (this.isPriceUpdateTransaction(tx)) {
        const priceUpdate = this.parsePriceFromTransaction(tx, blockData.blockNumber);
        if (priceUpdate) {
          priceUpdates.push(priceUpdate);
        }
      }
    }
    
    return priceUpdates;
  }

  private isOrderTransaction(tx: BlockTransaction): boolean {
    return tx.data && 
           tx.contractAddress === 'orders_contract' &&
           (tx.data.type === 'place_order' || tx.data.type === 'cancel_order');
  }

  private isLiquidityTransaction(tx: BlockTransaction): boolean {
    return tx.data && 
           tx.contractAddress === 'liquidity_contract' &&
           (tx.data.type === 'add_liquidity' || tx.data.type === 'remove_liquidity');
  }

  private isPriceUpdateTransaction(tx: BlockTransaction): boolean {
    return tx.data && 
           tx.contractAddress === 'price_oracle_contract' &&
           tx.data.type === 'price_update' &&
           tx.from === 'admin_oracle';
  }

  private parseOrderFromTransaction(tx: BlockTransaction, blockNumber: number): OrderData | null {
    try {
      const orderData: OrderData = {
        orderId: tx.txHash,
        user: tx.from,
        tokenPair: tx.data.tokenPair,
        orderType: tx.data.orderType,
        amount: tx.data.amount,
        price: tx.data.price,
        status: 'open',
        timestamp: new Date(),
        blockNumber
      };

      this.logger.debug(`Extracted order: ${orderData.orderType} ${orderData.amount} ${orderData.tokenPair} @ ${orderData.price}`);
      return orderData;
    } catch (error) {
      this.logger.error(`Failed to parse order from transaction ${tx.txHash}:`, error);
      return null;
    }
  }

  private parseLiquidityFromTransaction(tx: BlockTransaction, blockNumber: number): LiquidityPositionData | null {
    try {
      const positionData: LiquidityPositionData = {
        positionId: tx.txHash,
        provider: tx.from,
        tokenPair: tx.data.tokenPair,
        tokenAAmount: tx.data.tokenAAmount,
        tokenBAmount: tx.data.tokenBAmount,
        lpTokens: tx.data.lpTokens,
        timestamp: new Date(),
        blockNumber
      };

      this.logger.debug(`Extracted liquidity: ${positionData.tokenAAmount}/${positionData.tokenBAmount} ${positionData.tokenPair}`);
      return positionData;
    } catch (error) {
      this.logger.error(`Failed to parse liquidity from transaction ${tx.txHash}:`, error);
      return null;
    }
  }

  private parsePriceFromTransaction(tx: BlockTransaction, blockNumber: number): PriceData | null {
    try {
      const priceData: PriceData = {
        tokenPair: tx.data.tokenPair,
        price: tx.data.price,
        timestamp: new Date(tx.data.timestamp),
        volume24h: tx.data.volume24h,
        change24h: tx.data.change24h,
        confidence: tx.data.confidence
      };

      this.logger.log(`💰 Extracted price from block: ${priceData.tokenPair} = ${priceData.price.toFixed(4)}`);
      return priceData;
    } catch (error) {
      this.logger.error(`Failed to parse price from transaction ${tx.txHash}:`, error);
      return null;
    }
  }
}