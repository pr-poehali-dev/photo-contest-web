import { useState, useEffect } from 'react';
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
  const [photoPair, setPhotoPair] = useState<PhotoPair | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadPhotoPair();
  }, [userId]);

  useEffect(() => {
    if (photoPair) {
      setCanVote(false);
      const timer = setTimeout(() => {
        setCanVote(true);
      }, 7000);
      return () => clearTimeout(timer);
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

      setLoading(true);
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
    <div className="min-h-screen flex flex-col">
      <header className="bg-secondary/50 py-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">Уроки Фотографии Рожнов Сергей</p>
      </header>

      {isMobile ? (
        <div className="flex-1 flex flex-col">
          <button
            onClick={() => handleVote(photo1.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden transition-opacity ${!canVote ? 'opacity-50' : 'hover:opacity-90'}`}
          >
            <img
              src={photo1.imageUrl}
              alt="Фото 1"
              className="w-full h-full object-cover"
            />
            {!canVote && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-lg font-bold">Подождите 7 секунд...</p>
              </div>
            )}
          </button>
          <button
            onClick={() => handleVote(photo2.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden transition-opacity ${!canVote ? 'opacity-50' : 'hover:opacity-90'}`}
          >
            <img
              src={photo2.imageUrl}
              alt="Фото 2"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex">
          <button
            onClick={() => handleVote(photoPair.photo1.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden transition-opacity ${!canVote ? 'opacity-50' : 'hover:opacity-90'}`}
          >
            <img
              src={photoPair.photo1.image_url}
              alt="Фото 1"
              className="w-full h-full object-cover"
            />
            {!canVote && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-2xl font-bold">Подождите 7 секунд...</p>
              </div>
            )}
          </button>
          <button
            onClick={() => handleVote(photoPair.photo2.id)}
            disabled={!canVote}
            className={`flex-1 relative overflow-hidden transition-opacity ${!canVote ? 'opacity-50' : 'hover:opacity-90'}`}
          >
            <img
              src={photoPair.photo2.image_url}
              alt="Фото 2"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      )}

      <div className="p-4 bg-secondary/50 flex gap-4 justify-center items-center">
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