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
    default: { http: [`https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`] },
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
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`),
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
    [polygon.id]: http(`https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
    [amoy.id]: http(`https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`),
  },
}) 