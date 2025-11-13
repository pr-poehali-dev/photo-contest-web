const API_URLS = {
  auth: 'https://functions.poehali.dev/ccc2cacc-25ed-4641-9f58-6ee23be6fa7c',
  photos: 'https://functions.poehali.dev/4ccb62b9-d773-45ee-aaeb-261b47fe6c4f',
  voting: 'https://functions.poehali.dev/b422fc96-6af8-47b7-9001-c269e818fe65',
  stats: 'https://functions.poehali.dev/94255665-2b47-4d9e-a41e-072304fe9b76',
  image: 'https://functions.poehali.dev/4a49a45d-b55f-4cc7-b375-49ac3d349cf9',
  imagesBatch: 'https://functions.poehali.dev/79427aea-8039-448c-999d-29018cf9ec9e',
  thumbnail: 'https://functions.poehali.dev/7dc9a7ac-9229-433e-8ca9-7627d247a291',
};

export interface User {
  user_id: number;
  username: string;
}

export interface Photo {
  id: number;
  image_url?: string;
  thumbnail_url?: string;
  rating: number;
  category_name: string;
  category_id: number;
}

export interface PhotoPair {
  photo1: Photo & { views_count: number };
  photo2: Photo & { views_count: number };
  category: string;
  completed?: boolean;
}

export interface TopUser {
  id: number;
  username: string;
  activity_count: number;
}

export interface TopPhoto {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  rating: number;
  category_name: string;
  username: string;
}

export interface Stats {
  top_users: TopUser[];
  top_photo: TopPhoto | null;
  top_photos_by_category: TopPhoto[];
  user_stats: {
    activity: number;
    best_photo_rating: number;
    rank: number | null;
    photos_by_category: Record<string, number>;
  };
}

async function loadThumbnailsBatch(photoIds: number[]): Promise<Record<string, string>> {
  if (photoIds.length === 0) return {};
  
  const results = await Promise.all(
    photoIds.map(async (id) => {
      try {
        const response = await fetch(`${API_URLS.thumbnail}?photo_id=${id}`);
        if (response.ok) {
          const { thumbnail_url } = await response.json();
          return { id: id.toString(), url: thumbnail_url };
        }
      } catch (error) {
        console.error(`Failed to load thumbnail ${id}:`, error);
      }
      return { id: id.toString(), url: '' };
    })
  );
  
  return Object.fromEntries(results.map(r => [r.id, r.url]));
}

async function loadImagesBatch(photoIds: number[]): Promise<Record<string, string>> {
  if (photoIds.length === 0) return {};
  
  const results = await Promise.all(
    photoIds.map(async (id) => {
      try {
        const response = await fetch(`${API_URLS.image}?photo_id=${id}`);
        if (response.ok) {
          const { image_url } = await response.json();
          return { id: id.toString(), url: image_url };
        }
      } catch (error) {
        console.error(`Failed to load image ${id}:`, error);
      }
      return { id: id.toString(), url: '' };
    })
  );
  
  return Object.fromEntries(results.map(r => [r.id, r.url]));
}

export const api = {
  async auth(username: string, password: string, action: 'login' | 'register'): Promise<User> {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, action }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    return response.json();
  },

  async getPhotos(userId?: number): Promise<Photo[]> {
    const url = userId 
      ? `${API_URLS.photos}?user_id=${userId}`
      : API_URLS.photos;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch photos');
    const photos = await response.json();
    
    if (photos.length === 0) return [];
    
    const photoIds = photos.map((p: Photo) => p.id);
    const thumbnails = await loadThumbnailsBatch(photoIds);
    
    return photos.map((photo: Photo) => ({
      ...photo,
      thumbnail_url: thumbnails[photo.id.toString()] || ''
    }));
  },

  async uploadPhoto(userId: number, categoryId: number, imageUrl: string, thumbnailUrl: string): Promise<{ photo_id: number }> {
    const response = await fetch(API_URLS.photos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        category_id: categoryId, 
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  async getVotingPair(userId: number): Promise<PhotoPair> {
    const response = await fetch(`${API_URLS.voting}?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch voting pair');
    const pair = await response.json();
    
    if (pair.completed) return pair;
    
    const images = await loadImagesBatch([pair.photo1.id, pair.photo2.id]);
    
    return {
      ...pair,
      photo1: { ...pair.photo1, image_url: images[pair.photo1.id.toString()] || '' },
      photo2: { ...pair.photo2, image_url: images[pair.photo2.id.toString()] || '' }
    };
  },

  async submitVote(userId: number, photo1Id: number, photo2Id: number, winnerPhotoId: number): Promise<void> {
    const response = await fetch(API_URLS.voting, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        photo1_id: photo1Id, 
        photo2_id: photo2Id, 
        winner_photo_id: winnerPhotoId 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Vote failed');
    }
  },

  async getStats(userId?: number): Promise<Stats> {
    const url = userId 
      ? `${API_URLS.stats}?user_id=${userId}`
      : API_URLS.stats;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stats');
    const stats = await response.json();
    
    const photoIds: number[] = [];
    if (stats.top_photo?.id) photoIds.push(stats.top_photo.id);
    stats.top_photos_by_category.forEach((p: TopPhoto) => {
      if (p?.id) photoIds.push(p.id);
    });
    
    if (photoIds.length === 0) return stats;
    
    const thumbnails = await loadThumbnailsBatch(photoIds);
    
    return {
      ...stats,
      top_photo: stats.top_photo 
        ? { ...stats.top_photo, thumbnail_url: thumbnails[stats.top_photo.id.toString()] || '' }
        : null,
      top_photos_by_category: stats.top_photos_by_category.map((p: TopPhoto) => ({
        ...p,
        thumbnail_url: thumbnails[p.id.toString()] || ''
      }))
    };
  },
};

export async function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxSize = 200;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Thumbnail creation failed'));
              return;
            }
            const thumbnailReader = new FileReader();
            thumbnailReader.readAsDataURL(blob);
            thumbnailReader.onloadend = () => {
              resolve(thumbnailReader.result as string);
            };
          },
          'image/jpeg',
          0.6
        );
      };
    };
    reader.onerror = reject;
  });
}

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxSize = 1000;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }

              if (blob.size > 150 * 1024 && quality > 0.1) {
                quality -= 0.1;
                compress();
              } else {
                const compressedReader = new FileReader();
                compressedReader.readAsDataURL(blob);
                compressedReader.onloadend = () => {
                  resolve(compressedReader.result as string);
                };
              }
            },
            'image/jpeg',
            quality
          );
        };

        compress();
      };
    };
    reader.onerror = reject;
  });
}