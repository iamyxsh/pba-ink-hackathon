import { create } from 'zustand'
import { apiClient, type PriceData, type AccountBalances, type MarketOrderRequest } from '@/services/api'

export type Token = "DOT" | "USDC"

interface SwapState {
  // Sell side
  sellAmount: number
  sellCurrency: Token
  sellBalance: number
  sellPrice: number
  
  // Buy side
  buyAmount: number
  buyCurrency: Token
  buyBalance: number
  buyPrice: number
  
  // Additional data
  percentageChange: number
  isLoading: boolean
  priceData: PriceData | null
  lastPriceUpdate: Date | null
  userAddress: string | null
  accountBalances: AccountBalances | null
  
  // Actions
  setSellAmount: (amount: number) => void
  setSellCurrency: (currency: Token) => void
  setSellBalance: (balance: number) => void
  setSellPrice: (price: number) => void
  
  setBuyAmount: (amount: number) => void
  setBuyCurrency: (currency: Token) => void
  setBuyBalance: (balance: number) => void
  setBuyPrice: (price: number) => void
  
  setPercentageChange: (change: number) => void
  setIsLoading: (loading: boolean) => void
  
  // API integration actions
  fetchCurrentPrice: () => Promise<void>
  startPriceUpdates: () => void
  stopPriceUpdates: () => void
  fetchBalances: (address: string) => Promise<void>
  setUserAddress: (address: string | null) => void
  placeMarketOrder: () => Promise<void>
  
  // Computed actions
  swapTokens: () => void
  resetAmounts: () => void
  calculateBuyAmount: (sellAmount: number, rate: number) => void
}

let priceUpdateInterval: NodeJS.Timeout | null = null;

