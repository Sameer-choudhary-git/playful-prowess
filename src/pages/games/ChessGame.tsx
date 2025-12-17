import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ChessEngine, ChessGameState, TimeControl, TIME_CONTROLS, formatTime, getPieceSymbol } from '@/engines/chessEngine';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/lib/mockWebSocket';
import { 
  ArrowLeft, Flag, RotateCcw, Clock, 
  MessageSquare, Eye, Users, Trophy
} from 'lucide-react';
import { Square, Color } from 'chess.js';
import { useToast } from '@/hooks/use-toast';

const BOARD_SIZE = 8;
const SQUARES = Array.from({ length: BOARD_SIZE }, (_, row) =>
  Array.from({ length: BOARD_SIZE }, (_, col) => {
    const file = String.fromCharCode(97 + col);
    const rank = String(8 - row);
    return `${file}${rank}` as Square;
  })
).flat();

interface ChessGameProps {
  isSpectator?: boolean;
  timeControl?: TimeControl;
  opponent?: { id: string; username: string; avatar: string };
}

const ChessGame = ({ isSpectator = false, timeControl = '10+0' }: ChessGameProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useGameStore();
  const ws = useWebSocket();

  const [engine] = useState(() => new ChessEngine(timeControl));
  const [gameState, setGameState] = useState<ChessGameState>(() => engine.getState());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);
  const [timer, setTimer] = useState({ white: TIME_CONTROLS[timeControl].initial, black: TIME_CONTROLS[timeControl].initial, activePlayer: null as Color | null });
  const [playerColor] = useState<Color>('w');
  const [gameStarted, setGameStarted] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);

  // Mock opponent for single-player
  const opponent = { id: 'ai', username: 'AI Opponent', avatar: '🤖', rating: 1600 };

  // Initialize game
  useEffect(() => {
    const handleTimerUpdate = (newTimer: typeof timer) => {
      setTimer(newTimer);
    };

    const handleTimeOut = (loser: Color) => {
      toast({
        title: loser === playerColor ? 'You lost on time!' : 'Opponent lost on time!',
        description: loser === playerColor ? 'Better luck next time' : 'You win!',
        variant: loser === playerColor ? 'destructive' : 'default',
      });
    };

    if (gameStarted && !isSpectator) {
      engine.startTimer(handleTimerUpdate, handleTimeOut);
    }

    return () => {
      engine.stopTimer();
    };
  }, [gameStarted, isSpectator, engine, playerColor, toast]);

  // Update game state after moves
  const updateState = useCallback(() => {
    const state = engine.getState();
    setGameState(state);

    if (state.isCheckmate) {
      toast({
        title: state.turn === playerColor ? 'Checkmate! You lose.' : 'Checkmate! You win!',
        description: state.turn === playerColor ? 'Better luck next time' : 'Congratulations!',
      });
      engine.stopTimer();
    } else if (state.isStalemate || state.isDraw) {
      toast({
        title: 'Draw!',
        description: state.isStalemate ? 'Stalemate' : 'Game drawn',
      });
      engine.stopTimer();
    } else if (state.isCheck) {
      toast({
        title: 'Check!',
        description: state.turn === playerColor ? 'Your king is in check' : 'Opponent is in check',
      });
    }
  }, [engine, playerColor, toast]);

  // Handle square click
  const handleSquareClick = (square: Square) => {
    if (isSpectator || gameState.isGameOver) return;
    if (gameState.turn !== playerColor) return;

    const piece = engine.getPiece(square);

    // If we have a selected piece, try to move
    if (selectedSquare) {
      if (highlightedSquares.includes(square)) {
        const move = engine.makeMove(selectedSquare, square);
        if (move) {
          updateState();
          setSelectedSquare(null);
          setHighlightedSquares([]);

          // Simulate AI opponent move
          if (!gameState.isGameOver) {
            setTimeout(() => {
              makeAIMove();
            }, 500);
          }
          return;
        }
      }
      setSelectedSquare(null);
      setHighlightedSquares([]);
    }

    // Select a piece
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const legalMoves = engine.getLegalMovesFrom(square);
      setHighlightedSquares(legalMoves);
    }
  };

  // Simple AI move
  const makeAIMove = useCallback(() => {
    const state = engine.getState();
    if (state.isGameOver || state.turn === playerColor) return;

    // Get all legal moves
    const allMoves: { from: Square; to: Square }[] = [];
    state.legalMoves.forEach((toSquares, fromSquare) => {
      toSquares.forEach((to) => {
        allMoves.push({ from: fromSquare, to });
      });
    });

    if (allMoves.length > 0) {
      // Random move (simple AI)
      const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      engine.makeMove(randomMove.from, randomMove.to);
      updateState();
    }
  }, [engine, playerColor, updateState]);

  const handleResign = () => {
    toast({
      title: 'You resigned',
      description: 'Better luck next time!',
      variant: 'destructive',
    });
    engine.stopTimer();
    setShowResignModal(false);
    // In real app, emit to websocket
  };

  const handleOfferDraw = () => {
    toast({
      title: 'Draw offered',
      description: 'Waiting for opponent response...',
    });
    setShowDrawModal(false);
    // In real app, emit to websocket
  };

  const startGame = () => {
    setGameStarted(true);
    toast({
      title: 'Game Started!',
      description: 'White moves first. Good luck!',
    });
  };

  const getSquareColor = (square: Square): string => {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]) - 1;
    const isLight = (file + rank) % 2 === 1;
    
    if (selectedSquare === square) {
      return 'bg-primary/60';
    }
    if (highlightedSquares.includes(square)) {
      return isLight ? 'bg-success/40' : 'bg-success/50';
    }
    if (gameState.lastMove && (gameState.lastMove.from === square || gameState.lastMove.to === square)) {
      return isLight ? 'bg-warning/30' : 'bg-warning/40';
    }
    return isLight ? 'bg-slate-300' : 'bg-slate-600';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <h1 className="font-display text-2xl font-bold">Chess Match</h1>
          
          <div className="flex items-center gap-2">
            {isSpectator && (
              <div className="stat-badge">
                <Eye className="w-4 h-4" />
                <span>Spectating</span>
              </div>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Chess Board */}
          <div className="gaming-card p-6">
            {/* Opponent Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl">
                  {opponent.avatar}
                </div>
                <div>
                  <div className="font-medium">{opponent.username}</div>
                  <div className="text-sm text-muted-foreground">ELO: {opponent.rating}</div>
                </div>
              </div>
              <div className={`font-display text-2xl px-4 py-2 rounded-lg ${
                gameState.turn === 'b' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Clock className="w-5 h-5 inline mr-2" />
                {formatTime(timer.black)}
              </div>
            </div>

            {/* Board */}
            <div className="aspect-square w-full max-w-[600px] mx-auto">
              <div className="grid grid-cols-8 gap-0 border-2 border-border rounded-lg overflow-hidden">
                {SQUARES.map((square) => {
                  const piece = engine.getPiece(square);
                  const isKingInCheck = gameState.isCheck && piece?.type === 'k' && piece.color === gameState.turn;
                  
                  return (
                    <motion.div
                      key={square}
                      className={`aspect-square flex items-center justify-center cursor-pointer relative ${getSquareColor(square)} ${
                        isKingInCheck ? 'ring-2 ring-inset ring-destructive' : ''
                      }`}
                      onClick={() => handleSquareClick(square)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {piece && (
                        <span className={`text-3xl md:text-5xl select-none ${
                          piece.color === 'w' ? 'text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-slate-900'
                        }`}>
                          {getPieceSymbol(piece)}
                        </span>
                      )}
                      
                      {/* Legal move indicator */}
                      {highlightedSquares.includes(square) && !piece && (
                        <div className="absolute w-4 h-4 rounded-full bg-success/60" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Player Info */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  {currentUser?.avatar || '🎮'}
                </div>
                <div>
                  <div className="font-medium">{currentUser?.username || 'You'}</div>
                  <div className="text-sm text-muted-foreground">ELO: {currentUser?.rating || 1500}</div>
                </div>
              </div>
              <div className={`font-display text-2xl px-4 py-2 rounded-lg ${
                gameState.turn === 'w' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Clock className="w-5 h-5 inline mr-2" />
                {formatTime(timer.white)}
              </div>
            </div>
          </div>

          {/* Game Controls & Info */}
          <div className="space-y-4">
            {/* Game Status */}
            <div className="gaming-card p-4">
              <h3 className="font-display text-lg font-bold mb-3">Game Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turn</span>
                  <span className="font-medium">{gameState.turn === 'w' ? 'White' : 'Black'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moves</span>
                  <span className="font-medium">{gameState.moveHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Control</span>
                  <span className="font-medium">{timeControl}</span>
                </div>
                {gameState.isCheck && (
                  <div className="text-destructive font-medium text-center py-2 bg-destructive/10 rounded">
                    CHECK!
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isSpectator && (
              <div className="gaming-card p-4">
                <h3 className="font-display text-lg font-bold mb-3">Actions</h3>
                <div className="space-y-2">
                  {!gameStarted ? (
                    <Button variant="hero" className="w-full" onClick={startGame}>
                      Start Game
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowDrawModal(true)}
                        disabled={gameState.isGameOver}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Offer Draw
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => setShowResignModal(true)}
                        disabled={gameState.isGameOver}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Resign
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Move History */}
            <div className="gaming-card p-4">
              <h3 className="font-display text-lg font-bold mb-3">Move History</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {gameState.moveHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No moves yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {gameState.moveHistory.map((move, index) => (
                      <div 
                        key={index}
                        className={`text-sm px-2 py-1 rounded ${
                          index % 2 === 0 ? 'bg-muted/50' : ''
                        }`}
                      >
                        {index % 2 === 0 && <span className="text-muted-foreground mr-1">{Math.floor(index / 2) + 1}.</span>}
                        {move.san}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Captured Pieces */}
            <div className="gaming-card p-4">
              <h3 className="font-display text-lg font-bold mb-3">Captured</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground w-16">White:</span>
                  <span className="text-xl">
                    {gameState.capturedPieces.white.map((p, i) => (
                      <span key={i} className="text-slate-900">
                        {getPieceSymbol({ type: p, color: 'b' })}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground w-16">Black:</span>
                  <span className="text-xl">
                    {gameState.capturedPieces.black.map((p, i) => (
                      <span key={i} className="text-slate-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                        {getPieceSymbol({ type: p, color: 'w' })}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resign Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="gaming-card p-6 max-w-sm w-full mx-4"
          >
            <h2 className="font-display text-xl font-bold mb-4">Resign Game?</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to resign? This will count as a loss.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowResignModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleResign}>
                Resign
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Draw Modal */}
      {showDrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="gaming-card p-6 max-w-sm w-full mx-4"
          >
            <h2 className="font-display text-xl font-bold mb-4">Offer Draw?</h2>
            <p className="text-muted-foreground mb-6">
              Your opponent will be asked to accept or decline the draw.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDrawModal(false)}>
                Cancel
              </Button>
              <Button variant="default" className="flex-1" onClick={handleOfferDraw}>
                Offer Draw
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
