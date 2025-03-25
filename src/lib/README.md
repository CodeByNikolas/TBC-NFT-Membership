# TBC NFT Membership - Library Files

This directory contains utility functions, tools, and helper modules that support the core functionality of the TBC NFT Membership application.

## Core Utilities

### httpUtils.ts
Unified HTTP utilities for both browser and server environments:
- Axios-based HTTP client with default configuration (`api`)
- Fetch-based utilities for browser environments (`fetchWithNoCache`, `postJSON`, `getJSON`)
- Cache prevention headers and middleware
- Error handling and timeout management

### apiUtils.ts
NextJS-specific utilities for API route handlers:
- `addNoCacheHeaders`: Adds cache prevention headers to NextResponse objects
- `jsonResponseNoCache`: Creates JSON responses with cache prevention
- `errorResponseNoCache`: Creates error responses with cache prevention

### ethers.ts
Comprehensive Ethereum blockchain interaction and network utilities:
- `getProvider`: Creates an ethers provider for different networks
- Network mapping functions:
  - `getNetworkNameFromChainId`: Converts chain IDs to network names
  - `getDisplayNameFromChainId`: Gets user-friendly network names
  - `getNetworkDisplayName`: Formats network IDs for display
- URL generation utilities:
  - `getAddressExplorerUrl`: Generates block explorer URLs for addresses
  - `getTxExplorerUrl`: Generates block explorer URLs for transactions
  - `getIpfsGatewayUrl`: Converts IPFS URIs to gateway URLs
- RPC connection helpers:
  - `getInfuraRpcUrl`: Gets Infura RPC URLs for different chain IDs
  - `getRpcUrl`: Gets appropriate RPC URL for a chain ID or network name

### supabase.ts
Supabase client configuration:
- Creates standard and admin Supabase clients
- Handles build-time vs. runtime environment variables
- Error handling for missing configuration

### utils.ts
General utilities:
- `cn`: CSS class name utility using clsx and tailwind-merge

### verification.ts
Contract verification utilities for smart contracts on block explorers:
- Processes pending verifications
- Circuit breaker pattern for API rate limiting
- Multi-step verification with fallbacks
- Verification status tracking

## Hooks

### hooks/useDeployContract.ts
React hook for deploying contracts through the API:
- Manages deployment state (loading, success, error)
- Handles the deployment request to the API
- Automatically schedules verification after deployment

## Scripts

### scripts/verify-contract.ts
Script for contract verification on block explorers:
- Manually triggers verification for a specific deployment
- Checks verification status
- Uses the verification service from verification.ts

## Consolidated and Deprecated Files
The following files have been consolidated for better organization and maintainability:

1. **Consolidated into httpUtils.ts**:
   - `api.ts` → HTTP client based on Axios
   - `fetchUtils.ts` → Fetch-based HTTP utilities

2. **Consolidated into ethers.ts**:
   - `networkUtils.ts` → Network utility functions for blockchain interactions

These files have been deleted from the codebase after their functionality was migrated.