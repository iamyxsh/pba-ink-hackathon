import { create } from 'zustand'

interface WalletState {
  address: string | null
  connected: boolean
  chainId: string | null
  setWallet: (address: string, chainId: string) => void
  disconnect: () => void
}

const useWalletStore = create<WalletState>((set) => ({
  address: null,
  connected: false,
  chainId: null,
  setWallet: (address: string, chainId: string) => set({ address, connected: true, chainId }),
  disconnect: () => set({ address: null, connected: false, chainId: null }),
}))

export default useWalletStore