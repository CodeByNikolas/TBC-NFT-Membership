'use client'

import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { useContractDeployment } from '@/hooks/useContractDeployment'
import { useChainId, useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { formatUnits } from 'viem'

interface FormData {
  name: string
  symbol: string
  baseURI: string
  gasMultiplier: number
}

export function ContractDeploymentForm() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { deploy, isDeploying, isConfirming, isSuccess, hash, feeData } = useContractDeployment()

  const [formData, setFormData] = useState<FormData>({
    name: 'TBC Membership NFT',
    symbol: 'TBC',
    baseURI: 'ipfs://',
    gasMultiplier: 1,
  })

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      await deploy(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy contract')
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const estimatedGasCost = useMemo(() => {
    if (!feeData?.maxFeePerGas) return null
    const baseGas = BigInt(1000000) // 1M gas units
    const gasPrice = feeData.maxFeePerGas
    const cost = baseGas * gasPrice
    return formatUnits(cost * BigInt(Math.floor(formData.gasMultiplier * 100)) / BigInt(100), 9)
  }, [feeData, formData.gasMultiplier])

  const estimatedGasCostInNative = useMemo(() => {
    if (!feeData?.maxFeePerGas) return null
    const baseGas = BigInt(1000000) // 1M gas units
    const gasPrice = feeData.maxFeePerGas
    const cost = baseGas * gasPrice
    return formatUnits(cost * BigInt(Math.floor(formData.gasMultiplier * 100)) / BigInt(100), 18)
  }, [feeData, formData.gasMultiplier])

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
      <Alert>
        <AlertDescription>
          Please connect your wallet to deploy the contract.
        </AlertDescription>
      </Alert>
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
          {currentGasPrice && (
            <div className="space-y-1 mt-2">
              <p className="text-base text-gray-500">
                Current Network Gas: {Number(currentGasPrice).toFixed(2)} gwei
              </p>
              <p className="text-base text-gray-500">
                Your Gas Price: {adjustedGasPrice} gwei
              </p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess && hash && (
          <Alert>
            <AlertDescription>
              Contract deployed successfully!{' '}
              <a
                href={`${getBlockExplorerUrl(chainId)}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                View on block explorer
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isDeploying || isConfirming}
          className="w-full"
        >
          {isDeploying || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isDeploying ? 'Deploying...' : 'Confirming...'}
            </>
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