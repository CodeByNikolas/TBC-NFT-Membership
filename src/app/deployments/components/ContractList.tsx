'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Button } from "@/components/ui/button";
import { api } from '@/lib/ClientApiUtils';

// Import types and utilities
import { ContractDeployment } from './types';
import { hasPendingContracts, isRecentlyDeployed } from './utils';

// Import components
import { NetworkToggle } from './NetworkToggle';
import { ContractCard } from './ContractCard';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  NoWalletState,
  NoContractsFoundState
} from './StateComponents';

export function ContractList() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [contracts, setContracts] = useState<ContractDeployment[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractDeployment[]>([]);
  const [showAllNetworks, setShowAllNetworks] = useState(false);
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

  // Load contracts initially
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

  // Monitor contracts for pending status
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
    
    return () => clearInterval(interval);
  }, []);

  // Update countdown timer UI
  useEffect(() => {
    const hasDeployedContracts = contracts.some(isRecentlyDeployed);
    
    if (hasDeployedContracts) {
      const interval = setInterval(() => {
        // Trigger re-render for countdown timers
        setContracts(prevContracts => [...prevContracts]);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [contracts]);

  // Filter contracts based on network toggle
  useEffect(() => {
    if (showAllNetworks) {
      setFilteredContracts(contracts);
    } else {
      // Filter to only show contracts from the current network using chain_id
      setFilteredContracts(
        contracts.filter(contract => contract.chain_id === chainId)
      );
    }
  }, [contracts, showAllNetworks, chainId]);

  // Load contracts (can be called manually or by polling)
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

  const handleVerifyContract = async (contractId: string) => {
    try {
      // Find the contract in our local state
      const contract = filteredContracts.find(c => c.id === contractId);
      if (!contract) {
        console.error(`Contract with ID ${contractId} not found`);
        return;
      }

      // Set verifying state for this contract
      setVerifyingContracts(prev => ({ ...prev, [contractId]: true }));
      
      console.log(`Initiating verification for contract: ${contract.contract_address}`);
      
      // Call the verification API with contract_address
      const response = await api.post('/api/contracts/verify', {
        contract_address: contract.contract_address
      });
      
      console.log(`Verification API response:`, response.data);
      
      // Update contract status to pending to show immediate feedback
      setContracts(prev => {
        const updated = prev.map(c => {
          if (c.id === contractId) {
            return {
              ...c,
              verification_status: 'pending' as const,
              verification_message: 'Verification in progress...',
              verification_timestamp: new Date().toISOString()
            };
          }
          return c;
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
        setVerifyingContracts(prev => ({ ...prev, [contractId]: false }));
        setCooldowns(prev => ({ ...prev, [contractId]: 60 }));
      }, 2000);
    } catch (error) {
      console.error('Error verifying contract:', error);
      setVerifyingContracts(prev => ({ ...prev, [contractId]: false }));
      
      // Set a 60 second cooldown even on error
      setCooldowns(prev => ({ ...prev, [contractId]: 60 }));
      
      // Still reload contracts to get updated status
      setTimeout(() => loadContracts(page), 2000);
    }
  };

  // Helper function for verification status
  const isVerificationDisabled = (contractId: string): boolean => {
    return verifyingContracts[contractId] || 
           (cooldowns[contractId] > 0) || 
           filteredContracts.find(c => c.id === contractId)?.verification_status === 'verified';
  };

  // Render based on state
  if (!address) {
    return <NoWalletState />;
  }

  if (loading && page === 1) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (contracts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <NetworkToggle 
        showAllNetworks={showAllNetworks} 
        setShowAllNetworks={setShowAllNetworks} 
      />

      {loading && page === 1 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredContracts.length === 0 ? (
        <NoContractsFoundState />
      ) : (
        <div className="space-y-4">
          {filteredContracts.map(contract => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onVerify={handleVerifyContract}
              verifyingContracts={verifyingContracts}
              cooldowns={cooldowns}
              isVerificationDisabled={isVerificationDisabled}
            />
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
      )}
    </div>
  );
}