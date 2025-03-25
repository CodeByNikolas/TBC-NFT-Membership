import { getAddressExplorerUrl } from '@/lib/ethersUtil';
import { ContractDeployment } from './types';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'verified':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-yellow-600';
  }
};

export const hasPendingContracts = (contractsToCheck: ContractDeployment[]): boolean => {
  return contractsToCheck.some(contract => contract.verification_status === 'pending');
};

export const isRecentlyDeployed = (contract: ContractDeployment): boolean => {
  const timestamp = contract.deployment_timestamp || contract.created_at;
  if (!timestamp) return false;
  
  const deployTime = new Date(timestamp).getTime();
  const now = Date.now();
  const secondsSinceDeployment = Math.floor((now - deployTime) / 1000);
  
  return secondsSinceDeployment < 120; // Block retries for 120 seconds
}; 