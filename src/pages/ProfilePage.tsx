import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface ProfilePageProps {
  currentUser: string;
  onNavigate: (page: 'home' | 'profile' | 'vote') => void;
}

interface Category {
  id: number;
  name: string;
  photos: Photo[];
}

interface Photo {
  id: number;
  imageUrl: string;
  rating: number;
}

export default function ProfilePage({ currentUser, onNavigate }: ProfilePageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories] = useState<Category[]>([
    {
      id: 1,
      name: 'природа',
      photos: [
        { id: 1, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', rating: 45 },
        { id: 2, imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', rating: 32 },
      ]
    },
    {
      id: 2,
      name: 'город',
      photos: [
        { id: 3, imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', rating: 28 },
      ]
    },
    {
      id: 3,
      name: 'животные',
      photos: []
    },
  ]);
  const [userActivity] = useState(87);
  const [topActivity] = useState(142);
  const [userRank] = useState(5);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = (categoryId: number) => {
    console.log('Upload to category:', categoryId);
  };

  const bestPhotoRatings: Record<string, number> = {
    'природа': 245,
    'город': 223,
    'животные': 198,
    'люди': 187,
    'разное': 165
  };

  return (
    <div className="min-h-screen">
      <header className="bg-secondary/50 py-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">Уроки Фотографии Рожнов Сергей</p>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{currentUser}</h2>
              <p className="text-sm text-muted-foreground">Место в рейтинге: {userRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Активность</p>
              <p className="text-3xl font-bold text-accent">{userActivity}</p>
              <p className="text-xs text-muted-foreground">Лидер: {topActivity}</p>
            </div>
          </div>
        </Card>

        {isMobile ? (
          <div className="space-y-4">
            {selectedCategory === null ? (
              <>
                <h3 className="text-xl font-bold">Мои фотографии</h3>
                {categories.map((category) => {
                  const myBest = category.photos.length > 0 ? Math.max(...category.photos.map(p => p.rating)) : 0;
                  const globalBest = bestPhotoRatings[category.name] || 0;
                  
                  return (
                    <Card
                      key={category.id}
                      className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium capitalize">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.photos.length} из 6 фото
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold">{myBest} ★</p>
                          <p className="text-xs text-muted-foreground">Лучший: {globalBest} ★</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            ) : (
              <>
                <Button
                  onClick={() => setSelectedCategory(null)}
                  variant="secondary"
                  size="sm"
                  className="mb-4"
                >
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Назад
                </Button>
                {categories
                  .filter(c => c.id === selectedCategory)
                  .map(category => {
                    const globalBest = bestPhotoRatings[category.name] || 0;
                    return (
                      <div key={category.id} className="space-y-4">
                        <h3 className="text-xl font-bold capitalize">{category.name}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {category.photos.map(photo => (
                            <Card key={photo.id} className="overflow-hidden">
                              <img
                                src={photo.imageUrl}
                                alt="Фото"
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2 text-center">
                                <p className="text-sm font-bold text-primary">{photo.rating} ★</p>
                                <p className="text-xs text-muted-foreground">Лучший: {globalBest} ★</p>
                              </div>
                            </Card>
                          ))}
                          {category.photos.length < 6 && (
                            <Card className="flex items-center justify-center h-32 cursor-pointer hover:bg-secondary/50 transition-colors">
                              <label className="cursor-pointer flex flex-col items-center">
                                <Icon name="Plus" size={32} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-2">Добавить фото</span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={() => handleFileUpload(category.id)}
                                />
                              </label>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Мои фотографии</h3>
            {categories.map((category) => {
              const globalBest = bestPhotoRatings[category.name] || 0;
              return (
                <Card key={category.id} className="p-6">
                  <h4 className="text-lg font-bold capitalize mb-4">{category.name}</h4>
                  <div className="grid grid-cols-6 gap-4">
                    {category.photos.map(photo => (
                      <div key={photo.id} className="space-y-2">
                        <img
                          src={photo.imageUrl}
                          alt="Фото"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="text-center text-xs">
                          <p className="font-bold text-primary">{photo.rating}</p>
                          <p className="text-muted-foreground">{globalBest}</p>
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: 6 - category.photos.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="space-y-2">
                        <label className="w-full h-24 bg-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors">
                          <Icon name="Plus" size={24} className="text-muted-foreground" />
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={() => handleFileUpload(category.id)}
                          />
                        </label>
                        <div className="text-center text-xs">
                          <p className="text-muted-foreground">0 / {globalBest}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex gap-4 justify-center pt-4">
          <Button onClick={() => onNavigate('home')} variant="secondary">
            <Icon name="Home" size={20} className="mr-2" />
            На главную
          </Button>
          <Button onClick={() => onNavigate('vote')}>
            <Icon name="Vote" size={20} className="mr-2" />
            Голосовать
          </Button>
        </div>
      </div>
    </div>
  );
}
