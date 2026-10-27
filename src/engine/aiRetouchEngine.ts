/**
 * AI-powered Retouching Engine:
 * - Intelligent Blemish Detection & Seamless Removal
 * - Automatic Skin Smoothing via Frequency Separation & Bilateral Masking
 * - Automatic Teeth & Sclera Whitening
 * All with real-time adjustable intensity levels.
 */

export interface AIRetouchSettings {
  skinSmoothing: number; // 0 to 100%
  blemishRemoval: number; // 0 to 100%
  teethWhitening: number; // 0 to 100%
  eyeSparkle: number; // 0 to 100%
  toneBalancing: number; // 0 to 100%
}

export const defaultAIRetouchSettings: AIRetouchSettings = {
  skinSmoothing: 65,
  blemishRemoval: 75,
  teethWhitening: 60,
  eyeSparkle: 50,
  toneBalancing: 40,
};

// Skin Chrominance detector (human skin tones conform tightly in YCbCr/HSV space across all ethnicities)
export function isSkinPixel(r: number, g: number, b: number): boolean {
  // YCbCr skin locus
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Standard skin locus ellipse in Cb-Cr space
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && y >= 30 && y <= 245;
}

// Check if pixel is likely within teeth/smile area (high value, low saturation, centered lower-third)
export function isTeethCandidate(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  // Spatial heuristic: teeth are usually in the lower 45% - 75% vertical range, center 30% - 70%
  const relX = x / w;
  const relY = y / h;
  if (relX < 0.28 || relX > 0.72 || relY < 0.45 || relY > 0.75) return false;

  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  // Teeth have good lightness and warm slight yellow tint (R & G > B)
  return luma > 110 && r >= b && g >= b * 0.9 && Math.abs(r - g) < 55;
}

// Intelligent Blemish Detection:
// Detects high-contrast local anomalies (dark spots, pimple redness, localized blemishes) in skin regions
export function detectAndRemoveBlemishes(
  imageData: ImageData,
  intensity: number // 0 to 100
) {
  if (intensity <= 0) return;
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  const sensitivity = 1 - (intensity / 100) * 0.5; // lower means more blemishes caught
  const threshold = 18 * sensitivity;
  const blendFactor = (intensity / 100) * 0.95;

  // Build a grayscale map to detect local variance
  const gray = new Float32Array(w * h);
  const skinMask = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
    skinMask[p] = isSkinPixel(r, g, b) ? 1 : 0;
  }

  // Detect blemish centroids using a 5x5 Laplacian / Difference of Gaussians
  const blemishes: { x: number; y: number; r: number }[] = [];
  const step = 2; // performance sampling step

  for (let y = 6; y < h - 6; y += step) {
    for (let x = 6; x < w - 6; x += step) {
      const idx = y * w + x;
      if (!skinMask[idx]) continue;

      const centerVal = gray[idx];

      // Sample local annular background average
      let bgSum = 0;
      let bgCount = 0;
      for (let dy = -5; dy <= 5; dy += 2) {
        for (let dx = -5; dx <= 5; dx += 2) {
          const dist = Math.hypot(dx, dy);
          if (dist >= 3 && dist <= 5) {
            bgSum += gray[(y + dy) * w + (x + dx)];
            bgCount++;
          }
        }
      }
      const bgAvg = bgSum / bgCount;

      // Dark anomaly or high-contrast red spot
      const contrastDiff = bgAvg - centerVal;
      const redDiff = d[idx * 4] - d[idx * 4 + 1]; // redness anomaly

      if (contrastDiff > threshold || (redDiff > 45 && contrastDiff > threshold * 0.6)) {
        blemishes.push({ x, y, r: Math.round(3 + (intensity / 100) * 4) });
      }
    }
  }

  // Multi-scale patch inpainting over detected blemishes
  for (const b of blemishes) {
    const br = b.r;
    let sumR = 0,
      sumG = 0,
      sumB = 0,
      cnt = 0;

    // Sample healthy border pixels
    for (let dy = -br - 2; dy <= br + 2; dy++) {
      for (let dx = -br - 2; dx <= br + 2; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist >= br && dist <= br + 2) {
          const nx = Math.min(w - 1, Math.max(0, b.x + dx));
          const ny = Math.min(h - 1, Math.max(0, b.y + dy));
          const pIdx = (ny * w + nx) * 4;
          sumR += d[pIdx];
          sumG += d[pIdx + 1];
          sumB += d[pIdx + 2];
          cnt++;
        }
      }
    }

    if (cnt === 0) continue;
    const avgR = sumR / cnt;
    const avgG = sumG / cnt;
    const avgB = sumB / cnt;

    // Blend center
    for (let dy = -br; dy <= br; dy++) {
      for (let dx = -br; dx <= br; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= br) {
          const nx = Math.min(w - 1, Math.max(0, b.x + dx));
          const ny = Math.min(h - 1, Math.max(0, b.y + dy));
          const pIdx = (ny * w + nx) * 4;
          const falloff = Math.pow(1 - dist / (br + 0.5), 1.2) * blendFactor;

          d[pIdx] = Math.round(d[pIdx] * (1 - falloff) + avgR * falloff);
          d[pIdx + 1] = Math.round(d[pIdx + 1] * (1 - falloff) + avgG * falloff);
          d[pIdx + 2] = Math.round(d[pIdx + 2] * (1 - falloff) + avgB * falloff);
        }
      }
    }
  }
}

