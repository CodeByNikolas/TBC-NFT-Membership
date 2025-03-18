'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  ipfsPinataKey: string;
  ipfsPinataSecret: string;
  infuraKey: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  ipfsPinataKey: '',
  ipfsPinataSecret: '',
  infuraKey: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage when available
    if (typeof window !== 'undefined') {
      const savedIpfsPinataKey = localStorage.getItem('ipfsPinataKey') || '';
      const savedIpfsPinataSecret = localStorage.getItem('ipfsPinataSecret') || '';
      const savedInfuraKey = localStorage.getItem('infuraKey') || '';
      
      setSettings({
        ipfsPinataKey: savedIpfsPinataKey,
        ipfsPinataSecret: savedIpfsPinataSecret,
        infuraKey: savedInfuraKey,
      });
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        Object.entries(updated).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 