import tbcNFTUtils from '../tbcNFTUtils';

/**
 * Example demonstrating how to use the TBCNFT utilities
 */

// Example contract address - replace with actual deployed address
const exampleContractAddress = '0x123...'; // Replace with your contract address
const chainId = 11155111; // Sepolia testnet

/**
 * Example 1: Get the base URI from a TBCNFT contract
 */
export async function getBaseURIExample() {
  console.log(`Getting base URI for contract ${exampleContractAddress}...`);
  
  // Fix for CORS issues
  tbcNFTUtils.setupCORSWorkaround();
  
  const baseURI = await tbcNFTUtils.getTBCNFTBaseURI(
    exampleContractAddress,
    chainId
  );
  
  console.log('Base URI:', baseURI);
  return baseURI;
}

/**
 * Example 2: Fetch full contract information
 */
export async function getContractInfoExample() {
  console.log(`Fetching full contract info for ${exampleContractAddress}...`);
  
  const contractInfo = await tbcNFTUtils.fetchTBCNFTInfo(
    exampleContractAddress,
    chainId
  );
  
  console.log('Contract Info:', contractInfo);
  return contractInfo;
}

/**
 * Example 3: Get tokens owned by a wallet
 */
export async function getOwnedTokensExample(walletAddress: string) {
  console.log(`Getting tokens owned by ${walletAddress}...`);
  
  const ownedTokens = await tbcNFTUtils.getOwnedTokenIds(
    exampleContractAddress,
    walletAddress,
    chainId
  );
  
  console.log(`Wallet ${walletAddress} owns tokens:`, ownedTokens);
  return ownedTokens;
}

/**
 * Example 4: Fetch multiple TBCNFT contracts in parallel
 */
export async function getMultipleContractsExample() {
  const contracts = [
    { address: exampleContractAddress, chainId },
    { address: '0x456...', chainId: 137 } // Add another contract on a different network
  ];
  
  console.log('Fetching multiple contract info...');
  
  const contractsInfo = await tbcNFTUtils.fetchMultipleTBCNFTs(contracts);
  
  console.log('Multiple Contracts Info:', contractsInfo);
  return contractsInfo;
}

/**
 * Initialize workaround for CORS issues
 * Call this in your App component or _app.tsx
 */
export function initCORSWorkaround() {
  console.log('Initializing CORS workaround...');
  tbcNFTUtils.setupCORSWorkaround();
}

// Example usage:
// To run these examples, uncomment and call these functions
/*
(async () => {
  try {
    // Initialize CORS workaround
    initCORSWorkaround();
    
    // Example 1: Get base URI
    await getBaseURIExample();
    
    // Example 2: Get contract info
    await getContractInfoExample();
    
    // Example 3: Get owned tokens
    const walletAddress = '0xYourWalletAddress';
    await getOwnedTokensExample(walletAddress);
    
    // Example 4: Get multiple contracts
    await getMultipleContractsExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
})();
*/ 