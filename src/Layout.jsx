import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Target, 
  Gift, 
  Trophy, 
  User, 
  Menu, 
  X, 
  Plus,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletProvider, useWallet } from './components/wallet/WalletContext';
import WalletButton from './components/wallet/WalletButton';
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { name: 'Home', icon: Home, path: 'Home' },
  { name: 'Predictions', icon: Target, path: 'Predictions' },
  { name: 'Tasks', icon: Gift, path: 'Tasks' },
  { name: 'Leaderboard', icon: Trophy, path: 'Leaderboard' },
];

function LayoutContent({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { userProfile, isConnected } = useWallet();
  const location = useLocation();

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'moderator';
  const isQualified = userProfile?.is_qualified_creator || 
    (userProfile?.total_predictions >= 10 && userProfile?.level >= 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 142.1 76.2% 36.3%;
          --primary-foreground: 355.7 100% 97.3%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 142.1 76.2% 36.3%;
        }
        body {
          background-color: hsl(222.2 84% 4.9%);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white hidden sm:block">
                CESS<span className="text-emerald-400">Predict</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                  >
                    <Button
                      variant="ghost"
                      className={`${
                        isActive 
                          ? 'text-emerald-400 bg-emerald-500/10' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to={createPageUrl('Admin')}>
                  <Button
                    variant="ghost"
                    className={`${
                      location.pathname.includes('Admin')
                        ? 'text-purple-400 bg-purple-500/10' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {isConnected && isQualified && (
                <Link to={createPageUrl('CreatePrediction')} className="hidden sm:block">
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                </Link>
              )}
              
              <WalletButton />

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname.includes(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive 
                            ? 'text-emerald-400 bg-emerald-500/10' 
                            : 'text-slate-400'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
                {isConnected && (
                  <Link
                    to={createPageUrl('Profile')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start text-slate-400">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to={createPageUrl('Admin')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start text-purple-400">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                {isConnected && isQualified && (
                  <Link
                    to={createPageUrl('CreatePrediction')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Prediction
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">
                  CESS<span className="text-emerald-400">Predict</span>
                </span>
              </div>
              <p className="text-sm text-slate-400">
                The decentralized prediction platform powered by CESS Network.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to={createPageUrl('Predictions')} className="hover:text-white">Predictions</Link></li>
                <li><Link to={createPageUrl('Tasks')} className="hover:text-white">Earn Points</Link></li>
                <li><Link to={createPageUrl('Leaderboard')} className="hover:text-white">Leaderboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">Telegram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2024 CESSPredict. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <WalletProvider>
      <LayoutContent>{children}</LayoutContent>
    </WalletProvider>
  );
}