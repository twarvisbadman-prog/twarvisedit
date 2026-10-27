import {
  ColorGradeSettings,
  ColorBalanceState,
  CurvesState,
  CurvePoint,
  HSLState,
  HSLColorName,
  RetouchStroke,
  RetouchToolType,
} from '../types/editor';

export function getDefaultHSL(): HSLState {
  return {
    red: { hue: 0, saturation: 0, luminance: 0 },
    orange: { hue: 0, saturation: 0, luminance: 0 },
    yellow: { hue: 0, saturation: 0, luminance: 0 },
    green: { hue: 0, saturation: 0, luminance: 0 },
    cyan: { hue: 0, saturation: 0, luminance: 0 },
    blue: { hue: 0, saturation: 0, luminance: 0 },
    purple: { hue: 0, saturation: 0, luminance: 0 },
    magenta: { hue: 0, saturation: 0, luminance: 0 },
  };
}

export function getDefaultCurves(): CurvesState {
  return {
    master: [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ],
    red: [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ],
    green: [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ],
    blue: [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ],
  };
}

export function getDefaultColorBalance(): ColorBalanceState {
  return {
    shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    preserveLuminosity: true,
  };
}

export function getDefaultColorSettings(): ColorGradeSettings {
  return {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,

    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,

    texture: 0,
    clarity: 0,
    dehaze: 0,

    colorBalance: getDefaultColorBalance(),

    colorWheels: {
      lift: { angle: 0, saturation: 0, luminance: 0 },
      gamma: { angle: 0, saturation: 0, luminance: 0 },
      gain: { angle: 0, saturation: 0, luminance: 0 },
      offset: { angle: 0, saturation: 0, luminance: 0 },
    },

    curves: getDefaultCurves(),
    hsl: getDefaultHSL(),

    grain: {
      amount: 0,
      size: 2,
      roughness: 50,
    },
    vignette: {
      amount: 0,
      midpoint: 50,
      feather: 50,
    },
    bloom: {
      amount: 0,
      radius: 12,
    },
    sharpen: {
      amount: 0,
      radius: 1.5,
    },

    activePresetId: null,
    presetBlend: 100,
  };
}

// Convert angle (0-360) and saturation (0-1) to an RGB tint vector centered around 0
export function wheelToRGB(angle: number, sat: number): [number, number, number] {
  if (sat === 0) return [0, 0, 0];
  const rad = (angle * Math.PI) / 180;
  // Compute normalized chromaticity on color circle
  const r = Math.cos(rad) * sat;
  const g = Math.cos(rad - (2 * Math.PI) / 3) * sat;
  const b = Math.cos(rad - (4 * Math.PI) / 3) * sat;
  return [r, g, b];
}

// Monotonic Cubic Spline Curve Interpolation
export function buildCurveLUT(points: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort points by X
  const sorted = [...points].sort((a, b) => a.x - b.x);

  // Ensure endpoints 0 and 255 exist
  if (sorted[0].x > 0) {
    sorted.unshift({ x: 0, y: sorted[0].y });
  }
  if (sorted[sorted.length - 1].x < 255) {
    sorted.push({ x: 255, y: sorted[sorted.length - 1].y });
  }

  const n = sorted.length;
  // Natural cubic spline slopes
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dX = sorted[i + 1].x - sorted[i].x;
    const dY = sorted[i + 1].y - sorted[i].y;
    dx.push(dX);
    dy.push(dY);
    m.push(dX === 0 ? 0 : dY / dX);
  }

  // Tangents with Fritsch-Carlson monotonic preservation
  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = m[0];
  tangents[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (m[i - 1] + m[i]) / 2;
    }
  }

  // Monotonic correction
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / m[i];
      const beta = tangents[i + 1] / m[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        tangents[i] = tau * alpha * m[i];
        tangents[i + 1] = tau * beta * m[i];
      }
    }
  }

  // Evaluate spline for all values x in 0..255
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    while (seg < n - 2 && x > sorted[seg + 1].x) {
      seg++;
    }

    const x0 = sorted[seg].x;
    const x1 = sorted[seg + 1].x;
    const y0 = sorted[seg].y;
    const y1 = sorted[seg + 1].y;
    const h = x1 - x0;

    if (h === 0) {
      lut[x] = Math.min(255, Math.max(0, Math.round(y0)));
      continue;
    }

    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const val = h00 * y0 + h10 * h * tangents[seg] + h01 * y1 + h11 * h * tangents[seg + 1];
    lut[x] = Math.min(255, Math.max(0, Math.round(val)));
  }

  return lut;
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