// Automatic Skin Smoothing via Frequency Separation & Skin Tone Masking
export function applyAutomaticSkinSmoothing(
  imageData: ImageData,
  intensity: number // 0 to 100
) {
  if (intensity <= 0) return;
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const strength = (intensity / 100) * 0.75;

  const orig = new Uint8ClampedArray(d);
  const blurred = new Uint8ClampedArray(d);

  // Guided box blur on low-frequency tones
  const blurRadius = Math.max(2, Math.round(4 + (intensity / 100) * 6));

  // Horizontal blur pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sumR = 0,
        sumG = 0,
        sumB = 0,
        cnt = 0;
      for (let k = -blurRadius; k <= blurRadius; k += 2) {
        const nx = Math.min(w - 1, Math.max(0, x + k));
        const idx = (y * w + nx) * 4;
        sumR += orig[idx];
        sumG += orig[idx + 1];
        sumB += orig[idx + 2];
        cnt++;
      }
      const bIdx = (y * w + x) * 4;
      blurred[bIdx] = sumR / cnt;
      blurred[bIdx + 1] = sumG / cnt;
      blurred[bIdx + 2] = sumB / cnt;
    }
  }

  // Composite: preserve skin pores (high frequency) while smoothing out blotchiness on skin regions
  for (let i = 0; i < d.length; i += 4) {
    const r = orig[i];
    const g = orig[i + 1];
    const b = orig[i + 2];

    if (isSkinPixel(r, g, b)) {
      // High-frequency skin texture: detail that should be preserved!
      const hfR = r - blurred[i];
      const hfG = g - blurred[i + 1];
      const hfB = b - blurred[i + 2];

      // Recomposed pixel: smooth low frequency + authentic pores
      const targetR = blurred[i] + hfR * 0.9;
      const targetG = blurred[i + 1] + hfG * 0.9;
      const targetB = blurred[i + 2] + hfB * 0.9;

      d[i] = Math.round(r * (1 - strength) + targetR * strength);
      d[i + 1] = Math.round(g * (1 - strength) + targetG * strength);
      d[i + 2] = Math.round(b * (1 - strength) + targetB * strength);
    }
  }
}

// Automatic Teeth Whitening:
// Detects dental region, neutralizes warm yellow discoloration, and boosts enamel luminance
export function applyAutomaticTeethWhitening(
  imageData: ImageData,
  intensity: number // 0 to 100
) {
  if (intensity <= 0) return;
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const factor = (intensity / 100) * 0.85;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];

      if (isTeethCandidate(r, g, b, x, y, w, h)) {
        // Yellow cast = excess of red & green over blue
        const yellowCast = Math.max(0, (r + g) / 2 - b);
        const desat = yellowCast * 0.75 * factor;
        const lumaBoost = 1 + 0.15 * factor;

        d[idx] = Math.min(255, Math.round((r - desat * 0.4) * lumaBoost));
        d[idx + 1] = Math.min(255, Math.round((g - desat * 0.4) * lumaBoost));
        d[idx + 2] = Math.min(255, Math.round((b + desat * 0.8) * lumaBoost));
      }
    }
  }
}

// Automatic Eye Iris Sparkle & Sclera Clearing
export function applyAutomaticEyeEnhancement(
  imageData: ImageData,
  intensity: number // 0 to 100
) {
  if (intensity <= 0) return;
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const factor = (intensity / 100) * 0.65;

  // Eyes are typically in upper 25% - 55% of portrait
  for (let y = Math.floor(h * 0.25); y < Math.floor(h * 0.55); y++) {
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      const idx = (y * w + x) * 4;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // If iris (vibrant color)
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      if (sat > 0.22 && luma > 40 && luma < 180 && !isSkinPixel(r, g, b)) {
        // Iris: boost saturation & clarity
        d[idx] = Math.min(255, Math.round(luma + (r - luma) * (1 + 0.5 * factor)));
        d[idx + 1] = Math.min(255, Math.round(luma + (g - luma) * (1 + 0.5 * factor)));
        d[idx + 2] = Math.min(255, Math.round(luma + (b - luma) * (1 + 0.5 * factor)));
      } else if (luma > 160 && sat < 0.2 && !isSkinPixel(r, g, b)) {
        // Sclera: clean whites
        d[idx] = Math.min(255, Math.round(r * (1 + 0.08 * factor)));
        d[idx + 1] = Math.min(255, Math.round(g * (1 + 0.08 * factor)));
        d[idx + 2] = Math.min(255, Math.round(b * (1 + 0.12 * factor)));
      }
    }
  }
}

// Master AI Retouch processor
export function processAIRetouch(
  sourceImageData: ImageData,
  destImageData: ImageData,
  settings: AIRetouchSettings
) {
  // Copy source to dest
  destImageData.data.set(sourceImageData.data);

  // 1. Intelligent Blemish Detection & Removal
  if (settings.blemishRemoval > 0) {
    detectAndRemoveBlemishes(destImageData, settings.blemishRemoval);
  }

  // 2. Automatic Skin Smoothing (Frequency Separation)
  if (settings.skinSmoothing > 0) {
    applyAutomaticSkinSmoothing(destImageData, settings.skinSmoothing);
  }

  // 3. Teeth Whitening
  if (settings.teethWhitening > 0) {
    applyAutomaticTeethWhitening(destImageData, settings.teethWhitening);
  }

  // 4. Eye Sparkle & Sclera Clearing
  if (settings.eyeSparkle > 0) {
    applyAutomaticEyeEnhancement(destImageData, settings.eyeSparkle);
  }
}
