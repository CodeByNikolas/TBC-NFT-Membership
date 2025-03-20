// Add to the existing deployContract function, after the successful deployment

// After the deployment is successful and we get the response:
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
}

// Rest of the function continues as before