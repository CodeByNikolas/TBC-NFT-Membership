'use client';

import { ContractList } from './components/ContractList';

export default function DeploymentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Deployed Contracts</h2>
        <p className="text-gray-600">
          View and manage your deployed NFT contracts
        </p>
      </div>
      <ContractList />
    </div>
  );
}