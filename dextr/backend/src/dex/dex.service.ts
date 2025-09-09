import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BlockScannerService } from '../blockchain/block-scanner.service';
import { OracleService } from '../oracle/oracle.service';
import { OrdersService } from '../orders/orders.service';
import { LiquidityService } from '../liquidity/liquidity.service';

@Injectable()
export class DexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DexService.name);

  constructor(
    private readonly blockScanner: BlockScannerService,
    private readonly oracleService: OracleService,
    private readonly ordersService: OrdersService,
    private readonly liquidityService: LiquidityService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async start(): Promise<void> {
    try {
      this.logger.log('🚀 Starting DEX Backend System...');

      // Start oracle price feeds first
      await this.oracleService.startPriceFeeds();
      this.logger.log('✅ Oracle price feeds started');

      // Give a moment for initial prices to be set
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start scanning blocks
      await this.blockScanner.startBlockScanning();
      this.logger.log('✅ Block scanner started');

      this.logger.log('🎯 DEX backend is running and processing blocks');
      this.logger.log('📊 Monitoring blockchain for orders and liquidity positions...');

      // Log system status every 30 seconds
      this.startStatusLogging();

    } catch (error) {
      this.logger.error('❌ Failed to start DEX backend:', error);
      throw error;
    }
  }

  private startStatusLogging(): void {
    setInterval(() => {
      this.logSystemStatus();
    }, 30000); // Every 30 seconds
  }

  private logSystemStatus(): void {
    try {
      const currentBlock = this.blockScanner.getCurrentBlockHeight();
      const isScanning = this.blockScanner.isRunning();
      const isPriceFeeding = this.oracleService.isRunningPriceFeeds();
      
      const allOrders = this.ordersService.getAllOrders();
      const allOrderbooks = this.ordersService.getAllOrderbooks();
      const allPositions = this.liquidityService.getAllPositions();
      const allPools = this.liquidityService.getAllPools();

      const openOrders = allOrders.filter(order => order.status === 'open').length;
      const filledOrders = allOrders.filter(order => order.status === 'filled').length;

      this.logger.log(`📊 Status - Block: ${currentBlock} | Scanner: ${isScanning ? '✅' : '❌'} | Oracle: ${isPriceFeeding ? '✅' : '❌'}`);
      this.logger.log(`📈 Orders: ${allOrders.length} total (${openOrders} open, ${filledOrders} filled) | Orderbooks: ${allOrderbooks.size}`);
      this.logger.log(`💧 Liquidity: ${allPositions.length} positions | Pools: ${allPools.size}`);

      // Log orderbook status
      for (const [tokenPair, orderbook] of allOrderbooks) {
        const bidLevels = orderbook.bids.length;
        const askLevels = orderbook.asks.length;
        const bestBid = bidLevels > 0 ? orderbook.bids[0].price : 0;
        const bestAsk = askLevels > 0 ? orderbook.asks[0].price : 0;
        
        this.logger.debug(`📊 ${tokenPair}: ${bidLevels} bids, ${askLevels} asks | Best: ${bestBid} / ${bestAsk}`);
      }

    } catch (error) {
      this.logger.error('Error logging system status:', error);
    }
  }

  async stop(): Promise<void> {
    this.logger.log('🛑 Stopping DEX backend...');
    
    this.blockScanner.stopBlockScanning();
    this.oracleService.stopPriceFeeds();
    
    this.logger.log('✅ DEX backend stopped');
  }

  getSystemStatus(): any {
    return {
      blockHeight: this.blockScanner.getCurrentBlockHeight(),
      isScanning: this.blockScanner.isRunning(),
      isPriceFeeding: this.oracleService.isRunningPriceFeeds(),
      totalOrders: this.ordersService.getAllOrders().length,
      totalOrderbooks: this.ordersService.getAllOrderbooks().size,
      totalPositions: this.liquidityService.getAllPositions().length,
      totalPools: this.liquidityService.getAllPools().size,
      timestamp: new Date()
    };
  }
}