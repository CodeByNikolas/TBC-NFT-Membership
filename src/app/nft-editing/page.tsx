'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbi } from 'viem';
import { api } from '@/lib/ClientApiUtils';
import tbcNFTUtils from '@/lib/tbcNFTUtils'; // Import the TBCNFT utility

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import { Loader2, LayoutGrid, List, SlidersHorizontal, Plus } from 'lucide-react';

// Custom components
import { ContractDetailsBanner } from './components/ContractDetailsBanner';
import { NFTCard } from './components/NFTCard';
import { AddNFTCard } from './components/AddNFTCard';
import { NFTListView } from './components/NFTListView';

// This is simpler since we use tbcNFTUtils now
const tokenURIABI = parseAbi([
  'function tokenURI(uint256 tokenId) view returns (string)'
]);

interface ContractData {
  id: string;
  contract_address: string;
  chain_id: number;
  deployer_address: string;
  name: string;
  symbol: string;
  base_uri: string;
  deployment_tx_hash: string;
  verification_status: 'pending' | 'verified' | 'failed';
  // Add on-chain data
  onChainData?: {
    name?: string;
    symbol?: string;
    baseURI?: string;
    totalSupply?: number;
    owner?: string;
  };
}

interface NFTData {
  id: number;
  name: string;
  image: string;
  description?: string;
  attributes?: any[];
  isLoading?: boolean; // Add loading state for each NFT
  tokenURI?: string;   // Add token URI for reference
}

// This is the main component that will be rendered by Next.js
export default function NFTEditingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NFTEditingContent />
    </Suspense>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <span>Loading...</span>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Contract Selected</h3>
        <p className="text-gray-600 mb-4">Please go to the Deployments page and select a contract to edit its NFTs.</p>
        <Link href="/deployments">
          <Button>Go to Deployments</Button>
        </Link>
      </div>
    </div>
  );
}

// NFT loading skeleton component
function NFTLoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array(count).fill(0).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="w-full aspect-square" />
          <CardContent className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-10 w-[48%]" />
              <Skeleton className="h-10 w-[48%]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Error state component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Contract</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/deployments">
          <Button>Back to Deployments</Button>
        </Link>
      </div>
    </div>
  );
}

