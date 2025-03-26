import { ethers } from 'ethers';
import contractUtils from './contractUtils';

// Import the ABI from the contract JSON
// Note: If the import fails, you may need to adjust the path based on your project structure
import TBCNFT_JSON from '../contracts/TBCNFT.json';

// Extract the ABI from the imported JSON
const TBCNFT_ABI = TBCNFT_JSON.abi;

/**
 * Interface for TBCNFT contract data
 */
export interface TBCNFTContractInfo {
  address: string;
  name: string;
  symbol: string;
  baseURI: string;
  totalSupply: number;
  owner?: string;
  chainId: number;
}

/**
 * Create a TBCNFT contract instance
 * @param address Contract address
 * @param chainId Chain ID
 */
export function createTBCNFTInstance(
  address: string,
  chainId: number
): ethers.Contract | null {
  return contractUtils.createContractInstance(address, TBCNFT_ABI, chainId);
}

/**
 * Get the base URI from a TBCNFT contract
 * @param address Contract address
 * @param chainId Chain ID
 */
export async function getTBCNFTBaseURI(
  address: string,
  chainId: number
): Promise<string | null> {
  try {
    return await contractUtils.getBaseURI(address, TBCNFT_ABI, chainId);
  } catch (error) {
    console.error('Error getting TBCNFT base URI:', error);
    return null;
  }
}

/**
 * Fetch full information from a TBCNFT contract
 * @param address Contract address
 * @param chainId Chain ID
 */
export async function fetchTBCNFTInfo(
  address: string,
  chainId: number
): Promise<TBCNFTContractInfo | null> {
  try {
    const contractInfo = await contractUtils.fetchNFTContractInfo(address, TBCNFT_ABI, chainId);
    
    if (!contractInfo) {
      return null;
    }
    
    // Get the owner if possible
    let owner: string | undefined;
    try {
      const contract = createTBCNFTInstance(address, chainId);
      if (contract) {
        owner = await contract.owner();
      }
    } catch (error) {
      console.warn('Could not fetch owner of TBCNFT contract:', error);
    }
    
    return {
      address: contractInfo.address,
      name: contractInfo.name || '',
      symbol: contractInfo.symbol || '',
      baseURI: contractInfo.baseURI || '',
      totalSupply: contractInfo.totalSupply || 0,
      owner,
      chainId: contractInfo.chainId
    };
  } catch (error) {
    console.error('Error fetching TBCNFT info:', error);
    return null;
  }
}

/**
 * Fetch multiple TBCNFT contracts in parallel
 * @param contracts Array of contract addresses and chain IDs
 */
export async function fetchMultipleTBCNFTs(
  contracts: Array<{ address: string, chainId: number }>
): Promise<TBCNFTContractInfo[]> {
  try {
    const contractConfigs = contracts.map(contract => ({
      address: contract.address,
      abi: TBCNFT_ABI,
      chainId: contract.chainId
    }));
    
    const results = await contractUtils.fetchMultipleNFTContracts(contractConfigs);
    
    // Filter out any null results and convert to the expected format
    return results
      .filter(result => result !== null)
      .map(result => ({
        address: result.address,
        name: result.name || '',
        symbol: result.symbol || '',
        baseURI: result.baseURI || '',
        totalSupply: result.totalSupply || 0,
        chainId: result.chainId
      }));
  } catch (error) {
    console.error('Error fetching multiple TBCNFT contracts:', error);
    return [];
  }
}

/**
 * Get all token IDs owned by a wallet address from a TBCNFT contract
 * Note: This is an expensive operation that may time out on large contracts
 * @param contractAddress Contract address
 * @param ownerAddress Wallet address to check
 * @param chainId Chain ID
 */
export async function getOwnedTokenIds(
  contractAddress: string,
  ownerAddress: string,
  chainId: number
): Promise<number[]> {
  try {
    const contract = createTBCNFTInstance(contractAddress, chainId);
    if (!contract) {
      return [];
    }
    
    // First get the balance
    const balance = await contractUtils.getTokenBalance(
      contractAddress, 
      TBCNFT_ABI, 
      ownerAddress, 
      chainId
    );
    
    if (balance === 0) {
      return [];
    }
    
    // Get the total supply to know the range to search in
    const totalSupply = await contract.totalSupply();
    
    // Now we need to find which tokens are owned by this address
    // This is not efficient but necessary without an internal mapping
    const ownedTokens: number[] = [];
    const promises: Promise<void>[] = [];
    
    // Check each token ID to see if it's owned by the wallet
    // We create a batch of promises to speed up the process
    for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
      const promise = contractUtils.isOwnerOfToken(
        contractAddress,
        TBCNFT_ABI,
        tokenId,
        ownerAddress,
        chainId
      ).then(isOwner => {
        if (isOwner) {
          ownedTokens.push(tokenId);
        }
      });
      
      promises.push(promise);
      
      // Process in batches of 20 to avoid rate limits
      if (promises.length >= 20) {
        await Promise.all(promises);
        promises.length = 0;
      }
    }
    
    // Process any remaining promises
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    return ownedTokens;
  } catch (error) {
    console.error('Error getting owned token IDs:', error);
    return [];
  }
}

