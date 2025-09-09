import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BlockchainSimulator } from '../blockchain/blockchain-simulator.service';
import type { PriceData } from '../interfaces/blockchain.interface';
import { FaucetRequestDto, FaucetResponseDto, TokenType } from './faucet.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private faucetCooldowns = new Map<string, number>(); // Track faucet usage per address
  
  constructor(private readonly blockchainSimulator: BlockchainSimulator) {}

  @OnEvent('oracle.priceUpdate')
  async handlePriceUpdate(priceData: PriceData): Promise<void> {
    this.logger.log(`🏛️  Admin received price update: ${priceData.tokenPair} = ${priceData.price.toFixed(4)}`);
    
    // Submit price update transaction to blockchain
    await this.submitPriceTransaction(priceData);
  }

  private async submitPriceTransaction(priceData: PriceData): Promise<void> {
    try {
      // Create admin price update transaction
      const priceTransaction = {
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: 'admin_oracle',
        to: 'price_oracle_contract',
        contractAddress: 'price_oracle_contract',
        data: {
          type: 'price_update',
          tokenPair: priceData.tokenPair,
          price: priceData.price,
          timestamp: priceData.timestamp,
          volume24h: priceData.volume24h,
          change24h: priceData.change24h,
          confidence: priceData.confidence
        },
        gasUsed: 25000
      };

      // Submit to blockchain simulator
      await this.blockchainSimulator.submitAdminTransaction(priceTransaction);
      
      this.logger.log(`✅ Admin submitted price transaction: ${priceData.tokenPair} @ ${priceData.price.toFixed(4)}`);
    } catch (error) {
      this.logger.error(`❌ Failed to submit price transaction:`, error);
    }
  }

  async handleFaucetRequest(request: FaucetRequestDto): Promise<FaucetResponseDto> {
    try {
      // Check cooldown (10 minutes between requests per address)
      const cooldownKey = `${request.userAddress}-${request.token}`;
      const now = Date.now();
      const lastRequest = this.faucetCooldowns.get(cooldownKey) || 0;
      const cooldownPeriod = 10 * 60 * 1000; // 10 minutes

      if (now - lastRequest < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - (now - lastRequest)) / 60000);
        return {
          success: false,
          txHash: '',
          amount: 0,
          token: request.token,
          message: `Cooldown active. Try again in ${remainingTime} minutes.`
        };
      }

      // Determine faucet amounts
      const faucetAmounts = {
        [TokenType.DOT]: 100,
        [TokenType.USDC]: 1000
      };

      const amount = faucetAmounts[request.token];

      // Create faucet transaction
      const faucetTransaction = {
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: 'faucet_admin',
        to: request.userAddress,
        contractAddress: 'faucet_contract',
        data: {
          type: 'faucet_transfer',
          token: request.token,
          amount: amount,
          recipient: request.userAddress,
          timestamp: new Date()
        },
        gasUsed: 30000
      };

      // Submit to blockchain simulator
      await this.blockchainSimulator.submitAdminTransaction(faucetTransaction);

      // Update cooldown
      this.faucetCooldowns.set(cooldownKey, now);

      this.logger.log(`💰 Faucet: Sent ${amount} ${request.token} to ${request.userAddress}`);

      return {
        success: true,
        txHash: faucetTransaction.txHash,
        amount: amount,
        token: request.token,
        message: `Successfully sent ${amount} ${request.token} to your wallet`
      };

    } catch (error) {
      this.logger.error(`❌ Faucet request failed:`, error);
      return {
        success: false,
        txHash: '',
        amount: 0,
        token: request.token,
        message: 'Faucet request failed. Please try again later.'
      };
    }
  }
}