# TBC-NFT: Tum Blockchain Club Membership NFTs

A Next.js application for managing and distributing membership NFTs for Tum Blockchain Club members. Each member gets their own unique NFT representing their membership in the club.

## Features

- Mint and manage membership NFTs
- Connect crypto wallets using WalletConnect's AppKit
- Support for multiple EVM chains: Ethereum, Arbitrum, Optimism, Polygon
- Network switching capability
- Clean UI with shadcn components
- Settings panel for API keys (Pinata and Infura)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- WalletConnect Cloud Project ID
- Docker (optional, for containerized deployment)

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```
   - Get a Project ID from [Reown Cloud](https://cloud.reown.com) by creating an account and a new project
   - Add your Project ID to the `.env.local` file:
   ```
   NEXT_PUBLIC_PROJECT_ID=your_project_id_here
   ```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Deployment

1. Make sure you have Docker and Docker Compose installed.

2. Build and run the Docker container:
```bash
# Build the container
docker build -t wallet-demo .

# Run the container
docker run -p 3000:3000 -e NEXT_PUBLIC_PROJECT_ID=your_project_id_here wallet-demo
```

Alternatively, use Docker Compose:
```bash
# Create a .env file with your NEXT_PUBLIC_PROJECT_ID
echo "NEXT_PUBLIC_PROJECT_ID=your_project_id_here" > .env

# Build and run with Docker Compose
docker-compose up -d
```

## API Keys Configuration

The application supports configuring API keys for:
- **IPFS Pinata**: For storing files on IPFS
- **Infura**: For RPC provider access

These keys can be configured in the settings panel (gear icon in the navbar) and will be stored in your browser's localStorage.

## GitHub Actions Deployment

This project includes a GitHub Actions workflow for continuous integration and deployment. To use it:

1. Enable GitHub Actions for your repository
2. Set up the following secrets in your repository settings:
   - `NEXT_PUBLIC_PROJECT_ID`: Your WalletConnect Project ID from [Reown Cloud](https://cloud.reown.com)

## How to Use

1. Click the "Connect Wallet" button to connect your crypto wallet.
2. Once connected, you'll see a "Network Selection" button appear.
3. Use this button to switch between different blockchain networks.
4. Click the gear icon to access settings for API keys.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [WalletConnect AppKit](https://docs.reown.com/appkit/overview) - Wallet connection SDK
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [Docker](https://www.docker.com/) - Containerization platform
- [GitHub Actions](https://github.com/features/actions) - CI/CD workflow

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supported Networks

The application supports the following networks for contract deployment and interaction:

### Ethereum
- Sepolia Testnet
- Mainnet

### Polygon
- Amoy Testnet
- Mainnet

## Contract Deployment

The application uses Hardhat for smart contract development and deployment. The contract deployment is handled directly from the browser using the connected wallet.

### Required API Keys
- Etherscan API Key (for Ethereum contract verification)
- Polygonscan API Key (for Polygon contract verification)

### Contract Deployment Process
1. Connect your wallet
2. Select the desired network
3. Fill in the contract deployment form with:
   - Token Name
   - Token Symbol
   - IPFS Base URI (optional)
4. Deploy the contract

The deployed contract will be owned by the connected wallet address.

Note: For contract deployment, the application will use the RPC provider from your connected wallet. Custom RPC URLs are optional and can be configured in the `.env` file if needed.
