import { supabaseAdmin } from '../../supabaseUtils';
import { api } from '../../ClientApiUtils';
import { ContractDeployment } from '../../verification';
import { getApiEndpoint, getApiKey } from './apiUtils';
import ethersUtils from '@/lib/ethersUtil';
import { extractConstructorArguments } from './contractUtils';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

// Simple circuit breaker interface
interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  resetTimeout: number;
}

// Global circuit breaker registry
const circuitBreakerRegistry: Record<string, CircuitBreaker> = {};

/**
 * Update verification status in the database
 */
export async function updateVerificationStatus(
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
 * Verify a contract deployment using block explorer APIs
 */
export async function verifyContract(deployment: ContractDeployment): Promise<void> {
  // Simple circuit breaker implementation
  const circuitBreakerKey = `circuit_breaker_${deployment.chain_id}`;
  
  // Initialize circuit breaker state if needed
  if (!circuitBreakerRegistry[circuitBreakerKey]) {
    circuitBreakerRegistry[circuitBreakerKey] = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      resetTimeout: 30 * 60 * 1000 // 30 minutes until circuit resets
    };
  }
  
  const circuitBreaker = circuitBreakerRegistry[circuitBreakerKey];
  const now = Date.now();
  
  // Check if circuit is open (too many failures recently)
  if (circuitBreaker.isOpen) {
    // Check if we should reset the circuit breaker
    if (now - circuitBreaker.lastFailure > circuitBreaker.resetTimeout) {
      console.log(`Circuit breaker for chain ${deployment.chain_id} reset after cooling period`);
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
    } else {
      // Circuit is open, skip API calls and provide direct link for manual verification
      console.log(`Circuit breaker for chain ${deployment.chain_id} is open. Skipping API calls.`);
      const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
      const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
      
      await updateVerificationStatus(
        deployment.id,
        'failed',
        `Verification API unavailable. Please try manually at ${verifyUrl}`
      );
      return;
    }
  }
  
  try {
    const chainId = deployment.chain_id;
    const contractAddress = deployment.contract_address;
    
    console.log(`Verifying contract ${contractAddress} on chain ID: ${chainId}...`);
    
    // Get the appropriate API endpoint and API key
    const apiEndpoint = getApiEndpoint(chainId);
    const apiKey = getApiKey(chainId);
    
    if (!apiKey) {
      throw new Error(`No API key found for chain ID ${chainId}`);
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
        
        await updateVerificationStatus(
          deployment.id,
          'pending',
          `Waiting 30 seconds for contract to be indexed...`
        );
        
        // Schedule a delayed verification
        setTimeout(() => {
          console.log(`Delay complete, now attempting verification for ${contractAddress}`);
          verifyContract(deployment);
        }, delayNeeded * 1000);
        
        return;
      }
    } else {
      console.log('Bypassing delay for manual verification request');
    }
    
    // Extract constructor arguments before preparing verification request
    // This allows us to debug them before submission
    console.log(`Extracting constructor arguments for ${contractAddress}...`);
    const constructorArgs = await extractConstructorArguments(deployment);
    
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
    
    // Path to the contract
    const contractPath = path.resolve('hardhat/contracts/TBCNFT.sol');
    
    // Verify contract path exists
    if (!fs.existsSync(contractPath)) {
      console.warn(`Contract file not found at: ${contractPath}, trying alternate path...`);
      // Try alternate paths that might be used in Docker
      const altPaths = [
        path.resolve('/app/hardhat/contracts/TBCNFT.sol'),
        path.resolve('./hardhat/contracts/TBCNFT.sol'),
        path.resolve('../hardhat/contracts/TBCNFT.sol')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`Found contract file at alternate path: ${altPath}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error(`Contract file not found in any expected locations`);
      }
    }
    
    // Load the Hardhat build info
    const buildInfoDir = path.resolve('hardhat/artifacts/build-info');
    let buildInfo; // Define buildInfo variable in the outer scope
    
    if (!fs.existsSync(buildInfoDir)) {
      console.warn(`Build info directory not found at: ${buildInfoDir}, trying alternate paths...`);
      // Try alternate paths that might be used in Docker
      const altDirs = [
        path.resolve('/app/hardhat/artifacts/build-info'),
        path.resolve('./hardhat/artifacts/build-info'),
        path.resolve('../hardhat/artifacts/build-info')
      ];
      
      let foundDir = '';
      for (const altDir of altDirs) {
        if (fs.existsSync(altDir)) {
          console.log(`Found build info directory at alternate path: ${altDir}`);
          foundDir = altDir;
          break;
        }
      }
      
      if (!foundDir) {
        throw new Error(`Build info directory not found at: ${buildInfoDir}. Try manually at ${ethersUtils.getAddressExplorerUrl(contractAddress, chainId)}/contract-verification`);
      }
      
      // Use the found directory
      const buildInfoFiles = fs.readdirSync(foundDir);
      
      if (buildInfoFiles.length === 0) {
        throw new Error('No build info files found');
      }
      
      // Read the most recent build info file
      const buildInfoPath = path.join(foundDir, buildInfoFiles[0]);
      
      if (!fs.existsSync(buildInfoPath)) {
        throw new Error(`Build info file not found at: ${buildInfoPath}`);
      }
      
      console.log(`Using build info file: ${buildInfoPath}`);
      buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    } else {
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
      buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    }
    
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
      chainId,
      compilerVersion: 'v0.8.20+commit.a1b79de6',
      format: 'solidity-standard-json-input',
      hasConstructorArgs: !!constructorArgs,
      constructorArgsLength: constructorArgs ? constructorArgs.length : 0
    });
    
    try {
      // Submit the verification request with retry mechanism
      let retries = 5; // Increased from 3 to 5 retries
      let lastError = null;
      
      while (retries > 0) {
        try {
          const response = await api.post(apiEndpoint, data, {
            headers: {
              ...data.getHeaders(),
              'Content-Type': 'multipart/form-data'
            },
            // Use even longer timeout for verification requests
            timeout: 180000, // 3 minutes
            // These are already set in the api.ts defaults but adding here explicitly
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          console.log('Verification response:', JSON.stringify(response.data, null, 2));
          
          // Check the response
          if (response.data && response.data.status === '1') {
            // The verification was submitted successfully, but we need to check its status
            const guid = response.data.result;
            
            // Update the contract status to indicate verification is in progress
            await updateVerificationStatus(
              deployment.id,
              'pending',
              `Verification submitted. Checking status...`
            );
            
            // Check the verification status after a delay
            setTimeout(async () => {
              await checkVerificationStatus(deployment, guid, apiEndpoint, apiKey);
            }, 15000); // Wait 15 seconds before checking status
            
            return;
          } else {
            // Check if "already verified" message is in the response
            const errorMessage = response.data.result || 'Unknown error';
            
            if (errorMessage.includes('Already Verified') || errorMessage.includes('Contract source code already verified')) {
              // Contract is already verified - treat this as success
              const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
              
              await updateVerificationStatus(
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
              console.log(`Contract not yet indexed on chain ID ${deployment.chain_id}. Will retry after delay.`);
              
              await updateVerificationStatus(
                deployment.id,
                'pending',
                `Contract not yet indexed. Will retry in 30 seconds...`
              );
              
              // Retry after 30 seconds
              setTimeout(() => {
                console.log(`Retrying verification for ${contractAddress} after indexing delay`);
                verifyContract(deployment);
              }, 30000);
              
              return;
            } else {
              // The verification submission failed for a different reason
              throw new Error(`Verification submission failed: ${errorMessage}`);
            }
          }
        } catch (err: any) {
          lastError = err;
          console.log(`Verification attempt failed, retries left: ${retries - 1}`, err);
          
          // Log more detailed error info
          if (err.code) {
            console.log(`Error code: ${err.code}`);
          }
          if (err.response) {
            console.log(`Response status: ${err.response.status}`);
            console.log(`Response data:`, err.response.data);
          }
          
          retries--;
          
          if (retries > 0) {
            // Exponential backoff with longer delays
            const delayMs = Math.pow(2, 5 - retries) * 3000; // 6s, 12s, 24s, 48s backoff
            console.log(`Waiting ${delayMs/1000} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
    } catch (error: any) {
      console.error('Error verifying contract:', error);
      
      // Update circuit breaker on API failures
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
        circuitBreaker.failures += 1;
        circuitBreaker.lastFailure = Date.now();
        
        // Open the circuit after 3 consecutive failures
        if (circuitBreaker.failures >= 3) {
          console.log(`Circuit breaker for chain ${deployment.chain_id} opened after ${circuitBreaker.failures} failures`);
          circuitBreaker.isOpen = true;
        }
      }
      
      // For failed verifications, provide a direct link for manual verification
      const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
      const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
      const errorMessage = error.response?.data?.result || error.message || 'Unknown error';
      
      await updateVerificationStatus(
        deployment.id,
        'failed',
        `Verification failed: ${errorMessage}. Try manually at ${verifyUrl}`
      );
    }
  } catch (error: any) {
    console.error('Error verifying contract:', error);
    
    // For failed verifications, provide a direct link for manual verification
    const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
    const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
    const errorMessage = error.response?.data?.result || error.message || 'Unknown error';
    
    await updateVerificationStatus(
      deployment.id,
      'failed',
      `Verification failed: ${errorMessage}. Try manually at ${verifyUrl}`
    );
  }
}