// The main content component - now using tbcNFTUtils
function NFTEditingContent() {
  // The useSearchParams hook is now safely used inside a component that's wrapped with Suspense
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');
  
  const [contract, setContract] = useState<ContractData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [contractLoading, setContractLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [nftsLoading, setNftsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Function to load contract data from API and blockchain
  const fetchContractDetails = useCallback(async () => {
    if (!contractId) return;
    
    setContractLoading(true);
    try {
      // Try to get contract data from Supabase using the dedicated endpoint
      const response = await api.get(`/api/contracts/deployments/${contractId}`);
      const contractData = response.data.data;
      
      if (!contractData) {
        throw new Error('Contract not found');
      }
      
      // Set initial contract data to render the UI quickly
      setContract(contractData);
      setContractLoading(false);
      
      // Now fetch on-chain data asynchronously
      if (contractData.contract_address) {
        try {
          // Use tbcNFTUtils to fetch on-chain contract data
          const onChainData = await tbcNFTUtils.fetchTBCNFTInfo(
            contractData.contract_address,
            Number(contractData.chain_id)
          );
          
          if (onChainData) {
            // Update contract with on-chain data
            setContract(prevContract => {
              if (!prevContract) return null;
              
              return {
                ...prevContract,
                onChainData: {
                  name: onChainData.name,
                  symbol: onChainData.symbol,
                  baseURI: onChainData.baseURI,
                  totalSupply: onChainData.totalSupply,
                  owner: onChainData.owner
                }
              };
            });
            
            // Load initial NFTs based on totalSupply
            if (onChainData.totalSupply && onChainData.totalSupply > 0) {
              // Start loading NFTs with placeholders
              const count = Math.min(onChainData.totalSupply, 12);
              createNFTPlaceholders(count);
              loadNFTData(count, contractData.contract_address, Number(contractData.chain_id));
            } else {
              // If no totalSupply or zero, create a few placeholder NFTs
              createNFTPlaceholders(6);
              setNftsLoading(false);
            }
          } else {
            // If on-chain data couldn't be loaded, create placeholder NFTs
            createNFTPlaceholders(6);
            setNftsLoading(false);
          }
        } catch (err) {
          console.error("Error fetching on-chain contract data:", err);
          // If there's an error, still create placeholder NFTs
          createNFTPlaceholders(6);
          setNftsLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Error fetching contract:", err);
      setError(err.message || 'Failed to load contract data');
      setContractLoading(false);
    } finally {
      setInitialLoading(false);
    }
  }, [contractId]);

  // Load contract details when contractId changes
  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
    } else {
      setInitialLoading(false);
    }
  }, [contractId, fetchContractDetails]);

  // Create placeholder NFTs with loading state
  const createNFTPlaceholders = (count: number) => {
    const placeholders = Array(count).fill(0).map((_, index) => ({
      id: index + 1,
      name: `NFT #${index + 1}`,
      image: `/placeholder-nft.png`, // Use a local placeholder image
      description: 'Loading NFT data...',
      isLoading: true
    }));
    
    setNfts(placeholders);
  };

  // Load actual NFT data
  const loadNFTData = async (count: number, contractAddress: string, chainId: number) => {
    setNftsLoading(true);
    
    // Create array of promises to load NFT data in parallel
    const tokenIds = Array.from({ length: count }, (_, i) => i + 1);
    
    try {
      // Batch get token URIs using tbcNFTUtils
      const tokenURIs = await tbcNFTUtils.batchGetTokenURIs(
        contractAddress,
        tbcNFTUtils.TBCNFT_ABI,
        tokenIds,
        chainId
      );
      
      // Update each NFT with its data
      const updatedNfts = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const tokenURI = tokenURIs[tokenId];
            
            if (!tokenURI) {
              return {
                id: tokenId,
                name: `NFT #${tokenId}`,
                image: `/placeholder-nft.png`,
                description: 'No metadata available',
                isLoading: false
              };
            }
            
            // Get actual NFT metadata from the tokenURI
            let metadata;
            try {
              // Try to fetch the metadata from the tokenURI
              const gatewayUrl = tbcNFTUtils.getIpfsGatewayUrl(tokenURI);
              const response = await fetch(gatewayUrl);
              metadata = await response.json();
            } catch (err) {
              console.warn(`Failed to fetch metadata for token ${tokenId}:`, err);
              metadata = null;
            }
            
            if (metadata) {
              // Get image URL (either direct or IPFS)
              let imageUrl = metadata.image || `/placeholder-nft.png`;
              if (imageUrl.startsWith('ipfs://') || imageUrl.includes('/ipfs/')) {
                imageUrl = tbcNFTUtils.getIpfsGatewayUrl(imageUrl);
              }
              
              return {
                id: tokenId,
                name: metadata.name || `NFT #${tokenId}`,
                image: imageUrl,
                description: metadata.description || '',
                attributes: metadata.attributes || [],
                isLoading: false,
                tokenURI
              };
            } else {
              // Use placeholder for failed metadata
              return {
                id: tokenId,
                name: `NFT #${tokenId}`,
                image: `/placeholder-nft.png`,
                description: 'Metadata unavailable',
                isLoading: false,
                tokenURI
              };
            }
          } catch (err) {
            console.error(`Error loading NFT #${tokenId}:`, err);
            return {
              id: tokenId,
              name: `NFT #${tokenId}`,
              image: `/placeholder-nft.png`,
              description: 'Error loading NFT',
              isLoading: false
            };
          }
        })
      );
      
      setNfts(updatedNfts);
    } catch (err) {
      console.error("Error loading NFT data:", err);
    } finally {
      setNftsLoading(false);
    }
  };

  const handleEditNFT = (id: number) => {
    console.log(`Edit NFT ${id}`);
    // Implement edit functionality
  };

  const handleViewNFT = (id: number) => {
    console.log(`View NFT ${id}`);
    // Implement view functionality
  };

  const handleAddNFT = () => {
    console.log('Add new NFT');
    // Implement add functionality
  };

  // Show error state if there was an error
  if (error && !initialLoading) {
    return <ErrorState error={error} />;
  }

  // Show empty state if no contract was selected
  if (!contractId && !initialLoading) {
    return <EmptyState />;
  }

  // Show loading state while initial data is loading
  if (initialLoading) {
    return <LoadingState />;
  }

  // Prefer on-chain data if available, fall back to database values
  const name = contract?.onChainData?.name || contract?.name || '';
  const symbol = contract?.onChainData?.symbol || contract?.symbol || '';
  const baseURI = contract?.onChainData?.baseURI || contract?.base_uri || '';
  const totalSupply = contract?.onChainData?.totalSupply || 0;
  const chainId = Number(contract?.chain_id) || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Contract details banner */}
        {contract && (
          <ContractDetailsBanner
            name={name}
            symbol={symbol}
            contractAddress={contract.contract_address}
            chainId={chainId}
            baseUri={baseURI}
            totalSupply={totalSupply}
            deployerAddress={contract.deployer_address}
            isLoading={contractLoading}
          />
        )}

        {/* NFT list */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">NFT Collection</h2>
            <div className="flex space-x-2">
              {/* View mode toggle */}
              <div className="bg-secondary/20 rounded-md p-1 flex">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-2 h-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-2 h-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>

              {/* Add NFT button */}
              <Button onClick={handleAddNFT} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add NFT
              </Button>
            </div>
          </div>

          {/* Show loading state for NFTs */}
          {nftsLoading && nfts.length === 0 ? (
            <NFTLoadingSkeleton count={6} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  id={nft.id}
                  name={nft.name}
                  image={nft.image}
                  description={nft.description}
                  onEdit={handleEditNFT}
                  onView={handleViewNFT}
                  isLoading={nft.isLoading}
                />
              ))}
              <AddNFTCard onClick={handleAddNFT} />
            </div>
          ) : (
            <NFTListView
              nfts={nfts}
              onEdit={handleEditNFT}
              onView={handleViewNFT}
            />
          )}
        </div>
      </div>
    </div>
  );
} 