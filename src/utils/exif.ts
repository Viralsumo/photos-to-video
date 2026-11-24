/**
 * Load an image file into an object URL while extracting correct orientation and dimensions.
 */
export async function loadImageFromFile(file: File): Promise<{
  url: string;
  width: number;
  height: number;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      // Modern browsers auto-orient images with createImageBitmap({ imageOrientation: 'from-image' })
      let width = 0;
      let height = 0;
      
      if ('createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
          width = bitmap.width;
          height = bitmap.height;
          bitmap.close();
        } catch {
          // fallback to HTMLImageElement
        }
      }

      const url = URL.createObjectURL(file);

      if (width === 0 || height === 0) {
        const img = new Image();
        img.onload = () => {
          resolve({
            url,
            width: img.naturalWidth || 1920,
            height: img.naturalHeight || 1080,
          });
        };
        img.onerror = (err) => reject(err);
        img.src = url;
      } else {
        resolve({ url, width, height });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Preload an image URL and resolve with HTMLImageElement
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin on external http(s) URLs, never on blob: or data: URLs!
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin if browser blocked CORS
      const retryImg = new Image();
      retryImg.onload = () => resolve(retryImg);
      retryImg.onerror = (e) => reject(e);
      retryImg.src = url;
    };
    img.src = url;
  });
}
