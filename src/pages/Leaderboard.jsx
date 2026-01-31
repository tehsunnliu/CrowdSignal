import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users,
  Loader2,
  Search
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { motion } from 'framer-motion';
import LeaderboardRow from '../components/leaderboard/LeaderboardRow';
import { useWallet } from '../components/wallet/WalletContext';

export default function Leaderboard() {
  const { walletAddress } = useWallet();
  const [sortBy, setSortBy] = useState('total');
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['leaderboard', sortBy],
    queryFn: async () => {
      const sortField = sortBy === 'total' ? '-regular_points' : 
                       sortBy === 'predictions' ? '-correct_predictions' :
                       sortBy === 'referrals' ? '-total_referrals' : '-builder_points';
      return await base44.entities.UserProfile.list(sortField, 100);
    }
  });

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.wallet_address?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  // Sort users for ranking
  const rankedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'total') {
      return ((b.regular_points || 0) + (b.builder_points || 0)) - 
             ((a.regular_points || 0) + (a.builder_points || 0));
    }
    if (sortBy === 'predictions') {
      return (b.correct_predictions || 0) - (a.correct_predictions || 0);
    }
    if (sortBy === 'referrals') {
      return (b.total_referrals || 0) - (a.total_referrals || 0);
    }
    return (b.builder_points || 0) - (a.builder_points || 0);
  });

  // Find current user's rank
  const currentUserRank = rankedUsers.findIndex(u => u.wallet_address === walletAddress) + 1;
  const currentUserData = rankedUsers.find(u => u.wallet_address === walletAddress);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-slate-400">
            Top predictors competing for rewards
          </p>
        </div>

        {/* Current User Rank Card */}
        {currentUserData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl font-bold text-white">
                  #{currentUserRank}
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Rank</p>
                  <p className="text-xl font-bold text-white">
                    {currentUserData.username || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Points</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {((currentUserData.regular_points || 0) + (currentUserData.builder_points || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by wallet or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
          
          <Tabs value={sortBy} onValueChange={setSortBy}>
            <TabsList className="bg-slate-900/50 border border-slate-800">
              <TabsTrigger value="total" className="data-[state=active]:bg-slate-800">
                <Trophy className="w-4 h-4 mr-1.5" />
                Points
              </TabsTrigger>
              <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-800">
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Predictions
              </TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-slate-800">
                <Users className="w-4 h-4 mr-1.5" />
                Referrals
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Top 3 Podium */}
        {!search && rankedUsers.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {/* Second Place */}
            <div className="col-span-1 mt-8">
              <div className="bg-slate-900/50 border border-slate-400/30 rounded-2xl p-4 text-center">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xl font-bold text-slate-800">
                    {rankedUsers[1]?.wallet_address?.slice(2, 4).toUpperCase()}
                  </div>
                  <Medal className="absolute -bottom-1 -right-1 w-6 h-6 text-slate-300" />
                </div>
                <p className="font-semibold text-white truncate text-sm">
                  {rankedUsers[1]?.username || `${rankedUsers[1]?.wallet_address?.slice(0, 4)}...`}
                </p>
                <p className="text-lg font-bold text-slate-300">
                  {((rankedUsers[1]?.regular_points || 0) + (rankedUsers[1]?.builder_points || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">points</p>
              </div>
            </div>

            {/* First Place */}
            <div className="col-span-1">
              <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 rounded-2xl p-4 text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-black">
                    {rankedUsers[0]?.wallet_address?.slice(2, 4).toUpperCase()}
                  </div>
                  <Trophy className="absolute -bottom-1 -right-1 w-7 h-7 text-yellow-400" />
                </div>
                <p className="font-semibold text-white truncate">
                  {rankedUsers[0]?.username || `${rankedUsers[0]?.wallet_address?.slice(0, 4)}...`}
                </p>
                <p className="text-xl font-bold text-yellow-400">
                  {((rankedUsers[0]?.regular_points || 0) + (rankedUsers[0]?.builder_points || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">points</p>
              </div>
            </div>

            {/* Third Place */}
            <div className="col-span-1 mt-12">
              <div className="bg-slate-900/50 border border-amber-600/30 rounded-2xl p-4 text-center">
                <div className="relative w-14 h-14 mx-auto mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold text-white">
                    {rankedUsers[2]?.wallet_address?.slice(2, 4).toUpperCase()}
                  </div>
                  <Medal className="absolute -bottom-1 -right-1 w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-white truncate text-sm">
                  {rankedUsers[2]?.username || `${rankedUsers[2]?.wallet_address?.slice(0, 4)}...`}
                </p>
                <p className="text-lg font-bold text-amber-500">
                  {((rankedUsers[2]?.regular_points || 0) + (rankedUsers[2]?.builder_points || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">points</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {rankedUsers.slice(search ? 0 : 3).map((user, i) => (
              <LeaderboardRow
                key={user.id}
                user={user}
                rank={search ? i + 1 : i + 4}
                index={i}
                isCurrentUser={user.wallet_address === walletAddress}
              />
            ))}
            {rankedUsers.length === 0 && (
              <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}