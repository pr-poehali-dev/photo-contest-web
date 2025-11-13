import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HomePageProps {
  currentUser: string;
  onNavigate: (page: 'home' | 'profile' | 'vote') => void;
}

interface TopUser {
  username: string;
  activity: number;
}

interface TopPhoto {
  category: string;
  imageUrl: string;
  rating: number;
}

export default function HomePage({ currentUser, onNavigate }: HomePageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [topUsers] = useState<TopUser[]>([
    { username: 'Александр', activity: 142 },
    { username: 'Мария', activity: 128 },
    { username: 'Дмитрий', activity: 115 },
  ]);
  const [userActivity] = useState(87);
  const [topPhotos] = useState<TopPhoto[]>([
    { category: 'природа', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', rating: 245 },
    { category: 'город', imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', rating: 223 },
    { category: 'животные', imageUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5', rating: 198 },
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
                  <p className="text-2xl font-bold">{topUsers[0].username}</p>
                  <p className="text-lg text-primary">{topUsers[0].activity} голосов</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Ваша активность</p>
                  <p className="text-3xl font-bold text-accent">{userActivity}</p>
                  <p className="text-xs text-muted-foreground">до топа: {topUsers[0].activity - userActivity}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Лучшее фото дня</p>
                <img
                  src={topPhotos[0].imageUrl}
                  alt={topPhotos[0].category}
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm capitalize">{topPhotos[0].category}</span>
                  <span className="text-lg font-bold text-primary">{topPhotos[0].rating} ★</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ваш лучший: 45 ★</p>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Топ активных участников</h2>
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-lg text-accent">{user.activity} голосов</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-accent/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ваша активность</p>
                <p className="text-3xl font-bold text-accent">{userActivity} голосов</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Лучшие работы по темам</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPhotos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={photo.imageUrl}
                      alt={photo.category}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="flex justify-between items-center">
                      <span className="capitalize font-medium">{photo.category}</span>
                      <span className="text-primary font-bold">{photo.rating} ★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ваш лучший: {Math.floor(photo.rating * 0.3)} ★</p>
                  </div>
                ))}
              </div>
            </Card>
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