const useSwapStore = create<SwapState>((set, get) => ({
  // Initial state
  sellAmount: 0,
  sellCurrency: "DOT",
  sellBalance: 0,
  sellPrice: 10.00,
  
  buyAmount: 0,
  buyCurrency: "USDC",
  buyBalance: 0,
  buyPrice: 1.00,
  
  percentageChange: 0,
  isLoading: false,
  priceData: null,
  lastPriceUpdate: null,
  userAddress: null,
  accountBalances: null,
  
  // Sell actions
  setSellAmount: (amount: number) => {
    set({ sellAmount: amount })
    // Auto-calculate buy amount based on current rate
    const state = get()
    if (state.sellCurrency === "DOT" && state.buyCurrency === "USDC") {
      // DOT to USDC: multiply by DOT price
      set({ buyAmount: amount * state.sellPrice })
    } else if (state.sellCurrency === "USDC" && state.buyCurrency === "DOT") {
      // USDC to DOT: divide by DOT price
      set({ buyAmount: amount / state.sellPrice })
    } else {
      // Fallback to original calculation
      const rate = state.sellPrice / state.buyPrice
      set({ buyAmount: amount * rate })
    }
  },
  
  setSellCurrency: (currency: Token) => {
    const state = get();
    set({ sellCurrency: currency })
    
    // Update balance from account balances if available
    if (state.accountBalances) {
      const balance = state.accountBalances.balances.find(b => b.token === currency);
      set({ sellBalance: balance?.available || 0 })
    }
    
    // Trigger price update for new pair
    if (state.buyCurrency !== currency) {
      state.fetchCurrentPrice();
    }
  },
  
  setSellBalance: (balance: number) => set({ sellBalance: balance }),
  setSellPrice: (price: number) => set({ sellPrice: price }),
  
  // Buy actions
  setBuyAmount: (amount: number) => set({ buyAmount: amount }),
  setBuyCurrency: (currency: Token) => {
    const state = get();
    set({ buyCurrency: currency })
    
    // Update balance from account balances if available
    if (state.accountBalances) {
      const balance = state.accountBalances.balances.find(b => b.token === currency);
      set({ buyBalance: balance?.available || 0 })
    }
    
    // Trigger price update for new pair
    if (state.sellCurrency !== currency) {
      state.fetchCurrentPrice();
    }
  },
  setBuyBalance: (balance: number) => set({ buyBalance: balance }),
  setBuyPrice: (price: number) => set({ buyPrice: price }),
  
  // Other actions
  setPercentageChange: (change: number) => set({ percentageChange: change }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  // API integration actions
  fetchCurrentPrice: async () => {
    const state = get();
    const tokenPair = `${state.sellCurrency}/${state.buyCurrency}`;
    
    try {
      set({ isLoading: true });
      const priceData = await apiClient.getCurrentPrice(tokenPair);
      
      set({ 
        priceData,
        sellPrice: priceData.price,
        buyPrice: 1, // Assuming USDC as base currency
        percentageChange: priceData.change24h,
        lastPriceUpdate: new Date(),
        isLoading: false
      });

      // Auto-calculate buy amount if sell amount is set
      if (state.sellAmount > 0) {
        const buyAmount = state.sellAmount * priceData.price;
        set({ buyAmount });
      }
    } catch (error) {
      console.error('Failed to fetch price:', error);
      set({ isLoading: false });
    }
  },

  startPriceUpdates: () => {
    const { fetchCurrentPrice } = get();
    
    // Initial fetch
    fetchCurrentPrice();
    
    // Set up interval for updates every 10 seconds
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
    }
    
    priceUpdateInterval = setInterval(() => {
      fetchCurrentPrice();
    }, 10000);
  },

  stopPriceUpdates: () => {
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
      priceUpdateInterval = null;
    }
  },

  fetchBalances: async (address: string) => {
    try {
      set({ isLoading: true });
      const balances = await apiClient.getAccountBalances(address);
      
      set({ 
        accountBalances: balances,
        userAddress: address,
        isLoading: false
      });

      const state = get();
      
      // Update current balances
      const sellBalance = balances.balances.find(b => b.token === state.sellCurrency);
      const buyBalance = balances.balances.find(b => b.token === state.buyCurrency);
      
      set({
        sellBalance: sellBalance?.available || 0,
        buyBalance: buyBalance?.available || 0
      });

    } catch (error) {
      console.error('Failed to fetch balances:', error);
      set({ isLoading: false });
    }
  },

  setUserAddress: (address: string | null) => {
    set({ userAddress: address });
    if (!address) {
      set({ accountBalances: null, sellBalance: 0, buyBalance: 0 });
    }
  },

  placeMarketOrder: async () => {
    const state = get();
    
    if (!state.userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (state.sellAmount <= 0) {
      alert('Please enter a valid amount to sell');
      return;
    }

    if (state.sellAmount > state.sellBalance) {
      alert('Insufficient balance');
      return;
    }

    try {
      set({ isLoading: true });

      const orderRequest: MarketOrderRequest = {
        sellToken: state.sellCurrency,
        buyToken: state.buyCurrency,
        sellAmount: state.sellAmount,
        userAddress: state.userAddress
      };

      const result = await apiClient.placeMarketOrder(orderRequest);
      
      if (result.success) {
        alert(`Order placed successfully!\nTx Hash: ${result.txHash}\nEstimated Buy Amount: ${result.estimatedBuyAmount?.toFixed(4)}`);
        
        // Reset amounts and refresh balances
        set({ sellAmount: 0, buyAmount: 0 });
        if (state.userAddress) {
          state.fetchBalances(state.userAddress);
        }
      } else {
        alert(`Order failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order: ' + (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Computed actions
  swapTokens: () => {
    const state = get()
    set({
      sellCurrency: state.buyCurrency,
      sellBalance: state.buyBalance,
      sellPrice: state.buyPrice,
      sellAmount: state.buyAmount,
      
      buyCurrency: state.sellCurrency,
      buyBalance: state.sellBalance,
      buyPrice: state.sellPrice,
      buyAmount: state.sellAmount,
    })
  },
  
  resetAmounts: () => set({ sellAmount: 0, buyAmount: 0 }),
  
  calculateBuyAmount: (sellAmount: number, rate: number) => {
    set({ buyAmount: sellAmount * rate })
  },
}))

export default useSwapStore