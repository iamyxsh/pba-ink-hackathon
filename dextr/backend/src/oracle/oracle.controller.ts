import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OracleService } from './oracle.service';

@ApiTags('oracle')
@Controller('api/oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get all current token pair prices' })
  @ApiResponse({ status: 200, description: 'List of all available token pair prices with confidence levels' })
  async getAllPrices() {
    return await this.oracleService.getAllPrices();
  }

  @Get('prices/:tokenPair')
  @ApiOperation({ summary: 'Get current price for specific token pair' })
  @ApiParam({ name: 'tokenPair', description: 'Token pair (e.g., DOT/USDC)', example: 'DOT/USDC' })
  @ApiResponse({ status: 200, description: 'Current price data for the token pair' })
  @ApiResponse({ status: 404, description: 'Token pair not found' })
  async getCurrentPrice(@Param('tokenPair') tokenPair: string) {
    return await this.oracleService.getCurrentPrice(tokenPair);
  }

  @Get('history/:tokenPair')
  @ApiOperation({ summary: 'Get price history for specific token pair' })
  @ApiParam({ name: 'tokenPair', description: 'Token pair (e.g., DOT/USDC)', example: 'DOT/USDC' })
  @ApiResponse({ status: 200, description: 'Price history for the token pair (up to 100 recent entries)' })
  getPriceHistory(@Param('tokenPair') tokenPair: string) {
    return this.oracleService.getPriceHistory(tokenPair);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Oracle service status' })
  @ApiResponse({ status: 200, description: 'Oracle service status including running state and total pairs' })
  getOracleStatus() {
    return {
      isRunning: this.oracleService.isRunningPriceFeeds(),
      totalPairs: this.oracleService.getAllPrices().then(prices => prices.length),
      timestamp: new Date(),
    };
  }
}