/**
 * Check the status of a verification request
 */
export async function checkVerificationStatus(
  deployment: ContractDeployment, 
  guid: string, 
  apiEndpoint: string, 
  apiKey: string
): Promise<void> {
  let retries = 5;
  let lastError = null;
  
  while (retries > 0) {
    try {
      console.log(`Checking verification status for GUID: ${guid}, retries left: ${retries}`);
      
      const params = new URLSearchParams();
      params.append('apikey', apiKey);
      params.append('module', 'contract');
      params.append('action', 'checkverifystatus');
      params.append('guid', guid);
      
      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        timeout: 60000 // 60 seconds timeout
      });
      
      console.log('Verification status response:', JSON.stringify(response.data, null, 2));
      
      // First check if response contains "Already Verified" regardless of status code
      if (response.data && response.data.result && 
          (response.data.result.includes('Already Verified') || 
           response.data.result.includes('Contract source code already verified'))) {
        
        // Contract is already verified - treat this as success
        const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
        
        // Update the verification status with immediate write
        await updateVerificationStatus(
          deployment.id,
          'verified',
          `Contract is verified. View at: ${explorerUrl}`
        );
        
        console.log(`Contract ${deployment.contract_address} recognized as already verified.`);
        return;
      } else if (response.data && response.data.status === '1') {
        // Verification successful
        const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
        
        // Update the verification status with immediate write
        await updateVerificationStatus(
          deployment.id,
          'verified',
          `Contract successfully verified. View at: ${explorerUrl}`
        );
        
        console.log(`Contract ${deployment.contract_address} verified successfully.`);
        return;
      } else if (response.data && response.data.result === 'Pending in queue') {
        // Still pending, check again after delay
        console.log(`Verification ${guid} still pending, will check again in 10 seconds...`);
        
        // Update status to show current state
        await updateVerificationStatus(
          deployment.id,
          'pending',
          `Verification in progress (${guid})`
        );
        
        // Check again after 10 seconds
        setTimeout(() => {
          checkVerificationStatus(deployment, guid, apiEndpoint, apiKey);
        }, 10000);
        
        return;
      } else {
        // Verification failed
        const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
        const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
        const errorMessage = response.data?.result || 'Unknown error';
        
        await updateVerificationStatus(
          deployment.id,
          'failed',
          `Verification failed: ${errorMessage}. Try manually at ${verifyUrl}`
        );
        
        return;
      }
    } catch (err: any) {
      lastError = err;
      console.log(`Verification status check failed, retries left: ${retries - 1}`, err);
      
      // Log more detailed error info
      if (err.code) {
        console.log(`Error code: ${err.code}`);
      }
      if (err.response) {
        console.log(`Response status: ${err.response.status}`);
        console.log(`Response data:`, err.response.data);
      }
      
      retries--;
      
      if (retries > 0) {
        // Exponential backoff with longer delays
        const delayMs = Math.pow(2, 5 - retries) * 3000; // 6s, 12s, 24s, 48s backoff
        console.log(`Waiting ${delayMs/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        // All retries failed, mark as failed
        const explorerUrl = ethersUtils.getAddressExplorerUrl(deployment.contract_address, deployment.chain_id);
        const verifyUrl = `${explorerUrl.replace('#code', '')}/contract-verification`;
        const errorMessage = err.message || 'Connection error';
        
        await updateVerificationStatus(
          deployment.id,
          'failed',
          `Verification status check failed: ${errorMessage}. Try manually at ${verifyUrl}`
        );
      }
    }
  }
} 