import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Loader2 } from "lucide-react";
import ethersUtils from "@/lib/ethersUtil";

interface ContractDetailsBannerProps {
  name: string;
  symbol: string;
  contractAddress: string;
  chainId: number;
  baseUri?: string;
  totalSupply: number;
  deployerAddress: string;
  isLoading?: boolean;
}

export function ContractDetailsBanner({
  name,
  symbol,
  contractAddress,
  chainId,
  baseUri,
  totalSupply,
  deployerAddress,
  isLoading = false,
}: ContractDetailsBannerProps) {
  
  // Get formatted network name
  const networkDisplayName = ethersUtils.getDisplayNameFromChainId(chainId);
  
  // Get explorer URLs
  const contractExplorerUrl = ethersUtils.getAddressExplorerUrl(contractAddress, chainId);
  const deployerExplorerUrl = ethersUtils.getAddressExplorerUrl(deployerAddress, chainId);
  
  // Get IPFS gateway URL if baseUri is using IPFS
  const ipfsGatewayUrl = baseUri ? ethersUtils.getIpfsGatewayUrl(baseUri) : '';
  
  // Format address for display (truncate)
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };


  return (
    <Card className="border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">{symbol}</span>
              {isLoading && <Loader2 className="w-4 h-4 ml-1 animate-spin text-gray-400" />}
            </div>
            <div className="space-y-1 mb-4 md:mb-0">
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Contract:</span>
                {contractExplorerUrl ? (
                  <a 
                    href={contractExplorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center hover:bg-gray-200 transition-colors group"
                  >
                    <code>{formatAddress(contractAddress)}</code>
                    <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{formatAddress(contractAddress)}</code>
                )}
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Network:</span>
                <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">{networkDisplayName}</span>
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Base URI:</span>
                {ipfsGatewayUrl ? (
                  <a 
                    href={ipfsGatewayUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center hover:bg-gray-200 transition-colors group truncate max-w-xs"
                  >
                    <code className="truncate">{baseUri}</code>
                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs truncate max-w-xs">{baseUri || 'Not set'}</code>
                )}
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Deployer:</span>
                {deployerExplorerUrl ? (
                  <a 
                    href={deployerExplorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center hover:bg-gray-200 transition-colors group"
                  >
                    <code>{formatAddress(deployerAddress)}</code>
                    <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{formatAddress(deployerAddress)}</code>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="bg-primary/10 rounded-lg p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Total Supply</span>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-primary">{totalSupply}</span>
                {isLoading && <Loader2 className="ml-2 w-4 h-4 animate-spin text-primary" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 