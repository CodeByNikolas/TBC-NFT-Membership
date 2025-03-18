'use client';

import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Wallet Connection Demo</h1>
        
        <div className="space-y-8">
          <section className="border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white">
            <h2 className="text-lg font-semibold bg-gray-100 p-4 text-center">Connect your wallet</h2>
            <div className="flex justify-center items-center p-8">
              <appkit-button />
            </div>
          </section>
          
          {isConnected && (
            <section className="border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white">
              <h2 className="text-lg font-semibold bg-gray-100 p-4 text-center">Network Selection</h2>
              <div className="flex justify-center items-center p-8">
                <appkit-network-button />
              </div>
            </section>
          )}
          
          <section className="border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white">
            <h2 className="text-lg font-semibold bg-gray-100 p-4 text-center">Available Features</h2>
            <div className="p-6">
              <ul className="list-disc pl-6 space-y-2">
                <li>Connect with multiple wallet providers</li>
                <li>Switch between different networks including Polygon Amoy testnet</li>
                <li>Navigate to Contact Creation page (under construction)</li>
                <li>Navigate to NFT Editing page (under construction)</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
