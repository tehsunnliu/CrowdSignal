import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, AlertCircle, ExternalLink } from 'lucide-react';
import { useWallet } from './WalletContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectWalletModal({ isOpen, onClose, referralCode }) {
  const { connectWallet, isConnecting, error } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState(null);

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan QR code with mobile wallet',
      disabled: true,
      comingSoon: true
    }
  ];

  const handleConnect = async (walletType) => {
    setSelectedWallet(walletType);
    try {
      await connectWallet(walletType);
      onClose();
    } catch (err) {
      // Error is handled in context
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Connect your wallet to start making predictions and earning points
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <AnimatePresence>
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-auto p-4 flex items-center justify-between border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50 transition-all ${
                    wallet.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } ${selectedWallet === wallet.id ? 'border-emerald-500 bg-slate-800/50' : ''}`}
                  onClick={() => !wallet.disabled && handleConnect(wallet.id)}
                  disabled={isConnecting || wallet.disabled}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-white flex items-center gap-2">
                        {wallet.name}
                        {wallet.comingSoon && (
                          <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-400">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{wallet.description}</div>
                    </div>
                  </div>
                  {isConnecting && selectedWallet === wallet.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  )}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {referralCode && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-400">
              🎁 You were referred! Connect to receive bonus points.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}