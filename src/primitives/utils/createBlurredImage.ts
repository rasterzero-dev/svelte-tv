type ImageSource = string | URL;
type NullableImageSource = ImageSource | null | undefined;

export interface BlurOptions {
  readonly radius?: number;
  readonly crossOrigin?: 'anonymous' | 'use-credentials' | '';
  readonly resolution?: number;
}

const DEFAULT_BLUR_OPTIONS = {
  radius: 10,
  crossOrigin: 'anonymous',
  resolution: 1,
} as const;

export async function applyGaussianBlur<TSource extends ImageSource>(
  imageUrl: TSource,
  options?: Readonly<BlurOptions>,
): Promise<string> {
  const opts = { ...DEFAULT_BLUR_OPTIONS, ...options };
  if (opts.radius <= 0 || !Number.isFinite(opts.radius)) {
    throw new Error(`Invalid blur radius: ${opts.radius}.`);
  }
  if (opts.resolution <= 0 || opts.resolution > 1) {
    throw new Error(`Invalid resolution: ${opts.resolution}.`);
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = opts.crossOrigin;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const width = Math.max(1, Math.round(img.width * opts.resolution));
        const height = Math.max(1, Math.round(img.height * opts.resolution));
        canvas.width = width;
        canvas.height = height;
        ctx.filter = `blur(${opts.radius}px)`;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';
        resolve(canvas.toDataURL());
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = typeof imageUrl === 'string' ? imageUrl : imageUrl.toString();
  });
}

export function createBlurredImage<TSource extends NullableImageSource>(
  imageUrl: () => TSource,
  options?: Readonly<BlurOptions>,
) {
  return async () => {
    const url = imageUrl();
    if (url == null) return null;
    return applyGaussianBlur(
      typeof url === 'string' ? url : url.toString(),
      options,
    );
  };
}
