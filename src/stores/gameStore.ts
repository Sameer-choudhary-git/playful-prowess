import { create } from 'zustand';

export type GameType = 'chess' | 'poker' | 'blackjack';
export type LobbyStatus = 'waiting' | 'starting' | 'in_progress' | 'finished';

export interface Player {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  isReady: boolean;
  isOnline: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  gameType: GameType;
  host: Player;
  players: Player[];
  maxPlayers: number;
  entryFee: number;
  isPrivate: boolean;
  status: LobbyStatus;
  timeControl?: string;
  createdAt: Date;
}

export interface Match {
  id: string;
  gameType: GameType;
  players: Player[];
  winner?: Player;
  prizePool: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface Notification {
  id: string;
  type: 'invite' | 'win' | 'message' | 'friend_request';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface GameState {
  currentUser: Player | null;
  isConnected: boolean;
  walletAddress: string | null;
  balance: number;
  lobbies: Lobby[];
  activeLobby: Lobby | null;
  friends: Player[];
  notifications: Notification[];
  recentMatches: Match[];
  playersOnline: number;
  activeGames: number;
  totalPrizePool: number;
  
  // Actions
  setCurrentUser: (user: Player | null) => void;
  setWalletAddress: (address: string | null) => void;
  setBalance: (balance: number) => void;
  setConnected: (connected: boolean) => void;
  addLobby: (lobby: Lobby) => void;
  removeLobby: (lobbyId: string) => void;
  updateLobby: (lobbyId: string, updates: Partial<Lobby>) => void;
  setActiveLobby: (lobby: Lobby | null) => void;
  joinLobby: (lobbyId: string) => void;
  leaveLobby: (lobbyId: string) => void;
  setPlayerReady: (lobbyId: string, playerId: string, ready: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  updateStats: (stats: { playersOnline?: number; activeGames?: number; totalPrizePool?: number }) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  isConnected: false,
  walletAddress: null,
  balance: 0,
  lobbies: [],
  activeLobby: null,
  friends: [],
  notifications: [],
  recentMatches: [],
  playersOnline: 1247,
  activeGames: 89,
  totalPrizePool: 15420,

  setCurrentUser: (user) => set({ currentUser: user }),
  
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  setBalance: (balance) => set({ balance }),
  
  setConnected: (connected) => set({ isConnected: connected }),

  addLobby: (lobby) => set((state) => ({ 
    lobbies: [...state.lobbies, lobby] 
  })),

  removeLobby: (lobbyId) => set((state) => ({
    lobbies: state.lobbies.filter((l) => l.id !== lobbyId)
  })),

  updateLobby: (lobbyId, updates) => set((state) => ({
    lobbies: state.lobbies.map((l) => 
      l.id === lobbyId ? { ...l, ...updates } : l
    )
  })),

  setActiveLobby: (lobby) => set({ activeLobby: lobby }),

  joinLobby: (lobbyId) => {
    const { currentUser, lobbies } = get();
    if (!currentUser) return;
    
    set({
      lobbies: lobbies.map((lobby) => {
        if (lobby.id === lobbyId && lobby.players.length < lobby.maxPlayers) {
          return {
            ...lobby,
            players: [...lobby.players, { ...currentUser, isReady: false }]
          };
        }
        return lobby;
      })
    });
  },

  leaveLobby: (lobbyId) => {
    const { currentUser, lobbies } = get();
    if (!currentUser) return;
    
    set({
      lobbies: lobbies.map((lobby) => {
        if (lobby.id === lobbyId) {
          return {
            ...lobby,
            players: lobby.players.filter((p) => p.id !== currentUser.id)
          };
        }
        return lobby;
      }),
      activeLobby: null
    });
  },

  setPlayerReady: (lobbyId, playerId, ready) => set((state) => ({
    lobbies: state.lobbies.map((lobby) => {
      if (lobby.id === lobbyId) {
        return {
          ...lobby,
          players: lobby.players.map((p) => 
            p.id === playerId ? { ...p, isReady: ready } : p
          )
        };
      }
      return lobby;
    })
  })),

  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date()
      },
      ...state.notifications
    ]
  })),

  markNotificationRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    )
  })),

  clearNotifications: () => set({ notifications: [] }),

  updateStats: (stats) => set((state) => ({
    playersOnline: stats.playersOnline ?? state.playersOnline,
    activeGames: stats.activeGames ?? state.activeGames,
    totalPrizePool: stats.totalPrizePool ?? state.totalPrizePool
  })),
}));

// Initialize with mock data
const mockFriends: Player[] = [
  { id: '1', username: 'CryptoKing', avatar: '👑', rating: 1850, isReady: false, isOnline: true },
  { id: '2', username: 'ChessMaster', avatar: '♟️', rating: 2100, isReady: false, isOnline: true },
  { id: '3', username: 'PokerFace', avatar: '🃏', rating: 1720, isReady: false, isOnline: false },
  { id: '4', username: 'BlackjackPro', avatar: '🎰', rating: 1650, isReady: false, isOnline: true },
];

const mockLobbies: Lobby[] = [
  {
    id: 'lobby-1',
    name: 'Casual Chess',
    gameType: 'chess',
    host: mockFriends[1],
    players: [mockFriends[1]],
    maxPlayers: 2,
    entryFee: 0,
    isPrivate: false,
    status: 'waiting',
    timeControl: '10+0',
    createdAt: new Date()
  },
  {
    id: 'lobby-2',
    name: 'High Stakes Poker',
    gameType: 'poker',
    host: mockFriends[2],
    players: [mockFriends[2], mockFriends[0]],
    maxPlayers: 6,
    entryFee: 50,
    isPrivate: false,
    status: 'waiting',
    createdAt: new Date()
  },
  {
    id: 'lobby-3',
    name: 'Quick Blackjack',
    gameType: 'blackjack',
    host: mockFriends[3],
    players: [mockFriends[3]],
    maxPlayers: 4,
    entryFee: 10,
    isPrivate: false,
    status: 'waiting',
    createdAt: new Date()
  }
];

const mockMatches: Match[] = [
  {
    id: 'match-1',
    gameType: 'chess',
    players: [mockFriends[0], mockFriends[1]],
    winner: mockFriends[1],
    prizePool: 100,
    startedAt: new Date(Date.now() - 3600000),
    endedAt: new Date(Date.now() - 1800000)
  },
  {
    id: 'match-2',
    gameType: 'poker',
    players: [mockFriends[0], mockFriends[2], mockFriends[3]],
    winner: mockFriends[0],
    prizePool: 300,
    startedAt: new Date(Date.now() - 7200000),
    endedAt: new Date(Date.now() - 5400000)
  }
];

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'invite',
    title: 'Game Invite',
    message: 'ChessMaster invited you to a chess match',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'notif-2',
    type: 'win',
    title: 'Victory!',
    message: 'You won 150 tokens in Poker',
    read: false,
    createdAt: new Date(Date.now() - 3600000)
  }
];

// Set initial mock data
setTimeout(() => {
  useGameStore.setState({
    friends: mockFriends,
    lobbies: mockLobbies,
    recentMatches: mockMatches,
    notifications: mockNotifications
  });
}, 0);