// Convert HSL back to RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Calculate weights for the 8 HSL color bands given a pixel's hue in degrees
const HSL_CENTERS: Record<HSLColorName, number> = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  cyan: 180,
  blue: 240,
  purple: 280,
  magenta: 320,
};

function getHslBandWeight(hue: number, center: number): number {
  let diff = Math.abs(hue - center);
  if (diff > 180) diff = 360 - diff;
  // Gaussian bell curve falloff over ±40 degrees
  const sigma = 25;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

// Main image grading processor on ImageData
export function applyColorGradeToImageData(
  sourceData: ImageData,
  destData: ImageData,
  settings: ColorGradeSettings
) {
  const src = sourceData.data;
  const dst = destData.data;
  const len = src.length;

  // Precompute Curve LUTs
  const lutMaster = buildCurveLUT(settings.curves.master);
  const lutRed = buildCurveLUT(settings.curves.red);
  const lutGreen = buildCurveLUT(settings.curves.green);
  const lutBlue = buildCurveLUT(settings.curves.blue);

  // Precompute Color Wheels parameters
  const [liftR, liftG, liftB] = wheelToRGB(
    settings.colorWheels.lift.angle,
    settings.colorWheels.lift.saturation
  );
  const liftLuma = settings.colorWheels.lift.luminance * 0.3;

  const [gammaR, gammaG, gammaB] = wheelToRGB(
    settings.colorWheels.gamma.angle,
    settings.colorWheels.gamma.saturation
  );
  const gammaLuma = settings.colorWheels.gamma.luminance * 0.3;

  const [gainR, gainG, gainB] = wheelToRGB(
    settings.colorWheels.gain.angle,
    settings.colorWheels.gain.saturation
  );
  const gainLuma = settings.colorWheels.gain.luminance * 0.3;

  const [offR, offG, offB] = wheelToRGB(
    settings.colorWheels.offset.angle,
    settings.colorWheels.offset.saturation
  );
  const offLuma = settings.colorWheels.offset.luminance * 0.3;

  // Basic tone constants
  const exposureMult = Math.pow(2, settings.exposure);
  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));

  const highlightsFactor = settings.highlights / 100;
  const shadowsFactor = settings.shadows / 100;
  const whitesFactor = settings.whites / 100;
  const blacksFactor = settings.blacks / 100;

  // White balance constants
  const tempFactor = settings.temperature / 100; // Warm (adds R, subtracts B)
  const tintFactor = settings.tint / 100; // Magenta (adds G subtraction)

  const vibranceFactor = settings.vibrance / 100;
  const saturationFactor = settings.saturation / 100;

  const hasHslAdjustments = Object.values(settings.hsl).some(
    (c) => c.hue !== 0 || c.saturation !== 0 || c.luminance !== 0
  );

  const cb = settings.colorBalance;
  const hasColorBalance =
    cb &&
    (cb.shadows.cyanRed !== 0 ||
      cb.shadows.magentaGreen !== 0 ||
      cb.shadows.yellowBlue !== 0 ||
      cb.midtones.cyanRed !== 0 ||
      cb.midtones.magentaGreen !== 0 ||
      cb.midtones.yellowBlue !== 0 ||
      cb.highlights.cyanRed !== 0 ||
      cb.highlights.magentaGreen !== 0 ||
      cb.highlights.yellowBlue !== 0);

  for (let i = 0; i < len; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];
    const a = src[i + 3];

    // 1. Exposure
    if (exposureMult !== 1) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // 2. White Balance
    if (tempFactor !== 0 || tintFactor !== 0) {
      r += tempFactor * 25;
      b -= tempFactor * 25;
      g -= tintFactor * 18;
    }

    // 3. Highlights & Shadows & Whites & Blacks
    const currentLuma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (highlightsFactor !== 0 && currentLuma > 0.5) {
      const hMask = (currentLuma - 0.5) * 2;
      const boost = 1 + highlightsFactor * 0.5 * hMask;
      r *= boost;
      g *= boost;
      b *= boost;
    }
    if (shadowsFactor !== 0 && currentLuma < 0.5) {
      const sMask = (0.5 - currentLuma) * 2;
      const boost = 1 + shadowsFactor * 0.5 * sMask;
      r *= boost;
      g *= boost;
      b *= boost;
    }
    if (whitesFactor !== 0 && currentLuma > 0.75) {
      const wMask = (currentLuma - 0.75) * 4;
      r += whitesFactor * 30 * wMask;
      g += whitesFactor * 30 * wMask;
      b += whitesFactor * 30 * wMask;
    }
    if (blacksFactor !== 0 && currentLuma < 0.25) {
      const bMask = (0.25 - currentLuma) * 4;
      r += blacksFactor * 25 * bMask;
      g += blacksFactor * 25 * bMask;
      b += blacksFactor * 25 * bMask;
    }

    // 4. Contrast
    if (contrastFactor !== 1) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Normalize to 0..1 for Color Wheels
    let normR = Math.max(0, Math.min(1, r / 255));
    let normG = Math.max(0, Math.min(1, g / 255));
    let normB = Math.max(0, Math.min(1, b / 255));
    const normLuma = 0.299 * normR + 0.587 * normG + 0.114 * normB;

    // 5. 3-Way Color Wheels (Lift, Gamma, Gain, Offset)
    // Lift modifies shadows (1 - luma)
    const shadowWeight = Math.max(0, 1 - normLuma * 1.5);
    normR += (liftR * 0.4 + liftLuma) * shadowWeight;
    normG += (liftG * 0.4 + liftLuma) * shadowWeight;
    normB += (liftB * 0.4 + liftLuma) * shadowWeight;

    // Gain modifies highlights
    const highlightWeight = Math.max(0, normLuma * 1.4 - 0.2);
    normR += (gainR * 0.4 + gainLuma) * highlightWeight;
    normG += (gainG * 0.4 + gainLuma) * highlightWeight;
    normB += (gainB * 0.4 + gainLuma) * highlightWeight;

    // Gamma modifies midtones
    const midtoneWeight = Math.max(0, 1 - Math.abs(normLuma - 0.5) * 2);
    normR += (gammaR * 0.3 + gammaLuma) * midtoneWeight;
    normG += (gammaG * 0.3 + gammaLuma) * midtoneWeight;
    normB += (gammaB * 0.3 + gammaLuma) * midtoneWeight;

    // Color Balance (Shadows, Midtones, Highlights)
    if (hasColorBalance) {
      const sWeight = Math.max(0, 1 - normLuma * 2);
      const mWeight = Math.max(0, 1 - Math.abs(normLuma - 0.5) * 2);
      const hWeight = Math.max(0, (normLuma - 0.5) * 2);

      const dR = (cb.shadows.cyanRed * sWeight + cb.midtones.cyanRed * mWeight + cb.highlights.cyanRed * hWeight) * 0.35;
      const dG = (cb.shadows.magentaGreen * sWeight + cb.midtones.magentaGreen * mWeight + cb.highlights.magentaGreen * hWeight) * 0.35;
      const dB = (cb.shadows.yellowBlue * sWeight + cb.midtones.yellowBlue * mWeight + cb.highlights.yellowBlue * hWeight) * 0.35;

      normR += dR / 255;
      normG += dG / 255;
      normB += dB / 255;

      if (cb.preserveLuminosity) {
        const newLuma = 0.299 * normR + 0.587 * normG + 0.114 * normB;
        if (newLuma > 0) {
          const lumaScale = normLuma / newLuma;
          normR *= lumaScale;
          normG *= lumaScale;
          normB *= lumaScale;
        }
      }
    }

    // Master Offset
    normR += offR * 0.2 + offLuma;
    normG += offG * 0.2 + offLuma;
    normB += offB * 0.2 + offLuma;

    r = Math.max(0, Math.min(255, Math.round(normR * 255)));
    g = Math.max(0, Math.min(255, Math.round(normG * 255)));
    b = Math.max(0, Math.min(255, Math.round(normB * 255)));

    // 6. Spline Tone Curves
    r = lutRed[lutMaster[r]];
    g = lutGreen[lutMaster[g]];
    b = lutBlue[lutMaster[b]];

    // 7. Vibrance & Saturation
    if (vibranceFactor !== 0 || saturationFactor !== 0) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // Vibrance affects less saturated colors more, protecting skin tones
      let totalSatMult = 1 + saturationFactor;
      if (vibranceFactor !== 0) {
        totalSatMult += vibranceFactor * (1 - sat);
      }

      r = luma + (r - luma) * totalSatMult;
      g = luma + (g - luma) * totalSatMult;
      b = luma + (b - luma) * totalSatMult;
    }

    // 8. HSL Secondary Color Mixer
    if (hasHslAdjustments) {
      let [h, s, l] = rgbToHsl(
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b))
      );

      let deltaH = 0;
      let deltaS = 0;
      let deltaL = 0;

      for (const [channelName, adj] of Object.entries(settings.hsl) as [
        HSLColorName,
        HSLState[HSLColorName],
      ][]) {
        if (adj.hue === 0 && adj.saturation === 0 && adj.luminance === 0) continue;
        const weight = getHslBandWeight(h, HSL_CENTERS[channelName]);
        if (weight > 0.01) {
          deltaH += adj.hue * weight;
          deltaS += (adj.saturation / 100) * weight;
          deltaL += (adj.luminance / 100) * weight * 0.5;
        }
      }

      if (deltaH !== 0 || deltaS !== 0 || deltaL !== 0) {
        h = (h + deltaH + 360) % 360;
        s = Math.max(0, Math.min(1, s * (1 + deltaS)));
        l = Math.max(0, Math.min(1, l + deltaL));
        [r, g, b] = hslToRgb(h, s, l);
      }
    }

    dst[i] = Math.max(0, Math.min(255, r));
    dst[i + 1] = Math.max(0, Math.min(255, g));
    dst[i + 2] = Math.max(0, Math.min(255, b));
    dst[i + 3] = a;
  }

  // 9. Film Grain effect
  if (settings.grain.amount > 0) {
    applyFilmGrain(destData, settings.grain.amount, settings.grain.size);
  }

  // 10. Vignette effect
  if (settings.vignette.amount !== 0) {
    applyVignette(
      destData,
      settings.vignette.amount,
      settings.vignette.midpoint,
      settings.vignette.feather
    );
  }
}

