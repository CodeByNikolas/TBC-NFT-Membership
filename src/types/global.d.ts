declare module '@/lib/wallet' {
  export function getWallet(): Promise<any>;
}

declare module '@/lib/ethers' {
  export function getProvider(network: string): any;
}

declare module '@/hardhat/typechain-types' {
  export class TBCNFT__factory {
    constructor(signer: any);
    deploy(name: string, symbol: string, ownerAddress: string, baseURI: string, deployOptions?: any): Promise<any>;
  }
} 