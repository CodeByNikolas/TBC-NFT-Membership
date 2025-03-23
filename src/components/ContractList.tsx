'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

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
  created_at: string | null;
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
  
  // Use refs to track polling instead of state to avoid re-renders
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const lastPollTimeRef = useRef<number>(0);
  
  // Debug counter to track number of polls
  const pollCountRef = useRef<number>(0);

  // Cleanup function to stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      isPollingRef.current = false;
      console.log(`Polling stopped after ${pollCountRef.current} polls`);
      pollCountRef.current = 0;
    }
  };

  // Start polling function
  const startPolling = (pageNum: number) => {
    if (isPollingRef.current) {
      console.log('Polling already active, not starting another instance');
      return; // Already polling
    }
    
    console.log('Starting polling with 5 second interval');
    isPollingRef.current = true;
    pollCountRef.current = 0;
    
    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Ensure at least 4 seconds between polls to prevent overlapping
      if (now - lastPollTimeRef.current >= 4000) {
        pollCountRef.current++;
        lastPollTimeRef.current = now;
        console.log(`Polling contracts (poll #${pollCountRef.current})`);
        loadContracts(pageNum, true);
      } else {
        console.log('Skipping poll - too soon after last poll');
      }
    }, 5000);
  };

  // Force a single poll without starting the interval
  const forceSinglePoll = (pageNum: number) => {
    const now = Date.now();
    if (now - lastPollTimeRef.current >= 2000) {
      console.log('Forcing a single poll for immediate update');
      lastPollTimeRef.current = now;
      loadContracts(pageNum, true);
    } else {
      console.log('Skipping forced poll - too soon after last poll');
    }
  };

  // Helper function to check if there are any pending contracts
  const hasPendingContracts = (contractsToCheck: ContractDeployment[]) => {
    return contractsToCheck.some(contract => contract.verification_status === 'pending');
  };

  // Modify the initial load effect to check for pending contracts
  useEffect(() => {
    let mounted = true;
    
    const initialLoad = async () => {
      if (address) {
        try {
          setLoading(true);
          const response = await api.get('/api/contracts/deployments', {
            params: {
              page: 1,
              limit: 10,
              deployer_address: address
            }
          });
          
          if (!mounted) return;
          
          const contractsData = response.data.data;
          setContracts(contractsData);
          setHasMore(contractsData.length === 10);
          
          // Check for pending contracts and start polling if needed
          if (hasPendingContracts(contractsData)) {
            console.log('Initial load found pending contracts, starting polling');
            startPolling(1);
          }
        } catch (err: any) {
          if (mounted) {
            setError(err.message);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };
    
    initialLoad();
    
    // Clean up polling on unmount
    return () => {
      mounted = false;
      stopPolling();
    };
  }, [address]);

  // Effect to monitor contracts for pending status and start/stop polling accordingly
  useEffect(() => {
    // Don't do anything if we're still loading the initial data
    if (loading) return;
    
    const pendingExists = hasPendingContracts(contracts);
    
    console.log(`Contracts updated - has pending: ${pendingExists}, isPolling: ${isPollingRef.current}`);
    
    if (pendingExists && !isPollingRef.current) {
      console.log('Starting polling because pending contracts detected');
      startPolling(page);
    } else if (!pendingExists && isPollingRef.current) {
      console.log('Stopping polling - no more pending contracts');
      stopPolling();
    }
  }, [contracts, page, loading]);

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

  // Add an effect to update the countdown timer UI every second
  useEffect(() => {
    // Force UI updates every second for contracts with active countdowns
    const hasDeployedContracts = contracts.some(isRecentlyDeployed);
    
    if (hasDeployedContracts) {
      const interval = setInterval(() => {
        // This state update will trigger a re-render even though no actual data changes
        // Just to refresh the UI for the countdown timers
        setContracts(prevContracts => [...prevContracts]);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [contracts]);

  // Modify loadContracts to update only the necessary state
  const loadContracts = async (pageNum = 1, isPolling = false) => {
    try {
      // Only show loading indicator for initial/manual loads, not polling
      if (!isPolling) {
        setLoading(true);
      }
      
      const response = await api.get('/api/contracts/deployments', {
        params: {
          page: pageNum,
          limit: 10,
          deployer_address: address
        }
      });

      const contractsData = response.data.data;

      if (pageNum === 1) {
        setContracts(contractsData);
      } else if (isPolling) {
        // For polling updates, only update contracts that have changed status
        setContracts(prevContracts => {
          const updatedContracts = [...prevContracts];
          let hasChanges = false;
          
          // Update only contracts that have changed
          contractsData.forEach((newContract: ContractDeployment) => {
            const existingIndex = updatedContracts.findIndex(c => c.id === newContract.id);
            if (existingIndex !== -1) {
              // Only update if verification status or message has changed
              if (updatedContracts[existingIndex].verification_status !== newContract.verification_status ||
                  updatedContracts[existingIndex].verification_message !== newContract.verification_message) {
                console.log(`Contract ${newContract.id} changed status: ${updatedContracts[existingIndex].verification_status} -> ${newContract.verification_status}`);
                updatedContracts[existingIndex] = newContract;
                hasChanges = true;
              }
            }
          });
          
          return hasChanges ? updatedContracts : prevContracts;
        });
      } else {
        // Normal pagination append
        setContracts(prev => [...prev, ...contractsData]);
      }

      // Only update pagination info for manual loads
      if (!isPolling) {
        setHasMore(contractsData.length === 10);
        setPage(pageNum);
      }
    } catch (err: any) {
      if (!isPolling) {
        setError(err.message);
      } else {
        console.error('Error during status polling:', err);
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

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
      const response = await api.post('/api/contracts/verify', {
        contract_address: contractAddress
      });
      
      console.log(`Verification API response:`, response.data);
      
      // Update contract status to pending to show immediate feedback
      setContracts(prev => {
        const updated = prev.map(contract => {
          if (contract.contract_address === contractAddress) {
            return {
              ...contract,
              verification_status: 'pending' as const,
              verification_message: 'Verification in progress...',
              verification_timestamp: new Date().toISOString()
            };
          }
          return contract;
        });
        
        // Make sure polling is active since we now have at least one pending contract
        if (!isPollingRef.current) {
          console.log('Starting polling after verification request');
          startPolling(page);
        }
        
        return updated;
      });
      
      // Force a single poll after 2 seconds for immediate feedback
      setTimeout(() => {
        forceSinglePoll(page);
      }, 2000);
      
      // Clear verifying state and set cooldown
      setTimeout(() => {
        setVerifyingContracts(prev => ({ ...prev, [contractAddress]: false }));
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

  const isRecentlyDeployed = (contract: ContractDeployment): boolean => {
    const timestamp = contract.deployment_timestamp || contract.created_at;
    if (!timestamp) return false;
    
    const deployTime = new Date(timestamp).getTime();
    const now = Date.now();
    const secondsSinceDeployment = Math.floor((now - deployTime) / 1000);
    
    return secondsSinceDeployment < 120; // Block retries for 120 seconds
  };
  
  // Update getWaitTimeMessage to use 120 seconds
  const getWaitTimeMessage = (contract: ContractDeployment): string => {
    const timestamp = contract.deployment_timestamp || contract.created_at;
    if (!timestamp) return "Verification scheduled";
    
    const deployTime = new Date(timestamp).getTime();
    const now = Date.now();
    const secondsSinceDeployment = Math.floor((now - deployTime) / 1000);
    const secondsRemaining = 120 - secondsSinceDeployment;
    
    if (secondsRemaining <= 0) return "Verification in progress";
    return `Verification scheduled (${secondsRemaining}s)`;
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
                {contract.verification_status === 'pending' && isRecentlyDeployed(contract) ? (
                  <Button 
                    disabled
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {getWaitTimeMessage(contract)}
                  </Button>
                ) : (
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
                )}
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