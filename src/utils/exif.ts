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
 * Preload an image URL and resolve with HTMLImageElement safely.
 * Ensures the resulting image never taints the canvas or causes VideoFrame 'Invalid source state'.
 */
export async function preloadImage(url: string): Promise<HTMLImageElement> {
  // 1. Direct load for blob: and data: URLs (already same-origin, no CORS header needed)
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load local blob image: ${e}`));
      img.src = url;
    });
  }

  // 2. For external remote URLs, fetch as blob first to guarantee a same-origin clean buffer
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(new Error(`Failed to decode fetched blob image: ${e}`));
          img.src = blobUrl;
        });
      }
    } catch {
      // Fetch failed or blocked by CORS, proceed to image element with crossOrigin
    }
  }

  // 3. For bundled/local or remote images, always load with crossOrigin = 'anonymous'
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Reject rather than retrying without crossOrigin, because a tainted canvas
      // causes Chromium's WebCodecs VideoFrame constructor to throw "Invalid source state"
      reject(new Error(`Failed to load image from ${url}. Ensure the server supports CORS or use local uploads.`));
    };
    img.src = url;
  });
}
