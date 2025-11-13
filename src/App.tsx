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

  const handleLogin = (username: string) => {
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
        {currentPage === 'home' && <HomePage currentUser={currentUser} onNavigate={handleNavigate} />}
        {currentPage === 'vote' && <VotePage onNavigate={handleNavigate} />}
        {currentPage === 'profile' && <ProfilePage currentUser={currentUser} onNavigate={handleNavigate} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;