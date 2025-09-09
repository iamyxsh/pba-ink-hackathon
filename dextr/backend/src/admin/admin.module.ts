import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [forwardRef(() => BlockchainModule)],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}