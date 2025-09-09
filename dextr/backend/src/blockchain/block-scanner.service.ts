import { Injectable, Logger } from '@nestjs/common';
import { BlockchainSimulator } from './blockchain-simulator.service';
import { BlockDataExtractor } from './block-data-extractor.service';
import { BlockPriceService } from './block-price.service';
import { OrdersService } from '../orders/orders.service';
import { LiquidityService } from '../liquidity/liquidity.service';
import { OrderData, LiquidityPositionData, PriceData } from '../interfaces/blockchain.interface';

@Injectable()
export class BlockScannerService {
  private readonly logger = new Logger(BlockScannerService.name);
  private currentBlockHeight: number = 0;
  private isScanning: boolean = false;

  constructor(
    private readonly blockchainSimulator: BlockchainSimulator,
    private readonly dataExtractor: BlockDataExtractor,
    private readonly blockPriceService: BlockPriceService,
    private readonly ordersService: OrdersService,
    private readonly liquidityService: LiquidityService
  ) {}

  async startBlockScanning(): Promise<void> {
    if (this.isScanning) {
      this.logger.warn('Block scanning is already running');
      return;
    }

    this.isScanning = true;
    this.logger.log('Starting block scanner');

    // Check for new blocks every 1 second
    setInterval(async () => {
      if (!this.isScanning) return;
      
      try {
        const latestBlockHeight = await this.blockchainSimulator.getLatestBlockHeight();
        
        // Process all blocks we haven't seen yet
        for (let blockHeight = this.currentBlockHeight + 1; blockHeight <= latestBlockHeight; blockHeight++) {
          await this.processBlock(blockHeight);
        }
        
        this.currentBlockHeight = latestBlockHeight;
      } catch (error) {
        this.logger.error('Error in block scanning loop:', error);
      }
    }, 1000);
  }

  stopBlockScanning(): void {
    this.isScanning = false;
    this.logger.log('Block scanning stopped');
  }

  private async processBlock(blockHeight: number): Promise<void> {
    try {
      // Fetch complete block data
      const blockData = await this.blockchainSimulator.getBlock(blockHeight);
      if (!blockData) {
        this.logger.warn(`Block ${blockHeight} not found`);
        return;
      }

      // Extract all orders from this block
      const orders = this.dataExtractor.extractOrders(blockData);
      
      // Extract all liquidity positions from this block
      const liquidityPositions = this.dataExtractor.extractLiquidityPositions(blockData);
      
      // Extract all price updates from this block
      const priceUpdates = this.dataExtractor.extractPriceUpdates(blockData);
      
      // Process extracted data
      await this.processExtractedData(orders, liquidityPositions, priceUpdates, blockHeight);
      
      if (orders.length > 0 || liquidityPositions.length > 0) {
        this.logger.log(`Processed block ${blockHeight}: ${orders.length} orders, ${liquidityPositions.length} liquidity positions`);
      }
      
    } catch (error) {
      this.logger.error(`Error processing block ${blockHeight}:`, error);
    }
  }

  private async processExtractedData(
    orders: OrderData[], 
    liquidityPositions: LiquidityPositionData[], 
    priceUpdates: PriceData[],
    blockHeight: number
  ): Promise<void> {
    // Process price updates FIRST (needed for order validation)
    for (const priceUpdate of priceUpdates) {
      this.blockPriceService.processBlockPriceUpdate(priceUpdate);
    }
    
    // Process all orders found in this block
    for (const orderData of orders) {
      await this.ordersService.processBlockOrder(orderData);
    }
    
    // Process all liquidity positions found in this block
    for (const positionData of liquidityPositions) {
      await this.liquidityService.processBlockLiquidityPosition(positionData);
    }
    
    // Run orderbook matching after processing all block data
    if (orders.length > 0) {
      await this.ordersService.runOrderbookMatching();
    }
  }

  getCurrentBlockHeight(): number {
    return this.currentBlockHeight;
  }

  isRunning(): boolean {
    return this.isScanning;
  }
}