/**
 * Global type declarations for the application
 */

// Add ethereum to the Window interface for MetaMask compatibility
interface Window {
  ethereum?: any;
}

// Add global variables for environment
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_INFURA_API_KEY?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    ETHERSCAN_API_KEY?: string;
    POLYGONSCAN_API_KEY?: string;
    SEPOLIA_RPC_URL?: string;
    MUMBAI_RPC_URL?: string;
    GOERLI_RPC_URL?: string;
    MAINNET_RPC_URL?: string;
    POLYGON_RPC_URL?: string;
    AMOY_RPC_URL?: string;
  }
}
