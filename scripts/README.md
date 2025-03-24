# Contract Management Scripts

This directory contains utility scripts for managing the TBCNFT smart contract.

## update-contract.js

A utility script that automates the process of updating the TBCNFT contract across the project:

1. Synchronizes the contract files between `/contracts` and `/hardhat/contracts`
2. Compiles the contract using Hardhat
3. Copies the compiled artifacts to `/src/contracts` for frontend usage
4. Updates the source code file for verification purposes
5. Generates TypeScript types based on the contract ABI

### Usage

You can run the script using npm:

```bash
npm run update-contract
```

Or directly:

```bash
node scripts/update-contract.js
```

### When to Use

Run this script whenever you make changes to the TBCNFT.sol contract to ensure that:

- The Contract Creation page uses the latest version of the contract
- Contract verification works correctly with the updated source code
- TypeScript typings are updated to match the contract ABI

### Important Notes

- Always run this script after modifying the contract and before deploying new instances
- The script expects the main contract to be at `/contracts/TBCNFT.sol`
- The script will use the main contract as the source of truth and update all other copies 