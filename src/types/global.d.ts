import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { ContractTransactionResponse, ContractDeployment } from 'ethers';

declare module '@/lib/wallet' {
  export function getWallet(): Promise<BrowserProvider>;
}

declare module '@/lib/ethers' {
  export function getProvider(network: string): JsonRpcProvider;
}
