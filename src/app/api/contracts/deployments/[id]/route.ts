import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonResponseNoCache, errorResponseNoCache } from '@/lib/apiUtils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return errorResponseNoCache('Contract ID is required', 400);
    }
    
    // Fetch the contract from Supabase
    const { data, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponseNoCache('Contract not found', 404);
      }
      throw error;
    }
    
    if (!data) {
      return errorResponseNoCache('Contract not found', 404);
    }
    
    return jsonResponseNoCache({ data });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return errorResponseNoCache(error.message, 500);
  }
}