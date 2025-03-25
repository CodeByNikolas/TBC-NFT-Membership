import { supabaseAdmin } from '../../supabaseUtils';
import { ContractDeployment } from '../../verification';

/**
 * Extract constructor arguments from a deployment
 */
export async function extractConstructorArguments(deployment: ContractDeployment): Promise<string> {
  try {
    console.log('Extracting constructor arguments for deployment:', deployment.id);
    
    // APPROACH 1: Use stored constructor arguments if available
    if (deployment.constructor_args) {
      console.log('Using stored constructor args from database');
      return deployment.constructor_args.startsWith('0x') 
        ? deployment.constructor_args.slice(2) 
        : deployment.constructor_args;
    }
    
    // APPROACH 2: Re-encode from deployment parameters using viem
    console.log('Re-encoding constructor arguments from deployment parameters');
    
    // Get constructor parameters from deployment
    const name = deployment.name || 'TBC Membership NFT';
    const symbol = deployment.symbol || 'TBC';
    const initialOwner = deployment.deployer_address; // Use deployer_address as initialOwner
    const baseURI = deployment.base_uri || 'ipfs://';
    
    if (!initialOwner) {
      throw new Error('Missing deployer_address for constructor arguments');
    }
    
    console.log('Using parameters for encoding:', { name, symbol, initialOwner, baseURI });
    
    // Use viem's encodeAbiParameters to match the deployment encoding
    const { encodeAbiParameters } = require('viem');
    const encodedArgs = encodeAbiParameters(
      [
        { name: 'name', type: 'string' },
        { name: 'symbol', type: 'string' },
        { name: 'initialOwner', type: 'address' },
        { name: 'baseURI', type: 'string' }
      ],
      [name, symbol, initialOwner, baseURI]
    );
    
    console.log('Encoded constructor args:', encodedArgs);
    
    // Store the encoded arguments in the database for future use
    await supabaseAdmin
      .from('contract_deployments')
      .update({ constructor_args: encodedArgs.slice(2) })
      .eq('id', deployment.id);
    
    return encodedArgs.slice(2); // Remove 0x prefix
    
  } catch (error: any) {
    console.error('Error extracting constructor arguments:', error);
    return '';
  }
} 