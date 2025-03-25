import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWallet } from '@/lib/wallet';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { TBCNFT__factory } from '@/hardhat/typechain-types';
import { getProvider } from '@/lib/ethers';
import { verificationService } from '@/lib/verification';

export async function POST(request: Request) {
  try {
    const { network, name, symbol, baseURI, gasLimit, maxPriorityFeePerGas, maxFeePerGas } = await request.json();

    // Validate input data
    if (!network) {
      return NextResponse.json({ error: 'Network is required' }, { status: 400 });
    }

    // Get the wallet for the authenticator user
    const wallet = await getWallet();
    if (!wallet) {
      return NextResponse.json({ error: 'No wallet available' }, { status: 500 });
    }

    // Get the provider for the specified network
    const provider = getProvider(network);
    if (!provider) {
      return NextResponse.json({ error: `Unsupported network: ${network}` }, { status: 400 });
    }

    // Connect the wallet to the provider
    const signer = wallet.connect(provider);
    const deployerAddress = await signer.getAddress();

    // Get the chain ID
    const { chainId } = await provider.getNetwork();

    // Prepare contract factory
    const contractFactory = new TBCNFT__factory(signer);

    // Default values
    const contractName = name || 'TBC Membership NFT';
    const contractSymbol = symbol || 'TBC';
    const contractBaseURI = baseURI || 'ipfs://';

    console.log(`Deploying contract to ${network} with params:`, {
      name: contractName,
      symbol: contractSymbol,
      initialOwner: deployerAddress,
      baseURI: contractBaseURI
    });

    // Deploy the contract with updated ethers v6 syntax
    const deployOptions = {
      gasLimit: gasLimit ? BigInt(gasLimit) : undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas ? BigInt(maxPriorityFeePerGas) : undefined,
      maxFeePerGas: maxFeePerGas ? BigInt(maxFeePerGas) : undefined
    };

    const contract = await contractFactory.deploy(
      contractName,
      contractSymbol,
      deployerAddress,
      contractBaseURI,
      deployOptions
    );

    console.log(`Contract deployment transaction submitted: ${contract.deploymentTransaction?.hash}`);

    // Wait for the contract to be deployed (ethers v6 syntax)
    const receipt = await contract.deploymentTransaction?.wait();
    const contractAddress = await contract.getAddress();

    console.log(`Contract deployed successfully at ${contractAddress}`);

    // Create an ID for this deployment
    const deploymentId = uuidv4();

    // Store the deployment in the database
    const { data: deployment, error } = await supabaseAdmin
      .from('contract_deployments')
      .insert({
        id: deploymentId,
        contract_address: contractAddress,
        deployer_address: deployerAddress,
        network: network,
        chain_id: chainId,
        transaction_hash: receipt?.hash,
        deployment_timestamp: new Date().toISOString(),
        verification_status: 'pending',
        verification_message: 'Verification will be attempted soon'
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing deployment:', error);
      return NextResponse.json(
        { error: 'Contract deployed but failed to store details' },
        { status: 500 }
      );
    }

    // Successful deployment
    console.log(`Contract deployed successfully at ${contractAddress} on ${network}`);
    
    // Schedule delayed verification
    try {
      console.log('Scheduling delayed verification...');
      await verificationService.scheduleVerification(deployment.id, 30);
      console.log('Delayed verification scheduled successfully');
    } catch (verifyError) {
      console.error('Error scheduling delayed verification:', verifyError);
      // Continue with deployment response even if verification scheduling fails
    }
    
    return NextResponse.json({
      success: true,
      contract_address: contractAddress,
      network,
      transaction_hash: receipt?.hash,
      deployment_id: deployment.id
    });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 