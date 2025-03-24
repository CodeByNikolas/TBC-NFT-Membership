#!/usr/bin/env node

/**
 * Contract Update Script
 * 
 * This script automates the process of updating the TBCNFT contract:
 * 1. Compiles the contract using Hardhat
 * 2. Copies the artifacts to the right locations
 * 3. Updates the contract source for the verification API
 * 
 * Usage: node scripts/update-contract.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

// Project directories
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTRACTS_DIR = path.join(ROOT_DIR, 'contracts');
const HARDHAT_CONTRACTS_DIR = path.join(ROOT_DIR, 'hardhat', 'contracts');
const HARDHAT_DIR = path.join(ROOT_DIR, 'hardhat');
const SRC_CONTRACTS_DIR = path.join(ROOT_DIR, 'src', 'contracts');

// Make sure the directories exist
if (!fs.existsSync(SRC_CONTRACTS_DIR)) {
  fs.mkdirSync(SRC_CONTRACTS_DIR, { recursive: true });
}

console.log('🔄 Starting contract update process...');

// Step 1: Make sure the contract is consistent in both places
console.log('📝 Checking contract consistency...');
try {
  const mainContract = fs.readFileSync(path.join(CONTRACTS_DIR, 'TBCNFT.sol'), 'utf8');
  const hardhatContract = fs.readFileSync(path.join(HARDHAT_CONTRACTS_DIR, 'TBCNFT.sol'), 'utf8');
  
  if (mainContract !== hardhatContract) {
    console.log('📋 Updating Hardhat contract with the latest version...');
    fs.writeFileSync(path.join(HARDHAT_CONTRACTS_DIR, 'TBCNFT.sol'), mainContract);
  } else {
    console.log('✅ Contracts are already in sync.');
  }
} catch (error) {
  console.error('❌ Error syncing contracts:', error.message);
  exit(1);
}

// Step 2: Compile the contract with Hardhat
console.log('🔨 Compiling contract with Hardhat...');
try {
  process.chdir(HARDHAT_DIR);
  execSync('npx hardhat compile', { stdio: 'inherit' });
  process.chdir(ROOT_DIR);
  console.log('✅ Compilation successful!');
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  exit(1);
}

// Step 3: Copy the artifacts to the src/contracts directory
console.log('📦 Copying artifacts to src/contracts...');
try {
  const artifactPath = path.join(HARDHAT_DIR, 'artifacts', 'contracts', 'TBCNFT.sol', 'TBCNFT.json');
  const destPath = path.join(SRC_CONTRACTS_DIR, 'TBCNFT.json');
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Create a simplified version for frontend use
  const frontendArtifact = {
    contractName: artifact.contractName,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    deployedBytecode: artifact.deployedBytecode,
    sourceName: artifact.sourceName,
    source: fs.readFileSync(path.join(CONTRACTS_DIR, 'TBCNFT.sol'), 'utf8'),
    compiler: {
      name: artifact.compiler?.name || 'solc',
      version: artifact.compiler?.version || '0.8.20',
    },
    networks: {}
  };
  
  fs.writeFileSync(destPath, JSON.stringify(frontendArtifact, null, 2));
  console.log('✅ Artifacts copied to frontend directory!');
  
  // Generate TypeScript types (optional, only if ts-node is available)
  try {
    console.log('🔄 Generating TypeScript types...');
    const contractInterface = JSON.stringify(artifact.abi);
    const tsContent = `/**
 * Generated TypeScript interface for TBCNFT contract
 * DO NOT EDIT DIRECTLY - Use update-contract.js to regenerate
 */

export const TBCNFT_ABI = ${contractInterface} as const;

export type TBCNFT_ABI = typeof TBCNFT_ABI;
`;
    fs.writeFileSync(path.join(SRC_CONTRACTS_DIR, 'TBCNFT.ts'), tsContent);
    console.log('✅ TypeScript types generated!');
  } catch (typeError) {
    console.warn('⚠️ Could not generate TypeScript types:', typeError.message);
  }
} catch (error) {
  console.error('❌ Error copying artifacts:', error.message);
  exit(1);
}

// Step 4: Update verification source for easy access
console.log('📝 Updating verification source code...');
try {
  const contractSource = fs.readFileSync(path.join(CONTRACTS_DIR, 'TBCNFT.sol'), 'utf8');
  fs.writeFileSync(path.join(SRC_CONTRACTS_DIR, 'TBCNFT.sol'), contractSource);
  console.log('✅ Source code prepared for verification!');
} catch (error) {
  console.error('❌ Error updating verification source:', error.message);
}

console.log('');
console.log('🎉 Contract update complete! The compiled contract is now ready for deployment.');
console.log(''); 