// Film Grain generator
function applyFilmGrain(imageData: ImageData, amount: number, size: number) {
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const grainScale = (amount / 100) * 35;
  const step = Math.max(1, Math.round(size));

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      // Perlin-style or Gaussian random noise
      const noise = (Math.random() - 0.5) * grainScale;

      for (let sy = 0; sy < step && y + sy < h; sy++) {
        for (let sx = 0; sx < step && x + sx < w; sx++) {
          const idx = ((y + sy) * w + (x + sx)) * 4;
          // Protect extreme highlights and extreme shadows
          const luma = (d[idx] + d[idx + 1] + d[idx + 2]) / (3 * 255);
          const mask = Math.sin(luma * Math.PI); // Midtones receive most grain
          const appliedNoise = noise * mask;

          d[idx] = Math.max(0, Math.min(255, d[idx] + appliedNoise));
          d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + appliedNoise));
          d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + appliedNoise));
        }
      }
    }
  }
}

// Radial Vignette
function applyVignette(imageData: ImageData, amount: number, midpoint: number, feather: number) {
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const midNorm = (midpoint / 100) * 0.7 + 0.2;
  const featherNorm = (feather / 100) * 0.5 + 0.1;
  const strength = amount / 100;

  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxRadius;
      if (dist > midNorm - featherNorm) {
        const t = Math.max(0, Math.min(1, (dist - (midNorm - featherNorm)) / (featherNorm * 2)));
        // Smoothstep curve
        const factor = t * t * (3 - 2 * t);
        const mult = 1 + strength * factor * (strength < 0 ? 0.9 : 0.6);
        const idx = (y * w + x) * 4;

        d[idx] = Math.max(0, Math.min(255, d[idx] * mult));
        d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] * mult));
        d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] * mult));
      }
    }
  }
}

