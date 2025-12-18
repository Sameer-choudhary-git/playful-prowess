import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { connectWallet, isMetaMaskInstalled, shortenAddress, getBalance } from '@/lib/wallet';
import { Gamepad2, Users, Trophy, Wallet, Zap, Shield, ArrowRight, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    currentUser, 
    walletAddress, 
    playersOnline, 
    activeGames, 
    totalPrizePool,
    setWalletAddress,
    setCurrentUser,
    setBalance
  } = useGameStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState('');

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to connect your wallet.',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        const balance = await getBalance(address);
        setBalance(parseFloat(balance));
        
        // Check if user exists (in real app, this would be an API call)
        const existingUser = localStorage.getItem(`user_${address}`);
        if (existingUser) {
          setCurrentUser(JSON.parse(existingUser));
          navigate('/dashboard');
        } else {
          setShowUsernameModal(true);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateUser = () => {
    if (username.length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    const newUser = {
      id: walletAddress!,
      username,
      avatar: '🎮',
      rating: 1500,
      isReady: false,
      isOnline: true,
    };

    localStorage.setItem(`user_${walletAddress}`, JSON.stringify(newUser));
    setCurrentUser(newUser);
    setShowUsernameModal(false);
    navigate('/dashboard');
    
    toast({
      title: 'Welcome!',
      description: `Your account has been created, ${username}!`,
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Floating orbs */}
      <motion.div
        className="fixed top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="fixed bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Gamepad2 className="w-10 h-10 text-primary" />
          <span className="font-display text-2xl font-bold text-glow-primary">
            Social Gaming Hub
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {walletAddress ? (
            <div className="flex items-center gap-3">
              <div className="stat-badge">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{shortenAddress(walletAddress)}</span>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="gradient-text-primary">Play</span>
              <br />
              <span className="text-foreground">Win</span>
              <br />
              <span className="gradient-text-gold">Earn</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              The ultimate multiplayer gaming platform. Compete in Chess, Poker, and Blackjack 
              against players worldwide. Win tournaments and earn real rewards.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button 
                variant="hero" 
                size="xl"
                onClick={walletAddress ? () => navigate('/dashboard') : handleConnectWallet}
              >
                <Zap className="w-5 h-5" />
                {walletAddress ? 'Enter Hub' : 'Play Now'}
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <Button variant="outline" size="xl" onClick={() => navigate('/tournaments')}>
                <Trophy className="w-5 h-5" />
                Tournaments
              </Button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div 
                className="gaming-card p-4 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-display text-2xl font-bold text-glow-primary">
                  {playersOnline.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Players Online</div>
              </motion.div>

              <motion.div 
                className="gaming-card p-4 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Gamepad2 className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="font-display text-2xl font-bold text-glow-success">
                  {activeGames}
                </div>
                <div className="text-sm text-muted-foreground">Active Games</div>
              </motion.div>

              <motion.div 
                className="gaming-card p-4 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <Trophy className="w-6 h-6 text-gold mx-auto mb-2" />
                <div className="font-display text-2xl font-bold gradient-text-gold">
                  ${totalPrizePool.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Prize Pool</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Game Preview Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="gaming-card p-6 col-span-2"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl mb-4">♟️</div>
                <h3 className="font-display text-xl font-bold mb-2">Chess</h3>
                <p className="text-muted-foreground text-sm">
                  Classic strategy game with ranked matchmaking and tournaments
                </p>
              </motion.div>

              <motion.div 
                className="gaming-card p-6"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl mb-4">🃏</div>
                <h3 className="font-display text-xl font-bold mb-2">Poker</h3>
                <p className="text-muted-foreground text-sm">
                  Texas Hold'em with real-time betting
                </p>
              </motion.div>

              <motion.div 
                className="gaming-card p-6"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl mb-4">🎰</div>
                <h3 className="font-display text-xl font-bold mb-2">Blackjack</h3>
                <p className="text-muted-foreground text-sm">
                  Beat the dealer in 21
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 bg-card/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="font-display text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Choose <span className="gradient-text-primary">Social Gaming Hub</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure & Fair',
                description: 'Built on Base blockchain with verified smart contracts ensuring fair gameplay',
              },
              {
                icon: Zap,
                title: 'Instant Matches',
                description: 'Real-time matchmaking finds opponents at your skill level in seconds',
              },
              {
                icon: Trophy,
                title: 'Win Rewards',
                description: 'Compete in tournaments and climb leaderboards to earn tokens',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="gaming-card p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="gaming-card p-8 max-w-md w-full mx-4"
          >
            <h2 className="font-display text-2xl font-bold mb-4">Create Your Profile</h2>
            <p className="text-muted-foreground mb-6">
              Choose a username to start playing
            </p>
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              maxLength={20}
            />
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={() => {
                  setShowUsernameModal(false);
                  setWalletAddress(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={handleCreateUser}
              >
                Create Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Landing;
