export interface BlockData {
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
  transactions: BlockTransaction[];
}

export interface BlockTransaction {
  txHash: string;
  from: string;
  to: string;
  contractAddress: string;
  data: any;
  gasUsed: number;
}

export interface OrderData {
  orderId: string;
  user: string;
  tokenPair: string;
  orderType: 'buy' | 'sell';
  amount: number;
  price: number;
  status: string;
  timestamp: Date;
  blockNumber: number;
}

export interface LiquidityPositionData {
  positionId: string;
  provider: string;
  tokenPair: string;
  tokenAAmount: number;
  tokenBAmount: number;
  lpTokens: number;
  timestamp: Date;
  blockNumber: number;
}

export interface PriceData {
  tokenPair: string;
  price: number;
  timestamp: Date;
  volume24h: number;
  change24h: number;
  confidence: number;
}