/**
 * Get IPFS Gateway URL for a given IPFS URI
 * @param uri The IPFS URI to convert
 * @returns The gateway URL
 */
export function getIpfsGatewayUrl(uri: string): string {
  // First check if it's an IPFS URI
  if (!uri) return '';
  
  // Default to using Cloudflare's IPFS gateway
  const gateway = 'https://cloudflare-ipfs.com/ipfs/';
  
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', gateway);
  }
  
  // Handle /ipfs/ path format
  if (uri.includes('/ipfs/')) {
    const ipfsHash = uri.split('/ipfs/')[1];
    return `${gateway}${ipfsHash}`;
  }
  
  // If it doesn't appear to be an IPFS URI, return it unchanged
  return uri;
}

/**
 * Batch get token URIs for multiple token IDs
 * @param contractAddress The NFT contract address
 * @param abi The contract ABI
 * @param tokenIds Array of token IDs to fetch
 * @param chainId The chain ID
 * @returns A record mapping token IDs to their token URIs
 */
export async function batchGetTokenURIs(
  contractAddress: string,
  abi: any,
  tokenIds: number[],
  chainId: number
): Promise<Record<number, string>> {
  const result: Record<number, string> = {};
  
  try {
    const contract = createTBCNFTInstance(contractAddress, chainId);
    if (!contract) {
      return result;
    }
    
    // Get the base URI if available
    let baseURI: string | null = null;
    try {
      baseURI = await getTBCNFTBaseURI(contractAddress, chainId);
    } catch (error) {
      // If we can't get the base URI, we'll try with tokenURI directly for each token
      console.warn('Could not get base URI, will try individual tokenURI calls', error);
    }
    
    // Batch the requests into groups to avoid rate limiting
    const batchSize = 10;
    
    // Create batches of token IDs
    for (let i = 0; i < tokenIds.length; i += batchSize) {
      const batch = tokenIds.slice(i, i + batchSize);
      
      // Process each batch with a Promise.all to run in parallel
      await Promise.all(
        batch.map(async (tokenId) => {
          try {
            // If we have a baseURI that ends with a /, we can just append the token ID
            if (baseURI && baseURI.endsWith('/')) {
              result[tokenId] = `${baseURI}${tokenId}`;
              return;
            }
            
            // Otherwise, we need to call tokenURI for each token
            const tokenURI = await contract.tokenURI(tokenId);
            result[tokenId] = tokenURI;
          } catch (error) {
            console.error(`Error fetching tokenURI for token ${tokenId}:`, error);
            // Don't set a value in the result if we couldn't get it
          }
        })
      );
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < tokenIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in batchGetTokenURIs:', error);
    return result;
  }
}

// /**
//  * Fix for the CORS issue mentioned in the error
//  * This is a client-side workaround to handle the Cross-Origin-Opener-Policy error
//  */
// export function setupCORSWorkaround() {
//   if (typeof window !== 'undefined') {
//     // Attempt to patch the fetch API to ignore the COOP errors
//     const originalFetch = window.fetch;
//     window.fetch = function(input, init) {
//       // Only proceed with patching if we're dealing with COOP checks
//       if (typeof input === 'string' && input.includes('cross-origin-opener-policy')) {
//         return Promise.resolve(new Response(JSON.stringify({}), {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' }
//         }));
//       }
      
//       // Otherwise, use the original fetch
//       return originalFetch.apply(this, arguments as any);
//     };
    
//     console.log('CORS workaround for COOP initialized');
//   }
// }

// Create and export combined utility object
const tbcNFTUtils = {
  createTBCNFTInstance,
  getTBCNFTBaseURI,
  fetchTBCNFTInfo,
  fetchMultipleTBCNFTs,
  getOwnedTokenIds,
  getIpfsGatewayUrl,
  batchGetTokenURIs,
  TBCNFT_ABI, // Export the ABI for direct use
};

export default tbcNFTUtils; 