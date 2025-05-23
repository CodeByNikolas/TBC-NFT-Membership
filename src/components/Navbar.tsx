'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Settings from './Settings';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contract-creation', label: 'Contract Creation' },
    { href: '/deployments', label: 'Deployments' },
    { href: '/nft-editing', label: 'NFT Editing' },
  ];

  const SettingsIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 text-xl font-bold text-gray-800">
                TBC NFT
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map(link => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`inline-flex items-center px-1 pt-1 text-gray-700 hover:text-gray-900 ${
                      pathname === link.href ? 'font-bold border-b-2 border-blue-500' : ''
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="flex items-center">
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <appkit-button />
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="ml-4 p-2 text-gray-700 hover:text-gray-900"
                >
                  <SettingsIcon />
                </button>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 text-gray-700 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${
                  pathname === link.href ? 'font-bold border-l-4 border-blue-500' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pl-3 pr-4 py-2 flex items-center space-x-2">
              <appkit-button />
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-700 hover:text-gray-900"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}