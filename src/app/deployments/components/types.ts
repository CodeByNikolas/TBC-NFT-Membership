export interface ContractDeployment {
  id: string;
  contract_address: string;
  chain_id: number;
  network?: string;
  deployer_address: string;
  // DB-stored values that might be outdated or empty
  name: string;
  symbol: string;
  base_uri: string;
  // On-chain values (will be fetched directly from blockchain)
  onChainData?: {
    name?: string;
    symbol?: string;
    baseURI?: string;
    totalSupply?: number;
    owner?: string;
  };
  deployment_tx_hash: string;
  deployment_timestamp: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_message?: string;
  verification_timestamp?: string;
  created_at: string | null;
} 