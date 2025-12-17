import { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';

export interface ChessGameState {
  fen: string;
  turn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  moveHistory: Move[];
  legalMoves: Map<Square, Square[]>;
  capturedPieces: { white: PieceSymbol[]; black: PieceSymbol[] };
  lastMove: { from: Square; to: Square } | null;
}

export interface ChessTimer {
  white: number;
  black: number;
  activePlayer: Color | null;
}

export type TimeControl = '1+0' | '3+0' | '5+0' | '10+0' | '15+10' | '30+0';

export const TIME_CONTROLS: Record<TimeControl, { initial: number; increment: number }> = {
  '1+0': { initial: 60, increment: 0 },
  '3+0': { initial: 180, increment: 0 },
  '5+0': { initial: 300, increment: 0 },
  '10+0': { initial: 600, increment: 0 },
  '15+10': { initial: 900, increment: 10 },
  '30+0': { initial: 1800, increment: 0 },
};

export class ChessEngine {
  private game: Chess;
  private timer: ChessTimer;
  private timeControl: TimeControl;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTimerUpdate?: (timer: ChessTimer) => void;
  private onTimeOut?: (loser: Color) => void;

  constructor(timeControl: TimeControl = '10+0') {
    this.game = new Chess();
    this.timeControl = timeControl;
    const { initial } = TIME_CONTROLS[timeControl];
    this.timer = {
      white: initial,
      black: initial,
      activePlayer: null,
    };
  }

  getState(): ChessGameState {
    const legalMoves = new Map<Square, Square[]>();
    const moves = this.game.moves({ verbose: true });
    
    moves.forEach((move) => {
      if (!legalMoves.has(move.from)) {
        legalMoves.set(move.from, []);
      }
      legalMoves.get(move.from)!.push(move.to);
    });

    const history = this.game.history({ verbose: true });
    const capturedPieces = this.getCapturedPieces(history);
    const lastMove = history.length > 0 
      ? { from: history[history.length - 1].from, to: history[history.length - 1].to }
      : null;

    return {
      fen: this.game.fen(),
      turn: this.game.turn(),
      isCheck: this.game.isCheck(),
      isCheckmate: this.game.isCheckmate(),
      isStalemate: this.game.isStalemate(),
      isDraw: this.game.isDraw(),
      isGameOver: this.game.isGameOver(),
      moveHistory: history,
      legalMoves,
      capturedPieces,
      lastMove,
    };
  }

  private getCapturedPieces(history: Move[]): { white: PieceSymbol[]; black: PieceSymbol[] } {
    const captured = { white: [] as PieceSymbol[], black: [] as PieceSymbol[] };
    
    history.forEach((move) => {
      if (move.captured) {
        // If white moved and captured, it's a black piece
        if (move.color === 'w') {
          captured.black.push(move.captured);
        } else {
          captured.white.push(move.captured);
        }
      }
    });

    return captured;
  }

  makeMove(from: Square, to: Square, promotion?: PieceSymbol): Move | null {
    try {
      const move = this.game.move({ from, to, promotion: promotion || 'q' });
      
      if (move) {
        // Add increment after successful move
        const { increment } = TIME_CONTROLS[this.timeControl];
        if (increment > 0) {
          const playerWhoMoved = move.color;
          if (playerWhoMoved === 'w') {
            this.timer.white += increment;
          } else {
            this.timer.black += increment;
          }
        }
        
        // Switch active timer
        this.timer.activePlayer = this.game.turn();
      }
      
      return move;
    } catch {
      return null;
    }
  }

  isLegalMove(from: Square, to: Square): boolean {
    const moves = this.game.moves({ square: from, verbose: true });
    return moves.some((move) => move.to === to);
  }

  getLegalMovesFrom(square: Square): Square[] {
    const moves = this.game.moves({ square, verbose: true });
    return moves.map((move) => move.to);
  }

  getPiece(square: Square) {
    return this.game.get(square);
  }

  undo(): Move | null {
    return this.game.undo();
  }

  reset(): void {
    this.game.reset();
    const { initial } = TIME_CONTROLS[this.timeControl];
    this.timer = { white: initial, black: initial, activePlayer: null };
    this.stopTimer();
  }

  loadFen(fen: string): boolean {
    try {
      this.game.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  // Timer methods
  startTimer(onUpdate: (timer: ChessTimer) => void, onTimeOut: (loser: Color) => void): void {
    this.onTimerUpdate = onUpdate;
    this.onTimeOut = onTimeOut;
    this.timer.activePlayer = this.game.turn();
    
    this.timerInterval = setInterval(() => {
      if (this.timer.activePlayer) {
        if (this.timer.activePlayer === 'w') {
          this.timer.white = Math.max(0, this.timer.white - 1);
          if (this.timer.white === 0) {
            this.stopTimer();
            this.onTimeOut?.('w');
            return;
          }
        } else {
          this.timer.black = Math.max(0, this.timer.black - 1);
          if (this.timer.black === 0) {
            this.stopTimer();
            this.onTimeOut?.('b');
            return;
          }
        }
        this.onTimerUpdate?.({ ...this.timer });
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timer.activePlayer = null;
  }

  getTimer(): ChessTimer {
    return { ...this.timer };
  }

  setTimeControl(timeControl: TimeControl): void {
    this.timeControl = timeControl;
    const { initial } = TIME_CONTROLS[timeControl];
    this.timer = { white: initial, black: initial, activePlayer: null };
  }

  // PGN methods
  getPGN(): string {
    return this.game.pgn();
  }

  loadPGN(pgn: string): boolean {
    try {
      this.game.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  // ASCII representation for debugging
  getAscii(): string {
    return this.game.ascii();
  }
}

// Chess piece Unicode symbols
export const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export const getPieceSymbol = (piece: { type: PieceSymbol; color: Color } | null): string => {
  if (!piece) return '';
  const key = `${piece.color}${piece.type.toUpperCase()}`;
  return PIECE_SYMBOLS[key] || '';
};

// Format time for display
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