// Retouching Engine: Applies interactive retouching strokes onto canvas
export function applyRetouchStrokeToCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: RetouchStroke,
  imgWidth: number,
  imgHeight: number
) {
  const { tool, brush, points, sourcePoint } = stroke;
  if (!points || points.length === 0) return;

  const radius = brush.size / 2;
  const strength = brush.strength / 100;
  const hardness = brush.hardness / 100;

  ctx.save();

  switch (tool) {
    case 'heal': {
      // Spot Blemish Remover: Seamless texture synthesis
      for (const pt of points) {
        healSpot(ctx, pt.x, pt.y, radius, hardness, strength, imgWidth, imgHeight);
      }
      break;
    }

    case 'skin_smooth': {
      // Frequency Separation skin smoothing: soft tone blend preserving pore texture
      smoothSkinStroke(ctx, points, radius, hardness, strength, imgWidth, imgHeight);
      break;
    }

    case 'dodge': {
      // Highlight enhancer
      ctx.globalCompositeOperation = 'screen';
      paintGradedBrush(ctx, points, radius, hardness, strength * 0.35, 'rgba(255,255,255,1)');
      break;
    }

    case 'burn': {
      // Shadow / contour depth
      ctx.globalCompositeOperation = 'multiply';
      paintGradedBrush(ctx, points, radius, hardness, strength * 0.35, 'rgba(0,0,0,1)');
      break;
    }

    case 'teeth_whiten': {
      // Desaturates warm yellow stains & brightens enamel
      whitenTeethStroke(ctx, points, radius, hardness, strength, imgWidth, imgHeight);
      break;
    }

    case 'eye_enhance': {
      // Iris Pop: contrast + vibrant saturation
      enhanceIrisStroke(ctx, points, radius, hardness, strength, imgWidth, imgHeight);
      break;
    }

    case 'sharpen': {
      // High-pass micro-clarity on eyelashes, brows, hair
      sharpenDetailStroke(ctx, points, radius, hardness, strength, imgWidth, imgHeight);
      break;
    }

    case 'clone_stamp': {
      if (sourcePoint) {
        cloneStampStroke(ctx, points, sourcePoint, radius, hardness, strength);
      }
      break;
    }
  }

  ctx.restore();
}

