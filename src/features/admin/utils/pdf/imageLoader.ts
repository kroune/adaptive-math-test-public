import type { ItemAnswer, Item } from '../../../../types';

export interface ImageData {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

// Collect all image URLs referenced by the answered items (question images + option images).
export function collectImageUrls(answers: ItemAnswer[], itemMap: Map<string, Item>): string[] {
  const urls = new Set<string>();
  for (const a of answers) {
    const item = itemMap.get(a.item_id);
    if (!item) continue;
    if (item.image_url) urls.add(item.image_url);
    if (item.options) {
      for (const opt of item.options) {
        if (opt.image_url) urls.add(opt.image_url);
      }
    }
  }
  return Array.from(urls);
}

// Fetch an image URL and normalize it to a JPEG data URL (losslessly converts any format
// supported by the browser — WEBP, AVIF, PNG — so jsPDF's addImage is happy).
async function loadImage(url: string): Promise<ImageData | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode failed'));
      el.src = rawDataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // White backdrop so transparency doesn't render black in PDFs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight, format: 'JPEG' };
  } catch {
    return null;
  }
}

export async function loadAllImages(urls: string[]): Promise<Map<string, ImageData>> {
  const map = new Map<string, ImageData>();
  const results = await Promise.all(
    urls.map(async (u) => [u, await loadImage(u)] as const),
  );
  for (const [u, d] of results) if (d) map.set(u, d);
  return map;
}

// Fit an image within max dimensions preserving aspect ratio; returns mm sizes.
export function fitImage(
  img: ImageData,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  // Assume ~3.78 px per mm (96 dpi ≈ 3.78). We don't need exact physical size —
  // just a sensible default for pixel images, then clamp to max bounds.
  let w = img.width / 3.78;
  let h = img.height / 3.78;
  const ratio = img.width / img.height;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}
