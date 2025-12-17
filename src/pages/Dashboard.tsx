import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/wallet';
import { 
  Gamepad2, Users, Trophy, Wallet, Bell, 
  Settings, LogOut, ChevronRight, Clock, 
  Swords, Coins
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    walletAddress, 
    balance,
    friends,
    recentMatches,
    notifications,
    lobbies,
    setCurrentUser,
    setWalletAddress
  } = useGameStore();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    setCurrentUser(null);
    setWalletAddress(null);
    navigate('/');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <span className="font-display text-lg font-bold">Gaming Hub</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: Gamepad2, label: 'Dashboard', path: '/dashboard', active: true },
            { icon: Swords, label: 'Lobbies', path: '/lobbies' },
            { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
            { icon: Users, label: 'Friends', path: '/friends' },
            { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
          ].map((item) => (
            <Button
              key={item.label}
              variant={item.active ? 'gaming' : 'ghost'}
              className="w-full justify-start"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome back, <span className="gradient-text-primary">{currentUser.username}</span>
            </h1>
            <p className="text-muted-foreground">Ready to play?</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {/* Wallet */}
            <div className="gaming-card px-4 py-2 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{shortenAddress(walletAddress || '')}</div>
                <div className="text-xs text-muted-foreground">{balance.toFixed(4)} ETH</div>
              </div>
            </div>

            {/* Profile */}
            <div className="gaming-card px-4 py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                {currentUser.avatar}
              </div>
              <div>
                <div className="text-sm font-medium">{currentUser.username}</div>
                <div className="text-xs text-muted-foreground">ELO: {currentUser.rating}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-6 mb-8">
          {[
            { 
              title: 'Quick Match', 
              description: 'Find an opponent now',
              icon: Swords,
              color: 'primary',
              action: () => navigate('/lobbies')
            },
            { 
              title: 'Create Lobby', 
              description: 'Host your own game',
              icon: Users,
              color: 'secondary',
              action: () => navigate('/lobbies?create=true')
            },
            { 
              title: 'Tournaments', 
              description: 'Compete for prizes',
              icon: Trophy,
              color: 'gold',
              action: () => navigate('/tournaments')
            },
          ].map((action) => (
            <motion.div
              key={action.title}
              className="gaming-card p-6 cursor-pointer group"
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={action.action}
            >
              <action.icon className={`w-10 h-10 text-${action.color} mb-4`} />
              <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-muted-foreground text-sm">{action.description}</p>
              <ChevronRight className="w-5 h-5 text-muted-foreground mt-4 group-hover:text-primary group-hover:translate-x-2 transition-all" />
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-3 gap-6">
          {/* Active Games */}
          <div className="col-span-2">
            <h2 className="font-display text-xl font-bold mb-4">Active Lobbies</h2>
            <div className="space-y-3">
              {lobbies.slice(0, 4).map((lobby) => (
                <motion.div
                  key={lobby.id}
                  className="gaming-card p-4 flex items-center justify-between cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/lobbies/${lobby.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                      {lobby.gameType === 'chess' ? '♟️' : lobby.gameType === 'poker' ? '🃏' : '🎰'}
                    </div>
                    <div>
                      <h4 className="font-medium">{lobby.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lobby.players.length}/{lobby.maxPlayers} players • {lobby.host.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {lobby.entryFee > 0 && (
                      <div className="stat-badge">
                        <Coins className="w-4 h-4 text-gold" />
                        <span>{lobby.entryFee}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/lobbies')}>
              View All Lobbies
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Friends Online */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Friends Online</h2>
            <div className="gaming-card p-4 space-y-4">
              {friends.filter(f => f.isOnline).slice(0, 5).map((friend) => (
                <div key={friend.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        {friend.avatar}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{friend.username}</div>
                      <div className="text-xs text-muted-foreground">ELO: {friend.rating}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Swords className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {friends.filter(f => f.isOnline).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No friends online
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold mb-4">Recent Matches</h2>
          <div className="gaming-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Game</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Opponent</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Result</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Prize</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((match) => {
                  const opponent = match.players.find(p => p.id !== currentUser.id);
                  const isWinner = match.winner?.id === currentUser.id;
                  
                  return (
                    <tr key={match.id} className="border-t border-border">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {match.gameType === 'chess' ? '♟️' : match.gameType === 'poker' ? '🃏' : '🎰'}
                          </span>
                          <span className="capitalize">{match.gameType}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{opponent?.avatar}</span>
                          <span>{opponent?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isWinner ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {isWinner ? 'Victory' : 'Defeat'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={isWinner ? 'text-success' : 'text-destructive'}>
                          {isWinner ? '+' : '-'}{match.prizePool}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(match.endedAt!).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
