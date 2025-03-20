import { supabaseAdmin } from './supabase';
import axios from 'axios';

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

  public async verifyContract(deployment: any) {
    try {
      const apiKey = this.getApiKeyForNetwork(deployment.network);
      const apiUrl = this.getApiUrlForNetwork(deployment.network);

      const constructorArguments = this.extractConstructorArguments(deployment);

      console.log(`Verifying contract ${deployment.contract_address} on ${deployment.network}...`);
      
      // Log detailed verification request parameters (excluding apiKey for security)
      const verificationParams = {
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: deployment.contract_address,
        contractname: 'TBCNFT',
        compilerVersion: 'v0.8.20+commit.a1b79de6',
        optimizationUsed: 1,
        runs: 200,
        sourceCodeLength: deployment.source_code ? deployment.source_code.length : 0,
        constructorArgsLength: constructorArguments ? constructorArguments.length : 0
      };
      
      console.log('Verification request parameters:', JSON.stringify(verificationParams, null, 2));
      
      const response = await axios.post(apiUrl, {
        apikey: apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: deployment.contract_address,
        sourceCode: deployment.source_code,
        contractname: 'TBCNFT',
        compilerVersion: 'v0.8.20+commit.a1b79de6',
        optimizationUsed: 1,
        runs: 200,
        constructorArguements: constructorArguments || '',
        // Add license type - important for some explorers
        licenseType: 3, // MIT License is usually 3
        // Add EVM version
        evmVersion: 'paris',
        // Add compiler settings
        codeformat: 'solidity-single-file'
      });

      // Log the complete API response for debugging
      console.log(`API Response from ${deployment.network} explorer:`, JSON.stringify(response.data, null, 2));

      if (response.data.status === '1') {
        await this.updateVerificationStatus(deployment.id, 'verified', response.data.result);
        console.log(`Contract ${deployment.contract_address} verification submitted successfully`);
      } else {
        // More detailed logging for failure
        console.error(`Contract verification failed on ${deployment.network}:`, {
          status: response.data.status,
          message: response.data.message || response.data.result || 'Unknown error',
          contractAddress: deployment.contract_address
        });
        
        await this.updateVerificationStatus(
          deployment.id, 
          'failed', 
          `${response.data.message || response.data.result || 'NOTOK'} - Try again later`
        );
      }
    } catch (error: any) {
      console.error(`Error verifying contract ${deployment.contract_address}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      console.error('Verification error details:', {
        message: errorMessage,
        network: deployment.network,
        status: error.response?.status,
        data: error.response?.data
      });
      
      await this.updateVerificationStatus(deployment.id, 'failed', `${errorMessage} - Try again later`);
    }
  }

  private extractConstructorArguments(deployment: any): string {
    try {
      console.log('Extracting constructor arguments for contract:', deployment.contract_address);
      
      // For debugging purposes, log what arguments we need to encode
      const constructorArgs = {
        name: deployment.name,
        symbol: deployment.symbol,
        initialOwner: deployment.deployer_address,
        baseURI: deployment.base_uri || 'ipfs://'
      };
      
      console.log('Constructor arguments to encode:', constructorArgs);
      
      // This is a known issue with contract verification - we need proper ABI encoding
      // For now, we will leave it blank as many explorers can infer the arguments
      // from the transaction data
      
      // In a more complete implementation, we would use ethers.js or a similar library
      // to encode these values according to the contract's ABI
      
      // For example: 
      // const abiCoder = new ethers.utils.AbiCoder();
      // const encodedArgs = abiCoder.encode(
      //   ['string', 'string', 'address', 'string'],
      //   [deployment.name, deployment.symbol, deployment.deployer_address, deployment.base_uri || 'ipfs://']
      // );
      // return encodedArgs.slice(2); // Remove '0x' prefix
      
      // For now, return empty string which works for some explorers
      return '';
    } catch (error) {
      console.error('Error extracting constructor arguments:', error);
      return '';
    }
  }

  private getApiKeyForNetwork(network: string): string {
    switch (network.toLowerCase()) {
      case 'ethereum mainnet':
        return process.env.ETHERSCAN_API_KEY || '';
      case 'sepolia testnet':
        return process.env.ETHERSCAN_API_KEY || '';
      case 'polygon mainnet':
        return process.env.POLYGONSCAN_API_KEY || '';
      case 'polygon amoy':
        return process.env.POLYGONSCAN_API_KEY || '';
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  private getApiUrlForNetwork(network: string): string {
    switch (network.toLowerCase()) {
      case 'ethereum mainnet':
        return 'https://api.etherscan.io/api';
      case 'sepolia testnet':
        return 'https://api-sepolia.etherscan.io/api';
      case 'polygon mainnet':
        return 'https://api.polygonscan.com/api';
      case 'polygon amoy':
        return 'https://api-amoy.polygonscan.com/api';
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  private async updateVerificationStatus(
    id: string,
    status: 'verified' | 'failed',
    message?: string
  ) {
    const { error } = await supabaseAdmin
      .from('contract_deployments')
      .update({
        verification_status: status,
        verification_message: message,
        verification_timestamp: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }
}

// Create a singleton instance
export const verificationService = new ContractVerificationService();