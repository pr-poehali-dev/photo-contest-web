import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface VotePageProps {
  userId: number;
  onNavigate: (page: 'home' | 'profile' | 'vote') => void;
}

interface Photo {
  id: number;
  image_url: string;
  rating: number;
  views_count: number;
}

interface PhotoPair {
  photo1: Photo;
  photo2: Photo;
  category: string;
}

export default function VotePage({ userId, onNavigate }: VotePageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [canVote, setCanVote] = useState(false);
  const [votingComplete, setVotingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoPair, setPhotoPair] = useState<PhotoPair | null>(() => {
    const saved = sessionStorage.getItem('currentPhotoPair');
    return saved ? JSON.parse(saved) : null;
  });
  const [timeLeft, setTimeLeft] = useState(7);
  const loadedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (photoPair) {
      sessionStorage.setItem('currentPhotoPair', JSON.stringify(photoPair));
    }
  }, [photoPair]);

  useEffect(() => {
    if (!loadedRef.current && userId > 0 && !photoPair) {
      loadedRef.current = true;
      loadPhotoPair();
    } else if (photoPair) {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (photoPair) {
      setCanVote(false);
      setTimeLeft(7);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanVote(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [photoPair]);

  const loadPhotoPair = async () => {
    try {
      const pair = await api.getVotingPair(userId);
      
      if ('completed' in pair && pair.completed) {
        setVotingComplete(true);
      } else {
        setPhotoPair(pair as PhotoPair);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фотографии для голосования',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (photoId: number) => {
    if (!canVote || !photoPair) return;

    try {
      await api.submitVote(userId, photoPair.photo1.id, photoPair.photo2.id, photoId);
      
      toast({
        title: 'Голос учтён!',
        description: '+1 к вашей активности',
      });

      sessionStorage.removeItem('currentPhotoPair');
      await loadPhotoPair();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить голос',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (votingComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-secondary/50 py-2 px-4 text-center">
          <p className="text-xs text-muted-foreground">Уроки Фотографии Рожнов Сергей</p>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center space-y-4 max-w-md">
            <Icon name="CheckCircle" size={64} className="mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Отличная работа!</h2>
            <p className="text-muted-foreground">
              Вы проголосовали за все доступные фотографии. Приходите завтра, чтобы продолжить!
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => onNavigate('home')}>На главную</Button>
              <Button onClick={() => onNavigate('profile')} variant="secondary">В личный кабинет</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!photoPair) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Нет доступных фото для голосования</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-secondary/50 py-2 px-4 text-center flex-shrink-0">
        <p className="text-xs text-muted-foreground">Уроки Фотографии Рожнов Сергей</p>
      </header>

      {isMobile ? (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <button
            onClick={() => handleVote(photoPair.photo1.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden ${!canVote ? 'cursor-not-allowed' : ''}`}
          >
            <img
              src={photoPair.photo1.image_url}
              alt="Фото 1"
              className="w-full h-full object-cover"
            />
          </button>
          <button
            onClick={() => handleVote(photoPair.photo2.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden ${!canVote ? 'cursor-not-allowed' : ''}`}
          >
            <img
              src={photoPair.photo2.image_url}
              alt="Фото 2"
              className="w-full h-full object-cover"
            />
          </button>
          
          {!canVote && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex flex-col items-center gap-1 shadow-2xl">
                <p className="text-gray-300 text-sm font-medium">Оцените фото</p>
                <div className="text-2xl font-bold text-white">{timeLeft}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex gap-4 p-4 min-h-0 relative">
          <button
            onClick={() => handleVote(photoPair.photo1.id)}
            disabled={!canVote}
            className={`flex-1 relative transition-opacity ${!canVote ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            <div className="bg-gray-700 rounded-lg h-full flex items-center justify-center p-20">
              <img
                src={photoPair.photo1.image_url}
                alt="Фото 1"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          </button>
          
          {!canVote && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-gray-800 rounded-xl px-6 py-4 flex flex-col items-center gap-2 shadow-2xl">
                <p className="text-gray-300 text-base font-medium">Оцените фото</p>
                <div className="text-3xl font-bold text-white">{timeLeft}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => handleVote(photoPair.photo2.id)}
            disabled={!canVote}
            className={`flex-1 relative transition-opacity ${!canVote ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            <div className="bg-gray-700 rounded-lg h-full flex items-center justify-center p-20">
              <img
                src={photoPair.photo2.image_url}
                alt="Фото 2"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          </button>
        </div>
      )}

      <div className="p-4 bg-secondary/50 flex gap-4 justify-center items-center flex-shrink-0">
        <p className="text-sm text-muted-foreground capitalize">Тема: {photoPair.category}</p>
        <Button onClick={() => onNavigate('home')} variant="secondary" size="sm">
          <Icon name="Home" size={16} className="mr-2" />
          На главную
        </Button>
        <Button onClick={() => onNavigate('profile')} variant="secondary" size="sm">
          <Icon name="User" size={16} className="mr-2" />
          В личку
        </Button>
      </div>
    </div>
  );
}