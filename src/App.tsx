import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Lobbies from "./pages/Lobbies";
import Tournaments from "./pages/Tournaments";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import ChessGame from "./pages/games/ChessGame";
import BlackjackGame from "./pages/games/BlackjackGame";
import PokerGame from "./pages/games/PokerGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lobbies" element={<Lobbies />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/games/chess" element={<ChessGame />} />
          <Route path="/games/blackjack" element={<BlackjackGame />} />
          <Route path="/games/poker" element={<PokerGame />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
