import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface HomePageProps {
  currentUser: string;
  userId: number;
  onNavigate: (page: 'home' | 'profile' | 'vote') => void;
}

interface TopUser {
  username: string;
  activity_count: number;
}

interface TopPhoto {
  category_name: string;
  image_url: string;
  rating: number;
}

export default function HomePage({ currentUser, userId, onNavigate }: HomePageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [userActivity, setUserActivity] = useState(0);
  const [topPhoto, setTopPhoto] = useState<TopPhoto | null>(null);
  const [topPhotos, setTopPhotos] = useState<TopPhoto[]>([]);
  const [userBestRating, setUserBestRating] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const stats = await api.getStats(userId);
      setTopUsers(stats.top_users);
      setUserActivity(stats.user_stats.activity);
      setUserBestRating(stats.user_stats.best_photo_rating);
      setTopPhoto(stats.top_photo);
      setTopPhotos(stats.top_photos_by_category.filter(p => p.thumbnail_url || p.image_url));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-secondary/50 py-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">Уроки Фотографии Рожнов Сергей</p>
      </header>

      <div className="container mx-auto p-4 space-y-8">
        {isMobile ? (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Самый активный</p>
                  {topUsers.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">{topUsers[0].username}</p>
                      <p className="text-lg text-primary">{topUsers[0].activity_count} голосов</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет данных</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Ваша активность</p>
                  <p className="text-3xl font-bold text-accent">{userActivity}</p>
                  {topUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground">до топа: {topUsers[0].activity_count - userActivity}</p>
                  )}
                </div>
              </div>
            </Card>

            {topPhoto && (
              <Card className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Лучшее фото дня</p>
                  <img
                    src={topPhoto.thumbnail_url || topPhoto.image_url}
                    alt={topPhoto.category_name}
                    className="w-full h-64 object-cover rounded-lg mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm capitalize">{topPhoto.category_name}</span>
                    <span className="text-lg font-bold text-primary">{topPhoto.rating} ★</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ваш лучший: {userBestRating} ★</p>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Топ активных участников</h2>
              {topUsers.length > 0 ? (
                <div className="space-y-3">
                  {topUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">{index + 1}</span>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <span className="text-lg text-accent">{user.activity_count} голосов</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Нет данных об активности</p>
              )}
              <div className="mt-4 p-4 bg-accent/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ваша активность</p>
                <p className="text-3xl font-bold text-accent">{userActivity} голосов</p>
              </div>
            </Card>

            {topPhotos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Лучшие работы по темам</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topPhotos.map((photo, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative bg-gray-700 rounded-lg aspect-square flex items-center justify-center p-12">
                        <img
                          src={photo.thumbnail_url || photo.image_url}
                          alt={photo.category_name}
                          className="w-full h-full object-contain rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-gray-400 text-sm font-medium">подождите 7 секунд</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium">{photo.category_name}</span>
                        <span className="text-primary font-bold">{photo.rating} ★</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={() => onNavigate('vote')} size="lg" className="flex items-center gap-2">
            <Icon name="Vote" size={20} />
            Голосовать
          </Button>
          <Button onClick={() => onNavigate('profile')} variant="secondary" size="lg" className="flex items-center gap-2">
            <Icon name="User" size={20} />
            Личный кабинет
          </Button>
        </div>
      </div>
    </div>
  );
}