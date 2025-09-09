import { ApiProperty } from '@nestjs/swagger';

export class AddLiquidityDto {
  @ApiProperty({
    description: 'Token pair for the liquidity pool',
    example: 'DOT/USDC',
  })
  tokenPair: string;

  @ApiProperty({
    description: 'Amount of the first token to add',
    example: 1000,
    minimum: 0.01,
  })
  tokenAAmount: number;

  @ApiProperty({
    description: 'Amount of the second token to add',
    example: 7500,
    minimum: 0.01,
  })
  tokenBAmount: number;

  @ApiProperty({
    description: 'User address or identifier',
    example: 'user_123',
  })
  user: string;

  @ApiProperty({
    description: 'Minimum LP tokens to receive (slippage protection)',
    example: 500,
    required: false,
    minimum: 0,
  })
  minLpTokens?: number;
}

export class AddLiquidityResponseDto {
  @ApiProperty({
    description: 'Unique position ID',
    example: 'pos_abc123',
  })
  positionId: string;

  @ApiProperty({
    description: 'Token pair',
    example: 'DOT/USDC',
  })
  tokenPair: string;

  @ApiProperty({
    description: 'Actual amount of first token added',
    example: 1000,
  })
  tokenAAmount: number;

  @ApiProperty({
    description: 'Actual amount of second token added',
    example: 7500,
  })
  tokenBAmount: number;

  @ApiProperty({
    description: 'LP tokens received',
    example: 547.72,
  })
  lpTokensReceived: number;

  @ApiProperty({
    description: 'Current pool reserves after addition',
    example: { tokenA: 5000, tokenB: 37500 },
  })
  poolReserves: {
    tokenA: number;
    tokenB: number;
  };

  @ApiProperty({
    description: 'Transaction hash',
    example: '0x123abc...',
  })
  txHash: string;

  @ApiProperty({
    description: 'Block number where transaction was included',
    example: 12345,
  })
  blockNumber: number;

  @ApiProperty({
    description: 'Timestamp of the transaction',
  })
  timestamp: Date;
}