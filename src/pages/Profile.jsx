import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Trophy, 
  Target, 
  Flame, 
  Users, 
  History,
  Edit2,
  Save,
  X,
  Loader2,
  TrendingUp,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from "sonner";
import StatsCard from '../components/stats/StatsCard';
import ReferralCard from '../components/referral/ReferralCard';
import { useWallet } from '../components/wallet/WalletContext';
import ConnectWalletModal from '../components/wallet/ConnectWalletModal';

export default function Profile() {
  const { walletAddress, userProfile, isConnected, refreshProfile } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || '');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['user-entries', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return await base44.entities.PredictionEntry.filter(
        { wallet_address: walletAddress },
        '-created_date',
        50
      );
    },
    enabled: !!walletAddress
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions-for-entries'],
    queryFn: async () => {
      if (entries.length === 0) return [];
      const ids = entries.map(e => e.prediction_id);
      return await base44.entities.Prediction.filter({ id: { $in: ids } });
    },
    enabled: entries.length > 0
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return await base44.entities.PointsTransaction.filter(
        { wallet_address: walletAddress },
        '-created_date',
        50
      );
    },
    enabled: !!walletAddress
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return await base44.entities.Referral.filter({ referrer_wallet: walletAddress });
    },
    enabled: !!walletAddress
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserProfile.update(userProfile.id, {
        username: username.trim()
      });
    },
    onSuccess: () => {
      toast.success('Profile updated');
      setIsEditing(false);
      refreshProfile();
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const getPrediction = (predictionId) => {
    return predictions.find(p => p.id === predictionId);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connect Wallet</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to view your profile</p>
          <Button
            onClick={() => setShowWalletModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            Connect Wallet
          </Button>
          <ConnectWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
        </div>
      </div>
    );
  }

  const accuracy = userProfile?.total_predictions > 0
    ? ((userProfile.correct_predictions / userProfile.total_predictions) * 100).toFixed(1)
    : 0;

  const stats = [
    {
      title: 'Total Points',
      value: (userProfile?.regular_points || 0) + (userProfile?.builder_points || 0),
      icon: Trophy,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Predictions Made',
      value: userProfile?.total_predictions || 0,
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Win Rate',
      value: `${accuracy}%`,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Check-in Streak',
      value: userProfile?.check_in_streak || 0,
      subtitle: 'days',
      icon: Flame,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/20 border-slate-800 p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl font-bold text-white">
                  {walletAddress?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="bg-slate-800 border-slate-700 text-white w-48"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={updateProfileMutation.isLoading}
                      >
                        {updateProfileMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 text-emerald-400" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setUsername(userProfile?.username || '');
                        }}
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-white">
                        {userProfile?.username || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
                      </h1>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-slate-400 font-mono mt-1">
                    {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                      Level {userProfile?.level || 1}
                    </span>
                    {userProfile?.is_qualified_creator && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        Creator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {(userProfile?.regular_points || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Regular Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-400">
                    {(userProfile?.builder_points || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Builder Points</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatsCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Activity */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="predictions" className="w-full">
              <TabsList className="bg-slate-900/50 border border-slate-800 w-full justify-start mb-6">
                <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-800">
                  <Target className="w-4 h-4 mr-1.5" />
                  Predictions
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-slate-800">
                  <History className="w-4 h-4 mr-1.5" />
                  Points History
                </TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-slate-800">
                  <Users className="w-4 h-4 mr-1.5" />
                  Referrals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="predictions">
                {loadingEntries ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : entries.length > 0 ? (
                  <div className="space-y-3">
                    {entries.map((entry, i) => {
                      const prediction = getPrediction(entry.prediction_id);
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card className="bg-slate-900/50 border-slate-800 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                  {prediction?.title || 'Unknown Prediction'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Submitted {format(new Date(entry.submitted_at || entry.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {entry.is_correct !== undefined && (
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    entry.is_correct 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {entry.is_correct ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        +{entry.points_earned || prediction?.points_reward || 0}
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3 h-3" />
                                        Wrong
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No predictions yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Card className="bg-slate-900/50 border-slate-800 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">{tx.description || tx.transaction_type}</p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(tx.created_date), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                    <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No transactions yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="referrals">
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((ref, i) => (
                      <motion.div
                        key={ref.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-white">
                                {ref.referee_wallet?.slice(2, 4).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-mono text-sm text-white">
                                  {ref.referee_wallet?.slice(0, 6)}...{ref.referee_wallet?.slice(-4)}
                                </p>
                                <p className="text-xs text-slate-400">Tier {ref.referral_tier}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${ref.is_valid ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {ref.is_valid ? 'Active' : 'Pending'}
                              </p>
                              <p className="text-xs text-slate-400">
                                +{ref.total_points_earned || 0} pts
                              </p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No referrals yet</p>
                    <p className="text-sm text-slate-500 mt-1">Share your referral link to earn builder points</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Referral */}
          <div className="lg:col-span-1">
            <ReferralCard userProfile={userProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}