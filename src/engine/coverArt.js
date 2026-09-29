export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export const optimizeArtwork = async (file, { maxDimension = 640, quality = 0.78 } = {}) => {
  if (!file || !file.type?.startsWith('image/')) {
    const error = new Error('Choose an image file.');
    error.code = 'unsupported-image';
    throw error;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const error = new Error('Image is larger than 12 MB. Choose a smaller file.');
    error.code = 'image-too-large';
    throw error;
  }
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(image, 0, 0, width, height);
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
  } finally {
    image.close?.();
  }
};

export const isStorageQuotaError = (error) => error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014;
