import { Module, forwardRef } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [forwardRef(() => BlockchainModule)],
  controllers: [LiquidityController],
  providers: [LiquidityService],
  exports: [LiquidityService]
})
export class LiquidityModule {}