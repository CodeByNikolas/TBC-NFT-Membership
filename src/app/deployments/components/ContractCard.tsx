import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from 'lucide-react';
import { ContractDeployment } from './types';
import { getStatusColor } from './utils';
import { VerificationButton } from './VerificationButton';
import ethersUtils from '@/lib/ethersUtil';

interface ContractCardProps {
  contract: ContractDeployment;
  onVerify: (id: string) => void;
  verifyingContracts: { [key: string]: boolean };
  cooldowns: { [key: string]: number };
  isVerificationDisabled: (id: string) => boolean;
}

export function ContractCard({ 
  contract, 
  onVerify, 
  verifyingContracts, 
  cooldowns,
  isVerificationDisabled
}: ContractCardProps) {
  // Check if we have on-chain data
  const hasOnChainData = !!contract.onChainData;
  const isLoadingData = !hasOnChainData;
  
  // Prefer on-chain data if available, fall back to database values
  const name = contract.onChainData?.name || contract.name;
  const symbol = contract.onChainData?.symbol || contract.symbol;
  const baseURI = contract.onChainData?.baseURI || contract.base_uri;
  const totalSupply = contract.onChainData?.totalSupply;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div>
            <h3 className="text-xl font-bold group flex items-center">
              {name}
              {isLoadingData ? (
                <span className="ml-2 inline-flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span className="text-xs text-gray-500">Loading on-chain data...</span>
                </span>
              ) : hasOnChainData && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">
                  verified on-chain
                </span>
              )}
            </h3>
            <p className="text-gray-600 flex items-center">
              Symbol: {symbol}
              {isLoadingData && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
            </p>
            {totalSupply !== undefined && (
              <p className="text-gray-600">Total Supply: {totalSupply}</p>
            )}
          </div>
        </div>
        <span className={`font-semibold ${getStatusColor(contract.verification_status)}`}>
          Verification: {contract.verification_status.charAt(0).toUpperCase() + contract.verification_status.slice(1)}
        </span>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm">
          <span className="font-medium">Address:</span>{' '}
          <a
            href={ethersUtils.getAddressExplorerUrl(contract.contract_address, contract.chain_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-500 hover:underline"
          >
            {contract.contract_address}
          </a>
        </p>
        <div className="text-sm mb-2">
          <span className="font-medium">Network:</span> {ethersUtils.getDisplayNameFromChainId(contract.chain_id)}
        </div>
        <p className="text-sm truncate flex items-center">
          <span className="font-medium mr-1">Base URI:</span>{' '}
          <span className="font-mono text-sm">{baseURI || 'Not set'}</span>
          {isLoadingData && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
        </p>
        <p className="text-sm">
          <span className="font-medium">Deployment:</span>{' '}
          <a
            href={ethersUtils.getTxExplorerUrl(contract.deployment_tx_hash, contract.chain_id)}
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
        <div className="flex flex-wrap mt-4 gap-2">
          <VerificationButton
            contractId={contract.id}
            status={contract.verification_status}
            onVerify={onVerify}
            isVerifying={verifyingContracts[contract.id] || false}
            cooldown={cooldowns[contract.id] || 0}
            isDisabled={isVerificationDisabled(contract.id)}
          />
          
          {/* Edit NFT Button */}
          <Link href={`/nft-editing?contractId=${contract.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit NFTs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 