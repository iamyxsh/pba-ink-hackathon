// Polkadot.js types and interfaces - will be properly imported once dependencies are resolved
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    injectedWeb3?: any;
  }
}

export interface PolkadotAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

export class PolkadotWalletService {
  private isConnected: boolean = false;
  private currentAccount: PolkadotAccount | null = null;

  async initializeApi(): Promise<void> {
    // For now, simulate API initialization
    // TODO: Replace with actual Polkadot API initialization when dependencies are resolved
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async enableExtension(): Promise<boolean> {
    // Check for Polkadot.js extension
    if (typeof window !== 'undefined' && window.injectedWeb3) {
      const extensions = Object.keys(window.injectedWeb3);
      return extensions.length > 0;
    }
    
    // Check for common extension patterns
    if (typeof window !== 'undefined' && 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).web3Enable || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).polkadotExtension)) {
      return true;
    }
    
    return false;
  }

  async getAccounts(): Promise<PolkadotAccount[]> {
    // TODO: Replace with actual extension account retrieval
    // For demo purposes, return mock account if extension is available
    const extensionAvailable = await this.enableExtension();
    
    if (extensionAvailable) {
      // Try to get real accounts when extension is loaded
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).web3Accounts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const accounts = await (window as any).web3Accounts();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return accounts.map((account: any) => ({
            address: account.address,
            meta: {
              name: account.meta.name,
              source: account.meta.source
            }
          }));
        }
      } catch {
        // Silently fail and use demo account
      }
    }
    
    // Return demo account for development
    return [{
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: {
        name: 'Demo Account',
        source: 'polkadot-js'
      }
    }];
  }

  async getBalance(): Promise<string> {
    // TODO: Replace with actual balance query
    return '1000000000000'; // 100 DOT in planck units
  }

  async connectWallet(): Promise<{ address: string; chainId: string } | null> {
    try {
      // Initialize API simulation
      await this.initializeApi();
      
      // Check for extension
      const extensionEnabled = await this.enableExtension();
      if (!extensionEnabled) {
        // For development, we'll allow connection without extension
      }

      // Get accounts
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Polkadot extension.');
      }

      // Use first account
      this.currentAccount = accounts[0];
      this.isConnected = true;
      
      const chainId = 'polkadot'; // or get from API when available

      return {
        address: this.currentAccount.address,
        chainId
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async signAndSendTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _extrinsic: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback?: (status: any) => void
  ): Promise<string> {
    // TODO: Implement actual transaction signing
    
    if (callback) {
      callback({ status: 'Ready' });
      setTimeout(() => callback({ status: 'InBlock', hash: '0x123...' }), 1000);
      setTimeout(() => callback({ status: 'Finalized', hash: '0x123...' }), 3000);
    }
    
    return '0x1234567890abcdef'; // Mock transaction hash
  }

  disconnect(): void {
    this.isConnected = false;
    this.currentAccount = null;
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }

  getCurrentAccount(): PolkadotAccount | null {
    return this.currentAccount;
  }
}

// Export singleton instance
export const polkadotWalletService = new PolkadotWalletService();