'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  
  // Create local state for form inputs
  const [formSettings, setFormSettings] = useState({
    ipfsPinataKey: settings.ipfsPinataKey,
    ipfsPinataSecret: settings.ipfsPinataSecret,
    infuraKey: settings.infuraKey
  });
  
  // Update local form state when settings change
  useEffect(() => {
    setFormSettings({
      ipfsPinataKey: settings.ipfsPinataKey,
      ipfsPinataSecret: settings.ipfsPinataSecret,
      infuraKey: settings.infuraKey
    });
  }, [settings]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormSettings({
      ...formSettings,
      [id]: value
    });
  };
  
  const handleSave = () => {
    // Save settings using context
    updateSettings(formSettings);
    onClose();
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
              <h4 className="text-base font-medium text-gray-900 mb-2">IPFS Pinata</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="ipfsPinataKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    id="ipfsPinataKey"
                    value={formSettings.ipfsPinataKey}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    value={formSettings.ipfsPinataSecret}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Pinata API Secret"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-2">RPC Infura</h4>
              <div>
                <label htmlFor="infuraKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  id="infuraKey"
                  value={formSettings.infuraKey}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Infura API Key"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 