// Blemish Healing: Samples concentric clean outer skin ring and blends seamlessly
function healSpot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hardness: number,
  strength: number,
  imgW: number,
  imgH: number
) {
  const pad = Math.ceil(radius * 1.5);
  const sx = Math.max(0, Math.floor(cx - pad));
  const sy = Math.max(0, Math.floor(cy - pad));
  const sw = Math.min(imgW - sx, pad * 2);
  const sh = Math.min(imgH - sy, pad * 2);

  if (sw <= 0 || sh <= 0) return;

  const imgData = ctx.getImageData(sx, sy, sw, sh);
  const d = imgData.data;

  // Sample outer ring (radius 1.0 to 1.4) to gather donor color & texture
  let sampleR = 0,
    sampleG = 0,
    sampleB = 0,
    sampleCount = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const realX = sx + x;
      const realY = sy + y;
      const dist = Math.hypot(realX - cx, realY - cy);
      if (dist >= radius * 0.9 && dist <= radius * 1.4) {
        const idx = (y * sw + x) * 4;
        sampleR += d[idx];
        sampleG += d[idx + 1];
        sampleB += d[idx + 2];
        sampleCount++;
      }
    }
  }

  if (sampleCount === 0) return;
  const avgR = sampleR / sampleCount;
  const avgG = sampleG / sampleCount;
  const avgB = sampleB / sampleCount;

  // Blend center with radial feathering
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const realX = sx + x;
      const realY = sy + y;
      const dist = Math.hypot(realX - cx, realY - cy);
      if (dist < radius) {
        const normDist = dist / radius;
        // Radial falloff curve
        const falloff = Math.pow(1 - normDist, 1.5 - hardness * 0.8) * strength;
        const idx = (y * sw + x) * 4;

        // Subtle high-frequency texture preservation
        const origLuma = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
        const donorLuma = (avgR + avgG + avgB) / 3;
        const highPass = (origLuma - donorLuma) * 0.25;

        d[idx] = Math.round(d[idx] * (1 - falloff) + (avgR + highPass) * falloff);
        d[idx + 1] = Math.round(d[idx + 1] * (1 - falloff) + (avgG + highPass) * falloff);
        d[idx + 2] = Math.round(d[idx + 2] * (1 - falloff) + (avgB + highPass) * falloff);
      }
    }
  }

  ctx.putImageData(imgData, sx, sy);
}

