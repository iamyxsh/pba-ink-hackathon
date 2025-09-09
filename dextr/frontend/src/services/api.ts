export interface PriceData {
  tokenPair: string;
  price: number;
  timestamp: string;
  volume24h: number;
  change24h: number;
  confidence: number;
}

export interface OrderData {
  orderId: string;
  user: string;
  tokenPair: string;
  orderType: 'buy' | 'sell';
  amount: number;
  price: number;
  status: string;
  timestamp: string;
  blockNumber: number;
}

export interface OrderbookData {
  pair: string;
  bids: Array<{ price: number; amount: number; total: number }>;
  asks: Array<{ price: number; amount: number; total: number }>;
  lastPrice?: number;
  volume24h?: number;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    blockchain: string;
    orderbook: string;
    oracle: string;
    liquidity: string;
  };
}

export interface MarketOrderRequest {
  sellToken: 'DOT' | 'USDC';
  buyToken: 'DOT' | 'USDC';
  sellAmount: number;
  userAddress: string;
}

export interface MarketOrderResponse {
  success: boolean;
  txHash: string;
  orderId?: string;
  estimatedBuyAmount?: number;
  message?: string;
}

export interface TokenBalance {
  token: 'DOT' | 'USDC';
  available: number;
  locked: number;
  total: number;
}

export interface AccountBalances {
  address: string;
  balances: TokenBalance[];
  lastUpdated: string;
}

export interface FaucetRequest {
  userAddress: string;
  token: 'DOT' | 'USDC';
}

export interface FaucetResponse {
  success: boolean;
  txHash: string;
  amount: number;
  token: string;
  message: string;
}

export interface AddLiquidityRequest {
  tokenPair: string;
  tokenAAmount: number;
  tokenBAmount: number;
  userAddress: string;
  slippageTolerance: number;
}

export interface AddLiquidityResponse {
  positionId: string;
  tokenPair: string;
  tokenAAmount: number;
  tokenBAmount: number;
  lpTokensReceived: number;
  poolReserves: {
    tokenA: number;
    tokenB: number;
  };
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8282';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Oracle API methods
  async getAllPrices(): Promise<PriceData[]> {
    return this.request<PriceData[]>('/api/oracle/prices');
  }

  async getCurrentPrice(tokenPair: string): Promise<PriceData> {
    return this.request<PriceData>(`/api/oracle/prices/${tokenPair}`);
  }

  async getPriceHistory(tokenPair: string): Promise<PriceData[]> {
    return this.request<PriceData[]>(`/api/oracle/history/${tokenPair}`);
  }

  // Orders API methods
  async getAllOrders(): Promise<OrderData[]> {
    return this.request<OrderData[]>('/api/orders');
  }

  async getOrder(orderId: string): Promise<OrderData> {
    return this.request<OrderData>(`/api/orders/${orderId}`);
  }

  async getOrderbook(tokenPair: string): Promise<OrderbookData> {
    return this.request<OrderbookData>(`/api/orders/orderbook/${tokenPair}`);
  }

  async getAllOrderbooks(): Promise<OrderbookData[]> {
    return this.request<OrderbookData[]>('/api/orders/orderbooks/all');
  }

  // DEX System API methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getSystemStatus(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/api/dex/status');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/api/dex/health');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getLatestBlock(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/api/dex/blocks/latest');
  }

  // Trading API methods (simulated via blockchain transactions)
  async placeMarketOrder(orderRequest: MarketOrderRequest): Promise<MarketOrderResponse> {
    try {
      // For now, simulate the order by creating a mock response
      // In a real implementation, this would submit to the blockchain
      const currentPrice = await this.getCurrentPrice(`${orderRequest.sellToken}/${orderRequest.buyToken}`);
      
      const mockResponse: MarketOrderResponse = {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        orderId: `order_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
        estimatedBuyAmount: orderRequest.sellAmount * currentPrice.price,
        message: 'Order submitted to blockchain simulator'
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockResponse;
    } catch (error) {
      console.error('Failed to place market order:', error);
      return {
        success: false,
        txHash: '',
        message: 'Failed to place order: ' + (error as Error).message
      };
    }
  }

  // Account/Balance methods (mock for now, should integrate with Polkadot)
  async getAccountBalances(address: string): Promise<AccountBalances> {
    try {
      // Mock balances - in real implementation, this would query Polkadot chain
      const mockBalances: AccountBalances = {
        address,
        balances: [
          {
            token: 'DOT',
            available: Math.floor(Math.random() * 1000) + 100,
            locked: Math.floor(Math.random() * 100),
            total: 0
          },
          {
            token: 'USDC',
            available: Math.floor(Math.random() * 10000) + 1000,
            locked: Math.floor(Math.random() * 1000),
            total: 0
          },
        ],
        lastUpdated: new Date().toISOString()
      };

      // Calculate totals
      mockBalances.balances.forEach(balance => {
        balance.total = balance.available + balance.locked;
      });

      return mockBalances;
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      throw error;
    }
  }

  // Faucet API methods
  async requestFaucetTokens(faucetRequest: FaucetRequest): Promise<FaucetResponse> {
    try {
      return this.request<FaucetResponse>('/api/admin/faucet', {
        method: 'POST',
        body: JSON.stringify(faucetRequest),
      });
    } catch (error) {
      console.error('Failed to request faucet tokens:', error);
      throw error;
    }
  }

  // Liquidity API methods
  async addLiquidity(liquidityRequest: AddLiquidityRequest): Promise<AddLiquidityResponse> {
    try {
      return this.request<AddLiquidityResponse>('/api/liquidity/add', {
        method: 'POST',
        body: JSON.stringify(liquidityRequest),
      });
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      throw error;
    }
  }

  async getAllLiquidityPools(): Promise<any[]> {
    return this.request<any[]>('/api/liquidity/pools');
  }
}

export const apiClient = new ApiClient();