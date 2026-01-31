import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Gift, Share2, Twitter, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";

export default function ReferralCard({ userProfile }) {
  const [copied, setCopied] = useState(false);
  
  const referralCode = userProfile?.referral_code || '';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const tierRewards = [
    { tier: 1, percentage: 10, label: 'Direct Referrals' },
    { tier: 2, percentage: 5, label: 'Tier 2' },
    { tier: 3, percentage: 2, label: 'Tier 3' }
  ];

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Join me on CESS Predict and earn rewards for your predictions! 🎯\n\nUse my referral link:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/20 border-slate-800 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Invite & Earn</h3>
            <p className="text-sm text-slate-400">Earn builder points from referrals</p>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{userProfile?.total_referrals || 0}</p>
            <p className="text-xs text-slate-400">Valid Referrals</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <Gift className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{(userProfile?.builder_points || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400">Builder Points</p>
          </div>
        </div>

        {/* Tier Rewards */}
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-3">Reward Structure</p>
          <div className="flex gap-2">
            {tierRewards.map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700"
              >
                <p className="text-lg font-bold text-purple-400">{tier.percentage}%</p>
                <p className="text-xs text-slate-500">{tier.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Your Referral Link</p>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={shareOnTwitter}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-400"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          Referrals become valid after completing 10 predictions
        </p>
      </div>
    </Card>
  );
}