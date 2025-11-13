const API_URLS = {
  auth: 'https://functions.poehali.dev/ccc2cacc-25ed-4641-9f58-6ee23be6fa7c',
  photos: 'https://functions.poehali.dev/4ccb62b9-d773-45ee-aaeb-261b47fe6c4f',
  voting: 'https://functions.poehali.dev/b422fc96-6af8-47b7-9001-c269e818fe65',
};

export interface User {
  user_id: number;
  username: string;
}

export interface Photo {
  id: number;
  image_url: string;
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
    return response.json();
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
    return response.json();
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
