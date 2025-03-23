import { useState } from 'react';

export interface DeployedContract {
  deployment_id: string;
  address: string;
  network: string;
  [key: string]: any;
}

export function useDeployContract() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deployedContract, setDeployedContract] = useState<DeployedContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployContract = async (formData: any) => {
    try {
      setStatus('loading');
      
      // Deployment logic
      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Contract deployed successfully:', data);
        
        // Automatically schedule delayed verification
        try {
          console.log('Scheduling delayed verification...');
          const verifyResponse = await fetch('/api/contracts/verify-delayed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
            body: JSON.stringify({
              deployment_id: data.deployment_id,
            }),
          });
  
          if (verifyResponse.ok) {
            console.log('Verification scheduled successfully');
          } else {
            console.warn('Failed to schedule verification:', await verifyResponse.text());
          }
        } catch (verifyError) {
          console.error('Error scheduling verification:', verifyError);
          // Continue with deployment success even if verification scheduling fails
        }
        
        // Update state for successful deployment
        setDeployedContract(data);
        setStatus('success');
        return data;
      } else {
        const errorText = await response.text();
        setError(errorText);
        setStatus('error');
        throw new Error(errorText);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during deployment');
      setStatus('error');
      throw err;
    }
  };

  return {
    deployContract,
    status,
    deployedContract,
    error,
  };
}

export default useDeployContract;