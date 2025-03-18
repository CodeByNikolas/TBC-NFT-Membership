'use client'

import { createAppKit } from '@reown/appkit/react'
import { cookieToInitialState } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, config, networks } from '../config'
import { WagmiProvider } from 'wagmi'

// Initialize AppKit with projectId from environment
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '';
if (!projectId) {
  console.warn('Project ID is not defined. Wallet connection may not work.');
}

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
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