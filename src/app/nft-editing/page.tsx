'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbi } from 'viem';
import { NFTCard } from '@/components/NFTCard';
import { AddNFTCard } from '@/components/AddNFTCard';
import { ContractDetailsBanner } from '@/components/ContractDetailsBanner';

// ERC721 ABI with totalSupply function
const erc721ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)'
]);

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

export default function NFTEditing() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
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
        try {
          // Get total NFT supply using publicClient
          const data = await publicClient.readContract({
            address: contractData.contract_address as `0x${string}`,
            abi: erc721ABI,
            functionName: 'totalSupply',
          });
          
          setTotalSupply(Number(data));
          
          // Fetch individual NFTs
          // For now with placeholders, but we can load from IPFS/blockchain
          const nftData: NFTData[] = [];
          
          // Create some placeholder NFTs based on the total supply
          const count = Math.min(Number(data), 12); // Limit to 12 for performance
          for (let i = 0; i < count; i++) {
            nftData.push({
              id: i + 1,
              name: `${contractData.name || 'NFT'} #${i + 1}`,
              image: `https://placehold.co/200x200/${getRandomColor()}/white?text=NFT+${i + 1}`,
              description: `Token ID: ${i + 1}`,
            });
          }
          
          setNfts(nftData);
        } catch (err) {
          console.error("Error fetching blockchain data:", err);
          // Fallback to placeholders if blockchain data fails
          setNfts([
            { id: 1, name: 'NFT #1', image: 'https://placehold.co/200x200/purple/white?text=NFT+1' },
            { id: 2, name: 'NFT #2', image: 'https://placehold.co/200x200/blue/white?text=NFT+2' },
            { id: 3, name: 'NFT #3', image: 'https://placehold.co/200x200/green/white?text=NFT+3' },
          ]);
        }
      }
    } catch (err: any) {
      console.error("API error:", err);
      setError(err.message || 'Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to generate random colors for placeholder NFTs
  const getRandomColor = () => {
    const colors = ['purple', 'blue', 'green', 'red', 'orange', 'teal', 'pink', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Helper to get chainId from network name
  const getChainIdFromNetwork = (network: string): number => {
    switch (network.toLowerCase()) {
      case 'ethereum mainnet':
        return 1;
      case 'sepolia testnet':
        return 11155111;
      case 'polygon mainnet':
        return 137;
      case 'polygon amoy':
        return 80002;
      default:
        return 1; // Default to Ethereum mainnet
    }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading contract details...</span>
      </div>
    );
  }

  if (error) {
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">NFT Collection</h2>
        <p className="text-sm text-gray-500">Showing {nfts.length} of {totalSupply} NFTs</p>
      </div>
      
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
    </div>
  );
} 