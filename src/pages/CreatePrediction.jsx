import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ImagePlus, 
  Link as LinkIcon,
  Clock,
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";
import { useWallet } from '../components/wallet/WalletContext';
import ConnectWalletModal from '../components/wallet/ConnectWalletModal';
import { format, addDays } from 'date-fns';

const categories = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'technology', label: 'Technology' },
  { value: 'community', label: 'Community' }
];

export default function CreatePrediction() {
  const { walletAddress, userProfile, isConnected, refreshProfile } = useWallet();
  const navigate = useNavigate();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    cover_image: '',
    options: [
      { id: '1', text: '', vote_count: 0 },
      { id: '2', text: '', vote_count: 0 }
    ],
    correct_option_id: '',
    points_reward: 100,
    end_time: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    settlement_time: format(addDays(new Date(), 8), "yyyy-MM-dd'T'HH:mm"),
    reference_links: ['']
  });

  const isQualified = userProfile?.is_qualified_creator || 
    (userProfile?.total_predictions >= 10 && userProfile?.level >= 1);

  const createMutation = useMutation({
    mutationFn: async () => {
      const predictionData = {
        ...form,
        creator_wallet: walletAddress,
        status: 'pending_review',
        total_participants: 0,
        options: form.options.filter(o => o.text.trim()),
        reference_links: form.reference_links.filter(l => l.trim())
      };

      await base44.entities.Prediction.create(predictionData);

      // Update user predictions created count
      await base44.entities.UserProfile.update(userProfile.id, {
        predictions_created: (userProfile.predictions_created || 0) + 1
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        wallet_address: walletAddress,
        action: 'prediction_create',
        metadata: { title: form.title }
      });
    },
    onSuccess: () => {
      toast.success('Prediction submitted for review!');
      refreshProfile();
      navigate(createPageUrl('Predictions'));
    },
    onError: (error) => {
      toast.error('Failed to create prediction');
      console.error(error);
    }
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    if (form.options.length >= 5) return;
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { id: String(prev.options.length + 1), text: '', vote_count: 0 }]
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index, text) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, text } : opt)
    }));
  };

  const addReferenceLink = () => {
    setForm(prev => ({
      ...prev,
      reference_links: [...prev.reference_links, '']
    }));
  };

  const updateReferenceLink = (index, value) => {
    setForm(prev => ({
      ...prev,
      reference_links: prev.reference_links.map((link, i) => i === index ? value : link)
    }));
  };

  const removeReferenceLink = (index) => {
    setForm(prev => ({
      ...prev,
      reference_links: prev.reference_links.filter((_, i) => i !== index)
    }));
  };

  const isValid = () => {
    return (
      form.title.trim() &&
      form.title.length <= 54 &&
      form.category &&
      form.options.filter(o => o.text.trim()).length >= 2 &&
      form.end_time &&
      form.points_reward >= 10
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connect Wallet</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to create predictions</p>
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

  if (!isQualified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Not Qualified Yet</h2>
          <p className="text-slate-400 mb-6">
            To create predictions, you need to:
          </p>
          <ul className="text-left text-slate-300 mb-6 space-y-2">
            <li className="flex items-center gap-2">
              {userProfile?.total_predictions >= 10 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
              )}
              Complete at least 10 predictions ({userProfile?.total_predictions || 0}/10)
            </li>
            <li className="flex items-center gap-2">
              {userProfile?.level >= 1 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
              )}
              Reach Level 1 (Current: Level {userProfile?.level || 0})
            </li>
          </ul>
          <Link to={createPageUrl('Predictions')}>
            <Button variant="outline" className="border-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Predictions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to={createPageUrl('Predictions')}>
          <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Predictions
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Prediction</h1>
          <p className="text-slate-400">
            Submit your prediction for community review
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <div className="space-y-6">
              {/* Title */}
              <div>
                <Label className="text-white mb-2 block">
                  Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="What will happen?"
                  maxLength={54}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {form.title.length}/54 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Provide context and details..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-white mb-2 block">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-800">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cover Image */}
              <div>
                <Label className="text-white mb-2 block">Cover Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.cover_image}
                    onChange={(e) => updateForm('cover_image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button type="button" variant="outline" className="border-slate-700 px-3">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div>
                <Label className="text-white mb-2 block">
                  Options <span className="text-red-400">*</span>
                  <span className="text-slate-500 text-xs ml-2">(2-5 options)</span>
                </Label>
                <div className="space-y-3">
                  <AnimatePresence>
                    {form.options.map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2"
                      >
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        {form.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {form.options.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="border-slate-700 border-dashed w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>

              {/* End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">
                    <Clock className="w-4 h-4 inline mr-1" />
                    End Time <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => updateForm('end_time', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">
                    <Trophy className="w-4 h-4 inline mr-1" />
                    Points Reward
                  </Label>
                  <Input
                    type="number"
                    value={form.points_reward}
                    onChange={(e) => updateForm('points_reward', parseInt(e.target.value) || 0)}
                    min={10}
                    max={1000}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Reference Links */}
              <div>
                <Label className="text-white mb-2 block">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Reference Links
                </Label>
                <div className="space-y-2">
                  {form.reference_links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link}
                        onChange={(e) => updateReferenceLink(index, e.target.value)}
                        placeholder="https://..."
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      {form.reference_links.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReferenceLink(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addReferenceLink}
                    className="text-slate-400 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-slate-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid() || createMutation.isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {createMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Submit for Review
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <Card className="bg-slate-900/50 border-emerald-500/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" />
                  Preview
                </h3>
                {form.cover_image && (
                  <img 
                    src={form.cover_image} 
                    alt="Cover" 
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                <h4 className="text-xl font-bold text-white mb-2">{form.title || 'Untitled Prediction'}</h4>
                <p className="text-slate-400 mb-4">{form.description || 'No description'}</p>
                <div className="space-y-2">
                  {form.options.filter(o => o.text.trim()).map((option, i) => (
                    <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white">
                      {option.text}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}