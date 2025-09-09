import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LiquidityService } from './liquidity.service';
import { AddLiquidityDto, AddLiquidityResponseDto } from './dto/add-liquidity.dto';

@ApiTags('liquidity')
@Controller('api/liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('positions')
  @ApiOperation({ summary: 'Get all liquidity positions' })
  @ApiResponse({ status: 200, description: 'List of all liquidity positions with token amounts and LP tokens' })
  getAllPositions() {
    return this.liquidityService.getAllPositions();
  }

  @Get('positions/:positionId')
  @ApiOperation({ summary: 'Get specific liquidity position by ID' })
  @ApiParam({ name: 'positionId', description: 'Position ID', example: 'pos_123' })
  @ApiResponse({ status: 200, description: 'Liquidity position details including token amounts and LP tokens' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  getPosition(@Param('positionId') positionId: string) {
    return this.liquidityService.getPosition(positionId);
  }

  @Get('pools')
  @ApiOperation({ summary: 'Get all liquidity pools' })
  @ApiResponse({ status: 200, description: 'List of all liquidity pools with reserves and LP token supply' })
  getAllPools() {
    const pools = this.liquidityService.getAllPools();
    return Array.from(pools.entries()).map(([pair, pool]) => ({
      ...pool,
      pair,
    }));
  }

  @Get('pools/:tokenPair')
  @ApiOperation({ summary: 'Get specific liquidity pool by token pair' })
  @ApiParam({ name: 'tokenPair', description: 'Token pair (e.g., DOT/USDC)', example: 'DOT/USDC' })
  @ApiResponse({ status: 200, description: 'Liquidity pool details including reserves and LP token supply' })
  getPool(@Param('tokenPair') tokenPair: string) {
    return this.liquidityService.getPool(tokenPair);
  }

  @Get('pools/:tokenPair/stats')
  @ApiOperation({ summary: 'Get liquidity pool statistics' })
  @ApiParam({ name: 'tokenPair', description: 'Token pair (e.g., DOT/USDC)', example: 'DOT/USDC' })
  @ApiResponse({ status: 200, description: 'Pool statistics including APY, volume, and fees' })
  getPoolStats(@Param('tokenPair') tokenPair: string) {
    return this.liquidityService.getPoolStats(tokenPair);
  }

  @Post('add')
  @ApiOperation({ 
    summary: 'Add liquidity to a pool',
    description: 'Add liquidity to an existing pool or create a new pool. Calculates optimal token amounts and issues LP tokens based on the constant product formula.'
  })
  @ApiBody({ type: AddLiquidityDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Liquidity added successfully, LP tokens issued',
    type: AddLiquidityResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input or slippage too high' })
  @ApiResponse({ status: 500, description: 'Failed to submit transaction to blockchain' })
  async addLiquidity(@Body() addLiquidityDto: AddLiquidityDto): Promise<AddLiquidityResponseDto> {
    return this.liquidityService.addLiquidity(addLiquidityDto);
  }
}