import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';

@Module({
  imports: [EventEmitterModule],
  controllers: [OracleController],
  providers: [OracleService],
  exports: [OracleService]
})
export class OracleModule {}