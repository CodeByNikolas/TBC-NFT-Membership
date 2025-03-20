'use client'

import { useState, FormEvent, ChangeEvent, useMemo, useEffect } from 'react'
import { useContractDeployment } from '@/hooks/useContractDeployment'
import { useChainId, useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { formatUnits } from 'viem'
import Link from 'next/link'
import React from 'react'

interface FormData {
  name: string
  symbol: string
  baseURI: string
  gasMultiplier: number
}

export function ContractDeploymentForm() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { deploy, estimateGas, isDeploying, isEstimatingGas, isConfirming, isSuccess, hash, feeData, estimatedGas } = useContractDeployment()

  const [formData, setFormData] = useState<FormData>({
    name: 'TBC Membership NFT',
    symbol: 'TBC',
    baseURI: 'ipfs://',
    gasMultiplier: 1.0, // Use 1.0 (normal) for standard transaction speed
  })

  const [error, setError] = useState<string | null>(null)
  const [isGasLoading, setIsGasLoading] = useState<boolean>(true)
  const [txInProgress, setTxInProgress] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Check if gas data is still loading
  useEffect(() => {
    if (feeData?.maxFeePerGas) {
      setIsGasLoading(false)
    } else {
      setIsGasLoading(true)
    }
  }, [feeData])

  // Estimate gas whenever form data changes
  useEffect(() => {
    let isMounted = true;
    const debouncedEstimation = setTimeout(async () => {
      if (address && feeData?.maxFeePerGas && isMounted) {
        try {
          await estimateGas({
            name: formData.name,
            symbol: formData.symbol,
            baseURI: formData.baseURI
          });
        } catch (err) {
          console.error('Failed to estimate gas:', err);
        }
      }
    }, 1000); // Add a longer debounce time to prevent rapid re-estimation
    
    return () => {
      isMounted = false;
      clearTimeout(debouncedEstimation);
    };
  }, [address, feeData, formData.name, formData.symbol, formData.baseURI, estimateGas]);

  // Track transaction hash changes
  useEffect(() => {
    if (hash && !txHash) {
      setTxHash(hash)
      setTxInProgress(true)
    }
    
    // Reset UI when transaction completes
    if (isSuccess) {
      setTxInProgress(false)
    }
  }, [hash, isSuccess, txHash])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setTxInProgress(false)
    setTxHash(null)

    if (!feeData?.maxFeePerGas) {
      setError('Gas price data is not available yet. Please wait a moment.')
      return
    }

    try {
      console.log('Initiating contract deployment...')
      const result = await deploy(formData)
      console.log('Deploy function completed, hash:', result?.hash)
      
      // Store the hash
      if (result?.hash) {
        setTxHash(result.hash)
        setTxInProgress(true)
      }
      
      // If we get here, the transaction was sent to the wallet
      // The actual confirmation will be handled by the useWaitForTransactionReceipt hook
      // or by our manual confirmation process
    } catch (err) {
      console.error('Deployment failed:', err)
      setTxInProgress(false)
      
      // Provide more specific error messages based on common issues
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase()
        if (errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
          setError('Transaction was rejected in the wallet.')
        } else if (errorMsg.includes('gas')) {
          setError('Gas estimation failed. Try adjusting the gas price or reducing contract complexity.')
        } else if (errorMsg.includes('would have cost') || errorMsg.includes('extra fees') || errorMsg.includes('stopped it')) {
          setError('Your wallet detected unusually high fees and stopped the transaction. Try using a lower gas multiplier (0.5-0.8) and try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to deploy contract. Please check your wallet connection and try again.')
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const estimatedGasCost = useMemo(() => {
    if (!feeData?.maxFeePerGas) return null
    
    // Use the dynamic estimation if available, otherwise fallback to static
    const baseGas = estimatedGas || BigInt(300000)
    const gasPrice = feeData.maxFeePerGas
    
    // Apply the same aggressive reduction for very slow option
    const adjustedGasPrice = formData.gasMultiplier <= 0.5
      ? gasPrice * BigInt(50) / BigInt(100)  // 50% reduction
      : gasPrice * BigInt(Math.floor(formData.gasMultiplier * 100)) / BigInt(100)
    
    const cost = baseGas * adjustedGasPrice
    return formatUnits(cost, 9)
  }, [feeData, formData.gasMultiplier, estimatedGas])

  const estimatedGasCostInNative = useMemo(() => {
    if (!feeData?.maxFeePerGas) return null
    
    // Use the dynamic estimation if available, otherwise fallback to static
    const baseGas = estimatedGas || BigInt(300000)
    const gasPrice = feeData.maxFeePerGas
    
    // Apply the same aggressive reduction for very slow option
    const adjustedGasPrice = formData.gasMultiplier <= 0.5
      ? gasPrice * BigInt(50) / BigInt(100)  // 50% reduction
      : gasPrice * BigInt(Math.floor(formData.gasMultiplier * 100)) / BigInt(100)
    
    const cost = baseGas * adjustedGasPrice
    return formatUnits(cost, 18)
  }, [feeData, formData.gasMultiplier, estimatedGas])

  const currentGasPrice = useMemo(() => {
    if (!feeData?.maxFeePerGas) return null
    return formatUnits(feeData.maxFeePerGas, 9)
  }, [feeData])

  const adjustedGasPrice = useMemo(() => {
    if (!currentGasPrice) return null
    return (Number(currentGasPrice) * formData.gasMultiplier).toFixed(2)
  }, [currentGasPrice, formData.gasMultiplier])

  const getGasSpeedLabel = (multiplier: number) => {
    if (multiplier <= 0.5) return '🐌 Very Slow'
    if (multiplier <= 0.8) return '🐢 Slow'
    if (multiplier <= 1.0) return '⚖️ Normal'
    if (multiplier <= 1.5) return '🚀 Fast'
    return '⚡⚡ Very Fast'
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to create and deploy a new NFT contract.</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Deployed Successfully!</h2>
        <p className="text-gray-600 mb-8">Your NFT contract has been deployed and is being verified. You can view its status in your deployments.</p>
        <div className="space-x-4">
          <Link href="/deployments">
            <Button>View Deployments</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Deploy Another Contract
          </Button>
        </div>
      </div>
    )
  }

  const getNetworkName = (chainId: number) => {
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

  const steps = [0.5, 0.8, 1, 1.5, 2]
  const stepIndex = steps.indexOf(formData.gasMultiplier)
  const normalizedValue = stepIndex / (steps.length - 1)

  const handleSliderChange = (value: number[]) => {
    const index = Math.round(value[0] * (steps.length - 1))
    setFormData(prev => ({ ...prev, gasMultiplier: steps[index] }))
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Deploy NFT Contract</h2>
        <p className="text-gray-600">
          Current Network: {getNetworkName(chainId)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Use the network button in the navbar to switch networks
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter token name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">Token Symbol</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            placeholder="Enter token symbol"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseURI">Base URI (optional)</Label>
          <Input
            id="baseURI"
            value={formData.baseURI}
            onChange={handleInputChange}
            placeholder="ipfs://"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-lg">Transaction Speed & Cost</Label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium">
              {getGasSpeedLabel(formData.gasMultiplier)}
            </span>
            {estimatedGasCostInNative && (
              <span className="text-base font-medium">
                Total Cost: {Number(estimatedGasCostInNative).toFixed(4)} {chainId === 137 || chainId === 80002 ? 'MATIC' : 'ETH'}
              </span>
            )}
          </div>
          <Slider
            defaultValue={[0.5]}
            min={0}
            max={1}
            step={1 / (steps.length - 1)}
            value={[normalizedValue]}
            onValueChange={handleSliderChange}
            className="my-4"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>Cheaper</span>
            <span>Faster</span>
          </div>
          {isEstimatingGas && (
            <div className="text-sm flex items-center text-gray-500 mt-2">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Estimating gas...
            </div>
          )}
          {currentGasPrice && (
            <div className="space-y-1 mt-2">
              <p className="text-base text-gray-500">
                Current Network Gas: {Number(currentGasPrice).toFixed(2)} gwei
              </p>
              <p className="text-base text-gray-500">
                Your Gas Price: {adjustedGasPrice} gwei
              </p>
              {estimatedGas && (
                <p className="text-base text-gray-500">
                  Estimated Gas Units: {Number(estimatedGas).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isGasLoading && !isEstimatingGas && (
          <Alert>
            <AlertDescription className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading gas price data...
            </AlertDescription>
          </Alert>
        )}

        {txInProgress && txHash && !isSuccess && (
          <Alert>
            <AlertDescription className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transaction in progress... Please wait for confirmation. 
              <a 
                href={`${getBlockExplorerUrl(chainId)}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:underline"
              >
                View on explorer
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isDeploying || isConfirming || !feeData?.maxFeePerGas || txInProgress}
          className="w-full"
        >
          {isDeploying || isConfirming || txInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isDeploying ? 'Deploying...' : 
               txInProgress ? 'Transaction in progress...' : 
               'Confirming...'}
            </>
          ) : !feeData?.maxFeePerGas ? (
            'Loading Gas Data...'
          ) : (
            'Deploy Contract'
          )}
        </Button>
      </form>
    </div>
  )
}

function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'https://etherscan.io'
    case 11155111:
      return 'https://sepolia.etherscan.io'
    case 137:
      return 'https://polygonscan.com'
    case 80002:
      return 'https://amoy.polygonscan.com'
    default:
      return ''
  }
}