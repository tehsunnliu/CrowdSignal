import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, ChevronDown, Copy, LogOut, User, Trophy, Check } from 'lucide-react';
import { useWallet } from './WalletContext';
import ConnectWalletModal from './ConnectWalletModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WalletButton() {
  const { walletAddress, userProfile, isConnected, disconnectWallet, isLoading } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Button variant="outline" className="border-slate-700 bg-slate-800/50" disabled>
        <div className="w-4 h-4 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
        <ConnectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  const totalPoints = (userProfile?.regular_points || 0) + (userProfile?.builder_points || 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {walletAddress?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <span className="hidden sm:inline">{formatAddress(walletAddress)}</span>
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{totalPoints.toLocaleString()}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-white">
        <div className="p-3 border-b border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Connected Wallet</p>
          <p className="font-mono text-sm">{formatAddress(walletAddress)}</p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-xs text-slate-400">Regular Points</p>
              <p className="font-bold text-emerald-400">{(userProfile?.regular_points || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Builder Points</p>
              <p className="font-bold text-teal-400">{(userProfile?.builder_points || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800">
          <Link to={createPageUrl('Profile')} className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer hover:bg-slate-800">
          {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-red-400 hover:bg-slate-800 hover:text-red-400">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}