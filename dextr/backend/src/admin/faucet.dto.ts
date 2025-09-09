import { ApiProperty } from '@nestjs/swagger';

export enum TokenType {
  DOT = 'DOT',
  USDC = 'USDC'
}

export class FaucetRequestDto {
  @ApiProperty({ description: 'User wallet address', example: '5GrpknVvGGrGH3EFuURXeMrWHvbpj3VfER1oX5jFtuGbfzCE' })
  userAddress: string;

  @ApiProperty({ description: 'Token to claim', enum: TokenType, example: 'DOT' })
  token: TokenType;
}

export class FaucetResponseDto {
  @ApiProperty({ description: 'Whether the request was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Transaction hash', example: '0x123...' })
  txHash: string;

  @ApiProperty({ description: 'Amount of tokens sent', example: 100 })
  amount: number;

  @ApiProperty({ description: 'Token type sent', example: 'DOT' })
  token: string;

  @ApiProperty({ description: 'Response message', example: 'Faucet tokens sent successfully' })
  message: string;
}