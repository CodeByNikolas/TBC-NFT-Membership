import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verificationService } from '@/lib/verification';

// POST endpoint to trigger verification for a specific contract
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contract_address } = body;
    
    console.log(`Verification requested for contract: ${contract_address}`);
    
    if (!contract_address) {
      console.error('Missing contract address in verification request');
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
      console.error(`Contract not found: ${contract_address}`, error);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    console.log(`Contract found for verification:`, {
      id: contract.id,
      address: contract.contract_address,
      network: contract.network,
      current_status: contract.verification_status
    });
    
    // Check if the contract is already verified or has a verification in progress
    if (contract.verification_status !== 'pending' && contract.verification_status !== 'failed') {
      console.log(`Contract ${contract_address} verification status is already: ${contract.verification_status}`);
      return NextResponse.json({
        message: `Contract verification is ${contract.verification_status}`,
        status: contract.verification_status
      });
    }
    
    console.log(`Starting verification process for contract: ${contract_address} on ${contract.network}`);
    
    // Manually verify this specific contract
    try {
      await verificationService.verifyContract(contract);
      console.log(`Verification process initiated for contract: ${contract_address}`);
      
      return NextResponse.json({
        message: 'Contract verification initiated',
        contract_address
      });
    } catch (verificationError) {
      console.error(`Error during verification process:`, verificationError);
      
      // Update the contract status to failed even if the verification process throws an error
      try {
        await supabaseAdmin
          .from('contract_deployments')
          .update({
            verification_status: 'failed',
            verification_message: verificationError instanceof Error 
              ? verificationError.message 
              : 'Unknown error during verification',
            verification_timestamp: new Date().toISOString()
          })
          .eq('id', contract.id);
      } catch (updateError) {
        console.error('Failed to update contract status after verification error:', updateError);
      }
      
      throw verificationError;
    }
  } catch (error: any) {
    console.error('Error triggering contract verification:', error);
    return NextResponse.json(
      { error: error.message },
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
    
    // Return the verification status
    return NextResponse.json({
      contract_address,
      verification_status: contract.verification_status,
      verification_message: contract.verification_message,
      verification_timestamp: contract.verification_timestamp
    });
  } catch (error: any) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 