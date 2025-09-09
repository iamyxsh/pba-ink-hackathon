import { Injectable, Logger } from '@nestjs/common';
import { BlockData, BlockTransaction } from '../interfaces/blockchain.interface';

@Injectable()
export class BlockchainSimulator {
  private readonly logger = new Logger(BlockchainSimulator.name);
  private blocks: BlockData[] = [];
  private currentBlockHeight: number = 0;
  private pendingAdminTransactions: BlockTransaction[] = [];

  constructor() {
    this.startBlockProduction();
  }

  private startBlockProduction(): void {
    // Produce a block every 6 seconds (Polkadot-like timing)
    setInterval(() => {
      this.produceBlock();
    }, 6000);

    this.logger.log('Block production started - 6 second intervals');
  }

  private produceBlock(): void {
    const blockNumber = ++this.currentBlockHeight;
    
    // Combine admin transactions and random transactions
    const allTransactions = [
      ...this.pendingAdminTransactions, // Admin price updates first
      ...this.generateRandomTransactions()
    ];
    
    const block: BlockData = {
      blockNumber,
      blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      timestamp: new Date(),
      transactions: allTransactions
    };

    this.blocks.push(block);
    
    // Clear admin transactions after including them in block
    const adminTxCount = this.pendingAdminTransactions.length;
    this.pendingAdminTransactions = [];
    
    if (adminTxCount > 0) {
      this.logger.log(`📦 Produced block ${blockNumber} with ${adminTxCount} admin + ${allTransactions.length - adminTxCount} random transactions`);
    } else {
      this.logger.debug(`Produced block ${blockNumber} with ${allTransactions.length} transactions`);
    }
  }

  private generateRandomTransactions(): BlockTransaction[] {
    const txCount = Math.floor(Math.random() * 5) + 1; // 1-5 transactions per block
    const transactions: BlockTransaction[] = [];

    for (let i = 0; i < txCount; i++) {
      if (Math.random() > 0.5) {
        // Generate order transaction
        transactions.push({
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          from: `user_${Math.floor(Math.random() * 100)}`,
          to: 'orders_contract',
          contractAddress: 'orders_contract',
          data: {
            type: 'place_order',
            tokenPair: this.getRandomTokenPair(),
            orderType: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: Math.floor(Math.random() * 1000) + 100,
            price: this.getRandomPrice()
          },
          gasUsed: 50000
        });
      } else {
        // Generate liquidity transaction
        transactions.push({
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          from: `user_${Math.floor(Math.random() * 100)}`,
          to: 'liquidity_contract',
          contractAddress: 'liquidity_contract',
          data: {
            type: 'add_liquidity',
            tokenPair: this.getRandomTokenPair(),
            tokenAAmount: Math.floor(Math.random() * 10000) + 1000,
            tokenBAmount: Math.floor(Math.random() * 1000) + 100,
            lpTokens: Math.floor(Math.random() * 500) + 50
          },
          gasUsed: 75000
        });
      }
    }

    return transactions;
  }

  private getRandomTokenPair(): string {
    // Focus on DOT/USDC for now
    return 'DOT/USDC';
  }

  private getRandomPrice(): number {
    // Generate realistic price ranges for different pairs
    return parseFloat((5 + Math.random() * 20).toFixed(4));
  }

  async getLatestBlockHeight(): Promise<number> {
    return this.currentBlockHeight;
  }

  async getBlock(blockHeight: number): Promise<BlockData | null> {
    return this.blocks.find(block => block.blockNumber === blockHeight) || null;
  }

  async getAllBlocks(): Promise<BlockData[]> {
    return [...this.blocks];
  }

  async submitAdminTransaction(transaction: BlockTransaction): Promise<void> {
    // Add admin transaction to pending queue
    this.pendingAdminTransactions.push(transaction);
    this.logger.debug(`Admin transaction queued: ${transaction.data.type} for ${transaction.data.tokenPair}`);
  }
}