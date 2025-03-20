import { verificationService } from '../verification';
import 'dotenv/config';
import { supabaseAdmin } from '../supabase';

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
    // Check if deployment ID was provided
    const deploymentId = process.argv[2];
    
    if (!deploymentId) {
      console.error('Please provide a deployment ID as a command line argument');
      console.log('Usage: npx tsx src/lib/scripts/verify-contract.ts <deployment_id>');
      process.exit(1);
    }
    
    console.log(`Starting manual verification for deployment: ${deploymentId}`);
    
    // Attempt to verify the contract
    await verificationService.verifyDeploymentById(deploymentId);
    
    console.log('Verification process started successfully');
    
    // Wait for a reasonable amount of time to allow verification to complete or fail
    // This is for command line use, as the verification is asynchronous
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('Verification process may still be running in the background.');
    console.log('Check the verification_status in the contract_deployments table for final results.');
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

main(); 