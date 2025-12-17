import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

// Base Network Chain ID
export const BASE_CHAIN_ID = '0x2105'; // 8453 in hex
export const BASE_CHAIN_ID_DECIMAL = 8453;

export const BASE_NETWORK = {
  chainId: BASE_CHAIN_ID,
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
};

export const connectWallet = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Switch to Base network
    await switchToBase();

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Connection rejected by user');
    }
    throw error;
  }
};

export const switchToBase = async (): Promise<void> => {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (error: any) {
    // Chain not added, let's add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [BASE_NETWORK],
      });
    } else {
      throw error;
    }
  }
};

export const getBalance = async (address: string): Promise<string> => {
  if (!window.ethereum) return '0';

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

export const disconnectWallet = (): void => {
  // MetaMask doesn't have a disconnect method, so we just clear local state
  // The actual disconnection is handled by the store
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const subscribeToAccountChanges = (callback: (accounts: string[]) => void): void => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

export const subscribeToChainChanges = (callback: (chainId: string) => void): void => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

export const unsubscribeFromAccountChanges = (callback: (accounts: string[]) => void): void => {
  if (window.ethereum) {
    window.ethereum.removeListener('accountsChanged', callback);
  }
};

export const unsubscribeFromChainChanges = (callback: (chainId: string) => void): void => {
  if (window.ethereum) {
    window.ethereum.removeListener('chainChanged', callback);
  }
};
