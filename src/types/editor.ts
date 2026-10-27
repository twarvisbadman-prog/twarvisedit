export interface ColorWheelVal {
  angle: number; // 0 to 360 degrees
  saturation: number; // 0 to 1
  luminance: number; // -1 to 1 (shadows/midtones/highlights offset)
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface CurvesState {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface HSLChannelAdjustment {
  hue: number; // -50 to 50
  saturation: number; // -100 to 100
  luminance: number; // -100 to 100
}

export type HSLColorName =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'magenta';

export type HSLState = Record<HSLColorName, HSLChannelAdjustment>;

export interface ColorBalanceChannel {
  cyanRed: number; // -100 (Cyan) to +100 (Red)
  magentaGreen: number; // -100 (Magenta) to +100 (Green)
  yellowBlue: number; // -100 (Yellow) to +100 (Blue)
}

export interface ColorBalanceState {
  shadows: ColorBalanceChannel;
  midtones: ColorBalanceChannel;
  highlights: ColorBalanceChannel;
  preserveLuminosity: boolean;
}

export interface ColorGradeSettings {
  // Basic Light & Tone
  exposure: number; // -2.0 to 2.0 EV
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100

  // White Balance & Color
  temperature: number; // -100 (Cool/Blue) to 100 (Warm/Amber)
  tint: number; // -100 (Green) to 100 (Magenta)
  vibrance: number; // -100 to 100 (Skin-tone aware)
  saturation: number; // -100 to 100

  // Presence & Details
  texture: number; // -100 to 100
  clarity: number; // -100 to 100
  dehaze: number; // -100 to 100

  // Color Balance (Shadows, Midtones, Highlights)
  colorBalance: ColorBalanceState;

  // 3-Way Color Wheels
  colorWheels: {
    lift: ColorWheelVal; // Shadows
    gamma: ColorWheelVal; // Midtones
    gain: ColorWheelVal; // Highlights
    offset: ColorWheelVal; // Global Master
  };

  // Tone Curves
  curves: CurvesState;

  // HSL Secondary Color Mixer
  hsl: HSLState;

  // Lens & Finishing Effects
  grain: {
    amount: number; // 0 to 100
    size: number; // 1 to 5
    roughness: number; // 0 to 100
  };
  vignette: {
    amount: number; // -100 to 100
    midpoint: number; // 0 to 100
    feather: number; // 0 to 100
  };
  bloom: {
    amount: number; // 0 to 100 (Soft Pro-Mist diffusion)
    radius: number; // 1 to 30
  };
  sharpen: {
    amount: number; // 0 to 100
    radius: number; // 1 to 5
  };

  // Preset blend
  activePresetId: string | null;
  presetBlend: number; // 0 to 100%
}

export type RetouchToolType =
  | 'navigate' // Pan & Zoom
  | 'heal' // Blemish / Acne remover (seamless texture patch)
  | 'skin_smooth' // Frequency separation skin smoothing
  | 'dodge' // Brighten highlights & contours
  | 'burn' // Deepen shadows & contours
  | 'teeth_whiten' // Whiten teeth & sclera
  | 'eye_enhance' // Eye iris pop & clarity
  | 'sharpen' // Eyelashes & detail brush
  | 'clone_stamp'; // Clone texture from source

export interface BrushSettings {
  size: number; // 4 to 250 px
  hardness: number; // 0 to 100%
  strength: number; // 1 to 100%
  flow: number; // 1 to 100%
}

export interface RetouchPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface RetouchStroke {
  id: string;
  tool: RetouchToolType;
  brush: BrushSettings;
  points: RetouchPoint[];
  sourcePoint?: { x: number; y: number }; // For clone stamp
  timestamp: number;
}

export interface CropState {
  isCropping: boolean;
  aspectRatio: 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '3:2' | '2:3';
  cropRect: { x: number; y: number; width: number; height: number }; // 0 to 1 normalized
  rotation: number; // 0, 90, 180, 270
  straighten: number; // -45 to 45 degrees
  flipH: boolean;
  flipV: boolean;
}

export interface ColorGradePreset {
  id: string;
  name: string;
  category: 'Cinematic' | 'Film Analog' | 'Portrait & Beauty' | 'Moody & Dark' | 'Commercial';
  description: string;
  badge: string;
  settings: Partial<ColorGradeSettings>;
}

export interface LoupeData {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  hex: string;
  hsl: { h: number; s: number; l: number };
}
