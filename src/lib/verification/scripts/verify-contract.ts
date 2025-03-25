#!/usr/bin/env tsx
import { verificationService } from '../../verification';
import 'dotenv/config';
import { supabaseAdmin } from '../../supabaseUtils';

/**
 * This script is used to trigger verification for a specific contract deployment
 * Usage: npx tsx src/lib/verification/scripts/verify-contract.ts <deployment_id>
 */

async function checkVerificationStatus(deploymentId: string): Promise<{status: string, message: string} | null> {
  const { data, error } = await supabaseAdmin
    .from('contract_deployments')
    .select('verification_status, verification_message')
    .eq('id', deploymentId)
    .single();
    
  if (error) {
    console.error('Error checking verification status:', error);
    return null;
  }
  
  return {
    status: data.verification_status,
    message: data.verification_message
  };
}

async function main() {
  try {
    // Get deployment ID from command line
    const deploymentId = process.argv[2];
    
    if (!deploymentId) {
      console.error('Error: No deployment ID provided');
      console.log('Usage: npx tsx src/lib/verification/scripts/verify-contract.ts <deployment_id>');
      process.exit(1);
    }
    
    console.log(`Starting manual verification for deployment ID: ${deploymentId}`);
    
    try {
      // Manually trigger verification for the specified deployment
      await verificationService.verifyDeploymentById(deploymentId);
      
      console.log('Verification process started. Check Supabase for status updates.');
      
      // Wait for a bit to show initial status changes
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check the current verification status
      const status = await checkVerificationStatus(deploymentId);
      if (status) {
        console.log(`Current verification status: ${status.status}`);
        console.log(`Message: ${status.message}`);
      }
      
      console.log('Verification process continues in the background.');
      console.log('Check the verification_status in the contract_deployments table for final results.');
      
      // Wait a bit before exiting to allow logs to be output
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Everything went well
      process.exit(0);
    } catch (error) {
      console.error('Error running verification script:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

// Run the script
main(); 