// Frequency Separation Skin Smoothing
function smoothSkinStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  radius: number,
  hardness: number,
  strength: number,
  imgW: number,
  imgH: number
) {
  for (const pt of points) {
    const pad = Math.ceil(radius * 1.3);
    const sx = Math.max(0, Math.floor(pt.x - pad));
    const sy = Math.max(0, Math.floor(pt.y - pad));
    const sw = Math.min(imgW - sx, pad * 2);
    const sh = Math.min(imgH - sy, pad * 2);
    if (sw <= 0 || sh <= 0) continue;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const d = imgData.data;

    // Fast box blur for low-frequency extraction
    const blurred = new Uint8ClampedArray(d);
    const blurRadius = Math.max(2, Math.round(radius * 0.35));

    // Horizontal pass
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        let sumR = 0,
          sumG = 0,
          sumB = 0,
          cnt = 0;
        for (let k = -blurRadius; k <= blurRadius; k++) {
          const nx = Math.min(sw - 1, Math.max(0, x + k));
          const idx = (y * sw + nx) * 4;
          sumR += d[idx];
          sumG += d[idx + 1];
          sumB += d[idx + 2];
          cnt++;
        }
        const bIdx = (y * sw + x) * 4;
        blurred[bIdx] = sumR / cnt;
        blurred[bIdx + 1] = sumG / cnt;
        blurred[bIdx + 2] = sumB / cnt;
      }
    }

    // Blend low frequency (smooth tones) while preserving high frequency pore structure
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const realX = sx + x;
        const realY = sy + y;
        const dist = Math.hypot(realX - pt.x, realY - pt.y);
        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 1.2) * (strength * 0.65);
          const idx = (y * sw + x) * 4;

          // High frequency skin texture = original - blurred
          const hfR = d[idx] - blurred[idx];
          const hfG = d[idx + 1] - blurred[idx + 1];
          const hfB = d[idx + 2] - blurred[idx + 2];

          // Recomposed pixel with softened low frequency + preserved high frequency pores
          const smoothedR = blurred[idx] + hfR * 0.85;
          const smoothedG = blurred[idx + 1] + hfG * 0.85;
          const smoothedB = blurred[idx + 2] + hfB * 0.85;

          d[idx] = Math.max(0, Math.min(255, d[idx] * (1 - falloff) + smoothedR * falloff));
          d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] * (1 - falloff) + smoothedG * falloff));
          d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] * (1 - falloff) + smoothedB * falloff));
        }
      }
    }

    ctx.putImageData(imgData, sx, sy);
  }
}

