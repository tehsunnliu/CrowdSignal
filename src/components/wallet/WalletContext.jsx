import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const address = accounts[0].toLowerCase();
          setWalletAddress(address);
          await loadUserProfile(address);
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (address) => {
    try {
      const profiles = await base44.entities.UserProfile.filter({ wallet_address: address });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      } else {
        // Create new profile
        const newProfile = await base44.entities.UserProfile.create({
          wallet_address: address,
          referral_code: generateReferralCode(address),
          wallet_created_at: new Date().toISOString()
        });
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const generateReferralCode = (address) => {
    return `CESS${address.slice(2, 8).toUpperCase()}`;
  };

  const connectWallet = async (walletType = 'metamask') => {
    setIsConnecting(true);
    setError(null);

    try {
      if (walletType === 'metamask') {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask is not installed. Please install it to continue.');
        }

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
          const address = accounts[0].toLowerCase();
          
          // Sign message for verification
          const message = `Sign this message to authenticate with CESS Predict.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address]
          });

          setWalletAddress(address);
          await loadUserProfile(address);

          // Log activity
          await base44.entities.ActivityLog.create({
            wallet_address: address,
            action: 'login',
            metadata: { wallet_type: walletType }
          });

          return { address, signature };
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setUserProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (walletAddress) {
      await loadUserProfile(walletAddress);
    }
  }, [walletAddress]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          const address = accounts[0].toLowerCase();
          setWalletAddress(address);
          loadUserProfile(address);
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [disconnectWallet]);

  const value = {
    walletAddress,
    userProfile,
    isConnecting,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    refreshProfile,
    isConnected: !!walletAddress
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;