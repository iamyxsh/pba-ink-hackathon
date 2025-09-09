import { Module, forwardRef } from '@nestjs/common';
import { BlockchainSimulator } from './blockchain-simulator.service';
import { BlockDataExtractor } from './block-data-extractor.service';
import { BlockScannerService } from './block-scanner.service';
import { BlockPriceService } from './block-price.service';
import { OrdersModule } from '../orders/orders.module';
import { LiquidityModule } from '../liquidity/liquidity.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    forwardRef(() => LiquidityModule)
  ],
  providers: [
    BlockchainSimulator,
    BlockDataExtractor,
    BlockPriceService,
    BlockScannerService
  ],
  exports: [
    BlockchainSimulator,
    BlockDataExtractor,
    BlockPriceService,
    BlockScannerService
  ]
})
export class BlockchainModule {}