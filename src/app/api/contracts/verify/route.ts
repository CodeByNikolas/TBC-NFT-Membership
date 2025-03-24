import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verificationService } from '@/lib/verification';
import { jsonResponseNoCache, errorResponseNoCache } from '@/lib/apiUtils';
import { getAddressExplorerUrl } from '@/lib/networkUtils';

export async function POST(request: Request) {
  try {
    const { contract_address } = await request.json();
    
    if (!contract_address) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }
    
    // Find the deployment by contract address
    const { data: deployment, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('contract_address', contract_address)
      .single();
    
    if (error || !deployment) {
      console.error('Error finding deployment:', error);
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }
    
    console.log(`Manual verification requested for ${contract_address}`);
    
    // Use the verifyDeploymentById method which has bypass_delay flag
    await verificationService.verifyDeploymentById(deployment.id);
    
    return NextResponse.json({
      success: true,
      message: 'Verification started',
      contract_address,
      deployment_id: deployment.id
    });
  } catch (error: any) {
    console.error('Error starting verification:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contract_address = searchParams.get('contract_address');
    
    if (!contract_address) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }
    
    // Find the contract in Supabase
    const { data: contract, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('contract_address', contract_address)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    // Convert network name to proper format and determine explorer URL
    let explorerUrl = '';
    
    // Determine network name from chain_id directly
    let networkName = '';
    if (contract.chain_id === 1) networkName = 'mainnet';
    else if (contract.chain_id === 11155111) networkName = 'sepolia';
    else if (contract.chain_id === 137) networkName = 'polygon';
    else if (contract.chain_id === 80002) networkName = 'amoy';
    else networkName = 'mainnet'; // Default to mainnet
    
    explorerUrl = getAddressExplorerUrl(contract.contract_address, networkName);
    
    // Return the verification status
    return NextResponse.json({
      contract_address,
      verification_status: contract.verification_status,
      verification_message: contract.verification_message,
      verification_timestamp: contract.verification_timestamp,
      explorer_url: explorerUrl
    });
  } catch (error: any) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 