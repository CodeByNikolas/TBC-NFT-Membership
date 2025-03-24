import { Card, CardContent } from "@/components/ui/card";

interface ContractDetailsBannerProps {
  name: string;
  symbol: string;
  contractAddress: string;
  network: string;
  baseUri?: string;
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
  deployerAddress,
}: ContractDetailsBannerProps) {
  return (
    <Card className="border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">{symbol}</span>
            </div>
            <div className="space-y-1 mb-4 md:mb-0">
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Contract:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{contractAddress}</code>
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Network:</span>
                <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">{network}</span>
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Base URI:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs truncate max-w-xs">{baseUri || 'Not set'}</code>
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="font-medium text-gray-700 mr-2">Deployer:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{deployerAddress}</code>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="bg-primary/10 rounded-lg p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Total Supply</span>
              <span className="text-3xl font-bold text-primary">{totalSupply}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 