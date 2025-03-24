'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbi } from 'viem';
import api from '@/lib/api';

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
import { ContractDetailsBanner } from '@/components/ContractDetailsBanner';

// ERC721 ABI with totalSupply function
const erc721ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function totalSupply() view returns (uint256)'
]);

// Optional ABI containing just totalSupply for detection
const totalSupplyABI = parseAbi([
  'function totalSupply() view returns (uint256)'
]);

// ERC165 interface detection
const erc165ABI = parseAbi([
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
]);

// ERC721Enumerable interface ID (contains totalSupply)
const ERC721_ENUMERABLE_INTERFACE_ID = '0x780e9d63';

interface ContractData {
  id: string;
  contract_address: string;
  network: string;
  deployer_address: string;
  name: string;
  symbol: string;
  base_uri: string;
  deployment_tx_hash: string;
  deployment_timestamp: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_message?: string;
  verification_timestamp?: string;
  created_at: string | null;
}

interface NFTData {
  id: number;
  name: string;
  image: string;
  description?: string;
  attributes?: any[];
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

// NFT List View component
function NFTListView({ nfts, onEdit, onView, onAdd }: { 
  nfts: NFTData[],
  onEdit: (id: number) => void,
  onView: (id: number) => void,
  onAdd: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 py-3 px-4 font-medium text-sm text-gray-500 border-b">
        <div className="col-span-1">ID</div>
        <div className="col-span-1">Image</div>
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Actions</div>
      </div>
      
      {nfts.map((nft) => (
        <div key={nft.id} className="grid grid-cols-12 py-3 px-4 items-center bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow">
          <div className="col-span-1 font-mono text-sm">{nft.id}</div>
          <div className="col-span-1">
            <img 
              src={nft.image} 
              alt={nft.name} 
              className="w-10 h-10 rounded-md object-cover"
            />
          </div>
          <div className="col-span-4 font-medium truncate">{nft.name}</div>
          <div className="col-span-4 text-sm text-gray-500 truncate">{nft.description || '-'}</div>
          <div className="col-span-2 flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(nft.id)}>
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onView(nft.id)}>
              View
            </Button>
          </div>
        </div>
      ))}
      
      <Button 
        className="w-full py-6 border-dashed border-2 shadow-none hover:shadow-sm bg-transparent text-gray-500 hover:bg-gray-50"
        variant="outline"
        onClick={onAdd}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New NFT
      </Button>
    </div>
  );
}

