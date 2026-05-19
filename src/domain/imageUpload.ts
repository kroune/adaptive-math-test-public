import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { validateImageFile } from './validateImage';
import { compressImage } from './compressImage';

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * Used by admin pages for item images, topic icons, and motivation question images.
 *
 * Validates the file before uploading (MIME type, size, decodability).
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string
): Promise<string> {
  await validateImageFile(file);

  const processed = await compressImage(file);

  const nameParts = processed.name.split('.');
  const ext = nameParts.length > 1 ? (nameParts.pop() ?? 'png') : 'png';
  const contentType = processed.type || `image/${ext}`;
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(fileName, processed, { contentType, upsert: false });

  if (uploadErr) {
    logger.error('Image upload failed', uploadErr, { fileName, contentType, bucket });
    throw new Error(`Ошибка загрузки изображения: ${uploadErr.message}`);
  }

  logger.info('Image uploaded', { fileName, bucket });

  return `/storage/v1/object/public/${bucket}/${fileName}`;
}
