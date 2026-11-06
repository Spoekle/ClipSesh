export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const SAMPLE_SIZE = 32;

/**
 * Extracts the dominant color of a loaded image by downscaling it onto a canvas,
 * bucketing pixels into a coarse color grid and picking the heaviest bucket.
 * Vivid pixels are weighted far more so dull backgrounds (black bars, grey UI) don't win.
 *
 * Returns `null` when the image isn't loaded yet or its pixels can't be read
 * (e.g. a cross-origin image without CORS headers taints the canvas).
 *
 * @example
 * const color = getDominantColor(imgElement);
 * if (color) el.style.backgroundColor = `rgb(${color.r} ${color.g} ${color.b} / 0.3)`;
 */
export const getDominantColor = (img: HTMLImageElement): RgbColor | null => {
  if (!img.complete || img.naturalWidth === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  } catch {
    return null;
  }

  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;
    // Tiny base weight keeps fully grey images working, but any vivid color outweighs dark/grey areas
    const weight = 0.001 + saturation * brightness * brightness;

    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    buckets.set(key, bucket);
  }

  let best: { weight: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.weight > best.weight) best = bucket;
  }
  if (!best || best.weight === 0) return null;

  return {
    r: Math.round(best.r / best.weight),
    g: Math.round(best.g / best.weight),
    b: Math.round(best.b / best.weight),
  };
};
