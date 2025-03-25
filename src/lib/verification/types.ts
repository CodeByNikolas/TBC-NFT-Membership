// Contract deployment type definition
export interface ContractDeployment {
  id: string;
  chain_id: number;
  contract_address: string;
  name?: string;
  symbol?: string;
  deployer_address?: string;
  base_uri?: string;
  constructor_args?: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_message?: string;
  verification_timestamp?: string;
  created_at?: string;
  deployment_timestamp?: string;
  bypass_delay?: boolean;
}

// Circuit breaker interface
export interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  resetTimeout: number;
}

export interface VerificationService {
  start(): Promise<void>;
  stop(): void;
  verifyContract(deployment: ContractDeployment): Promise<void>;
  verifyDeploymentById(deploymentId: string): Promise<void>;
  scheduleVerification(deploymentId: string, delaySeconds?: number): Promise<void>;
} 