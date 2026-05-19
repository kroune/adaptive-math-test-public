import { useState } from 'react';
import { uploadImageToStorage } from '../../../domain/imageUpload';

export interface UseImageUploadResult {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  /** Upload the current file and return the public URL. Throws on error. */
  uploadImage: () => Promise<string | null>;
}

/**
 * Shared hook for image upload in admin forms.
 * Wraps domain/imageUpload with React state management.
 */
export function useImageUpload(bucket: string): UseImageUploadResult {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const url = await uploadImageToStorage(imageFile, bucket);
    setImageFile(null);
    return url;
  };

  return { imageFile, setImageFile, uploadImage };
}