// Teeth and Sclera Whitener: selectively neutralizes warm yellows and lifts brightness
function whitenTeethStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  radius: number,
  hardness: number,
  strength: number,
  imgW: number,
  imgH: number
) {
  for (const pt of points) {
    const pad = Math.ceil(radius);
    const sx = Math.max(0, Math.floor(pt.x - pad));
    const sy = Math.max(0, Math.floor(pt.y - pad));
    const sw = Math.min(imgW - sx, pad * 2);
    const sh = Math.min(imgH - sy, pad * 2);
    if (sw <= 0 || sh <= 0) continue;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const d = imgData.data;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const realX = sx + x;
        const realY = sy + y;
        const dist = Math.hypot(realX - pt.x, realY - pt.y);
        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 1.4) * strength;
          const idx = (y * sw + x) * 4;

          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          // Target yellow cast (where red & green > blue)
          const yellowCast = Math.max(0, (r + g) / 2 - b);
          const desat = Math.min(yellowCast * 0.7, 30);

          const newR = Math.min(255, (r - desat * 0.5) * 1.08);
          const newG = Math.min(255, (g - desat * 0.5) * 1.08);
          const newB = Math.min(255, (b + desat * 0.8) * 1.1);

          d[idx] = Math.round(r * (1 - falloff) + newR * falloff);
          d[idx + 1] = Math.round(g * (1 - falloff) + newG * falloff);
          d[idx + 2] = Math.round(b * (1 - falloff) + newB * falloff);
        }
      }
    }
    ctx.putImageData(imgData, sx, sy);
  }
}

// Iris Eye Enhancer: enhances eye color vibrance, clarity, and spark
function enhanceIrisStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  radius: number,
  hardness: number,
  strength: number,
  imgW: number,
  imgH: number
) {
  for (const pt of points) {
    const pad = Math.ceil(radius);
    const sx = Math.max(0, Math.floor(pt.x - pad));
    const sy = Math.max(0, Math.floor(pt.y - pad));
    const sw = Math.min(imgW - sx, pad * 2);
    const sh = Math.min(imgH - sy, pad * 2);
    if (sw <= 0 || sh <= 0) continue;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const d = imgData.data;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const realX = sx + x;
        const realY = sy + y;
        const dist = Math.hypot(realX - pt.x, realY - pt.y);
        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 1.3) * strength;
          const idx = (y * sw + x) * 4;

          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          // Boost color saturation & micro-contrast
          const boostSat = 1.35;
          const boostLuma = luma > 80 ? 1.15 : 0.95;

          const enhancedR = Math.max(0, Math.min(255, (luma + (r - luma) * boostSat) * boostLuma));
          const enhancedG = Math.max(0, Math.min(255, (luma + (g - luma) * boostSat) * boostLuma));
          const enhancedB = Math.max(0, Math.min(255, (luma + (b - luma) * boostSat) * boostLuma));

          d[idx] = Math.round(r * (1 - falloff) + enhancedR * falloff);
          d[idx + 1] = Math.round(g * (1 - falloff) + enhancedG * falloff);
          d[idx + 2] = Math.round(b * (1 - falloff) + enhancedB * falloff);
        }
      }
    }
    ctx.putImageData(imgData, sx, sy);
  }
}

// Micro-Sharpening brush for eyelashes, eyebrows, hair details
function sharpenDetailStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  radius: number,
  hardness: number,
  strength: number,
  imgW: number,
  imgH: number
) {
  for (const pt of points) {
    const pad = Math.ceil(radius);
    const sx = Math.max(1, Math.floor(pt.x - pad));
    const sy = Math.max(1, Math.floor(pt.y - pad));
    const sw = Math.min(imgW - sx - 1, pad * 2);
    const sh = Math.min(imgH - sy - 1, pad * 2);
    if (sw <= 0 || sh <= 0) continue;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const d = imgData.data;
    const orig = new Uint8ClampedArray(d);

    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const realX = sx + x;
        const realY = sy + y;
        const dist = Math.hypot(realX - pt.x, realY - pt.y);
        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 1.2) * (strength * 0.8);
          const idx = (y * sw + x) * 4;

          // 3x3 Laplacian sharpening filter
          // [ 0, -1,  0 ]
          // [-1,  5, -1 ]
          // [ 0, -1,  0 ]
          const top = ((y - 1) * sw + x) * 4;
          const btm = ((y + 1) * sw + x) * 4;
          const lft = (y * sw + (x - 1)) * 4;
          const rgt = (y * sw + (x + 1)) * 4;

          for (let c = 0; c < 3; c++) {
            const laplace =
              orig[idx + c] * 5 -
              orig[top + c] -
              orig[btm + c] -
              orig[lft + c] -
              orig[rgt + c];
            const sharpVal = Math.max(0, Math.min(255, laplace));
            d[idx + c] = Math.round(orig[idx + c] * (1 - falloff) + sharpVal * falloff);
          }
        }
      }
    }
    ctx.putImageData(imgData, sx, sy);
  }
}

