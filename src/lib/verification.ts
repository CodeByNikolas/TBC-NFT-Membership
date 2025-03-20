import { supabaseAdmin } from './supabase';
import axios from 'axios';
import FormData from 'form-data';

interface VerificationService {
  start(): Promise<void>;
  stop(): void;
  verifyContract(deployment: any): Promise<void>;
}

class ContractVerificationService implements VerificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run every 30 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.processPendingVerifications();
      } catch (error) {
        console.error('Error processing verifications:', error);
      }
    }, 30000);

    // Initial run
    await this.processPendingVerifications();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private async processPendingVerifications() {
    const { data: pending, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('verification_status', 'pending')
      .limit(1);

    if (error) throw error;
    if (!pending || pending.length === 0) return;

    const deployment = pending[0];
    await this.verifyContract(deployment);
  }

  // Method to manually verify a specific deployment by ID
  public async verifyDeploymentById(deploymentId: string): Promise<void> {
    console.log(`Manual verification requested for deployment ID: ${deploymentId}`);
    
    const { data: deployment, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();
    
    if (error) {
      console.error(`Error fetching deployment ${deploymentId}:`, error);
      throw error;
    }
    
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }
    
    console.log(`Found deployment ${deploymentId} for ${deployment.contract_address} on ${deployment.network}`);
    
    // Set status to pending to indicate verification is starting
    await this.updateVerificationStatus(
      deploymentId,
      'pending',
      'Manual verification started'
    );
    
    // Create a modified deployment object with a flag to bypass the delay
    const deploymentWithoutDelay = {
      ...deployment,
      bypass_delay: true // Special flag to bypass delay for manual verifications
    };
    
    // Attempt to verify the contract without delay
    await this.verifyContract(deploymentWithoutDelay);
  }

  // Get API endpoints based on the network
  private getApiEndpoint(network: string, chainId: number): string {
    // Map network names to API endpoints
    switch(network.toLowerCase()) {
      case 'ethereum mainnet':
        return 'https://api.etherscan.io/api';
      case 'sepolia testnet':
        return 'https://api-sepolia.etherscan.io/api';
      case 'polygon mainnet':
        return 'https://api.polygonscan.com/api';
      case 'polygon amoy':
        return 'https://api-amoy.polygonscan.com/api';
      default:
        // Fallback based on chain ID
        if (chainId === 1) return 'https://api.etherscan.io/api';
        if (chainId === 11155111) return 'https://api-sepolia.etherscan.io/api';
        if (chainId === 137) return 'https://api.polygonscan.com/api';
        if (chainId === 80002) return 'https://api-amoy.polygonscan.com/api';
        
        throw new Error(`Unsupported network: ${network} (chainId: ${chainId})`);
    }
  }

  // Get the appropriate API key based on the network
  private getApiKey(network: string): string {
    if (network.toLowerCase().includes('ethereum') || network.toLowerCase().includes('sepolia')) {
      return process.env.ETHERSCAN_API_KEY || '';
    } else if (network.toLowerCase().includes('polygon')) {
      return process.env.POLYGONSCAN_API_KEY || '';
    }
    return '';
  }

  // Get the explorer URL for a specific network and contract address
  private getExplorerUrl(network: string, chainId: number, contractAddress: string): string {
    switch(network.toLowerCase()) {
      case 'ethereum mainnet':
        return `https://etherscan.io/address/${contractAddress}#code`;
      case 'sepolia testnet':
        return `https://sepolia.etherscan.io/address/${contractAddress}#code`;
      case 'polygon mainnet':
        return `https://polygonscan.com/address/${contractAddress}#code`;
      case 'polygon amoy':
        return `https://amoy.polygonscan.com/address/${contractAddress}#code`;
      default:
        // Fallback based on chain ID
        if (chainId === 1) return `https://etherscan.io/address/${contractAddress}#code`;
        if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${contractAddress}#code`;
        if (chainId === 137) return `https://polygonscan.com/address/${contractAddress}#code`;
        if (chainId === 80002) return `https://amoy.polygonscan.com/address/${contractAddress}#code`;
        
        return `https://etherscan.io/address/${contractAddress}#code`;
    }
  }

  // Extract constructor arguments
  private async extractConstructorArguments(deployment: any): Promise<string> {
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

  // Verify the contract using the appropriate block explorer API
  public async verifyContract(deployment: any) {
    try {
      const network = deployment.network;
      const chainId = deployment.chain_id;
      const contractAddress = deployment.contract_address;
      
      console.log(`Verifying contract ${contractAddress} on ${network} (chain ID: ${chainId})...`);
      
      // Get the appropriate API endpoint and API key
      const apiEndpoint = this.getApiEndpoint(network, chainId);
      const apiKey = this.getApiKey(network);
      
      if (!apiKey) {
        throw new Error(`No API key found for network ${network}`);
      }
      
      // Check how long since contract was deployed - we need to allow time for indexing
      // Skip this delay logic for manual verification requests
      if (!deployment.bypass_delay) {
        const deploymentTimestamp = new Date(deployment.created_at || deployment.deployment_timestamp || Date.now()).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - deploymentTimestamp) / 1000);
        
        console.log(`Time since deployment: ${elapsedSeconds} seconds`);
        
        // If the contract was deployed very recently, delay the verification
        if (elapsedSeconds < 30) {
          const delayNeeded = 30 - elapsedSeconds;
          console.log(`Contract deployed recently, delaying verification by ${delayNeeded} seconds to allow for indexing`);
          
          await this.updateVerificationStatus(
            deployment.id,
            'pending',
            `Waiting 30 seconds for contract to be indexed...`
          );
          
          // Schedule a delayed verification
          setTimeout(() => {
            console.log(`Delay complete, now attempting verification for ${contractAddress}`);
            this.verifyContract(deployment);
          }, delayNeeded * 1000);
          
          return;
        }
      } else {
        console.log('Bypassing delay for manual verification request');
      }
      
      // Extract constructor arguments before preparing verification request
      // This allows us to debug them before submission
      console.log(`Extracting constructor arguments for ${contractAddress}...`);
      const constructorArgs = await this.extractConstructorArguments(deployment);
      
      if (!constructorArgs) {
        console.warn('No constructor arguments found, proceeding with empty arguments');
      } else {
        console.log(`Constructor arguments (${constructorArgs.length} chars): ${constructorArgs}`);
        
        // Store constructor args in database for future use if not already stored
        if (!deployment.constructor_args) {
          await supabaseAdmin
            .from('contract_deployments')
            .update({ constructor_args: constructorArgs })
            .eq('id', deployment.id);
        }
      }
      
      // Create the form data for the verification request
      const fs = require('fs');
      const path = require('path');
      
      // Path to the contract
      const contractPath = path.resolve('hardhat/contracts/TBCNFT.sol');
      
      // Verify contract path exists
      if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract file not found at: ${contractPath}`);
      }
      
      // Load the Hardhat build info
      const buildInfoDir = path.resolve('hardhat/artifacts/build-info');
      
      if (!fs.existsSync(buildInfoDir)) {
        throw new Error(`Build info directory not found at: ${buildInfoDir}`);
      }
      
      const buildInfoFiles = fs.readdirSync(buildInfoDir);
      
      if (buildInfoFiles.length === 0) {
        throw new Error('No build info files found');
      }
      
      // Read the most recent build info file
      const buildInfoPath = path.join(buildInfoDir, buildInfoFiles[0]);
      
      if (!fs.existsSync(buildInfoPath)) {
        throw new Error(`Build info file not found at: ${buildInfoPath}`);
      }
      
      console.log(`Using build info file: ${buildInfoPath}`);
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      
      // Get the compiler input
      const compilerInput = buildInfo.input;
      
      if (!compilerInput) {
        throw new Error('No compiler input found in build info');
      }
      
      // Find the correct contract name by looking at the output contracts
      let contractName = 'TBCNFT.sol:TBCNFT'; // Default fallback
      
      if (buildInfo.output && buildInfo.output.contracts) {
        // Look for TBCNFT contract in the output
        for (const file in buildInfo.output.contracts) {
          if (file.includes('TBCNFT.sol') && buildInfo.output.contracts[file]['TBCNFT']) {
            contractName = `${file}:TBCNFT`;
            console.log(`Found contract name: ${contractName}`);
            break;
          }
        }
      }
      
      // Create the form data for the verification request
      const data = new FormData();
      data.append('apikey', apiKey);
      data.append('module', 'contract');
      data.append('action', 'verifysourcecode');
      data.append('contractaddress', contractAddress);
      data.append('sourceCode', JSON.stringify(compilerInput));
      data.append('codeformat', 'solidity-standard-json-input');
      data.append('contractname', contractName); // Use the extracted contract name
      data.append('compilerversion', 'v0.8.20+commit.a1b79de6'); // Must match hardhat.config.js
      data.append('optimizationUsed', '1'); // 1 for true
      data.append('runs', '200'); // Optimization runs from hardhat.config.js
      data.append('evmversion', 'paris'); // For Solidity 0.8.20
      data.append('licenseType', '3'); // MIT License
      
      // Add constructor arguments if needed
      if (constructorArgs) {
        data.append('constructorArguments', constructorArgs);
      }
      
      console.log(`Submitting verification request to ${apiEndpoint}...`);
      console.log('Verification request details:', {
        contractAddress,
        network,
        chainId,
        compilerVersion: 'v0.8.20+commit.a1b79de6',
        format: 'solidity-standard-json-input',
        hasConstructorArgs: !!constructorArgs,
        constructorArgsLength: constructorArgs ? constructorArgs.length : 0
      });
      
      try {
        // Submit the verification request
        const response = await axios.post(apiEndpoint, data, {
          headers: {
            ...data.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        
        console.log('Verification response:', JSON.stringify(response.data, null, 2));
        
        // Check the response
        if (response.data && response.data.status === '1') {
          // The verification was submitted successfully, but we need to check its status
          const guid = response.data.result;
          
          // Update the contract status to indicate verification is in progress
          await this.updateVerificationStatus(
            deployment.id,
            'pending',
            `Verification submitted. Checking status...`
          );
          
          // Check the verification status after a delay
          setTimeout(async () => {
            await this.checkVerificationStatus(deployment, guid, apiEndpoint, apiKey);
          }, 15000); // Wait 15 seconds before checking status
          
          return;
        } else {
          // Check if "already verified" message is in the response
          const errorMessage = response.data.result || 'Unknown error';
          
          if (errorMessage.includes('Already Verified') || errorMessage.includes('Contract source code already verified')) {
            // Contract is already verified - treat this as success
            const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
            
            await this.updateVerificationStatus(
              deployment.id,
              'verified',
              `Contract is already verified. View at: ${explorerUrl}`
            );
            
            // Force a second update to ensure the UI refreshes
            setTimeout(async () => {
              await supabaseAdmin
                .from('contract_deployments')
                .update({
                  verification_status: 'verified',
                  verification_message: `Contract is verified. View at: ${explorerUrl}`,
                  verification_timestamp: new Date().toISOString()
                })
                .eq('id', deployment.id);
              
              console.log(`Contract ${deployment.contract_address} recognized as already verified.`);
            }, 1000);
            
            return;
          } else if (errorMessage.includes('Unable to locate ContractCode')) {
            // Contract code not yet indexed - retry after a delay
            console.log(`Contract not yet indexed on ${network}. Will retry after delay.`);
            
            await this.updateVerificationStatus(
              deployment.id,
              'pending',
              `Contract not yet indexed. Will retry in 30 seconds...`
            );
            
            // Retry after 30 seconds
            setTimeout(() => {
              console.log(`Retrying verification for ${contractAddress} after indexing delay`);
              this.verifyContract(deployment);
            }, 30000);
            
            return;
          } else {
            // The verification submission failed for a different reason
            throw new Error(`Verification submission failed: ${errorMessage}`);
          }
        }
      } catch (error: any) {
        console.error('Error verifying contract:', error);
        
        // For failed verifications, provide a direct link for manual verification
        const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
        const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
        const errorMessage = error.response?.data?.result || error.message || 'Unknown error';
        
        await this.updateVerificationStatus(
          deployment.id,
          'failed',
          `Verification failed: ${errorMessage}. Try manually at ${verifyUrl}`
        );
      }
    } catch (error: any) {
      console.error('Error verifying contract:', error);
      
      // For failed verifications, provide a direct link for manual verification
      const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
      const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
      const errorMessage = error.response?.data?.result || error.message || 'Unknown error';
      
      await this.updateVerificationStatus(
        deployment.id,
        'failed',
        `Verification failed: ${errorMessage}. Try manually at ${verifyUrl}`
      );
    }
  }
  
  // Check the status of a verification request
  private async checkVerificationStatus(deployment: any, guid: string, apiEndpoint: string, apiKey: string) {
    try {
      console.log(`Checking verification status for GUID: ${guid}`);
      
      const params = new URLSearchParams();
      params.append('apikey', apiKey);
      params.append('module', 'contract');
      params.append('action', 'checkverifystatus');
      params.append('guid', guid);
      
      const response = await axios.get(`${apiEndpoint}?${params.toString()}`);
      
      console.log('Verification status response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.status === '1') {
        // Verification successful
        const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
        
        // Update the verification status with immediate write
        await this.updateVerificationStatus(
          deployment.id,
          'verified',
          `Verified successfully. View at: ${explorerUrl}`
        );
        
        // Force a second update to ensure the UI refreshes
        setTimeout(async () => {
          await supabaseAdmin
            .from('contract_deployments')
            .update({
              verification_status: 'verified',
              verification_message: `Verified successfully. View at: ${explorerUrl}`,
              verification_timestamp: new Date().toISOString()
            })
            .eq('id', deployment.id);
          
          console.log(`Contract ${deployment.contract_address} verified status refreshed in database.`);
        }, 1000);
        
        console.log(`Contract ${deployment.contract_address} verified successfully.`);
      } else if (response.data && response.data.result === 'Pending in queue') {
        // Still pending, check again later
        console.log(`Verification for ${deployment.contract_address} still pending. Will check again later.`);
        
        await this.updateVerificationStatus(
          deployment.id,
          'pending',
          `Verification is pending in the queue. Please wait...`
        );
        
        // Check again after a delay
        setTimeout(async () => {
          await this.checkVerificationStatus(deployment, guid, apiEndpoint, apiKey);
        }, 30000); // Wait 30 seconds before checking again
      } else if (response.data && response.data.result === 'Already Verified') {
        // Contract is already verified - treat this as success
        const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
        
        await this.updateVerificationStatus(
          deployment.id,
          'verified',
          `Contract is already verified. View at: ${explorerUrl}`
        );
        
        // Force a second update to ensure the UI refreshes
        setTimeout(async () => {
          await supabaseAdmin
            .from('contract_deployments')
            .update({
              verification_status: 'verified',
              verification_message: `Contract is verified. View at: ${explorerUrl}`,
              verification_timestamp: new Date().toISOString()
            })
            .eq('id', deployment.id);
          
          console.log(`Contract ${deployment.contract_address} verified status refreshed in database.`);
        }, 1000);
        
        console.log(`Contract ${deployment.contract_address} recognized as already verified.`);
      } else {
        // Verification failed
        const errorMessage = response.data.result || 'Unknown error';
        const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
        
        await this.updateVerificationStatus(
          deployment.id,
          'failed',
          `Verification failed: ${errorMessage}. Try manually at ${explorerUrl}`
        );
        
        console.error(`Contract verification failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      
      const errorMessage = error.response?.data?.result || error.message || 'Unknown error';
      const explorerUrl = this.getExplorerUrl(deployment.network, deployment.chain_id, deployment.contract_address);
      
      await this.updateVerificationStatus(
        deployment.id,
        'failed',
        `Error checking verification status: ${errorMessage}. Try manually at ${explorerUrl}`
      );
    }
  }

  private async updateVerificationStatus(
    id: string,
    status: 'verified' | 'failed' | 'pending',
    message?: string
  ) {
    const timestamp = new Date().toISOString();
    console.log(`Updating verification status for ${id} to ${status} at ${timestamp}`);
    
    const { error } = await supabaseAdmin
      .from('contract_deployments')
      .update({
        verification_status: status,
        verification_message: message,
        verification_timestamp: timestamp
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating verification status:', error);
      throw error;
    } else {
      console.log(`Successfully updated verification status for ${id} to ${status}`);
    }
  }

  /**
   * Schedules verification for a newly deployed contract with a delay to allow for indexing
   * @param deploymentId The ID of the deployment to verify
   * @param delaySeconds The number of seconds to delay before attempting verification (default: 30)
   */
  public async scheduleVerification(deploymentId: string, delaySeconds: number = 30): Promise<void> {
    console.log(`Scheduling verification for deployment ${deploymentId} with ${delaySeconds} second delay`);
    
    // Fetch the deployment
    const { data: deployment, error } = await supabaseAdmin
      .from('contract_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();
    
    if (error) {
      console.error(`Error fetching deployment ${deploymentId}:`, error);
      throw error;
    }
    
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }
    
    // Update status to pending with message about scheduled verification
    await this.updateVerificationStatus(
      deploymentId,
      'pending',
      `Verification scheduled in ${delaySeconds} seconds to allow for indexing`
    );
    
    // Schedule verification after the delay
    setTimeout(() => {
      console.log(`Executing scheduled verification for deployment ${deploymentId}`);
      this.verifyContract(deployment)
        .catch(err => console.error(`Error in scheduled verification for deployment ${deploymentId}:`, err));
    }, delaySeconds * 1000);
    
    return;
  }
}

// Create a singleton instance
export const verificationService = new ContractVerificationService();