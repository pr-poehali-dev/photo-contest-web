import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import VotePage from "./pages/VotePage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

type Page = 'auth' | 'home' | 'profile' | 'vote';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userId, setUserId] = useState<number>(0);

  const handleLogin = (id: number, username: string) => {
    setUserId(id);
    setCurrentUser(username);
    setCurrentPage('home');
  };

  const handleNavigate = (page: 'home' | 'profile' | 'vote') => {
    setCurrentPage(page);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {currentPage === 'auth' && <AuthPage onLogin={handleLogin} />}
        {currentPage === 'home' && <HomePage currentUser={currentUser} userId={userId} onNavigate={handleNavigate} />}
        {currentPage === 'vote' && <VotePage userId={userId} onNavigate={handleNavigate} />}
        {currentPage === 'profile' && <ProfilePage currentUser={currentUser} userId={userId} onNavigate={handleNavigate} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;