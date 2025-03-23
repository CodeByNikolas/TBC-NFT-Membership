'use client'

import { useAccount, useChainId, useDeployContract, useWaitForTransactionReceipt, useFeeData, usePublicClient } from 'wagmi'
import { parseEther, formatUnits, encodeAbiParameters } from 'viem'
import contractData from '@/contracts/TBCNFT.json'
import axios from 'axios'
import React from 'react'

interface DeployContractResult {
  address: string
  hash: string
}

interface ContractDeploymentHook {
  deploy: (params: {
    name: string;
    symbol: string;
    baseURI?: string;
    gasMultiplier?: number;
  }) => Promise<DeployContractResult>;
  estimateGas: (params: {
    name: string;
    symbol: string;
    baseURI?: string;
  }) => Promise<bigint | null>;
  isDeploying: boolean;
  isEstimatingGas: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  hash: `0x${string}` | undefined;
  feeData: any; // Using any here for simplicity, could be more specific
  estimatedGas: bigint | null;
}

interface TransactionReceipt {
  contractAddress: string
  transactionHash: string
  [key: string]: any
}

export function useContractDeployment(): ContractDeploymentHook {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: feeData } = useFeeData()
  const publicClient = usePublicClient()
  
  const { deployContract, data: hash, isPending } = useDeployContract()
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Additional state for manual confirmation tracking
  const [manuallyConfirmed, setManuallyConfirmed] = React.useState(false)
  const [contractAddress, setContractAddress] = React.useState<string | null>(null)
  const [recordedInSupabase, setRecordedInSupabase] = React.useState(false)
  
  // Store estimated gas value
  const [estimatedGas, setEstimatedGas] = React.useState<bigint | null>(null)
  const [isEstimatingGas, setIsEstimatingGas] = React.useState(false)
  const [lastEstimateParams, setLastEstimateParams] = React.useState<string | null>(null)
  const estimationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Use this reference to track the latest estimation request to avoid race conditions
  const latestEstimationId = React.useRef<number>(0)
  
  // Cache for recent estimations to avoid unnecessary API calls
  const recentEstimations = React.useRef<Record<string, {time: number, value: bigint}>>({})

  // Store form values for later use in the useEffect
  const [deploymentData, setDeploymentData] = React.useState<{
    name: string;
    symbol: string;
    baseURI: string;
  } | null>(null)

  // Function to estimate gas for contract deployment
  const estimateContractGas = async (name: string, symbol: string, initialOwner: `0x${string}`, baseURI: string) => {
    try {
      console.log('Estimating gas for contract deployment with real parameters...');
      
      // Validate the bytecode
      if (!contractData.bytecode || typeof contractData.bytecode !== 'string' || !contractData.bytecode.startsWith('0x')) {
        console.error('Invalid bytecode format:', contractData.bytecode);
        throw new Error('Invalid contract bytecode format');
      }
      
      // Prepare the encoded constructor arguments
      const encodedConstructorArgs = encodeAbiParameters(
        [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'initialOwner', type: 'address' },
          { name: 'baseURI', type: 'string' }
        ],
        [name, symbol, initialOwner, baseURI]
      );
      
      // Ensure the bytecode has the correct format with 0x prefix
      let rawBytecode = contractData.bytecode;
      if (typeof rawBytecode !== 'string') {
        throw new Error('Invalid bytecode format: not a string');
      }
      
      if (!rawBytecode.startsWith('0x')) {
        rawBytecode = `0x${rawBytecode}`;
      }
      
      // Now we can safely type it as a 0x-prefixed string
      const bytecode = rawBytecode as `0x${string}`;
      const deployData = `${bytecode}${encodedConstructorArgs.slice(2)}` as `0x${string}`;
      
      // First try to use wagmi's publicClient which uses the wallet's provider
      if (publicClient) {
        try {
          console.log('Estimating gas using connected wallet provider...');
          const gasEstimate = await publicClient.estimateGas({
            account: initialOwner,
            data: deployData
          });
          
          console.log('Raw gas estimate result from wallet provider:', gasEstimate);
          
          // Add a 20% buffer to the estimate for safety
          const estimatedWithBuffer = gasEstimate + (gasEstimate * BigInt(20) / BigInt(100));
          
          console.log(`Final gas estimate: ${estimatedWithBuffer} (with 20% buffer)`);
          return estimatedWithBuffer;
        } catch (walletError) {
          console.warn('Failed to estimate gas using wallet provider, falling back to RPC:', walletError);
          // Fall through to the RPC method below
        }
      }

      // Fallback to manual RPC call if publicClient isn't available or fails
      const rpcUrl = getRpcUrl(chainId);
      if (!rpcUrl) {
        throw new Error('No RPC URL available for this network');
      }
      
      // Estimate gas through RPC with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_estimateGas',
            params: [{
              from: initialOwner,
              data: deployData
            }]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle rate limiting errors explicitly
        if (response.status === 429) {
          console.log('Rate limit hit, using fallback gas estimate');
          throw new Error('Rate limit exceeded');
        }
        
        if (!response.ok) {
          throw new Error(`RPC error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(`Gas estimation failed: ${result.error.message}`);
        }
        
        const estimatedGasHex = result.result;
        if (!estimatedGasHex) {
          throw new Error('No gas estimate returned from RPC');
        }
        
        const estimateResult = BigInt(estimatedGasHex);
        
        console.log('Raw gas estimate result:', estimateResult);
        
        // Add a 20% buffer to the estimate for safety
        const estimatedWithBuffer = estimateResult + (estimateResult * BigInt(20) / BigInt(100));
        
        console.log(`Final gas estimate: ${estimatedWithBuffer} (with 20% buffer)`);
        return estimatedWithBuffer;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError; // Pass along the error for the main catch block
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      
      // Fallback to conservative values if estimation fails
      console.log('Using fallback gas estimates since real estimation failed');
      let fallbackEstimate: bigint;
      
      if (chainId === 137 || chainId === 80002) {
        // Polygon networks typically use less gas
        fallbackEstimate = BigInt(375000); // 250000 + 50% buffer
      } else {
        // Ethereum and other chains
        fallbackEstimate = BigInt(450000); // 300000 + 50% buffer
      }
      
      console.log(`Using fallback gas estimate: ${fallbackEstimate}`);
      return fallbackEstimate;
    }
  };

  // Manual polling for transaction confirmation if useWaitForTransactionReceipt doesn't work
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Only start polling if we have a hash and it's not already confirmed by the hook
    if (hash && !isSuccess && !manuallyConfirmed) {
      console.log('Starting manual transaction polling for hash:', hash);
      
      const checkTransaction = async () => {
        try {
          // First try to use the wallet's provider through wagmi publicClient
          if (publicClient) {
            try {
              console.log('Checking transaction receipt using wallet provider...');
              const receipt = await publicClient.getTransactionReceipt({ hash });
              
              if (receipt) {
                console.log('Receipt found from wallet provider:', receipt);
                setManuallyConfirmed(true);
                setContractAddress(receipt.contractAddress);
                return;
              }
            } catch (walletError) {
              console.warn('Failed to get receipt from wallet, falling back to RPC:', walletError);
            }
          }
          
          // Fallback to manual RPC call
          const rpcUrl = getRpcUrl(chainId);
          if (!rpcUrl) return;
          
          // Make a direct JSON-RPC call to check transaction receipt
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionReceipt',
              params: [hash]
            })
          });
          
          const data = await response.json();
          
          if (data.result) {
            console.log('Manual transaction confirmation detected:', data.result);
            setManuallyConfirmed(true);
            setContractAddress(data.result.contractAddress);
            
            // No need to continue polling
            return;
          }
          
          // Continue polling if no receipt yet
          timeoutId = setTimeout(checkTransaction, 5000);
        } catch (error) {
          console.error('Error checking transaction:', error);
          // Continue polling despite error
          timeoutId = setTimeout(checkTransaction, 5000);
        }
      };
      
      // Start the initial check
      checkTransaction();
    }
    
    // Cleanup the timeout on unmount or when status changes
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hash, isSuccess, chainId, manuallyConfirmed, publicClient]);

  // Add a useEffect to handle recording the deployment once the receipt is available
  // This will trigger for both the wagmi hook success and our manual confirmation
  React.useEffect(() => {
    const recordDeployment = async () => {
      // Only proceed if not already recorded in Supabase
      if (recordedInSupabase) return;
      
      // Check for either the wagmi hook success or our manual confirmation
      if ((isSuccess && receipt && address && deploymentData) || 
          (manuallyConfirmed && contractAddress && address && deploymentData)) {
        try {
          // Use either the receipt from the hook or our manually detected contract address
          const confirmedContractAddress = receipt?.contractAddress as string || contractAddress;
          
          if (!confirmedContractAddress) {
            console.error('No contract address found in receipt');
            return;
          }
          
          console.log('Recording deployment with contract address:', confirmedContractAddress);
          setRecordedInSupabase(true);
          
          // Record deployment in Supabase with all required fields
          await axios.post('/api/contracts/deployments', {
            contract_address: confirmedContractAddress,
            network: getNetworkName(chainId),
            chain_id: chainId,
            deployer_address: address,
            name: deploymentData.name,
            symbol: deploymentData.symbol,
            base_uri: deploymentData.baseURI,
            deployment_tx_hash: hash,
            // The timestamp fields will be handled server-side by Supabase
            // deployment_timestamp is set on the server
            verification_status: 'pending',
            verification_message: 'Awaiting verification',
            // verification_timestamp will be set on verification update
            source_code: contractData.sourceCode
          })
          .then(() => {
            console.log('Deployment recorded successfully in Supabase')
          })
          .catch(error => {
            console.error('Error recording deployment in Supabase:', error)
            setRecordedInSupabase(false); // Allow retry if it failed
          })
        } catch (error) {
          console.error('Error processing contract receipt:', error)
          setRecordedInSupabase(false); // Allow retry if it failed
        }
      }
    }
    
    recordDeployment()
  }, [isSuccess, receipt, address, hash, chainId, deploymentData, manuallyConfirmed, contractAddress, recordedInSupabase])

  // Function to estimate gas without deploying
  const estimateGas = async ({
    name,
    symbol,
    baseURI = 'ipfs://'
  }: {
    name: string
    symbol: string
    baseURI?: string
  }) => {
    if (!address) return null
    
    // Create a unique key for these parameters to avoid duplicate estimations
    const paramsKey = JSON.stringify({ name, symbol, baseURI })
    
    // Check if we have a recent cached estimation (less than 60 seconds old)
    const cachedEstimation = recentEstimations.current[paramsKey]
    const now = Date.now()
    if (cachedEstimation && (now - cachedEstimation.time < 60000)) {
      console.log('Using cached gas estimation')
      if (estimatedGas !== cachedEstimation.value) {
        setEstimatedGas(cachedEstimation.value)
      }
      return cachedEstimation.value
    }
    
    // If we already estimated gas for these exact parameters, don't re-estimate
    if (paramsKey === lastEstimateParams && estimatedGas) {
      return estimatedGas
    }
    
    // Clear any pending timeout
    if (estimationTimeoutRef.current) {
      clearTimeout(estimationTimeoutRef.current)
    }
    
    // Set state to indicate estimation in progress
    setIsEstimatingGas(true)
    
    // Generate a unique ID for this specific estimation request
    const currentEstimationId = ++latestEstimationId.current
    
    // Debounce the estimation to prevent too many API calls
    return new Promise<bigint | null>((resolve) => {
      estimationTimeoutRef.current = setTimeout(async () => {
        try {
          // Check if this estimation is still the latest one
          if (currentEstimationId !== latestEstimationId.current) {
            console.log('Skipping outdated estimation request', currentEstimationId, latestEstimationId.current)
            setIsEstimatingGas(false)
            resolve(null)
            return
          }
          
          // Validate the bytecode before estimation
          if (!contractData.bytecode || typeof contractData.bytecode !== 'string' || !contractData.bytecode.startsWith('0x')) {
            console.error('Invalid bytecode format:', contractData.bytecode)
            throw new Error('Invalid contract bytecode format')
          }
          
          // Store the params we're estimating for
          setLastEstimateParams(paramsKey)
          
          const gasEstimate = await estimateContractGas(name, symbol, address as `0x${string}`, baseURI)
          
          // Cache the result
          recentEstimations.current[paramsKey] = {
            time: Date.now(),
            value: gasEstimate
          }
          
          // Verify this is still the most recent estimation before updating state
          if (currentEstimationId === latestEstimationId.current) {
            setEstimatedGas(gasEstimate)
            setIsEstimatingGas(false)
            resolve(gasEstimate)
          } else {
            // This estimation was superseded by a newer one
            console.log('Discarding results from outdated estimation')
            resolve(null)
          }
        } catch (error) {
          console.error('Error estimating gas:', error)
          
          // Only use fallback if this is still the latest request
          if (currentEstimationId === latestEstimationId.current) {
            // Fallback to a conservative estimate
            let fallbackEstimate: bigint;
            if (chainId === 137 || chainId === 80002) {
              fallbackEstimate = BigInt(375000); // Polygon networks
            } else {
              fallbackEstimate = BigInt(450000); // Ethereum and others
            }
            
            // Cache the fallback result too
            recentEstimations.current[paramsKey] = {
              time: Date.now(),
              value: fallbackEstimate
            }
            
            setEstimatedGas(fallbackEstimate)
            setIsEstimatingGas(false)
            resolve(fallbackEstimate)
          } else {
            resolve(null)
          }
        }
      }, 800) // 800ms debounce
    })
  }

  const deploy = async ({
    name,
    symbol,
    baseURI = 'ipfs://',
    gasMultiplier = 1,
  }: {
    name: string
    symbol: string
    baseURI?: string
    gasMultiplier?: number
  }): Promise<DeployContractResult> => {
    if (!address) throw new Error('Wallet not connected')
    if (!feeData?.maxFeePerGas) throw new Error('Could not fetch gas fees')

    try {
      // Store the form data for later use
      setDeploymentData({
        name,
        symbol,
        baseURI
      })

      console.log('Preparing to deploy contract with params:', {
        name,
        symbol,
        baseURI,
        owner: address
      })

      // Try to validate the bytecode
      if (!contractData.bytecode || typeof contractData.bytecode !== 'string' || !contractData.bytecode.startsWith('0x')) {
        console.error('Invalid bytecode format:', contractData.bytecode)
        throw new Error('Invalid contract bytecode format')
      }
      
      // Estimate gas for this specific deployment
      const gasEstimate = await estimateGas({ name, symbol, baseURI });
      setEstimatedGas(gasEstimate);

      try {
        // Deploy contract with more precise types
        console.log('Calling deployContract...');
        console.log('Using gas multiplier:', gasMultiplier);
        
        // Calculate gas price with a more significant reduction for slow option
        let adjustedMaxFeePerGas = feeData.maxFeePerGas;
        let adjustedMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        
        if (gasMultiplier <= 0.5) {
          // For very slow option, apply an extra 50% reduction
          adjustedMaxFeePerGas = BigInt(Math.floor(Number(feeData.maxFeePerGas) * 0.5));
          if (feeData.maxPriorityFeePerGas) {
            adjustedMaxPriorityFeePerGas = BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * 0.5));
          }
          console.log('Applied aggressive gas reduction for very slow option');
        } else {
          // Normal multiplier application
          adjustedMaxFeePerGas = BigInt(Math.floor(Number(feeData.maxFeePerGas) * gasMultiplier));
          if (feeData.maxPriorityFeePerGas) {
            adjustedMaxPriorityFeePerGas = BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * gasMultiplier));
          }
        }
        
        console.log('Original gas price (gwei):', formatUnits(feeData.maxFeePerGas, 9));
        console.log('Adjusted gas price (gwei):', formatUnits(adjustedMaxFeePerGas, 9));
        
        // Ensure we have a valid gas limit, falling back to network defaults if needed
        const finalGasLimit = gasEstimate || (
          chainId === 137 || chainId === 80002 
            ? BigInt(375000)  // Polygon networks 
            : BigInt(450000)  // Ethereum and others
        );
        
        console.log(`Using estimated gas limit: ${finalGasLimit}`);
        
        const result = await deployContract({
          abi: contractData.abi,
          bytecode: contractData.bytecode as `0x${string}`,
          args: [name, symbol, address, baseURI],
          // Use more conservative gas estimations for Polygon networks
          maxFeePerGas: adjustedMaxFeePerGas,
          maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas,
          // Use the estimated gas value with a safety buffer
          gas: finalGasLimit
        });
        
        console.log('deployContract returned:', result)
        
        return {
          address: '', // The address will be available in the receipt once confirmed
          hash: result as unknown as string // Handle the result safely
        }
      } catch (deployError) {
        console.error('Error in deployContract:', deployError)
        // Check for specific error types from the wallet or RPC
        if (deployError instanceof Error) {
          if (deployError.message.includes('user denied') || deployError.message.includes('rejected')) {
            throw new Error('Transaction was rejected in your wallet')
          } else if (deployError.message.includes('insufficient funds')) {
            throw new Error('Your wallet has insufficient funds for this transaction')
          } else {
            throw deployError
          }
        }
        throw new Error('Failed to deploy contract - check console for details')
      }
    } catch (error) {
      console.error('Deployment error:', error)
      throw error
    }
  }

  return {
    deploy,
    estimateGas,
    isDeploying: isPending,
    isEstimatingGas,
    isConfirming: isConfirming && !manuallyConfirmed,
    isSuccess: isSuccess || manuallyConfirmed,
    hash,
    feeData,
    estimatedGas
  };
}

// Helper function to get RPC URL for the current chain - ONLY used as fallback now
function getRpcUrl(chainId: number): string | null {
  // Use public RPCs as fallbacks
  switch (chainId) {
    case 1:
      return 'https://eth.llamarpc.com';
    case 11155111:
      return 'https://rpc.sepolia.org';
    case 137:
      return 'https://polygon-rpc.com';
    case 80002:
      return 'https://rpc-amoy.polygon.technology';
    default:
      return null;
  }
}

function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 137:
      return 'Polygon Mainnet';
    case 80002:
      return 'Polygon Amoy';
    default:
      return 'Unknown Network';
  }
}