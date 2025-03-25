#!/usr/bin/env tsx
/**
 * Script wrapper for contract verification
 * 
 * This script forwards to the implementation in the verification module.
 * Usage: npx tsx src/scripts/verify-contract.ts <deployment_id>
 */

// Forward the process arguments so the deployment ID is passed to the actual script
process.argv = process.argv; // No need to modify, automatically forwarded 

// Use the require syntax to load and execute the module script
require('../lib/verification/scripts/verify-contract');