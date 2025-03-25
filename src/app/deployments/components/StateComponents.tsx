import Link from 'next/link';
import { Button } from "@/components/ui/button";

export const LoadingState = () => (
  <div className="text-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
  </div>
);

export const EmptyState = () => (
  <div className="text-center py-12">
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployments Yet</h3>
    <p className="text-gray-600 mb-4">You haven't deployed any contracts yet. Start by creating and deploying your first NFT contract.</p>
    <Link href="/contract-creation">
      <Button>Create New Contract</Button>
    </Link>
  </div>
);

export const ErrorState = ({ message }: { message: string }) => (
  <div className="text-center py-4 text-red-600">
    Error: {message}
  </div>
);

export const NoWalletState = () => (
  <div className="text-center py-8">
    <p className="text-gray-600">Please connect your wallet to view your contracts.</p>
  </div>
);

export const NoContractsFoundState = () => (
  <div className="p-6 text-center border rounded-md bg-gray-50">
    <p className="text-gray-500">No contracts found on the current network</p>
    <Link href="/create">
      <Button className="mt-4">Deploy New Contract</Button>
    </Link>
  </div>
); 