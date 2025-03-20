import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verificationService } from '@/lib/verification';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Set deployment timestamp if not provided
    if (!body.deployment_timestamp) {
      body.deployment_timestamp = new Date().toISOString();
    }
    
    // Validate required fields
    const requiredFields = [
      'contract_address', 
      'network', 
      'chain_id', 
      'deployer_address', 
      'name', 
      'symbol', 
      'deployment_tx_hash'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const { data, error } = await supabaseAdmin
      .from('contract_deployments')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    // Automatically trigger contract verification
    try {
      // Start verification in the background without awaiting
      // to avoid blocking the response
      setTimeout(async () => {
        try {
          await verificationService.verifyContract(data);
          console.log(`Verification process started for contract: ${data.contract_address}`);
        } catch (verificationError) {
          console.error('Error starting verification process:', verificationError);
        }
      }, 2000); // Wait 2 seconds to ensure the transaction is fully confirmed
    } catch (verificationError) {
      console.error('Error scheduling verification:', verificationError);
      // Don't fail the response if verification scheduling fails
    }

    return NextResponse.json({
      ...data,
      verification_scheduled: true
    });
  } catch (error: any) {
    console.error('Error saving contract deployment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const deployer_address = searchParams.get('deployer_address');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('contract_deployments')
      .select('*', { count: 'exact' });

    if (deployer_address) {
      query = query.eq('deployer_address', deployer_address);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        page,
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}