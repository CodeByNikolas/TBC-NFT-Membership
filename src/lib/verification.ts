// Re-export types from the types file
export * from './verification/types';

// Import the ContractVerificationService class
import { ContractVerificationService } from './verification/ContractVerificationService';

// Create a singleton instance of the verification service
export const verificationService = new ContractVerificationService();