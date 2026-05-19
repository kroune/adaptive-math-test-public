import { logger } from '../lib/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Validate that a File is a real, loadable image.
 *
 * Checks performed:
 * 1. MIME type is in the allow-list
 * 2. File size is within the limit
 * 3. The browser can actually decode the file as an image (catches corrupt / fake files)
 *
 * Throws a user-facing error message (Russian) on failure.
 */
export async function validateImageFile(file: File): Promise<void> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    logger.warn('Image validation: bad MIME type', { type: file.type, name: file.name });
    throw new Error(
      `Недопустимый формат файла: ${file.type || 'неизвестный'}. Допустимы: PNG, JPEG, GIF, WebP, SVG.`
    );
  }

  if (file.size === 0) {
    throw new Error('Файл пустой (0 байт).');
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`Файл слишком большой (${sizeMb} МБ). Максимум — 10 МБ.`);
  }

  // SVG is XML-based, skip bitmap decode check
  if (file.type === 'image/svg+xml') return;

  await assertImageDecodable(file);
}

/**
 * Try to load the file as a bitmap image via the browser's Image API.
 * Rejects if the browser can't decode it (corrupt data, not a real image, etc.).
 */
function assertImageDecodable(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      cleanup();
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Файл повреждён — не удалось определить размеры изображения.'));
      } else {
        resolve();
      }
    };

    img.onerror = () => {
      cleanup();
      logger.warn('Image validation: browser failed to decode file', { name: file.name, type: file.type });
      reject(new Error('Файл повреждён или не является изображением.'));
    };

    img.src = url;
  });
}
