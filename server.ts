import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface RestockProductInput {
  id: string;
  name: string;
  bnName?: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  brand?: string;
  unitsSold7Days: number;
  revenue7Days: number;
}

// Algorithmic fallback if API key is not present or Gemini fails
function computeAlgorithmicRestock(
  products: RestockProductInput[],
  currentMonthName: string
) {
  const predictions = products.map((p) => {
    const dailyVelocity = Math.round((p.unitsSold7Days / 7) * 10) / 10;
    const effectiveVelocity = dailyVelocity > 0 ? dailyVelocity : 0.3;
    const daysLeft = Math.round((p.currentStock / effectiveVelocity) * 10) / 10;

    let urgency: 'critical' | 'moderate' | 'seasonal_surge' | 'optimal' = 'optimal';
    let suggestedQty = 0;
    let seasonalityFactor = 'Regular Demand';
    let aiReasoning = '';
    let aiReasoningBn = '';

    const isWinterSeasonal =
      /tea|nescafe|mustard|radhuni|savlon|napa|creme|detergent/i.test(
        `${p.name} ${p.sku} ${p.category}`
      );

    if (p.currentStock <= 0) {
      urgency = 'critical';
      suggestedQty = Math.max(15, Math.ceil(effectiveVelocity * 14));
      seasonalityFactor = 'Stockout Urgent Alert';
      aiReasoning = `Product is completely out of stock with strong past demand of ${p.unitsSold7Days} units/wk. Reorder immediately to prevent lost sales.`;
      aiReasoningBn = `পণ্যটির স্টক শূন্য এবং সাপ্তাহিক চাহিদা ${p.unitsSold7Days} টি। দ্রুত নতুন স্টক আনুন।`;
    } else if (daysLeft <= 2.5) {
      urgency = 'critical';
      suggestedQty = Math.max(12, Math.ceil(effectiveVelocity * 12));
      seasonalityFactor = 'High Velocity Burn';
      aiReasoning = `Critical run-out risk within ${daysLeft} days at ${dailyVelocity} units/day. Minimum 12-day inventory buffer suggested.`;
      aiReasoningBn = `বর্তমান বিক্রির গতিতে আগামী ${daysLeft} দিনের মধ্যে স্টক শেষ হয়ে যাবে। জরুরি রিস্টক প্রয়োজন।`;
    } else if (daysLeft <= 5.5) {
      urgency = 'moderate';
      suggestedQty = Math.max(8, Math.ceil(effectiveVelocity * 10));
      seasonalityFactor = 'Buffer Depletion';
      aiReasoning = `Stock reaching reorder threshold. Moderate sales velocity warrants safety buffer for ${p.category}.`;
      aiReasoningBn = `স্টক সতর্কীকরণ সীমায় নেমে এসেছে। সাপ্লাই চেইনের স্বাভাবিকতা বজায় রাখতে পণ্য রিস্টক করুন।`;
    } else if (isWinterSeasonal && p.currentStock <= p.minStockAlert * 2.5) {
      urgency = 'seasonal_surge';
      suggestedQty = Math.max(10, Math.ceil(effectiveVelocity * 14));
      seasonalityFactor = `Early Winter Seasonal Surge (${currentMonthName})`;
      aiReasoning = `Seasonal surge anticipated for ${p.category} in ${currentMonthName}. Pre-stocking recommended to capture peak demand.`;
      aiReasoningBn = `${currentMonthName} মাসে ${p.category} পণ্যের মৌসুমি চাহিদা বৃদ্ধি পায়। বাড়তি স্টক সংরক্ষণ লাভজনক হবে।`;
    } else {
      urgency = 'optimal';
      suggestedQty = 0;
      seasonalityFactor = 'Stable Inventory';
      aiReasoning = `Stock level adequate for ${daysLeft} days of operation at current sales rate.`;
      aiReasoningBn = `বর্তমান বিক্রির গতিতে পণ্যটির পর্যাপ্ত স্টক রয়েছে।`;
    }

    return {
      productId: p.id,
      productName: p.name,
      bnName: p.bnName,
      sku: p.sku,
      category: p.category,
      currentStock: p.currentStock,
      unit: p.unit,
      dailyVelocity,
      daysLeft: Math.max(0, daysLeft),
      urgency,
      suggestedRestockQty: suggestedQty,
      estimatedCost: Math.round(suggestedQty * p.costPrice),
      seasonalityFactor,
      aiReasoning,
      aiReasoningBn,
    };
  });

  const needRestock = predictions.filter((p) => p.urgency !== 'optimal');

  return {
    generatedAt: new Date().toISOString(),
    seasonalContext: `Bangladesh Retail Market · ${currentMonthName} Seasonal Demand Cycle`,
    summary: {
      totalItemsToRestock: needRestock.length,
      criticalItemsCount: needRestock.filter((p) => p.urgency === 'critical').length,
      totalEstimatedCost: needRestock.reduce((sum, p) => sum + p.estimatedCost, 0),
    },
    predictions: needRestock.sort((a, b) => {
      const urgencyOrder = { critical: 0, seasonal_surge: 1, moderate: 2, optimal: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.daysLeft - b.daysLeft;
    }),
  };
}

// POST /api/ai/restock-predict
app.post('/api/ai/restock-predict', async (req, res) => {
  try {
    const { products, language = 'en' } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required for restock prediction' });
    }

    const now = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Check if real GEMINI_API_KEY is available (ignore placeholders like 'MY_GEMINI_API_KEY')
    const rawKey = process.env.GEMINI_API_KEY?.trim();
    if (!rawKey || rawKey === 'MY_GEMINI_API_KEY' || rawKey.length < 10) {
      const fallbackReport = computeAlgorithmicRestock(products, currentMonthName);
      return res.json({
        ...fallbackReport,
        source: 'algorithmic',
      });
    }

    // Call Gemini 3.8 Flash model with structured schema
    const prompt = `Analyze the following inventory and sales velocity data for an eSheba Smart POS retail store in Bangladesh during ${currentMonthName}.
Suggest restock quantities, urgency tiers ('critical', 'moderate', 'seasonal_surge', 'optimal'), days of stock left, estimated purchase cost, seasonality factor, and rationale in both English and Bengali.

Inventory Products & 7-Day Velocity Data:
${JSON.stringify(
  products.map((p: RestockProductInput) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    bnName: p.bnName,
    category: p.category,
    currentStock: p.currentStock,
    minAlert: p.minStockAlert,
    unit: p.unit,
    costPrice: p.costPrice,
    unitsSold7Days: p.unitsSold7Days,
    dailyBurnRate: Math.round((p.unitsSold7Days / 7) * 10) / 10,
  })),
  null,
  2
)}

Focus on products that actually need restocking (stockout, critical < 3 days supply, moderate < 6 days, or seasonal surge in ${currentMonthName} like winter groceries, tea, spices, cold meds).
Exclude products that already have plenty of stock.`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 8s')), 8000)
    );

    const response = (await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are an expert retail supply chain and inventory replenishment AI for Bangladeshi Supermarkets and Pharmacies ("eSheba Smart POS").
Assess sales velocity, lead times, safety stocks, and Bangladeshi seasonal buying habits (winter tea, spices, staple grains, cold care).
Output ONLY valid JSON adhering strictly to the requested schema. Provide concise, actionable insights in English and Bengali.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seasonalContext: {
                type: Type.STRING,
                description: 'Summary of the current seasonal buying trend',
              },
              summary: {
                type: Type.OBJECT,
                properties: {
                  totalItemsToRestock: { type: Type.INTEGER },
                  criticalItemsCount: { type: Type.INTEGER },
                  totalEstimatedCost: { type: Type.NUMBER },
                },
                required: ['totalItemsToRestock', 'criticalItemsCount', 'totalEstimatedCost'],
              },
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    productName: { type: Type.STRING },
                    bnName: { type: Type.STRING },
                    sku: { type: Type.STRING },
                    category: { type: Type.STRING },
                    currentStock: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    dailyVelocity: { type: Type.NUMBER },
                    daysLeft: { type: Type.NUMBER },
                    urgency: {
                      type: Type.STRING,
                      description: "Must be 'critical', 'moderate', 'seasonal_surge', or 'optimal'",
                    },
                    suggestedRestockQty: { type: Type.INTEGER },
                    estimatedCost: { type: Type.NUMBER },
                    seasonalityFactor: { type: Type.STRING },
                    aiReasoning: { type: Type.STRING },
                    aiReasoningBn: { type: Type.STRING },
                  },
                  required: [
                    'productId',
                    'productName',
                    'sku',
                    'category',
                    'currentStock',
                    'unit',
                    'dailyVelocity',
                    'daysLeft',
                    'urgency',
                    'suggestedRestockQty',
                    'estimatedCost',
                    'seasonalityFactor',
                    'aiReasoning',
                  ],
                },
              },
            },
            required: ['seasonalContext', 'summary', 'predictions'],
          },
        },
      }),
      timeoutPromise,
    ])) as any;

    const parsedJson = JSON.parse(response.text || '{}');

    return res.json({
      ...parsedJson,
      generatedAt: now.toISOString(),
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Gemini API Error during restock prediction:', error);
    // Graceful fallback to algorithmic forecast
    const fallbackReport = computeAlgorithmicRestock(
      req.body.products || [],
      new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    );
    return res.json({
      ...fallbackReport,
      source: 'algorithmic-fallback',
      warning: 'AI generated via local forecasting due to upstream latency',
    });
  }
});

// Vite mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`eSheba Smart POS server listening on port ${PORT}`);
  });
}

startServer();
