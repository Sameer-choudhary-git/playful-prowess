import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Trophy, Users, Coins, Calendar, 
  Clock, ChevronRight, Gamepad2
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  gameType: 'chess' | 'poker' | 'blackjack';
  prizePool: number;
  entryFee: number;
  participants: number;
  maxParticipants: number;
  startTime: Date;
  status: 'upcoming' | 'ongoing' | 'finished';
  bracket?: TournamentBracket;
}

interface TournamentBracket {
  rounds: BracketRound[];
}

interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

interface BracketMatch {
  id: string;
  player1?: { name: string; avatar: string; score?: number };
  player2?: { name: string; avatar: string; score?: number };
  winner?: string;
  status: 'upcoming' | 'ongoing' | 'finished';
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Chess Grand Prix',
    gameType: 'chess',
    prizePool: 5000,
    entryFee: 50,
    participants: 12,
    maxParticipants: 16,
    startTime: new Date(Date.now() + 3600000),
    status: 'upcoming',
  },
  {
    id: '2',
    name: 'Poker Championship',
    gameType: 'poker',
    prizePool: 10000,
    entryFee: 100,
    participants: 24,
    maxParticipants: 32,
    startTime: new Date(Date.now() + 7200000),
    status: 'upcoming',
  },
  {
    id: '3',
    name: 'Blackjack Blitz',
    gameType: 'blackjack',
    prizePool: 2500,
    entryFee: 25,
    participants: 8,
    maxParticipants: 8,
    startTime: new Date(),
    status: 'ongoing',
    bracket: {
      rounds: [
        {
          name: 'Quarter Finals',
          matches: [
            { id: 'm1', player1: { name: 'CryptoKing', avatar: '👑', score: 3 }, player2: { name: 'CardShark', avatar: '🦈', score: 1 }, winner: 'CryptoKing', status: 'finished' },
            { id: 'm2', player1: { name: 'PokerFace', avatar: '🃏', score: 2 }, player2: { name: 'LuckyDraw', avatar: '🍀', score: 3 }, winner: 'LuckyDraw', status: 'finished' },
            { id: 'm3', player1: { name: 'AceHigh', avatar: '🎴', score: 3 }, player2: { name: 'BluffMaster', avatar: '😎', score: 0 }, winner: 'AceHigh', status: 'finished' },
            { id: 'm4', player1: { name: 'ChipLeader', avatar: '🎰' }, player2: { name: 'AllIn', avatar: '💰' }, status: 'ongoing' },
          ],
        },
        {
          name: 'Semi Finals',
          matches: [
            { id: 'm5', player1: { name: 'CryptoKing', avatar: '👑' }, player2: { name: 'LuckyDraw', avatar: '🍀' }, status: 'upcoming' },
            { id: 'm6', player1: { name: 'AceHigh', avatar: '🎴' }, status: 'upcoming' },
          ],
        },
        {
          name: 'Final',
          matches: [
            { id: 'm7', status: 'upcoming' },
          ],
        },
      ],
    },
  },
];

const Tournaments = () => {
  const navigate = useNavigate();
  const { currentUser } = useGameStore();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'finished'>('all');

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const filteredTournaments = mockTournaments.filter(t => 
    filter === 'all' || t.status === filter
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
            <h1 className="font-display text-2xl font-bold">Tournaments</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {selectedTournament ? (
          <TournamentDetail 
            tournament={selectedTournament} 
            onBack={() => setSelectedTournament(null)} 
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-6">
              {(['all', 'upcoming', 'ongoing', 'finished'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Tournament Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <motion.div
                  key={tournament.id}
                  className="gaming-card p-6 cursor-pointer group"
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">
                      {tournament.gameType === 'chess' ? '♟️' : 
                       tournament.gameType === 'poker' ? '🃏' : '🎰'}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'upcoming' ? 'bg-primary/20 text-primary' :
                      tournament.status === 'ongoing' ? 'bg-success/20 text-success' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {tournament.status}
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Prize Pool
                      </span>
                      <span className="font-medium gradient-text-gold">${tournament.prizePool}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        Entry Fee
                      </span>
                      <span className="font-medium">{tournament.entryFee} tokens</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Players
                      </span>
                      <span className="font-medium">{tournament.participants}/{tournament.maxParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Start
                      </span>
                      <span className="font-medium">{formatDate(tournament.startTime)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {tournament.maxParticipants - tournament.participants} spots left
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTournaments.length === 0 && (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-2">No Tournaments</h3>
                <p className="text-muted-foreground">
                  Check back later for upcoming tournaments
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

interface TournamentDetailProps {
  tournament: Tournament;
  onBack: () => void;
}

const TournamentDetail = ({ tournament, onBack }: TournamentDetailProps) => {
  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Tournaments
      </Button>

      <div className="gaming-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">
                {tournament.gameType === 'chess' ? '♟️' : 
                 tournament.gameType === 'poker' ? '🃏' : '🎰'}
              </span>
              <h2 className="font-display text-3xl font-bold">{tournament.name}</h2>
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              tournament.status === 'upcoming' ? 'bg-primary/20 text-primary' :
              tournament.status === 'ongoing' ? 'bg-success/20 text-success' :
              'bg-muted text-muted-foreground'
            }`}>
              {tournament.status.toUpperCase()}
            </div>
          </div>

          {tournament.status === 'upcoming' && (
            <Button variant="hero" size="lg">
              Join Tournament
            </Button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
            <div className="font-display text-2xl font-bold gradient-text-gold">${tournament.prizePool}</div>
            <div className="text-sm text-muted-foreground">Prize Pool</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Coins className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="font-display text-2xl font-bold">{tournament.entryFee}</div>
            <div className="text-sm text-muted-foreground">Entry Fee</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="font-display text-2xl font-bold">{tournament.participants}/{tournament.maxParticipants}</div>
            <div className="text-sm text-muted-foreground">Players</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Clock className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="font-display text-2xl font-bold capitalize">{tournament.gameType}</div>
            <div className="text-sm text-muted-foreground">Game Type</div>
          </div>
        </div>
      </div>

      {/* Bracket */}
      {tournament.bracket && (
        <div className="gaming-card p-6">
          <h3 className="font-display text-xl font-bold mb-6">Tournament Bracket</h3>
          
          <div className="flex gap-8 overflow-x-auto pb-4">
            {tournament.bracket.rounds.map((round, roundIndex) => (
              <div key={round.name} className="min-w-[250px]">
                <h4 className="font-display text-lg font-bold mb-4 text-center text-muted-foreground">
                  {round.name}
                </h4>
                <div className="space-y-4">
                  {round.matches.map((match) => (
                    <motion.div
                      key={match.id}
                      className={`p-4 rounded-lg border ${
                        match.status === 'ongoing' ? 'border-primary bg-primary/10' :
                        match.status === 'finished' ? 'border-border bg-muted/30' :
                        'border-border/50 bg-card'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Player 1 */}
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner === match.player1?.name ? 'bg-success/20' : ''
                      }`}>
                        {match.player1 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span>{match.player1.avatar}</span>
                              <span className="font-medium">{match.player1.name}</span>
                            </div>
                            {match.player1.score !== undefined && (
                              <span className="font-display font-bold">{match.player1.score}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground py-1">VS</div>
                      
                      {/* Player 2 */}
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner === match.player2?.name ? 'bg-success/20' : ''
                      }`}>
                        {match.player2 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span>{match.player2.avatar}</span>
                              <span className="font-medium">{match.player2.name}</span>
                            </div>
                            {match.player2.score !== undefined && (
                              <span className="font-display font-bold">{match.player2.score}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
