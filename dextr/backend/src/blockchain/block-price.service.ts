import { Injectable, Logger } from '@nestjs/common';
import { PriceData } from '../interfaces/blockchain.interface';

@Injectable()
export class BlockPriceService {
  private readonly logger = new Logger(BlockPriceService.name);
  private blockPrices: Map<string, PriceData> = new Map();
  private priceHistory: Map<string, PriceData[]> = new Map();

  processBlockPriceUpdate(priceData: PriceData): void {
    this.blockPrices.set(priceData.tokenPair, priceData);
    
    // Store price history (keep last 50 entries)
    let history = this.priceHistory.get(priceData.tokenPair) || [];
    history.push(priceData);
    if (history.length > 50) {
      history = history.slice(-50);
    }
    this.priceHistory.set(priceData.tokenPair, history);

    this.logger.log(`📊 Block price updated: ${priceData.tokenPair} = ${priceData.price.toFixed(4)}`);
  }

  getCurrentBlockPrice(tokenPair: string): PriceData | null {
    return this.blockPrices.get(tokenPair) || null;
  }

  getAllBlockPrices(): PriceData[] {
    return Array.from(this.blockPrices.values());
  }

  getBlockPriceHistory(tokenPair: string): PriceData[] {
    return this.priceHistory.get(tokenPair) || [];
  }

  hasPrice(tokenPair: string): boolean {
    return this.blockPrices.has(tokenPair);
  }
}