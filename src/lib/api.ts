const API_URLS = {
  auth: 'https://functions.poehali.dev/ccc2cacc-25ed-4641-9f58-6ee23be6fa7c',
  photos: 'https://functions.poehali.dev/4ccb62b9-d773-45ee-aaeb-261b47fe6c4f',
  voting: 'https://functions.poehali.dev/b422fc96-6af8-47b7-9001-c269e818fe65',
  stats: 'https://functions.poehali.dev/94255665-2b47-4d9e-a41e-072304fe9b76',
  image: 'https://functions.poehali.dev/4a49a45d-b55f-4cc7-b375-49ac3d349cf9',
};

export interface User {
  user_id: number;
  username: string;
}

export interface Photo {
  id: number;
  image_url?: string;
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
    
    const photosWithImages = await Promise.all(
      photos.map(async (photo: Photo) => {
        try {
          const imgResponse = await fetch(`${API_URLS.image}?photo_id=${photo.id}`);
          if (imgResponse.ok) {
            const { image_url } = await imgResponse.json();
            return { ...photo, image_url };
          }
        } catch (err) {
          console.error(`Failed to load image ${photo.id}:`, err);
        }
        return { ...photo, image_url: '' };
      })
    );
    
    return photosWithImages;
  },

  async uploadPhoto(userId: number, categoryId: number, imageUrl: string): Promise<{ photo_id: number }> {
    const response = await fetch(API_URLS.photos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category_id: categoryId, image_url: imageUrl }),
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
    
    try {
      const [img1, img2] = await Promise.all([
        fetch(`${API_URLS.image}?photo_id=${pair.photo1.id}`).then(r => r.json()),
        fetch(`${API_URLS.image}?photo_id=${pair.photo2.id}`).then(r => r.json())
      ]);
      
      return {
        ...pair,
        photo1: { ...pair.photo1, image_url: img1.image_url },
        photo2: { ...pair.photo2, image_url: img2.image_url }
      };
    } catch (error) {
      console.error('Failed to load voting images:', error);
      throw error;
    }
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
    
    try {
      const imagePromises = [];
      
      if (stats.top_photo?.id) {
        imagePromises.push(
          fetch(`${API_URLS.image}?photo_id=${stats.top_photo.id}`)
            .then(r => r.json())
            .then(data => ({ ...stats.top_photo, image_url: data.image_url }))
            .catch(() => stats.top_photo)
        );
      } else {
        imagePromises.push(Promise.resolve(null));
      }
      
      const categoryPromises = stats.top_photos_by_category
        .filter((p: TopPhoto) => p?.id)
        .map((photo: TopPhoto) =>
          fetch(`${API_URLS.image}?photo_id=${photo.id}`)
            .then(r => r.json())
            .then(data => ({ ...photo, image_url: data.image_url }))
            .catch(() => photo)
        );
      
      const [topPhoto, ...categoryPhotos] = await Promise.all([...imagePromises, ...categoryPromises]);
      
      return {
        ...stats,
        top_photo: topPhoto || stats.top_photo,
        top_photos_by_category: categoryPhotos.length > 0 ? categoryPhotos : stats.top_photos_by_category
      };
    } catch (error) {
      console.error('Failed to load stats images:', error);
      return stats;
    }
  },
};

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

              if (blob.size > 300 * 1024 && quality > 0.1) {
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