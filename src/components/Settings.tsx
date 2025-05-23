'use client';

import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [ipfsPinataKey, setIpfsPinataKey] = useState('');
  const [ipfsPinataSecret, setIpfsPinataSecret] = useState('');
  const [infuraKey, setInfuraKey] = useState('');
  
  // Validation states
  const [isPinataValidating, setIsPinataValidating] = useState(false);
  const [isInfuraValidating, setIsInfuraValidating] = useState(false);
  const [pinataStatus, setPinataStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [infuraStatus, setInfuraStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pinataMessage, setPinataMessage] = useState('');
  const [infuraMessage, setInfuraMessage] = useState('');
  
  // Validate Pinata API credentials
  const validatePinataCredentials = useCallback(async (key: string, secret: string) => {
    if (!key || !secret) {
      setPinataStatus('idle');
      setPinataMessage('');
      return;
    }
    
    setIsPinataValidating(true);
    setPinataStatus('idle');
    
    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'pinata_api_key': key,
          'pinata_secret_api_key': secret
        }
      });
      
      if (response.ok) {
        setPinataStatus('success');
        setPinataMessage('Pinata credentials verified!');
      } else {
        setPinataStatus('error');
        setPinataMessage('Invalid Pinata credentials');
      }
    } catch (error) {
      // Explicitly ignore the error but log it in a way ESLint accepts
      console.error('Pinata validation error:', error);
      setPinataStatus('error');
      setPinataMessage('Error validating Pinata credentials');
    } finally {
      setIsPinataValidating(false);
    }
  }, []);
  
  // Validate Infura API key
  const validateInfuraCredentials = useCallback(async (key: string) => {
    if (!key) {
      setInfuraStatus('idle');
      setInfuraMessage('');
      return;
    }
    
    setIsInfuraValidating(true);
    setInfuraStatus('idle');
    
    try {
      const response = await fetch(`https://mainnet.infura.io/v3/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      });
      
      const data = await response.json();
      
      if (response.ok && !data.error) {
        setInfuraStatus('success');
        setInfuraMessage('Infura API key verified!');
      } else {
        setInfuraStatus('error');
        setInfuraMessage('Invalid Infura API key');
      }
    } catch (error) {
      // Explicitly ignore the error but log it in a way ESLint accepts
      console.error('Infura validation error:', error);
      setInfuraStatus('error');
      setInfuraMessage('Error validating Infura API key');
    } finally {
      setIsInfuraValidating(false);
    }
  }, []);
  
  // Load saved settings from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIpfsPinataKey = localStorage.getItem('ipfsPinataKey') || '';
      const savedIpfsPinataSecret = localStorage.getItem('ipfsPinataSecret') || '';
      const savedInfuraKey = localStorage.getItem('infuraKey') || '';
      
      setIpfsPinataKey(savedIpfsPinataKey);
      setIpfsPinataSecret(savedIpfsPinataSecret);
      setInfuraKey(savedInfuraKey);
      
      // Validate existing keys on load
      if (savedIpfsPinataKey && savedIpfsPinataSecret) {
        validatePinataCredentials(savedIpfsPinataKey, savedIpfsPinataSecret);
      }
      
      if (savedInfuraKey) {
        validateInfuraCredentials(savedInfuraKey);
      }
    }
  }, [validatePinataCredentials, validateInfuraCredentials]);
  
  // Create debounced versions of the validation functions
  const debouncedValidatePinata = useCallback((key: string, secret: string) => {
    const handler = debounce(() => {
      validatePinataCredentials(key, secret);
    }, 800);
    
    handler();
    
    return handler;
  }, [validatePinataCredentials]);
  
  const debouncedValidateInfura = useCallback((key: string) => {
    const handler = debounce(() => {
      validateInfuraCredentials(key);
    }, 800);
    
    handler();
    
    return handler;
  }, [validateInfuraCredentials]);
  
  // Handle Pinata input changes
  const handlePinataKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setIpfsPinataKey(newKey);
    
    if (newKey && ipfsPinataSecret) {
      setPinataStatus('idle');
      setPinataMessage('Validating...');
      debouncedValidatePinata(newKey, ipfsPinataSecret);
    } else {
      setPinataStatus('idle');
      setPinataMessage('');
    }
  }, [ipfsPinataSecret, debouncedValidatePinata]);
  
  const handlePinataSecretChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSecret = e.target.value;
    setIpfsPinataSecret(newSecret);
    
    if (ipfsPinataKey && newSecret) {
      setPinataStatus('idle');
      setPinataMessage('Validating...');
      debouncedValidatePinata(ipfsPinataKey, newSecret);
    } else {
      setPinataStatus('idle');
      setPinataMessage('');
    }
  }, [ipfsPinataKey, debouncedValidatePinata]);
  
  // Handle Infura input changes
  const handleInfuraKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setInfuraKey(newKey);
    
    if (newKey) {
      setInfuraStatus('idle');
      setInfuraMessage('Validating...');
      debouncedValidateInfura(newKey);
    } else {
      setInfuraStatus('idle');
      setInfuraMessage('');
    }
  }, [debouncedValidateInfura]);
  
  const handleSave = useCallback(() => {
    // Save valid configurations only
    if (ipfsPinataKey && ipfsPinataSecret) {
      if (pinataStatus === 'success' || pinataStatus === 'idle') {
        localStorage.setItem('ipfsPinataKey', ipfsPinataKey);
        localStorage.setItem('ipfsPinataSecret', ipfsPinataSecret);
      }
    } else {
      // Clear values if empty
      localStorage.removeItem('ipfsPinataKey');
      localStorage.removeItem('ipfsPinataSecret');
    }
    
    if (infuraKey) {
      if (infuraStatus === 'success' || infuraStatus === 'idle') {
        localStorage.setItem('infuraKey', infuraKey);
      }
    } else {
      // Clear value if empty
      localStorage.removeItem('infuraKey');
    }
    
    onClose();
  }, [ipfsPinataKey, ipfsPinataSecret, infuraKey, pinataStatus, infuraStatus, onClose]);
  
  const getStatusColor = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-gray-100 px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-medium text-gray-900">IPFS Pinata</h4>
                <a
                  href="https://docs.pinata.cloud/reference/pinning-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Documentation
                </a>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm text-blue-700 rounded">
                <p>
                  <span className="font-semibold">How to get keys:</span> Sign up at{' '}
                  <a 
                    href="https://app.pinata.cloud/register" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium underline hover:text-blue-800"
                  >
                    Pinata Cloud
                  </a>
                  {' '}and create an API key in the{' '}
                  <a 
                    href="https://app.pinata.cloud/developers/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium underline hover:text-blue-800"
                  >
                    API Keys section
                  </a>. 
                  The free tier should be enough.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="ipfsPinataKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    id="ipfsPinataKey"
                    value={ipfsPinataKey}
                    onChange={handlePinataKeyChange}
                    className={`w-full px-3 py-2 border ${
                      pinataStatus === 'error' ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter Pinata API Key"
                  />
                </div>
                <div>
                  <label htmlFor="ipfsPinataSecret" className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    id="ipfsPinataSecret"
                    value={ipfsPinataSecret}
                    onChange={handlePinataSecretChange}
                    className={`w-full px-3 py-2 border ${
                      pinataStatus === 'error' ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter Pinata API Secret"
                  />
                </div>
                {pinataMessage && (
                  <div className="flex items-center">
                    {isPinataValidating ? (
                      <svg className="animate-spin h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      pinataStatus === 'success' && (
                        <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    )}
                    <p className={`text-sm ${getStatusColor(pinataStatus)}`}>{pinataMessage}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-medium text-gray-900">RPC Provider (Infura)</h4>
                <a
                  href="https://docs.infura.io/api/networks/ethereum/json-rpc-methods"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Documentation
                </a>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm text-blue-700 rounded">
                <p>
                  <span className="font-semibold">Optional:</span> If no Infura API key is provided, the application will use your wallet's RPC provider directly.
                  <br/><br/>
                  To use Infura, create an account at{' '}
                  <a 
                    href="https://app.infura.io/register" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium underline hover:text-blue-800"
                  >
                    Infura
                  </a>
                  {' '}and create a new API key in the{' '}
                  <a 
                    href="https://app.infura.io/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium underline hover:text-blue-800"
                  >
                    Dashboard
                  </a>.
                </p>
              </div>
              <div>
                <label htmlFor="infuraKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  id="infuraKey"
                  value={infuraKey}
                  onChange={handleInfuraKeyChange}
                  className={`w-full px-3 py-2 border ${
                    infuraStatus === 'error' ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter Infura API Key (or leave empty to use wallet RPC)"
                />
                {infuraMessage && (
                  <div className="flex items-center mt-2">
                    {isInfuraValidating ? (
                      <svg className="animate-spin h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      infuraStatus === 'success' && (
                        <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    )}
                    <p className={`text-sm ${getStatusColor(infuraStatus)}`}>{infuraMessage}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 