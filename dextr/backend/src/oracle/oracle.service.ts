import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PriceData } from '../interfaces/blockchain.interface';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);
  private priceFeeds: Map<string, PriceData> = new Map();
  private priceHistory: Map<string, PriceData[]> = new Map();
  private volatilitySettings: Map<string, number> = new Map();
  private isRunning: boolean = false;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializePriceFeeds();
    this.initializeVolatilitySettings();
  }

  private initializePriceFeeds(): void {
    // Initialize DOT/USDC pair only for now
    const initialPrice = { tokenPair: 'DOT/USDC', price: 7.45, volume24h: 1250000 };

    const priceData: PriceData = {
      tokenPair: initialPrice.tokenPair,
      price: initialPrice.price,
      timestamp: new Date(),
      volume24h: initialPrice.volume24h,
      change24h: 0,
      confidence: 0.98
    };
    
    this.priceFeeds.set(initialPrice.tokenPair, priceData);
    this.priceHistory.set(initialPrice.tokenPair, [priceData]);
  }

  private initializeVolatilitySettings(): void {
    // Set volatility levels for DOT/USDC
    this.volatilitySettings.set('DOT/USDC', 0.02); // 2% volatility
  }

  async startPriceFeeds(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Price feeds are already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting oracle price feeds for DOT/USDC every 6 seconds');

    // Update DOT/USDC every 6 seconds (synchronized with block production)
    setInterval(() => {
      if (this.isRunning) {
        this.updateAndEmitPrice('DOT/USDC');
      }
    }, 6000); // 6 seconds to match block timing
  }

  private updateAndEmitPrice(tokenPair: string): void {
    const newPrice = this.generatePriceUpdate(tokenPair);
    if (newPrice) {
      this.priceFeeds.set(tokenPair, newPrice);
      
      // Store price history (keep last 100 entries)
      let history = this.priceHistory.get(tokenPair) || [];
      history.push(newPrice);
      if (history.length > 100) {
        history = history.slice(-100);
      }
      this.priceHistory.set(tokenPair, history);

      this.logger.log(`📈 Oracle price update: ${tokenPair} = ${newPrice.price.toFixed(4)} (${newPrice.change24h.toFixed(2)}%)`);
      
      // Emit price update event for admin to pick up
      this.eventEmitter.emit('oracle.priceUpdate', newPrice);
    }
  }

  private generatePriceUpdate(tokenPair: string): PriceData | null {
    const currentPrice = this.priceFeeds.get(tokenPair);
    if (!currentPrice) {
      return null;
    }

    const volatility = this.volatilitySettings.get(tokenPair) || 0.02;
    
    // Generate realistic price movement using random walk
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const priceChange = currentPrice.price * volatility * randomFactor * 0.1; // Scale down for realistic movements
    const newPrice = Math.max(0.0001, currentPrice.price + priceChange);
    
    // Calculate 24h change (simplified)
    const change24h = ((newPrice - currentPrice.price) / currentPrice.price) * 100;
    
    // Generate volume with some randomness
    const baseVolume = 1000000;
    const volumeVariation = 0.1; // 10% variation
    const volume24h = baseVolume * (1 + (Math.random() - 0.5) * volumeVariation);
    
    return {
      tokenPair,
      price: parseFloat(newPrice.toFixed(6)),
      timestamp: new Date(),
      volume24h: Math.floor(volume24h),
      change24h: parseFloat(change24h.toFixed(4)),
      confidence: 0.95 + Math.random() * 0.05 // 95-100% confidence
    };
  }

  async getCurrentPrice(tokenPair: string): Promise<PriceData | null> {
    return this.priceFeeds.get(tokenPair) || null;
  }

  async getAllPrices(): Promise<PriceData[]> {
    return Array.from(this.priceFeeds.values());
  }

  getPriceHistory(tokenPair: string): PriceData[] {
    return this.priceHistory.get(tokenPair) || [];
  }

  stopPriceFeeds(): void {
    this.isRunning = false;
    this.logger.log('Oracle price feeds stopped');
  }

  isRunningPriceFeeds(): boolean {
    return this.isRunning;
  }

  // Utility method to check if price is within acceptable range
  isPriceReasonable(tokenPair: string, price: number): boolean {
    const currentPrice = this.priceFeeds.get(tokenPair);
    if (!currentPrice) {
      return true; // No reference price, allow it
    }

    const maxDeviation = 0.1; // 10% max deviation
    const priceDeviation = Math.abs(price - currentPrice.price) / currentPrice.price;
    
    return priceDeviation <= maxDeviation;
  }
}