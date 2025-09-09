// Supported tokens (simplified to DOT/USDC only)
export const SUPPORTED_TOKENS = {
  DOT: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 10,
    color: '#E6007A',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    color: '#2775CA',
  },
} as const;

// Trading pairs (simplified to single pair)
export const TRADING_PAIRS = [
  'DOT/USDC',
] as const;

// Network configurations (for Step 2)
export const POLKADOT_NETWORKS = {
  POLKADOT: {
    name: 'Polkadot',
    rpc: 'wss://rpc.polkadot.io',
    prefix: 0,
  },
  KUSAMA: {
    name: 'Kusama',
    rpc: 'wss://kusama-rpc.polkadot.io',
    prefix: 2,
  },
  WESTEND: {
    name: 'Westend',
    rpc: 'wss://westend-rpc.polkadot.io',
    prefix: 42,
  },
} as const;

// UI Constants
export const SIDEBAR_WIDTH = 280;
export const HEADER_HEIGHT = 64;

// Trading constants
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const MAX_SLIPPAGE = 10; // 10%
export const MIN_ORDER_SIZE = 0.0001;