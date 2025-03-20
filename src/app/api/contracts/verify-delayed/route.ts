import { NextResponse } from 'next/server';
import { verificationService } from '@/lib/verification';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { contract_address, deployment_id } = await request.json();
    
    if (!contract_address && !deployment_id) {
      return NextResponse.json(
        { error: 'Either contract_address or deployment_id is required' },
        { status: 400 }
      );
    }
    
    // Find the deployment based on contract address or deployment ID
    let query = supabaseAdmin
      .from('contract_deployments')
      .select('*');
    
    if (deployment_id) {
      query = query.eq('id', deployment_id);
    } else {
      query = query.eq('contract_address', contract_address);
    }
    
    const { data: deployment, error } = await query.single();
    
    if (error || !deployment) {
      console.error('Error finding deployment:', error);
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }
    
    // Update status to pending with message about delayed verification
    await supabaseAdmin
      .from('contract_deployments')
      .update({
        verification_status: 'pending',
        verification_message: 'Verification scheduled in 30 seconds to allow for indexing',
        verification_timestamp: new Date().toISOString()
      })
      .eq('id', deployment.id);
    
    console.log(`Scheduled delayed verification for contract ${deployment.contract_address} in 30 seconds`);
    
    // Schedule verification after 30 seconds
    setTimeout(() => {
      console.log(`Executing delayed verification for contract ${deployment.contract_address}`);
      verificationService.verifyContract(deployment)
        .catch(err => console.error('Error in delayed verification:', err));
    }, 30000);
    
    return NextResponse.json({
      success: true,
      message: 'Verification scheduled in 30 seconds',
      deployment_id: deployment.id,
      contract_address: deployment.contract_address
    });
  } catch (error: any) {
    console.error('Error in delayed verification endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 