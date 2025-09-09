import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { LiquidityPositionData, BlockTransaction } from '../interfaces/blockchain.interface';
import { BlockchainSimulator } from '../blockchain/blockchain-simulator.service';
import type { AddLiquidityDto, AddLiquidityResponseDto } from './dto/add-liquidity.dto';

export interface LiquidityPosition {
  positionId: string;
  provider: string;
  tokenPair: string;
  tokenAAmount: number;
  tokenBAmount: number;
  lpTokens: number;
  status: 'active' | 'removed';
  timestamp: Date;
  blockNumber: number;
}

export interface LiquidityPool {
  tokenPair: string;
  tokenAReserve: number;
  tokenBReserve: number;
  totalLpTokens: number;
  positions: LiquidityPosition[];
  lastUpdated: Date;
}

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);
  private positions: Map<string, LiquidityPosition> = new Map();
  private pools: Map<string, LiquidityPool> = new Map();

  constructor(
    @Inject(forwardRef(() => BlockchainSimulator))
    private readonly blockchainSimulator: BlockchainSimulator,
  ) {}

  async processBlockLiquidityPosition(positionData: LiquidityPositionData): Promise<void> {
    try {
      // Convert to internal position format
      const position: LiquidityPosition = {
        positionId: positionData.positionId,
        provider: positionData.provider,
        tokenPair: positionData.tokenPair,
        tokenAAmount: positionData.tokenAAmount,
        tokenBAmount: positionData.tokenBAmount,
        lpTokens: positionData.lpTokens,
        status: 'active',
        timestamp: positionData.timestamp,
        blockNumber: positionData.blockNumber
      };

      // Store position
      this.positions.set(position.positionId, position);

      // Update liquidity pool
      this.updateLiquidityPool(position);

      this.logger.debug(`Processed liquidity position: ${position.tokenAAmount}/${position.tokenBAmount} ${position.tokenPair}`);
    } catch (error) {
      this.logger.error('Error processing block liquidity position:', error);
    }
  }

  private updateLiquidityPool(position: LiquidityPosition): void {
    let pool = this.pools.get(position.tokenPair);
    if (!pool) {
      pool = {
        tokenPair: position.tokenPair,
        tokenAReserve: 0,
        tokenBReserve: 0,
        totalLpTokens: 0,
        positions: [],
        lastUpdated: new Date()
      };
      this.pools.set(position.tokenPair, pool);
    }

    // Add position to pool
    pool.positions.push(position);
    
    // Update pool reserves
    pool.tokenAReserve += position.tokenAAmount;
    pool.tokenBReserve += position.tokenBAmount;
    pool.totalLpTokens += position.lpTokens;
    pool.lastUpdated = new Date();

    this.logger.debug(`Updated pool ${position.tokenPair}: ${pool.tokenAReserve}/${pool.tokenBReserve} reserves, ${pool.totalLpTokens} LP tokens`);
  }

  getPool(tokenPair: string): LiquidityPool | undefined {
    return this.pools.get(tokenPair);
  }

  getAllPools(): Map<string, LiquidityPool> {
    return this.pools;
  }

  getPosition(positionId: string): LiquidityPosition | undefined {
    return this.positions.get(positionId);
  }

  getAllPositions(): LiquidityPosition[] {
    return Array.from(this.positions.values());
  }

  getPoolPrice(tokenPair: string): number | null {
    const pool = this.pools.get(tokenPair);
    if (!pool || pool.tokenBReserve === 0) {
      return null;
    }

    // Simple constant product formula: price = tokenAReserve / tokenBReserve
    return pool.tokenAReserve / pool.tokenBReserve;
  }

  getPoolStats(tokenPair: string): any {
    const pool = this.pools.get(tokenPair);
    if (!pool) {
      return null;
    }

    return {
      tokenPair: pool.tokenPair,
      tokenAReserve: pool.tokenAReserve,
      tokenBReserve: pool.tokenBReserve,
      totalLpTokens: pool.totalLpTokens,
      currentPrice: this.getPoolPrice(tokenPair),
      totalPositions: pool.positions.length,
      lastUpdated: pool.lastUpdated
    };
  }

  async addLiquidity(addLiquidityDto: AddLiquidityDto): Promise<AddLiquidityResponseDto> {
    const { tokenPair, tokenAAmount, tokenBAmount, user, minLpTokens } = addLiquidityDto;

    // Validate input amounts
    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
      throw new BadRequestException('Token amounts must be greater than 0');
    }

    // Get or create pool
    let pool = this.pools.get(tokenPair);
    let lpTokensReceived: number;
    let actualTokenAAmount = tokenAAmount;
    let actualTokenBAmount = tokenBAmount;

    if (!pool) {
      // Create new pool - first liquidity provider
      lpTokensReceived = Math.sqrt(tokenAAmount * tokenBAmount);
      this.logger.log(`Creating new pool for ${tokenPair} with ${tokenAAmount}/${tokenBAmount}`);
    } else {
      // Add to existing pool - calculate optimal amounts and LP tokens
      const ratio = pool.tokenAReserve / pool.tokenBReserve;
      const optimalTokenBAmount = tokenAAmount / ratio;
      const optimalTokenAAmount = tokenBAmount * ratio;

      // Use the smaller ratio to prevent front-running
      if (optimalTokenBAmount <= tokenBAmount) {
        actualTokenBAmount = optimalTokenBAmount;
      } else {
        actualTokenAAmount = optimalTokenAAmount;
      }

      // Calculate LP tokens based on proportional share
      const shareOfPoolA = actualTokenAAmount / pool.tokenAReserve;
      const shareOfPoolB = actualTokenBAmount / pool.tokenBReserve;
      const shareOfPool = Math.min(shareOfPoolA, shareOfPoolB);
      lpTokensReceived = shareOfPool * pool.totalLpTokens;

      this.logger.log(`Adding to existing pool ${tokenPair}: ${actualTokenAAmount}/${actualTokenBAmount}, LP tokens: ${lpTokensReceived}`);
    }

    // Check slippage protection
    if (minLpTokens && lpTokensReceived < minLpTokens) {
      throw new BadRequestException(`Slippage too high: expected at least ${minLpTokens} LP tokens, got ${lpTokensReceived}`);
    }

    // Generate position ID and transaction hash
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    // Create liquidity transaction for blockchain
    const liquidityTransaction: BlockTransaction = {
      txHash,
      from: user,
      to: 'liquidity_contract',
      contractAddress: 'liquidity_contract',
      data: {
        type: 'add_liquidity',
        tokenPair,
        tokenAAmount: actualTokenAAmount,
        tokenBAmount: actualTokenBAmount,
        lpTokens: lpTokensReceived,
        positionId,
        provider: user
      },
      gasUsed: 75000
    };

    // Submit transaction to blockchain (if available)
    if (this.blockchainSimulator) {
      try {
        await this.blockchainSimulator.submitAdminTransaction(liquidityTransaction);
        this.logger.log(`✅ Submitted liquidity transaction to blockchain: ${positionId}`);
      } catch (error) {
        this.logger.error(`Failed to submit liquidity transaction: ${error.message}`);
        throw new BadRequestException('Failed to submit liquidity transaction to blockchain');
      }
    }

    // Get current block height for response
    const blockNumber = this.blockchainSimulator 
      ? await this.blockchainSimulator.getLatestBlockHeight() + 1
      : Math.floor(Math.random() * 1000000);

    // Create response
    const response: AddLiquidityResponseDto = {
      positionId,
      tokenPair,
      tokenAAmount: actualTokenAAmount,
      tokenBAmount: actualTokenBAmount,
      lpTokensReceived: parseFloat(lpTokensReceived.toFixed(6)),
      poolReserves: {
        tokenA: pool ? pool.tokenAReserve + actualTokenAAmount : actualTokenAAmount,
        tokenB: pool ? pool.tokenBReserve + actualTokenBAmount : actualTokenBAmount,
      },
      txHash,
      blockNumber,
      timestamp: new Date()
    };

    this.logger.log(`💰 Liquidity added: ${user} added ${actualTokenAAmount}/${actualTokenBAmount} ${tokenPair}, received ${lpTokensReceived.toFixed(6)} LP tokens`);

    return response;
  }
}