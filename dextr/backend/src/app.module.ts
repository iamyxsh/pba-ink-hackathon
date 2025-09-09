import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DexModule } from './dex/dex.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { OrdersModule } from './orders/orders.module';
import { LiquidityModule } from './liquidity/liquidity.module';
import { OracleModule } from './oracle/oracle.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DexModule,
    BlockchainModule,
    OrdersModule,
    LiquidityModule,
    OracleModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