// Clone Stamp
function cloneStampStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  source: { x: number; y: number },
  radius: number,
  hardness: number,
  strength: number
) {
  if (points.length === 0) return;
  const startP = points[0];
  const offsetX = source.x - startP.x;
  const offsetY = source.y - startP.y;

  for (const pt of points) {
    const srcX = pt.x + offsetX;
    const srcY = pt.y + offsetY;
    const srcImg = ctx.getImageData(srcX - radius, srcY - radius, radius * 2, radius * 2);

    // Create feathered offscreen circle mask
    const off = document.createElement('canvas');
    off.width = radius * 2;
    off.height = radius * 2;
    const offCtx = off.getContext('2d')!;
    offCtx.putImageData(srcImg, 0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = strength;
    ctx.drawImage(off, pt.x - radius, pt.y - radius);
    ctx.restore();
  }
}

// Helper: paints a soft circular radial brush
function paintGradedBrush(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  radius: number,
  hardness: number,
  opacity: number,
  color: string
) {
  ctx.save();
  for (const pt of points) {
    const grad = ctx.createRadialGradient(pt.x, pt.y, radius * hardness, pt.x, pt.y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Real-Time Scope extractors: Histogram
export function extractHistogramData(imageData: ImageData) {
  const rHist = new Uint32Array(256);
  const gHist = new Uint32Array(256);
  const bHist = new Uint32Array(256);
  const lumaHist = new Uint32Array(256);

  const d = imageData.data;
  const len = d.length;
  // Subsample large images for 60fps performance
  const step = Math.max(4, Math.floor(len / (4 * 40000)) * 4);

  for (let i = 0; i < len; i += step) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    rHist[r]++;
    gHist[g]++;
    bHist[b]++;
    lumaHist[luma]++;
  }

  // Find max for scaling
  let maxCount = 1;
  for (let i = 0; i < 256; i++) {
    if (rHist[i] > maxCount) maxCount = rHist[i];
    if (gHist[i] > maxCount) maxCount = gHist[i];
    if (bHist[i] > maxCount) maxCount = bHist[i];
  }

  return { rHist, gHist, bHist, lumaHist, maxCount };
}

// Generate 3D LUT string (.cube format) for NLE export
export function generateCubeLUT(settings: ColorGradeSettings, size: number = 17): string {
  let cube = `# AuraGrade Studio 3D LUT\n# Created with AuraGrade Pro\nTITLE "AuraGrade Cinematic Look"\nLUT_3D_SIZE ${size}\n\n`;

  // Build a dummy 1-pixel ImageData to sample the grade pipeline
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 1;
  testCanvas.height = 1;
  const testCtx = testCanvas.getContext('2d')!;
  const src = testCtx.createImageData(1, 1);
  const dst = testCtx.createImageData(1, 1);

  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const inR = Math.round((r / (size - 1)) * 255);
        const inG = Math.round((g / (size - 1)) * 255);
        const inB = Math.round((b / (size - 1)) * 255);

        src.data[0] = inR;
        src.data[1] = inG;
        src.data[2] = inB;
        src.data[3] = 255;

        applyColorGradeToImageData(src, dst, settings);

        const outR = (dst.data[0] / 255).toFixed(6);
        const outG = (dst.data[1] / 255).toFixed(6);
        const outB = (dst.data[2] / 255).toFixed(6);

        cube += `${outR} ${outG} ${outB}\n`;
      }
    }
  }

  return cube;
}
