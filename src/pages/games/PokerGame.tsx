import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Deck, Card, evaluatePokerHand, POKER_HAND_NAMES,
  SUIT_SYMBOLS, SUIT_COLORS
} from '@/engines/cardEngine';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, RefreshCw, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type GamePhase = 'betting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';
type PlayerAction = 'fold' | 'check' | 'call' | 'raise';

interface PokerPlayer {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  hand: Card[];
  bet: number;
  folded: boolean;
  isDealer: boolean;
  isCurrentTurn: boolean;
}

const PokerGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, balance, setBalance } = useGameStore();

  const [deck, setDeck] = useState<Deck>(() => new Deck());
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<PokerPlayer[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [winner, setWinner] = useState<PokerPlayer | null>(null);
  const [winningHand, setWinningHand] = useState<string>('');
  const [raiseAmount, setRaiseAmount] = useState(20);

  const SMALL_BLIND = 5;
  const BIG_BLIND = 10;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Initialize players
  const initializePlayers = useCallback(() => {
    const initialPlayers: PokerPlayer[] = [
      {
        id: currentUser?.id || '1',
        name: currentUser?.username || 'You',
        avatar: currentUser?.avatar || '🎮',
        chips: 500,
        hand: [],
        bet: 0,
        folded: false,
        isDealer: false,
        isCurrentTurn: false,
      },
      {
        id: 'ai1',
        name: 'PokerBot 1',
        avatar: '🤖',
        chips: 500,
        hand: [],
        bet: 0,
        folded: false,
        isDealer: false,
        isCurrentTurn: false,
      },
      {
        id: 'ai2',
        name: 'PokerBot 2',
        avatar: '🎰',
        chips: 500,
        hand: [],
        bet: 0,
        folded: false,
        isDealer: true,
        isCurrentTurn: false,
      },
    ];
    setPlayers(initialPlayers);
  }, [currentUser]);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  const startNewRound = () => {
    const newDeck = new Deck();
    setDeck(newDeck);
    setCommunityCards([]);
    setPot(0);
    setCurrentBet(BIG_BLIND);
    setPhase('preflop');
    setWinner(null);
    setWinningHand('');

    // Deal cards to players
    const updatedPlayers = players.map((player, index) => {
      const hand = newDeck.drawMultiple(2, player.id === currentUser?.id);
      // AI cards are face down until showdown
      if (player.id !== currentUser?.id) {
        hand.forEach(card => card.faceUp = false);
      }
      
      // Post blinds
      let bet = 0;
      if (index === 1) bet = SMALL_BLIND; // Small blind
      if (index === 2) bet = BIG_BLIND; // Big blind

      return {
        ...player,
        hand,
        bet,
        folded: false,
        isCurrentTurn: index === 0, // Player starts
      };
    });

    setPot(SMALL_BLIND + BIG_BLIND);
    setPlayers(updatedPlayers);
  };

  const handlePlayerAction = (action: PlayerAction) => {
    const playerIndex = players.findIndex(p => p.id === currentUser?.id);
    if (playerIndex === -1) return;

    let newPlayers = [...players];
    const player = newPlayers[playerIndex];

    switch (action) {
      case 'fold':
        player.folded = true;
        toast({ title: 'You folded', variant: 'destructive' });
        checkForWinByFold(newPlayers);
        break;

      case 'check':
        if (currentBet > player.bet) {
          toast({ title: 'Cannot check', description: 'You must call or raise', variant: 'destructive' });
          return;
        }
        break;

      case 'call':
        const callAmount = currentBet - player.bet;
        if (callAmount > player.chips) {
          toast({ title: 'Not enough chips', variant: 'destructive' });
          return;
        }
        player.chips -= callAmount;
        player.bet = currentBet;
        setPot(prev => prev + callAmount);
        break;

      case 'raise':
        const totalRaise = currentBet - player.bet + raiseAmount;
        if (totalRaise > player.chips) {
          toast({ title: 'Not enough chips', variant: 'destructive' });
          return;
        }
        player.chips -= totalRaise;
        player.bet = currentBet + raiseAmount;
        setPot(prev => prev + totalRaise);
        setCurrentBet(player.bet);
        break;
    }

    player.isCurrentTurn = false;
    newPlayers[playerIndex] = player;
    setPlayers(newPlayers);

    if (!player.folded) {
      // AI turns
      setTimeout(() => aiTurn(newPlayers), 500);
    }
  };

  const aiTurn = (currentPlayers: PokerPlayer[]) => {
    let newPlayers = [...currentPlayers];
    
    for (let i = 1; i < newPlayers.length; i++) {
      const ai = newPlayers[i];
      if (ai.folded) continue;

      // Simple AI logic
      const random = Math.random();
      const callAmount = currentBet - ai.bet;

      if (random < 0.1 && currentBet > 0) {
        // Fold 10% of the time
        ai.folded = true;
      } else if (callAmount === 0 || random < 0.7) {
        // Call/Check 70% of the time
        if (callAmount > 0 && callAmount <= ai.chips) {
          ai.chips -= callAmount;
          ai.bet = currentBet;
          setPot(prev => prev + callAmount);
        }
      } else if (random < 0.9) {
        // Raise 20% of the time
        const raiseAmt = Math.min(20, ai.chips - callAmount);
        if (raiseAmt > 0) {
          const total = callAmount + raiseAmt;
          ai.chips -= total;
          ai.bet = currentBet + raiseAmt;
          setPot(prev => prev + total);
          setCurrentBet(ai.bet);
        }
      }
    }

    setPlayers(newPlayers);

    // Check if round should progress
    const activePlayers = newPlayers.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      endRound(activePlayers[0], newPlayers);
      return;
    }

    // Progress to next phase
    setTimeout(() => progressPhase(newPlayers), 500);
  };

  const progressPhase = (currentPlayers: PokerPlayer[]) => {
    switch (phase) {
      case 'preflop':
        // Deal flop
        setCommunityCards(deck.drawMultiple(3, true));
        setPhase('flop');
        resetBets(currentPlayers);
        break;

      case 'flop':
        // Deal turn
        setCommunityCards(prev => [...prev, deck.draw(true)!]);
        setPhase('turn');
        resetBets(currentPlayers);
        break;

      case 'turn':
        // Deal river
        setCommunityCards(prev => [...prev, deck.draw(true)!]);
        setPhase('river');
        resetBets(currentPlayers);
        break;

      case 'river':
        setPhase('showdown');
        determineWinner(currentPlayers);
        break;
    }
  };

  const resetBets = (currentPlayers: PokerPlayer[]) => {
    const newPlayers = currentPlayers.map(p => ({ ...p, bet: 0, isCurrentTurn: p.id === currentUser?.id && !p.folded }));
    setPlayers(newPlayers);
    setCurrentBet(0);
  };

  const checkForWinByFold = (currentPlayers: PokerPlayer[]) => {
    const activePlayers = currentPlayers.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      endRound(activePlayers[0], currentPlayers);
    }
  };

  const determineWinner = (currentPlayers: PokerPlayer[]) => {
    const activePlayers = currentPlayers.filter(p => !p.folded);
    
    // Reveal all hands
    const newPlayers = currentPlayers.map(p => ({
      ...p,
      hand: p.hand.map(c => ({ ...c, faceUp: true }))
    }));
    setPlayers(newPlayers);

    let bestPlayer: PokerPlayer | null = null;
    let bestHandResult = { value: 0, rank: 'high_card' as any, cards: [], highCards: [] as any };

    activePlayers.forEach(player => {
      const allCards = [...player.hand, ...communityCards];
      const handResult = evaluatePokerHand(allCards);
      
      if (!bestPlayer || handResult.value > bestHandResult.value) {
        bestPlayer = player;
        bestHandResult = handResult;
      }
    });

    if (bestPlayer) {
      setWinningHand(POKER_HAND_NAMES[bestHandResult.rank]);
      setTimeout(() => endRound(bestPlayer!, newPlayers), 1000);
    }
  };

  const endRound = (winningPlayer: PokerPlayer, currentPlayers: PokerPlayer[]) => {
    setWinner(winningPlayer);
    setPhase('finished');

    const newPlayers = currentPlayers.map(p => {
      if (p.id === winningPlayer.id) {
        return { ...p, chips: p.chips + pot };
      }
      return p;
    });
    setPlayers(newPlayers);

    if (winningPlayer.id === currentUser?.id) {
      setBalance(balance + pot);
      toast({
        title: 'You Win!',
        description: `Won ${pot} chips with ${winningHand || 'last player standing'}!`,
      });
    } else {
      toast({
        title: `${winningPlayer.name} Wins!`,
        description: `Won ${pot} chips`,
        variant: 'destructive',
      });
    }
  };

  const humanPlayer = players.find(p => p.id === currentUser?.id);
  const canCheck = currentBet === (humanPlayer?.bet || 0);
  const isPlayerTurn = humanPlayer?.isCurrentTurn && !humanPlayer?.folded && phase !== 'showdown' && phase !== 'finished' && phase !== 'betting';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <h1 className="font-display text-2xl font-bold">Texas Hold'em</h1>
          
          <div className="flex items-center gap-3">
            <div className="stat-badge">
              <Users className="w-4 h-4" />
              <span>{players.filter(p => !p.folded).length} active</span>
            </div>
            <div className="stat-badge">
              <Coins className="w-4 h-4 text-gold" />
              <span>Pot: {pot}</span>
            </div>
          </div>
        </header>

        <div className="gaming-card p-8">
          {/* Poker Table */}
          <div className="relative min-h-[400px] bg-gradient-to-b from-green-900 to-green-800 rounded-[100px] border-8 border-amber-900 shadow-inner">
            {/* Community Cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex gap-2 mb-4">
                <AnimatePresence>
                  {communityCards.map((card, index) => (
                    <PokerCard key={index} card={card} delay={index * 0.2} />
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-16 h-22 rounded-lg border-2 border-dashed border-white/20" />
                  ))}
                </AnimatePresence>
              </div>
              <div className="text-center font-display text-2xl text-gold">
                POT: {pot}
              </div>
            </div>

            {/* Players */}
            {players.map((player, index) => {
              const positions = [
                'bottom-4 left-1/2 -translate-x-1/2', // Player
                'top-1/2 left-8 -translate-y-1/2', // AI 1
                'top-4 left-1/2 -translate-x-1/2', // AI 2 (Dealer)
              ];
              
              return (
                <div 
                  key={player.id}
                  className={`absolute ${positions[index]}`}
                >
                  <div className={`text-center ${player.folded ? 'opacity-50' : ''}`}>
                    {/* Cards */}
                    <div className="flex gap-1 justify-center mb-2">
                      {player.hand.map((card, cardIndex) => (
                        <PokerCard 
                          key={cardIndex} 
                          card={card} 
                          small={index !== 0}
                        />
                      ))}
                    </div>
                    
                    {/* Player info */}
                    <div className={`px-4 py-2 rounded-full ${
                      player.isCurrentTurn ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{player.avatar}</span>
                        <div className="text-left">
                          <div className="text-sm font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.chips} chips</div>
                        </div>
                        {player.isDealer && (
                          <span className="ml-2 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                            D
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Current bet */}
                    {player.bet > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-gold/20 text-gold text-sm"
                      >
                        <Coins className="w-3 h-3" />
                        {player.bet}
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Winner display */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/95 p-8 rounded-xl text-center"
              >
                <div className="text-4xl mb-2">{winner.avatar}</div>
                <h3 className="font-display text-2xl font-bold gradient-text-gold">{winner.name} Wins!</h3>
                {winningHand && <p className="text-muted-foreground">{winningHand}</p>}
                <p className="text-success text-xl mt-2">+{pot} chips</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Controls */}
          <div className="mt-8">
            {phase === 'betting' && (
              <div className="text-center">
                <Button variant="hero" size="lg" onClick={startNewRound}>
                  Start Round
                </Button>
              </div>
            )}

            {isPlayerTurn && (
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="destructive" size="lg" onClick={() => handlePlayerAction('fold')}>
                  Fold
                </Button>
                {canCheck ? (
                  <Button variant="secondary" size="lg" onClick={() => handlePlayerAction('check')}>
                    Check
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" onClick={() => handlePlayerAction('call')}>
                    Call {currentBet - (humanPlayer?.bet || 0)}
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="default" size="lg" onClick={() => handlePlayerAction('raise')}>
                    Raise {raiseAmount}
                  </Button>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            )}

            {phase === 'finished' && (
              <div className="text-center">
                <Button variant="hero" size="lg" onClick={startNewRound}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  New Round
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PokerCardProps {
  card: Card;
  delay?: number;
  small?: boolean;
}

const PokerCard = ({ card, delay = 0, small = false }: PokerCardProps) => {
  const sizeClass = small ? 'w-12 h-16' : 'w-16 h-22';
  const textSize = small ? 'text-xs' : 'text-sm';
  const suitSize = small ? 'text-lg' : 'text-2xl';

  if (!card.faceUp) {
    return (
      <motion.div
        initial={{ opacity: 0, rotateY: 180 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ delay }}
        className={`${sizeClass} rounded-lg bg-gradient-to-br from-blue-900 to-blue-700 shadow-lg border border-blue-500/50`}
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.03) 5px, rgba(255,255,255,0.03) 10px)',
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 180 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay }}
      className={`${sizeClass} rounded-lg bg-white shadow-lg flex flex-col items-center justify-center`}
    >
      <div className={`${textSize} font-bold ${SUIT_COLORS[card.suit]}`}>
        {card.rank}
      </div>
      <div className={`${suitSize} ${SUIT_COLORS[card.suit]}`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
    </motion.div>
  );
};

export default PokerGame;
