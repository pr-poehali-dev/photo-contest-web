import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { api, compressImage, createThumbnail } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProfilePageProps {
  currentUser: string;
  userId: number;
  onNavigate: (page: 'home' | 'profile' | 'vote') => void;
}

interface Category {
  id: number;
  name: string;
  photos: PhotoItem[];
}

interface PhotoItem {
  id: number;
  image_url: string;
  rating: number;
}

const CATEGORY_MAP: Record<string, number> = {
  'природа': 1,
  'город': 2,
  'животные': 3,
  'люди': 4,
  'разное': 5
};

const CATEGORIES = ['природа', 'город', 'животные', 'люди', 'разное'];

export default function ProfilePage({ currentUser, userId, onNavigate }: ProfilePageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [userId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const photos = await api.getPhotos(userId);
      
      const categoriesData = CATEGORIES.map((name, index) => ({
        id: index + 1,
        name,
        photos: photos.filter(p => p.category_id === index + 1).map(p => ({
          id: p.id,
          image_url: p.thumbnail_url || '',
          rating: p.rating
        }))
      }));

      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load photos:', error);
      setCategories(CATEGORIES.map((name, index) => ({
        id: index + 1,
        name,
        photos: []
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (categoryId: number, file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const [compressedImage, thumbnail] = await Promise.all([
        compressImage(file),
        createThumbnail(file)
      ]);
      
      await api.uploadPhoto(userId, categoryId, compressedImage, thumbnail);
      
      toast({
        title: 'Успешно!',
        description: 'Фотография загружена',
      });

      await loadPhotos();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Удалить это фото?')) return;

    try {
      await api.deletePhoto(photoId);
      
      toast({
        title: 'Успешно!',
        description: 'Фотография удалена',
      });

      await loadPhotos();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить фото',
        variant: 'destructive',
      });
    }
  };

  const bestPhotoRatings: Record<string, number> = {
    'природа': 245,
    'город': 223,
    'животные': 198,
    'люди': 187,
    'разное': 165
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

      <div className="container mx-auto p-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{currentUser}</h2>
              <p className="text-sm text-muted-foreground">ID: {userId}</p>
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
                            <Card key={photo.id} className="overflow-hidden relative group">
                              <img
                                src={photo.image_url}
                                alt="Фото"
                                className="w-full h-32 object-cover"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeletePhoto(photo.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                              <div className="p-2 text-center">
                                <p className="text-sm font-bold text-primary">{photo.rating} ★</p>
                                <p className="text-xs text-muted-foreground">Лучший: {globalBest} ★</p>
                              </div>
                            </Card>
                          ))}
                          {category.photos.length < 6 && (
                            <Card className="flex items-center justify-center h-32 cursor-pointer hover:bg-secondary/50 transition-colors">
                              <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                                <Icon name="Plus" size={32} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-2">
                                  {uploading ? 'Загрузка...' : 'Добавить фото'}
                                </span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(category.id, file);
                                  }}
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
                      <div key={photo.id} className="space-y-2 relative group">
                        <div className="relative">
                          <img
                            src={photo.image_url}
                            alt="Фото"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
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
                            disabled={uploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(category.id, file);
                            }}
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