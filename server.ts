import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// API Route: AI Color Grading & Retouch Recommendation
app.post('/api/ai-grade', async (req, res) => {
  try {
    const { prompt, styleName } = req.body;

    if (!aiClient) {
      // If no API key configured, provide structured smart presets dynamically
      return res.json({
        success: true,
        source: 'preset-fallback',
        grade: getFallbackSmartGrade(styleName || prompt || 'Cinematic Film'),
        message: 'Applied studio color science preset.',
      });
    }

    const systemInstruction = `You are a world-class Hollywood colorist and high-end beauty retoucher (Arri Alexa, Kodak 5207, DaVinci Resolve color science).
The user wants a professional color grade and retouch parameters matching their creative brief: "${prompt || styleName}".
Respond ONLY with a valid JSON object matching this TypeScript structure, with no markdown code fences:
{
  "exposure": number (-1.5 to 1.5, default 0),
  "contrast": number (-50 to 50, default 10),
  "highlights": number (-50 to 50, default -10),
  "shadows": number (-50 to 50, default 15),
  "whites": number (-50 to 50, default 5),
  "blacks": number (-50 to 50, default -5),
  "temperature": number (-50 to 50, default 0),
  "tint": number (-50 to 50, default 0),
  "vibrance": number (-50 to 50, default 15),
  "saturation": number (-50 to 50, default 5),
  "clarity": number (-30 to 30, default 5),
  "texture": number (-30 to 30, default 0),
  "dehaze": number (-30 to 30, default 0),
  "colorWheels": {
    "lift": { "angle": number (0 to 360), "saturation": number (0 to 1), "luminance": number (-0.5 to 0.5) },
    "gamma": { "angle": number (0 to 360), "saturation": number (0 to 1), "luminance": number (-0.5 to 0.5) },
    "gain": { "angle": number (0 to 360), "saturation": number (0 to 1), "luminance": number (-0.5 to 0.5) }
  },
  "curves": {
    "master": [
      { "x": 0, "y": number (0 to 30) },
      { "x": 64, "y": number (40 to 80) },
      { "x": 192, "y": number (180 to 220) },
      { "x": 255, "y": number (230 to 255) }
    ]
  },
  "grain": { "amount": number (0 to 50), "size": number (1 to 4) },
  "vignette": { "amount": number (-50 to 50) },
  "explanation": "Brief 1-sentence technical explanation of why this grade fits the look"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a pro color grade recipe for: ${prompt || styleName || 'Cinematic Film'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      source: 'gemini',
      grade: parsed,
      message: parsed.explanation || 'Applied AI color grade.',
    });
  } catch (err: any) {
    console.error('Error in /api/ai-grade:', err);
    return res.json({
      success: true,
      source: 'preset-fallback',
      grade: getFallbackSmartGrade(req.body?.styleName || 'Kodak Portra'),
      message: 'Applied studio color science preset (Gemini offline fallback).',
    });
  }
});

function getFallbackSmartGrade(style: string) {
  const s = style.toLowerCase();
  if (s.includes('teal') || s.includes('orange') || s.includes('cyber')) {
    return {
      exposure: 0.1,
      contrast: 18,
      highlights: -15,
      shadows: 10,
      whites: 5,
      blacks: -12,
      temperature: 8,
      tint: -4,
      vibrance: 20,
      saturation: 5,
      clarity: 12,
      texture: 4,
      dehaze: 8,
      colorWheels: {
        lift: { angle: 195, saturation: 0.35, luminance: -0.05 }, // Teal/cyan shadows
        gamma: { angle: 25, saturation: 0.15, luminance: 0.02 },
        gain: { angle: 38, saturation: 0.4, luminance: 0.05 }, // Warm amber highlights
      },
      curves: {
        master: [
          { x: 0, y: 8 },
          { x: 64, y: 55 },
          { x: 192, y: 205 },
          { x: 255, y: 250 },
        ],
      },
      grain: { amount: 15, size: 2 },
      vignette: { amount: -15 },
      explanation: 'Iconic block-buster Teal & Orange split grade: deep cyan low-end with warm radiant skin highlights.',
    };
  }

  if (s.includes('noir') || s.includes('black and white') || s.includes('monochrome')) {
    return {
      exposure: 0.15,
      contrast: 32,
      highlights: -25,
      shadows: -10,
      whites: 18,
      blacks: -20,
      temperature: 0,
      tint: 0,
      vibrance: -100,
      saturation: -100,
      clarity: 22,
      texture: 14,
      dehaze: 10,
      colorWheels: {
        lift: { angle: 0, saturation: 0, luminance: -0.1 },
        gamma: { angle: 0, saturation: 0, luminance: 0.05 },
        gain: { angle: 0, saturation: 0, luminance: 0.1 },
      },
      curves: {
        master: [
          { x: 0, y: 0 },
          { x: 64, y: 48 },
          { x: 192, y: 215 },
          { x: 255, y: 255 },
        ],
      },
      grain: { amount: 35, size: 2.5 },
      vignette: { amount: -28 },
      explanation: 'High-contrast fine art silver monochrome with rich deep blacks and cinematic film grain.',
    };
  }

  // Default: Kodak Portra 400 Natural Skin & Warm Lift
  return {
    exposure: 0.08,
    contrast: 10,
    highlights: -18,
    shadows: 14,
    whites: -5,
    blacks: 12,
    temperature: 12,
    tint: 4,
    vibrance: 14,
    saturation: 2,
    clarity: 6,
    texture: -4,
    dehaze: 0,
    colorWheels: {
      lift: { angle: 45, saturation: 0.15, luminance: 0.04 }, // Soft warm shadow lift
      gamma: { angle: 30, saturation: 0.12, luminance: 0.02 },
      gain: { angle: 42, saturation: 0.22, luminance: 0.03 },
    },
    curves: {
      master: [
        { x: 0, y: 14 }, // Lifted analog black floor
        { x: 64, y: 62 },
        { x: 192, y: 198 },
        { x: 255, y: 248 }, // Soft highlight roll-off
      ],
    },
    grain: { amount: 18, size: 1.8 },
    vignette: { amount: -10 },
    explanation: 'Kodak Portra analog aesthetic: creamy flattering skin tones, lifted soft shadows, and organic highlight roll-off.',
  };
}

// Vite integration
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraGrade Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
