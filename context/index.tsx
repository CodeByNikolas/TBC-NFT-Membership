'use client'

import { createAppKit } from '@reown/appkit/react'
import { cookieToInitialState } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, config, networks } from '../config'
import { WagmiProvider } from 'wagmi'
import { mainnet } from '@reown/appkit/networks'

// Initialize AppKit with projectId from environment
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '';
if (!projectId) {
  console.warn('Project ID is not defined. Wallet connection may not work.');
}

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  // @ts-ignore - The networks array is always non-empty as defined in config/index.tsx
  networks,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

// Setup query client
const queryClient = new QueryClient()

export default function ContextProvider({ 
  children, 
  cookies 
}: { 
  children: React.ReactNode, 
  cookies?: string 
}) {
  return (
    <WagmiProvider config={config} initialState={cookies ? cookieToInitialState(config, cookies) : undefined}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 