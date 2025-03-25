import { supabaseAdmin } from '../supabaseUtils';
import { ContractDeployment, CircuitBreaker, VerificationService } from './types';
import { verifyContract } from './utils/verificationUtils';
import { updateVerificationStatus } from './utils/verificationUtils';

export class ContractVerificationService implements VerificationService {
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

    const deployment = pending[0] as ContractDeployment;
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
    
    console.log(`Found deployment ${deploymentId} for ${deployment.contract_address} on ${deployment.chain_id}`);
    
    // Set status to pending to indicate verification is starting
    await updateVerificationStatus(
      deploymentId,
      'pending',
      'Manual verification started'
    );
    
    // Create a modified deployment object with a flag to bypass the delay
    const deploymentWithoutDelay: ContractDeployment = {
      ...deployment as ContractDeployment,
      bypass_delay: true // Special flag to bypass delay for manual verifications
    };
    
    // Attempt to verify the contract without delay
    await this.verifyContract(deploymentWithoutDelay);
  }

  // Delegate to the utility function
  public async verifyContract(deployment: ContractDeployment): Promise<void> {
    return verifyContract(deployment);
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
    await updateVerificationStatus(
      deploymentId,
      'pending',
      `Verification scheduled in ${delaySeconds} seconds to allow for indexing`
    );
    
    // Schedule verification after the delay
    setTimeout(() => {
      console.log(`Executing scheduled verification for deployment ${deploymentId}`);
      this.verifyContract(deployment as ContractDeployment)
        .catch(err => console.error(`Error in scheduled verification for deployment ${deploymentId}:`, err));
    }, delaySeconds * 1000);
    
    return;
  }
} 