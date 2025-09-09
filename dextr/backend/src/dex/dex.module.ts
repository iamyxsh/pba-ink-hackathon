import { Module } from '@nestjs/common';
import { DexService } from './dex.service';
import { DexController } from './dex.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { OrdersModule } from '../orders/orders.module';
import { LiquidityModule } from '../liquidity/liquidity.module';
import { OracleModule } from '../oracle/oracle.module';

@Module({
  imports: [
    BlockchainModule,
    OrdersModule,
    LiquidityModule,
    OracleModule
  ],
  controllers: [DexController],
  providers: [DexService],
  exports: [DexService]
})
export class DexModule {}