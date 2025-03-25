import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { ContractTransactionResponse, ContractDeployment } from 'ethers';

declare module '@/lib/wallet' {
  export function getWallet(): Promise<BrowserProvider>;
}

declare module '@/lib/ethers' {
  export function getProvider(network: string): JsonRpcProvider;
}

declare module '@/hardhat/typechain-types' {
  export class TBCNFT__factory {
    constructor(signer: JsonRpcProvider);
    deploy(
      name: string, 
      symbol: string, 
      ownerAddress: string, 
      baseURI: string, 
      deployOptions?: { gasLimit?: number; value?: bigint }
    ): Promise<ContractDeployment>;
  }
} 