# TBC-NFT: TUM Blockchain Club Membership NFTs

A Next.js application for managing and distributing membership NFTs for TUM Blockchain Club members. Each member gets their own unique NFT representing their membership in the club.

## Live Demo

A live implementation of this project can be found at: [https://tbc-nft.nikolashack.com/](https://tbc-nft.nikolashack.com/)

## Features

- Mint and manage membership NFTs
- Connect crypto wallets using WalletConnect's AppKit
- Support for multiple EVM chains: Ethereum, Arbitrum, Optimism, Polygon
- Network switching capability
- Smart contract deployment and verification
- Clean UI with shadcn components
- Settings panel for API keys (Pinata and Infura)
- Supabase integration for storing contract deployment data

## Prerequisites

- Node.js 18+ 
- npm
- WalletConnect Cloud Project ID
- Docker (optional, for containerized deployment)

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/CodeByNikolas/TBC-NFT-Membership.git
cd TBC-NFT-Membership
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```
   - Get a Project ID from [WalletConnect Cloud](https://cloud.reown.com) by creating an account and a new project
   - Add your Project ID and other required values to the `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Deployment

1. Make sure you have Docker and Docker Compose installed.

2. Build and run the Docker container:
```bash
# Build the container
docker build -t tbc-nft .

# Run the container
docker run -p 3000:3000 -e NEXT_PUBLIC_PROJECT_ID=your_project_id_here tbc-nft
```

## API Keys Configuration

The application supports configuring API keys for:
- **IPFS Pinata**: For storing files on IPFS
- **Infura**: For RPC provider access
- **Block Explorer APIs**: For contract verification (Etherscan, Polygonscan, etc.)

These keys can be configured in the settings panel (gear icon in the navbar) or through environment variables.

## GitHub Actions Deployment

This project includes a GitHub Actions workflow for continuous integration and deployment. To use it:

1. Enable GitHub Actions for your repository
2. Set up the necessary secrets in your repository settings, including your WalletConnect Project ID

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework (v15)
- [React](https://react.dev/) - UI library (v19)
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework (v4)
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [WalletConnect AppKit](https://docs.reown.com/appkit/overview) - Wallet connection SDK
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [ethers.js](https://docs.ethers.org/v6/) - Ethereum library
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [OpenZeppelin Contracts](https://www.openzeppelin.com/contracts) - Smart contract library
- [Supabase](https://supabase.com/) - Database and backend
- [Docker](https://www.docker.com/) - Containerization platform
- [GitHub Actions](https://github.com/features/actions) - CI/CD workflow

## Database Schema (Supabase)

The application uses Supabase for database management. Here's the current schema:

### contract_deployments

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key for deployments |
| contract_address | text | Contract address on blockchain |
| chain_id | int4 | Chain ID of the network |
| deployer_address | text | Address that deployed the contract |
| deployment_tx_hash | text | Transaction hash of deployment |
| deployment_timestamp | timestamptz | When contract was deployed |
| verification_status | text | Status of verification |
| verification_message | text | Message about verification status |
| verification_timestamp | timestamptz | When verification was completed |
| created_at | timestamptz | Record creation timestamp |
| constructor_args | text | Encoded constructor arguments for verification |

## Supabase Setup

To set up Supabase for this project:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the necessary tables as described in the Database Schema section
3. Get your Supabase URL and API keys
4. Add them to your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Smart Contract

The project includes a custom ERC721 NFT contract built with OpenZeppelin. Key features:

- ERC721 token standard with URI storage
- Batch minting capabilities
- Admin transfer functionality
- Metadata URI management
- Base URI updates
- Owner-controlled minting and burning

## Supported Networks

The application supports the following networks for contract deployment and interaction:

### Ethereum
- Sepolia Testnet
- Mainnet

### Polygon
- Amoy Testnet
- Mainnet

### Additional Networks
- Arbitrum
- Optimism
- Base

## Contract Deployment & Verification

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

## Future Improvements

- Multi-signature ownership for club contracts
- Integration with university authentication systems
- Enhanced metadata with member information
- DAO governance functionality
- Member-only gated content access

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

The Apache License 2.0:
- Allows free use, modification, and distribution of the code
- Requires preservation of copyright and license notices
- Requires attribution to "Nikolas Hack (CodeByNikolas)" when using this work
- Provides an express grant of patent rights from contributors
- Does not require derivative works to be released under the same license

Copyright 2025 Nikolas Hack (CodeByNikolas)
