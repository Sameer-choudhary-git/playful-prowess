import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, Lobby, GameType } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Plus, Users, Coins, Lock, 
  Search, Filter, Clock, Gamepad2
} from 'lucide-react';

const Lobbies = () => {
  const navigate = useNavigate();
  const { currentUser, lobbies, addLobby, joinLobby, setActiveLobby } = useGameStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState<GameType | 'all'>('all');

  // Check URL params for create modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const filteredLobbies = lobbies.filter((lobby) => {
    const matchesSearch = lobby.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lobby.host.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = filterGame === 'all' || lobby.gameType === filterGame;
    return matchesSearch && matchesGame;
  });

  const handleJoinLobby = (lobby: Lobby) => {
    if (lobby.players.length >= lobby.maxPlayers) return;
    joinLobby(lobby.id);
    setActiveLobby(lobby);
    
    // Navigate to game
    if (lobby.gameType === 'chess') {
      navigate('/games/chess');
    } else if (lobby.gameType === 'poker') {
      navigate('/games/poker');
    } else {
      navigate('/games/blackjack');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="font-display text-2xl font-bold">Game Lobbies</h1>
          </div>
          
          <Button variant="hero" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Lobby
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search lobbies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'chess', 'poker', 'blackjack'] as const).map((game) => (
              <Button
                key={game}
                variant={filterGame === game ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterGame(game)}
              >
                {game === 'all' ? 'All Games' : game.charAt(0).toUpperCase() + game.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Lobby Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLobbies.map((lobby) => (
            <motion.div
              key={lobby.id}
              className="gaming-card p-5"
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                    {lobby.gameType === 'chess' ? '♟️' : lobby.gameType === 'poker' ? '🃏' : '🎰'}
                  </div>
                  <div>
                    <h3 className="font-display font-bold flex items-center gap-2">
                      {lobby.name}
                      {lobby.isPrivate && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{lobby.gameType}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  lobby.status === 'waiting' ? 'bg-success/20 text-success' :
                  lobby.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {lobby.status === 'waiting' ? 'Open' : lobby.status === 'in_progress' ? 'In Progress' : 'Finished'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Players
                  </span>
                  <span className="font-medium">{lobby.players.length}/{lobby.maxPlayers}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    Entry Fee
                  </span>
                  <span className="font-medium">
                    {lobby.entryFee > 0 ? `${lobby.entryFee} tokens` : 'Free'}
                  </span>
                </div>

                {lobby.timeControl && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Time Control
                    </span>
                    <span className="font-medium">{lobby.timeControl}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Host</span>
                  <span className="font-medium flex items-center gap-1">
                    <span>{lobby.host.avatar}</span>
                    {lobby.host.username}
                  </span>
                </div>
              </div>

              {/* Players in lobby */}
              <div className="flex items-center gap-1 mb-4">
                {lobby.players.map((player) => (
                  <div
                    key={player.id}
                    className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm"
                    title={player.username}
                  >
                    {player.avatar}
                  </div>
                ))}
                {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-sm border border-dashed border-muted-foreground/30"
                  >
                    ?
                  </div>
                ))}
              </div>

              <Button
                variant={lobby.players.length >= lobby.maxPlayers ? 'ghost' : 'default'}
                className="w-full"
                disabled={lobby.players.length >= lobby.maxPlayers || lobby.status !== 'waiting'}
                onClick={() => handleJoinLobby(lobby)}
              >
                {lobby.players.length >= lobby.maxPlayers ? 'Full' : 
                 lobby.status !== 'waiting' ? 'In Progress' : 'Join Lobby'}
              </Button>
            </motion.div>
          ))}

          {filteredLobbies.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">No Lobbies Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterGame !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Be the first to create a lobby!'}
              </p>
              <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Lobby
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Create Lobby Modal */}
      {showCreateModal && (
        <CreateLobbyModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={(lobby) => {
            addLobby(lobby);
            setShowCreateModal(false);
            handleJoinLobby(lobby);
          }}
        />
      )}
    </div>
  );
};

interface CreateLobbyModalProps {
  onClose: () => void;
  onCreate: (lobby: Lobby) => void;
}

const CreateLobbyModal = ({ onClose, onCreate }: CreateLobbyModalProps) => {
  const { currentUser } = useGameStore();
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState<GameType>('chess');
  const [entryFee, setEntryFee] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [timeControl, setTimeControl] = useState('10+0');

  const handleCreate = () => {
    if (!name.trim() || !currentUser) return;

    const newLobby: Lobby = {
      id: `lobby-${Date.now()}`,
      name: name.trim(),
      gameType,
      host: currentUser,
      players: [currentUser],
      maxPlayers: gameType === 'chess' ? 2 : gameType === 'poker' ? 6 : 4,
      entryFee,
      isPrivate,
      status: 'waiting',
      timeControl: gameType === 'chess' ? timeControl : undefined,
      createdAt: new Date(),
    };

    onCreate(newLobby);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="gaming-card p-6 max-w-md w-full mx-4"
      >
        <h2 className="font-display text-2xl font-bold mb-6">Create Lobby</h2>

        <div className="space-y-4">
          {/* Lobby Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Lobby Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Lobby"
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Game Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['chess', 'poker', 'blackjack'] as GameType[]).map((game) => (
                <Button
                  key={game}
                  variant={gameType === game ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGameType(game)}
                >
                  {game === 'chess' ? '♟️' : game === 'poker' ? '🃏' : '🎰'}
                  <span className="ml-1 capitalize">{game}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Time Control (Chess only) */}
          {gameType === 'chess' && (
            <div>
              <label className="block text-sm font-medium mb-2">Time Control</label>
              <div className="grid grid-cols-3 gap-2">
                {['3+0', '5+0', '10+0', '15+10', '30+0'].map((tc) => (
                  <Button
                    key={tc}
                    variant={timeControl === tc ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeControl(tc)}
                  >
                    {tc}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Entry Fee */}
          <div>
            <label className="block text-sm font-medium mb-2">Entry Fee</label>
            <div className="flex gap-2">
              {[0, 10, 25, 50, 100].map((fee) => (
                <Button
                  key={fee}
                  variant={entryFee === fee ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEntryFee(fee)}
                >
                  {fee === 0 ? 'Free' : `${fee}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Private */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Private Lobby</span>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                isPrivate ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              <div
                className={`w-5 h-5 rounded-full bg-foreground transition-transform ${
                  isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="hero" 
            className="flex-1"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create Lobby
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Lobbies;
