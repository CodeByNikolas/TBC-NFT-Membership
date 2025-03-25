import { http, createConfig } from 'wagmi'
import { sepolia, mainnet, polygon, polygonAmoy } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Create wagmi config
export const config = createConfig({
  chains: [sepolia, mainnet, polygon, polygonAmoy],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
    }),
  ],
  // This will automatically use the wallet's provider when available
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
}) 