import { http, createConfig } from 'wagmi'
import { sepolia, mainnet, polygon } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Define custom Amoy chain
const amoy = {
  id: 80002,
  name: 'Polygon Amoy',
  network: 'amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan Amoy', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
} as const

// Create wagmi config
export const config = createConfig({
  chains: [sepolia, mainnet, polygon, amoy],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [amoy.id]: http(),
  },
}) 