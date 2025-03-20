'use client'

import { useAccount, useChainId, useDeployContract, useWaitForTransactionReceipt, useFeeData } from 'wagmi'
import { parseEther, formatUnits } from 'viem'
import contractData from '@/contracts/TBCNFT.json'

export function useContractDeployment() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: feeData } = useFeeData()
  
  const { deployContract, data: hash, isPending } = useDeployContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

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
  }) => {
    if (!address) throw new Error('Wallet not connected')
    if (!feeData?.maxFeePerGas) throw new Error('Could not fetch gas fees')

    try {
      await deployContract({
        abi: contractData.abi,
        bytecode: contractData.bytecode as `0x${string}`,
        args: [name, symbol, address, baseURI],
        gas: BigInt(1000000), // Reduced from 3M to 1M
        maxFeePerGas: BigInt(Number(feeData.maxFeePerGas) * gasMultiplier),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas 
          ? BigInt(Number(feeData.maxPriorityFeePerGas) * gasMultiplier)
          : undefined,
      })
    } catch (error) {
      console.error('Deployment error:', error)
      throw error
    }
  }

  return {
    deploy,
    isDeploying: isPending,
    isConfirming,
    isSuccess,
    hash,
    feeData,
  }
} 