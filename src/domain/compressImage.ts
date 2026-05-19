import imageCompression from 'browser-image-compression';

export async function compressImage(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<File> {
  if (file.type === 'image/svg+xml') return file;

  return imageCompression(file, {
    maxWidthOrHeight: opts?.maxWidth ?? 1200,
    initialQuality: opts?.quality ?? 0.8,
    useWebWorker: true,
    preserveExif: false,
  });
}
