'use client'

import { useAccount, useChainId, useDeployContract, useWaitForTransactionReceipt, useFeeData } from 'wagmi'
import { parseEther, formatUnits } from 'viem'
import contractData from '@/contracts/TBCNFT.json'
import axios from 'axios'
import React from 'react'

interface DeployContractResult {
  address: string
  hash: string
}

interface TransactionReceipt {
  contractAddress: string
  transactionHash: string
  [key: string]: any
}

export function useContractDeployment() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: feeData } = useFeeData()
  
  const { deployContract, data: hash, isPending } = useDeployContract()
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Additional state for manual confirmation tracking
  const [manuallyConfirmed, setManuallyConfirmed] = React.useState(false)
  const [contractAddress, setContractAddress] = React.useState<string | null>(null)
  const [recordedInSupabase, setRecordedInSupabase] = React.useState(false)

  // Store form values for later use in the useEffect
  const [deploymentData, setDeploymentData] = React.useState<{
    name: string;
    symbol: string;
    baseURI: string;
  } | null>(null)

  // Manual polling for transaction confirmation if useWaitForTransactionReceipt doesn't work
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Only start polling if we have a hash and it's not already confirmed by the hook
    if (hash && !isSuccess && !manuallyConfirmed) {
      console.log('Starting manual transaction polling for hash:', hash);
      
      const checkTransaction = async () => {
        try {
          // Get the RPC URL for the current chain
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
  }, [hash, isSuccess, chainId, manuallyConfirmed]);

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

      try {
        // Deploy contract with more precise types
        console.log('Calling deployContract...')
        const result = await deployContract({
          abi: contractData.abi,
          bytecode: contractData.bytecode as `0x${string}`,
          args: [name, symbol, address, baseURI],
          // Let the wallet estimate gas automatically, but still set the fee multiplier
          maxFeePerGas: feeData.maxFeePerGas 
            ? BigInt(Math.floor(Number(feeData.maxFeePerGas) * gasMultiplier))
            : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas 
            ? BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * gasMultiplier))
            : undefined,
        })
        
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
    isDeploying: isPending,
    isConfirming: isConfirming && !manuallyConfirmed,
    isSuccess: isSuccess || manuallyConfirmed,
    hash,
    feeData,
  }
}

// Helper function to get RPC URL for the current chain
function getRpcUrl(chainId: number): string | null {
  switch (chainId) {
    case 1:
      return `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY || localStorage.getItem('infuraKey') || ''}`;
    case 11155111:
      return `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || localStorage.getItem('infuraKey') || ''}`;
    case 137:
      return `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || localStorage.getItem('infuraKey') || ''}`;
    case 80002:
      return `https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY || localStorage.getItem('infuraKey') || ''}`;
    default:
      return null;
  }
}

function getNetworkName(chainId: number) {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet'
    case 11155111:
      return 'Sepolia Testnet'
    case 137:
      return 'Polygon Mainnet'
    case 80002:
      return 'Polygon Amoy'
    default:
      return 'Unknown Network'
  }
}