// NFT Card component with enhanced styling
function NFTCard({ id, name, image, description, onEdit, onView }: {
  id: number;
  name: string;
  image: string;
  description?: string;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform hover:scale-105" 
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{name}</h3>
        {description && (
          <p className="text-sm text-gray-500 truncate mt-1">{description}</p>
        )}
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 mr-1"
            onClick={() => onEdit(id)}
          >
            Edit
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 ml-1"
            onClick={() => onView(id)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Add NFT Card component
function AddNFTCard({ onClick }: { onClick: () => void }) {
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-700">Add New NFT</h3>
        <p className="text-sm text-gray-500 mt-2">Upload and mint a new token</p>
      </div>
    </Card>
  );
}

// The main content component - now using useSearchParams properly within a client component
// that is wrapped in Suspense
function NFTEditingContent() {
  // The useSearchParams hook is now safely used inside a component that's wrapped with Suspense
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');
  
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
    }
  }, [contractId]);

  const fetchContractDetails = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      // Try to get contract data from Supabase using the dedicated endpoint
      const response = await api.get(`/api/contracts/deployments/${contractId}`);
      const contractData = response.data.data;
      
      if (!contractData) {
        throw new Error('Contract not found');
      }
      
      setContract(contractData);
      
      // Now fetch on-chain data
      if (contractData.contract_address && publicClient) {
        // Default placeholder count for NFTs if we can't get it from the blockchain
        const placeholderCount = 6;
        let hasUsedPlaceholder = false;
        
        try {
          // Try multiple approaches to check for totalSupply
          
          // Approach 1: Try to directly read the totalSupply (may fail with some errors)
          try {
            const data = await publicClient.readContract({
              address: contractData.contract_address as `0x${string}`,
              abi: totalSupplyABI,
              functionName: 'totalSupply',
            });
            
            setTotalSupply(Number(data));
            const count = Math.min(Number(data), 12);
            generateNFTs(count, contractData);
            return; // If successful, exit early
          } catch (err) {
            console.warn("Direct totalSupply read failed, trying alternative approaches");
          }
          
          // Approach 2: Check if the contract supports ERC721Enumerable via ERC165
          try {
            const supportsEnumerable = await publicClient.readContract({
              address: contractData.contract_address as `0x${string}`,
              abi: erc165ABI,
              functionName: 'supportsInterface',
              args: [ERC721_ENUMERABLE_INTERFACE_ID]
            });
            
            if (supportsEnumerable) {
              // If it supports the enumerable extension, try totalSupply again
              const data = await publicClient.readContract({
                address: contractData.contract_address as `0x${string}`,
                abi: totalSupplyABI,
                functionName: 'totalSupply',
              });
              
              setTotalSupply(Number(data));
              const count = Math.min(Number(data), 12);
              generateNFTs(count, contractData);
              return; // If successful, exit early
            } else {
              console.warn("Contract does not support ERC721Enumerable extension");
            }
          } catch (err) {
            console.warn("ERC165 interface check failed", err);
          }
          
          // Approach 3: Try to use estimateGas to check if the function exists
          try {
            await publicClient.estimateContractGas({
              address: contractData.contract_address as `0x${string}`,
              abi: totalSupplyABI,
              functionName: 'totalSupply',
              account: address || '0x0000000000000000000000000000000000000000',
            });
            
            // If estimateGas succeeds, try to call totalSupply again
            const data = await publicClient.readContract({
              address: contractData.contract_address as `0x${string}`,
              abi: totalSupplyABI,
              functionName: 'totalSupply',
            });
            
            setTotalSupply(Number(data));
            const count = Math.min(Number(data), 12);
            generateNFTs(count, contractData);
            return; // If successful, exit early
          } catch (err) {
            console.warn("Contract does not support totalSupply via estimateGas", err);
          }
          
          // If we reach here, none of the approaches worked - use placeholders
          if (!hasUsedPlaceholder) {
            console.log("Using placeholder NFT data");
            setTotalSupply(placeholderCount);
            generateNFTs(placeholderCount, contractData);
            hasUsedPlaceholder = true;
          }
        } catch (err) {
          console.error("Error fetching blockchain data:", err);
          if (!hasUsedPlaceholder) {
            setTotalSupply(placeholderCount);
            generateNFTs(placeholderCount, contractData);
          }
        }
      }
    } catch (err: any) {
      console.error("API error:", err);
      setError(err.message || 'Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to generate NFT data 
  const generateNFTs = (count: number, contractData: ContractData) => {
    const nftData: NFTData[] = [];
    for (let i = 0; i < count; i++) {
      nftData.push({
        id: i + 1,
        name: `${contractData.name || 'NFT'} #${i + 1}`,
        image: `https://picsum.photos/400/400?random=${i + 100 + Math.floor(Math.random() * 1000)}`,
        description: `A beautiful NFT from the ${contractData.name} collection`,
      });
    }
    setNfts(nftData);
  };

  const handleEditNFT = (id: number) => {
    console.log(`Edit NFT ${id}`);
    // TODO: Implement NFT editing
  };

  const handleViewNFT = (id: number) => {
    console.log(`View NFT ${id}`);
    // TODO: Implement NFT viewing
  };

  const handleAddNFT = () => {
    console.log('Add new NFT');
    // TODO: Implement add new NFT
  };

  // If no contract ID is provided, show a message to go to deployments
  if (!contractId) {
    return <EmptyState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Contract Details Banner */}
      {contract && (
        <div className="mb-8">
          <ContractDetailsBanner
            name={contract.name}
            symbol={contract.symbol}
            contractAddress={contract.contract_address}
            network={contract.network}
            baseUri={contract.base_uri}
            totalSupply={totalSupply}
            deployerAddress={contract.deployer_address}
          />
        </div>
      )}

      {/* NFT Gallery Section */}
      <Card className="shadow">
        <CardContent className="p-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">NFT Collection</h2>
                <p className="text-sm text-gray-500">Showing {nfts.length} of {totalSupply} NFTs</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <TabsList className="grid w-[160px] grid-cols-2">
                  <TabsTrigger value="grid">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Gallery
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                </TabsList>
  
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Sort by ID</DropdownMenuItem>
                    <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                    <DropdownMenuItem>Filter...</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* View Mode Content */}
            <TabsContent value="grid" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {nfts.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    id={nft.id}
                    name={nft.name}
                    image={nft.image}
                    description={nft.description}
                    onEdit={handleEditNFT}
                    onView={handleViewNFT}
                  />
                ))}
  
                {/* Add New NFT Card */}
                <AddNFTCard onClick={handleAddNFT} />
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <NFTListView 
                nfts={nfts} 
                onEdit={handleEditNFT} 
                onView={handleViewNFT} 
                onAdd={handleAddNFT} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 