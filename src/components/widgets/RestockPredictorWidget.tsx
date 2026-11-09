import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  Calendar,
  DollarSign,
  ChevronRight,
  Flame,
  Snowflake,
  ShieldAlert,
  CheckCircle2,
  PackagePlus,
  Info,
} from 'lucide-react';

interface RestockPrediction {
  productId: string;
  productName: string;
  bnName?: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  dailyVelocity: number;
  daysLeft: number;
  urgency: 'critical' | 'moderate' | 'seasonal_surge' | 'optimal';
  suggestedRestockQty: number;
  estimatedCost: number;
  seasonalityFactor: string;
  aiReasoning: string;
  aiReasoningBn?: string;
}

interface RestockReport {
  generatedAt: string;
  seasonalContext: string;
  source?: string;
  summary: {
    totalItemsToRestock: number;
    criticalItemsCount: number;
    totalEstimatedCost: number;
  };
  predictions: RestockPrediction[];
}

export const RestockPredictorWidget: React.FC = () => {
  const { products, invoices, adjustStock, settings, playBeep } = usePos();
  const isBn = settings.language === 'bn';

  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<RestockReport | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'seasonal_surge' | 'moderate'>('all');
  const [restockedMap, setRestockedMap] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute past 7-day velocity per product
  const unitsSoldMap = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;

    invoices.forEach((inv) => {
      if (inv.status === 'returned') return;
      if (new Date(inv.date).getTime() < sevenDaysAgo) return;

      inv.items.forEach((item) => {
        const curr = map.get(item.product.id) || { qty: 0, revenue: 0 };
        map.set(item.product.id, {
          qty: curr.qty + item.quantity,
          revenue: curr.revenue + item.total,
        });
      });
    });
    return map;
  }, [invoices]);

  const generatePredictions = useCallback(async () => {
    setLoading(true);
    try {
      const productInputs = products.map((p) => {
        const stats = unitsSoldMap.get(p.id) || { qty: 0, revenue: 0 };
        return {
          id: p.id,
          name: p.name,
          bnName: p.bnName,
          sku: p.sku,
          category: p.category,
          currentStock: p.stock,
          minStockAlert: p.minStockAlert,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          unit: p.unit,
          brand: p.brand,
          unitsSold7Days: stats.qty,
          revenue7Days: stats.revenue,
        };
      });

      const res = await fetch('/api/ai/restock-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productInputs,
          language: settings.language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: RestockReport = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch AI restock predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [products, unitsSoldMap, settings.language]);

  // Initial auto-generation on mount
  useEffect(() => {
    generatePredictions();
  }, [generatePredictions]);

  // Quick Restock action execution
  const handleExecuteRestock = (item: RestockPrediction) => {
    const targetProduct = products.find((p) => p.id === item.productId);
    if (!targetProduct) return;

    const newStock = targetProduct.stock + item.suggestedRestockQty;
    adjustStock(targetProduct.id, newStock);
    playBeep('success');

    setRestockedMap((prev) => ({
      ...prev,
      [item.productId]: (prev[item.productId] || 0) + item.suggestedRestockQty,
    }));

    const name = isBn && item.bnName ? item.bnName : item.productName;
    const msg = isBn
      ? `সফলভাবে ${item.suggestedRestockQty} ${item.unit} "${name}" রিস্টক করা হয়েছে!`
      : `Restocked ${item.suggestedRestockQty} ${item.unit} of "${name}" successfully!`;

    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredPredictions = useMemo(() => {
    if (!report?.predictions) return [];
    if (selectedFilter === 'all') return report.predictions;
    return report.predictions.filter((p) => p.urgency === selectedFilter);
  }, [report, selectedFilter]);

  const criticalCount = report?.predictions.filter((p) => p.urgency === 'critical').length || 0;
  const seasonalCount = report?.predictions.filter((p) => p.urgency === 'seasonal_surge').length || 0;
  const moderateCount = report?.predictions.filter((p) => p.urgency === 'moderate').length || 0;

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'AI স্মার্ট রিস্টক প্রেডিক্টর' : 'AI Restock Predictor'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? 'বিক্রয়ের বেগ, স্টক শেষ হওয়ার ঝুঁকি ও স্থানীয় মৌসুমি চাহিদার AI পূর্বাভাস'
                : 'Demand forecasting powered by historical sales velocity and seasonal buying cycles'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={generatePredictions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors border border-slate-200"
            title="Refresh AI Forecast"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{isBn ? 'পুনরায় বিশ্লেষণ' : 'Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Seasonal Context Banner */}
      {report?.seasonalContext && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/70 via-emerald-50/60 to-slate-50 border border-amber-200/60 rounded-lg flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{report.seasonalContext}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {isBn ? 'দৈনিক বিক্রয় বেগের ভিত্তিতে হিসাবকৃত' : 'Derived from 7-day velocity'}
          </span>
        </div>
      )}

      {/* Summary KPI Strip */}
      {report?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block">
              {isBn ? 'প্রস্তাবিত মোট রিস্টক আইটেম' : 'Recommended Items'}
            </span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {report.summary.totalItemsToRestock} {isBn ? 'টি পণ্য' : 'products'}
            </div>
            <span className="text-[10px] text-slate-400">
              {criticalCount} {isBn ? 'টি জরুরি' : 'critical risk'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block">
              {isBn ? 'আনুমানিক রিস্টক ইনভেস্টমেন্ট' : 'Estimated Capital Needed'}
            </span>
            <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {settings.currencySymbol}
              {report.summary.totalEstimatedCost.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">
              {isBn ? 'পাইকারি ক্রয়মূল্যের ভিত্তিতে' : 'At wholesale cost basis'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block">
              {isBn ? 'মৌসুমি ও বিক্রয় চাপ' : 'Seasonal Surge Items'}
            </span>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-700 mt-0.5">
              {seasonalCount} {isBn ? 'টি পণ্য' : 'surging items'}
            </div>
            <span className="text-[10px] text-slate-400">
              {isBn ? 'শীতকালীন চাহিদা বৃদ্ধি' : 'Early winter category spike'}
            </span>
          </div>
        </div>
      )}

      {/* Filter Segmented Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isBn ? 'সকল সুপারিশ' : 'All Suggestions'} ({report?.predictions?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('critical')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'critical'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isBn ? 'জরুরি শেষ হওয়ার পথে' : 'Critical Stockout Risk'}</span>
          <span>({criticalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('seasonal_surge')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'seasonal_surge'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Snowflake className="w-3.5 h-3.5" />
          <span>{isBn ? 'মৌসুমি চাহিদা বৃদ্ধি' : 'Seasonal Surge'}</span>
          <span>({seasonalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('moderate')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedFilter === 'moderate'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isBn ? 'মধ্যম বাফার' : 'Moderate Buffer'} ({moderateCount})
        </button>
      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Predictions Table / Cards */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-600">
            {isBn ? 'AI মডেল বিক্রয় বেগ ও ঋতুভিত্তিক চাহিদা বিশ্লেষণ করছে...' : 'Gemini AI is analyzing sales velocity and winter seasonality trends...'}
          </p>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          <PackageCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
          <p className="font-semibold text-slate-700">
            {isBn ? 'নির্বাচিত ফিল্টারে কোনো রিস্টক সুপারিশ নেই' : 'No restock recommendations found for this filter'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'ইনভেন্টরি পর্যাপ্ত রয়েছে' : 'All items have optimal inventory health'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {filteredPredictions.map((item) => {
            const hasRestocked = restockedMap[item.productId];
            const liveProduct = products.find((p) => p.id === item.productId);
            const currentStockDisplay = liveProduct ? liveProduct.stock : item.currentStock;

            return (
              <div
                key={item.productId}
                className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Product & SKU details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {isBn && item.bnName ? item.bnName : item.productName}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      SKU: {item.sku}
                    </span>
                    {item.urgency === 'critical' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        <span>{isBn ? 'জরুরি রিস্টক' : 'Critical Stockout'}</span>
                      </span>
                    ) : item.urgency === 'seasonal_surge' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Snowflake className="w-3 h-3 text-amber-600" />
                        <span>{isBn ? 'মৌসুমি চাহিদা' : 'Seasonal Surge'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {isBn ? 'মধ্যম সতর্কতা' : 'Reorder Buffer'}
                      </span>
                    )}
                  </div>

                  {/* AI Reasoning Text */}
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isBn && item.aiReasoningBn ? item.aiReasoningBn : item.aiReasoning}
                  </p>

                  {/* Velocity and Seasonality factor tags */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>
                      {isBn ? 'বিক্রয় বেগ:' : 'Velocity:'}{' '}
                      <strong className="text-slate-600">{item.dailyVelocity} {item.unit}/day</strong>
                    </span>
                    <span>·</span>
                    <span>
                      {isBn ? 'অবশিষ্ট সরবরাহ:' : 'Supply Left:'}{' '}
                      <strong className={item.daysLeft <= 2 ? 'text-rose-600' : 'text-slate-700'}>
                        {item.daysLeft} days
                      </strong>
                    </span>
                    <span>·</span>
                    <span className="text-amber-800 font-sans font-medium">
                      {item.seasonalityFactor}
                    </span>
                  </div>
                </div>

                {/* Right: Recommendation & Quick Restock Button */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-[11px] text-slate-400 font-sans">
                      {isBn ? 'বর্তমান স্টক' : 'Current Stock'}:{' '}
                      <strong className="font-mono text-slate-800">{currentStockDisplay} {item.unit}</strong>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      +{item.suggestedRestockQty} {item.unit}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ≈ {settings.currencySymbol}{item.estimatedCost.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteRestock(item)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-[0.98] ${
                      hasRestocked
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>
                      {hasRestocked
                        ? isBn
                          ? `রিস্টক করা হয়েছে (+${hasRestocked})`
                          : `Restocked (+${hasRestocked})`
                        : isBn
                        ? `রিস্টক করুন (+${item.suggestedRestockQty})`
                        : `Restock (+${item.suggestedRestockQty})`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
