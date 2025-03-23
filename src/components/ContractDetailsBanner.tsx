import { BookText, Network, Image, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ContractDetailsProps {
  name: string;
  symbol: string;
  contractAddress: string;
  network: string;
  baseUri: string;
  totalSupply: number;
  deployerAddress: string;
}

export function ContractDetailsBanner({
  name,
  symbol,
  contractAddress,
  network,
  baseUri,
  totalSupply,
  deployerAddress
}: ContractDetailsProps) {
  // Helper to abbreviate addresses
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Determine network color
  const getNetworkColor = (network: string): string => {
    const networkLower = network.toLowerCase();
    if (networkLower.includes('ethereum')) return 'bg-blue-100 text-blue-800';
    if (networkLower.includes('polygon')) return 'bg-purple-100 text-purple-800';
    if (networkLower.includes('sepolia')) return 'bg-gray-100 text-gray-800';
    if (networkLower.includes('amoy')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-white shadow-md overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <BookText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold truncate max-w-md">{name}</h1>
              <Badge variant="outline" className="mt-1">{symbol}</Badge>
            </div>
          </div>
          <Badge className={`${getNetworkColor(network)} px-3 py-1 md:ml-3`}>
            {network}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <div className="mt-0.5">
              <Network className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Contract Address</p>
              <p className="font-mono text-gray-600 truncate max-w-[180px]" title={contractAddress}>
                {shortenAddress(contractAddress)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="mt-0.5">
              <Image className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Base URI</p>
              <p className="font-mono text-gray-600 truncate max-w-[180px]" title={baseUri || 'Not set'}>
                {baseUri || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="mt-0.5">
              <Wallet className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <div className="flex items-center">
                <p className="font-medium text-gray-700 mr-2">Owner</p>
                <Badge variant="outline" className="px-2 py-0">{totalSupply} NFTs</Badge>
              </div>
              <p className="font-mono text-gray-600 truncate max-w-[180px]" title={deployerAddress}>
                {shortenAddress(deployerAddress)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 