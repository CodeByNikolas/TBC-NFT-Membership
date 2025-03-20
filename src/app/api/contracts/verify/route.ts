import { NextResponse } from 'next/server';
import { verificationService } from '@/lib/verification';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    // Determine explorer URL based on network
    let explorerUrl = '';
    switch(contract.network.toLowerCase()) {
      case 'ethereum mainnet':
        explorerUrl = `https://etherscan.io/address/${contract_address}`;
        break;
      case 'sepolia testnet':
        explorerUrl = `https://sepolia.etherscan.io/address/${contract_address}`;
        break;
      case 'polygon mainnet':
        explorerUrl = `https://polygonscan.com/address/${contract_address}`;
        break;
      case 'polygon amoy':
        explorerUrl = `https://amoy.polygonscan.com/address/${contract_address}`;
        break;
      default:
        // Fallback based on chain ID
        if (contract.chain_id === 1) explorerUrl = `https://etherscan.io/address/${contract_address}`;
        else if (contract.chain_id === 11155111) explorerUrl = `https://sepolia.etherscan.io/address/${contract_address}`;
        else if (contract.chain_id === 137) explorerUrl = `https://polygonscan.com/address/${contract_address}`;
        else if (contract.chain_id === 80002) explorerUrl = `https://amoy.polygonscan.com/address/${contract_address}`;
        else explorerUrl = `https://etherscan.io/address/${contract_address}`;
    }
    
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