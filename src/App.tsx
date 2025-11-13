import { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedUserId = localStorage.getItem('userId');
    return savedUserId ? 'home' : 'auth';
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('username') || '';
  });
  const [userId, setUserId] = useState<number>(() => {
    const savedUserId = localStorage.getItem('userId');
    return savedUserId ? parseInt(savedUserId) : 0;
  });

  useEffect(() => {
    if (userId > 0) {
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('username', currentUser);
    }
  }, [userId, currentUser]);

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