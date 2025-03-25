import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseUtils';
import { verificationService } from '@/lib/verification';
import { jsonResponseNoCache, errorResponseNoCache } from '../../../../lib/ServerApiUtils';

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Define handlers based on environment
const handlers = {
  // Runtime handlers
  runtime: {
    async POST(request: Request) {
      try {
        const body = await request.json();
        
        console.log('Received deployment data:', JSON.stringify(body, null, 2));
        
        // Set deployment timestamp if not provided
        if (!body.deployment_timestamp) {
          body.deployment_timestamp = new Date().toISOString();
        }
        
        // Validate required fields
        const requiredFields = [
          'contract_address', 
          'chain_id', 
          'deployer_address', 
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
    },
    
    async GET(request: Request) {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const deployer_address = searchParams.get('deployer_address');
        const id = searchParams.get('id');
        const offset = (page - 1) * limit;
    
        let query = supabaseAdmin
          .from('contract_deployments')
          .select('*', { count: 'exact' });
    
        if (deployer_address) {
          query = query.eq('deployer_address', deployer_address);
        }
        
        if (id) {
          query = query.eq('id', id);
        }
    
        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
    
        if (error) throw error;
    
        return jsonResponseNoCache({
          data,
          pagination: {
            total: count,
            page,
            limit
          }
        });
      } catch (error: any) {
        return errorResponseNoCache(error.message, 500);
      }
    }
  },
  
  // Build time handlers (dummy)
  buildTime: {
    async POST() {
      return NextResponse.json({ message: 'Build time placeholder' });
    },
    
    async GET() {
      return NextResponse.json({ message: 'Build time placeholder' });
    }
  }
};

// Export the appropriate handlers based on environment
export const POST = isBuildTime ? handlers.buildTime.POST : handlers.runtime.POST;
export const GET = isBuildTime ? handlers.buildTime.GET : handlers.runtime.GET;