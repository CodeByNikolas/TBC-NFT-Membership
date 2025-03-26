import { ethers } from 'ethers';
import ethersUtils from './ethersUtil';

/**
 * ContractUtils - Utility functions for interacting with smart contracts
 * Builds upon ethersUtils for provider management
 */

/**
 * A basic contract instance with common NFT methods
 */
export interface NFTContractInfo {
  address: string;
  name?: string;
  symbol?: string;
  baseURI?: string;
  totalSupply?: number;
  chainId: number;
}

/**
 * Create a contract instance from ABI and address
 */
export function createContractInstance(
  address: string,
  abi: any,
  chainId: number
): ethers.Contract | null {
  try {
    const provider = ethersUtils.getProvider(chainId);
    
    if (!provider) {
      console.error(`No provider available for chain ID: ${chainId}`);
      return null;
    }
    
    return new ethers.Contract(address, abi, provider);
  } catch (error) {
    console.error(`Error creating contract instance:`, error);
    return null;
  }
}

/**
 * Fetch basic information from an ERC721 NFT contract
 * @param address Contract address
 * @param abi Contract ABI
 * @param chainId Network chain ID
 */
export async function fetchNFTContractInfo(
  address: string,
  abi: any,
  chainId: number
): Promise<NFTContractInfo | null> {
  try {
    const contract = createContractInstance(address, abi, chainId);
    
    if (!contract) {
      return null;
    }
    
    // Create the result object
    const result: NFTContractInfo = {
      address,
      chainId
    };

    // Create an array of promises for all the contract calls
    const promises: Promise<any>[] = [];
    const promiseNames: string[] = [];

    // Add all supported method calls to the batch
    // These methods are standard in ERC721, but we'll handle cases where they don't exist
    if (hasMethod(contract, 'name')) {
      promises.push(contract.name());
      promiseNames.push('name');
    }
    
    if (hasMethod(contract, 'symbol')) {
      promises.push(contract.symbol());
      promiseNames.push('symbol');
    }
    
    if (hasMethod(contract, 'getBaseURI') || hasMethod(contract, 'baseURI')) {
      const baseURIMethod = hasMethod(contract, 'getBaseURI') ? 'getBaseURI' : 'baseURI';
      promises.push(contract[baseURIMethod]());
      promiseNames.push('baseURI');
    }
    
    if (hasMethod(contract, 'totalSupply')) {
      promises.push(contract.totalSupply());
      promiseNames.push('totalSupply');
    }

    // Execute all promises concurrently
    const results = await Promise.allSettled(promises);
    
    // Process results
    results.forEach((resultItem, index) => {
      if (resultItem.status === 'fulfilled') {
        const propertyName = promiseNames[index];
        // For BigNumber results (like totalSupply), convert to number
        if (propertyName === 'totalSupply' && resultItem.value.toString) {
          result[propertyName] = Number(resultItem.value.toString());
        } else {
          result[propertyName] = resultItem.value;
        }
      } else {
        console.warn(`Failed to fetch ${promiseNames[index]} for contract ${address}:`, resultItem.reason);
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching NFT contract info:`, error);
    return null;
  }
}

/**
 * Fetch information from multiple NFT contracts in parallel
 * @param contracts Array of contract configurations
 */
export async function fetchMultipleNFTContracts(
  contracts: Array<{ address: string, abi: any, chainId: number }>
): Promise<NFTContractInfo[]> {
  try {
    const promises = contracts.map(contract => 
      fetchNFTContractInfo(contract.address, contract.abi, contract.chainId)
    );
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<NFTContractInfo> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching multiple NFT contracts:', error);
    return [];
  }
}

/**
 * Get token balance for a specific address
 * @param contractAddress NFT contract address
 * @param abi Contract ABI
 * @param ownerAddress Address to check balance for
 * @param chainId Chain ID
 */
export async function getTokenBalance(
  contractAddress: string,
  abi: any,
  ownerAddress: string,
  chainId: number
): Promise<number> {
  try {
    const contract = createContractInstance(contractAddress, abi, chainId);
    
    if (!contract) {
      return 0;
    }
    
    const balance = await contract.balanceOf(ownerAddress);
    return Number(balance.toString());
  } catch (error) {
    console.error(`Error getting token balance:`, error);
    return 0;
  }
}

/**
 * Get token URI for a specific token ID
 */
export async function getTokenURI(
  contractAddress: string,
  abi: any,
  tokenId: number,
  chainId: number
): Promise<string | null> {
  try {
    const contract = createContractInstance(contractAddress, abi, chainId);
    
    if (!contract) {
      return null;
    }
    
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error(`Error getting token URI:`, error);
    return null;
  }
}

/**
 * Get the base URI from a TBCNFT contract
 * @param contractAddress Contract address
 * @param abi Contract ABI
 * @param chainId Chain ID
 * @returns The base URI string or null if not available
 */
export async function getBaseURI(
  contractAddress: string,
  abi: any,
  chainId: number
): Promise<string | null> {
  try {
    const contract = createContractInstance(contractAddress, abi, chainId);
    
    if (!contract) {
      return null;
    }
    
    // First try the getBaseURI method (specific to TBCNFT)
    if (hasMethod(contract, 'getBaseURI')) {
      return await contract.getBaseURI();
    }
    
    // Fallback to baseURI method if available
    if (hasMethod(contract, 'baseURI')) {
      return await contract.baseURI();
    }
    
    console.warn('No baseURI method found in contract');
    return null;
  } catch (error) {
    console.error('Error getting base URI:', error);
    return null;
  }
}

/**
 * Check if a wallet owns a specific NFT
 */
export async function isOwnerOfToken(
  contractAddress: string,
  abi: any,
  tokenId: number,
  ownerAddress: string,
  chainId: number
): Promise<boolean> {
  try {
    const contract = createContractInstance(contractAddress, abi, chainId);
    
    if (!contract) {
      return false;
    }
    
    const tokenOwner = await contract.ownerOf(tokenId);
    return tokenOwner.toLowerCase() === ownerAddress.toLowerCase();
  } catch (error) {
    console.error(`Error checking token ownership:`, error);
    return false;
  }
}

/**
 * Batch RPC call to read multiple tokens at once
 * Note: This uses ethers.js Multicall which requires the contract to support multicall
 * @param contractAddress Contract address
 * @param abi Contract ABI
 * @param tokenIds Array of token IDs to query
 * @param chainId Chain ID
 */
export async function batchGetTokenURIs(
  contractAddress: string,
  abi: any,
  tokenIds: number[],
  chainId: number
): Promise<Record<number, string>> {
  try {
    const contract = createContractInstance(contractAddress, abi, chainId);
    
    if (!contract) {
      return {};
    }
    
    // Create a multicall interface for the provider
    const provider = ethersUtils.getProvider(chainId);
    
    if (!provider) {
      return {};
    }
    
    // Regular sequential approach
    const results: Record<number, string> = {};
    
    // Prepare batch of promises
    const promises = tokenIds.map(tokenId => {
      return contract.tokenURI(tokenId)
        .then((uri: string) => {
          results[tokenId] = uri;
        })
        .catch((error: any) => {
          console.error(`Error fetching tokenURI for token ${tokenId}:`, error);
        });
    });
    
    // Wait for all promises to resolve
    await Promise.allSettled(promises);
    
    return results;
  } catch (error) {
    console.error(`Error in batch getting token URIs:`, error);
    return {};
  }
}

/**
 * Check if a contract has a specific method
 */
function hasMethod(contract: ethers.Contract, methodName: string): boolean {
  return contract.interface.fragments.some(
    (fragment: any) => fragment.name === methodName
  );
}

// Create and export combined utility object
const contractUtils = {
  createContractInstance,
  fetchNFTContractInfo,
  fetchMultipleNFTContracts,
  getTokenBalance,
  getTokenURI,
  getBaseURI,
  isOwnerOfToken,
  batchGetTokenURIs
};

export default contractUtils; 