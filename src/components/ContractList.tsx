'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface ContractDeployment {
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
}

export function ContractList() {
  const { address } = useAccount();
  const [contracts, setContracts] = useState<ContractDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [verifyingContracts, setVerifyingContracts] = useState<{ [key: string]: boolean }>({});
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});

  // Handle countdown timers for verification cooldowns
  useEffect(() => {
    const cooldownTimers: { [key: string]: NodeJS.Timeout } = {};
    
    // Update cooldown timers every second
    const interval = setInterval(() => {
      setCooldowns(prev => {
        const updated = { ...prev };
        let hasUpdates = false;
        
        // Decrease each cooldown by 1 second
        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) {
            updated[key] -= 1;
            hasUpdates = true;
          }
        });
        
        return hasUpdates ? updated : prev;
      });
    }, 1000);
    
    return () => {
      // Clean up interval and all timers
      clearInterval(interval);
      Object.values(cooldownTimers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const loadContracts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/contracts/deployments', {
        params: {
          page: pageNum,
          limit: 10,
          deployer_address: address
        }
      });

      if (pageNum === 1) {
        setContracts(response.data.data);
      } else {
        setContracts(prev => [...prev, ...response.data.data]);
      }

      setHasMore(response.data.data.length === 10);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadContracts();
    }
  }, [address]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadContracts(page + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getBlockExplorerUrl = (network: string, contractAddress: string, isTx = false) => {
    const addressPath = isTx ? 'tx' : 'address';
    
    switch (network.toLowerCase()) {
      case 'ethereum mainnet':
        return `https://etherscan.io/${addressPath}/${contractAddress}`;
      case 'sepolia testnet':
        return `https://sepolia.etherscan.io/${addressPath}/${contractAddress}`;
      case 'polygon mainnet':
        return `https://polygonscan.com/${addressPath}/${contractAddress}`;
      case 'polygon amoy':
        return `https://amoy.polygonscan.com/${addressPath}/${contractAddress}`;
      default:
        // For unknown networks, try to make an educated guess based on network name
        const networkName = network.toLowerCase();
        if (networkName.includes('ethereum')) {
          return `https://etherscan.io/${addressPath}/${contractAddress}`;
        } else if (networkName.includes('polygon')) {
          return `https://polygonscan.com/${addressPath}/${contractAddress}`;
        }
        return '#';
    }
  };

  const handleVerifyContract = async (contractAddress: string) => {
    try {
      // Set verifying state for this contract
      setVerifyingContracts(prev => ({ ...prev, [contractAddress]: true }));
      
      console.log(`Initiating verification for contract: ${contractAddress}`);
      
      // Call the verification API
      const response = await axios.post('/api/contracts/verify', {
        contract_address: contractAddress
      });
      
      console.log(`Verification API response:`, response.data);
      
      // Refresh the contract list to show updated status
      setTimeout(() => {
        loadContracts(page);
        setVerifyingContracts(prev => ({ ...prev, [contractAddress]: false }));
        
        // Set a 60 second cooldown for the contract after attempting verification
        setCooldowns(prev => ({ ...prev, [contractAddress]: 60 }));
      }, 2000);
    } catch (error) {
      console.error('Error verifying contract:', error);
      setVerifyingContracts(prev => ({ ...prev, [contractAddress]: false }));
      
      // Set a 60 second cooldown even on error
      setCooldowns(prev => ({ ...prev, [contractAddress]: 60 }));
      
      // Still reload contracts to get updated status
      setTimeout(() => loadContracts(page), 2000);
    }
  };

  // Function to format the cooldown time
  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
  };

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to view your contracts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployments Yet</h3>
        <p className="text-gray-600 mb-4">You haven't deployed any contracts yet. Start by creating and deploying your first NFT contract.</p>
        <Link href="/contract-creation">
          <Button>Create New Contract</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map(contract => (
        <div key={contract.id} className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{contract.name}</h3>
              <p className="text-gray-600">Symbol: {contract.symbol}</p>
            </div>
            <span className={`font-semibold ${getStatusColor(contract.verification_status)}`}>
              Verification: {contract.verification_status.charAt(0).toUpperCase() + contract.verification_status.slice(1)}
            </span>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm">
              <span className="font-medium">Address:</span>{' '}
              <a
                href={getBlockExplorerUrl(contract.network, contract.contract_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-500 hover:underline"
              >
                {contract.contract_address}
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">Network:</span> {contract.network}
            </p>
            <p className="text-sm">
              <span className="font-medium">Deployment:</span>{' '}
              <a
                href={getBlockExplorerUrl(contract.network, contract.deployment_tx_hash, true)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Transaction
              </a>
            </p>
            {contract.verification_message && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Message:</span> {contract.verification_message}
              </p>
            )}
            
            {/* Verification button */}
            {(contract.verification_status === 'pending' || contract.verification_status === 'failed') && (
              <div className="mt-4">
                <Button 
                  onClick={() => handleVerifyContract(contract.contract_address)}
                  disabled={
                    verifyingContracts[contract.contract_address] || 
                    (cooldowns[contract.contract_address] > 0)
                  }
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  {verifyingContracts[contract.contract_address] ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : cooldowns[contract.contract_address] && cooldowns[contract.contract_address] > 0 ? (
                    `Retry in ${formatCooldown(cooldowns[contract.contract_address])}`
                  ) : (
                    contract.verification_status === 'failed' ? 'Retry Verification' : 'Verify Contract'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {hasMore && (
        <div className="text-center py-4">
          <Button
            onClick={loadMore}
            variant="outline"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}