import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DexService } from './dex.service';
import { BlockchainSimulator } from '../blockchain/blockchain-simulator.service';

@ApiTags('dex')
@Controller('api/dex')
export class DexController {
  constructor(
    private readonly dexService: DexService,
    private readonly blockchainSimulator: BlockchainSimulator,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get DEX system status' })
  @ApiResponse({ status: 200, description: 'System status with blockchain height, active orders, liquidity pools' })
  getSystemStatus() {
    return this.dexService.getSystemStatus();
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get all blockchain blocks' })
  @ApiResponse({ status: 200, description: 'List of all blocks with transactions' })
  async getAllBlocks() {
    return await this.blockchainSimulator.getAllBlocks();
  }

  @Get('blocks/latest')
  @ApiOperation({ summary: 'Get latest blockchain block' })
  @ApiResponse({ status: 200, description: 'Latest block with transactions including admin price updates' })
  async getLatestBlock() {
    const latestHeight = await this.blockchainSimulator.getLatestBlockHeight();
    return await this.blockchainSimulator.getBlock(latestHeight);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'System health status for all services' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date(),
      services: {
        blockchain: 'running',
        orderbook: 'running',
        oracle: 'running',
        liquidity: 'running',
      },
    };
  }
}