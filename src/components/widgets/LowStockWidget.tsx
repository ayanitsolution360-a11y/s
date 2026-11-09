import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  AlertTriangle,
  PackageX,
  ArrowRight,
  Plus,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';

interface LowStockWidgetProps {
  onNavigateToInventory?: () => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  onNavigateToInventory,
}) => {
  const { products, adjustStock, setActiveTab, settings, playBeep } = usePos();
  const isBn = settings.language === 'bn';

  // Identify products reaching or below reorder level
  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStockAlert)
    .sort((a, b) => {
      // Sort out of stock first, then by stock/minStockAlert ratio
      if (a.stock === 0 && b.stock > 0) return -1;
      if (b.stock === 0 && a.stock > 0) return 1;
      return a.stock / a.minStockAlert - b.stock / b.minStockAlert;
    });

  // Calculate total units needed to restore to safety stock + buffer
  const totalUnitsDeficit = lowStockProducts.reduce((sum, p) => {
    const target = Math.max(p.minStockAlert * 2, 10);
    return sum + Math.max(0, target - p.stock);
  }, 0);

  // Calculate estimated replenishment investment cost
  const totalRestockCost = lowStockProducts.reduce((sum, p) => {
    const target = Math.max(p.minStockAlert * 2, 10);
    const deficit = Math.max(0, target - p.stock);
    return sum + deficit * p.costPrice;
  }, 0);

  // Quick single-item restock
  const handleQuickRestock = (product: Product, unitsToAdd: number) => {
    adjustStock(product.id, product.stock + unitsToAdd);
    playBeep('success');
  };

  // Bulk restock all low items to recommended safety level
  const handleRestockAll = () => {
    lowStockProducts.forEach((p) => {
      const target = Math.max(p.minStockAlert * 2, 10);
      const unitsNeeded = Math.max(0, target - p.stock);
      if (unitsNeeded > 0) {
        adjustStock(p.id, p.stock + unitsNeeded);
      }
    });
    playBeep('success');
  };

  const handleGoToInventory = () => {
    if (onNavigateToInventory) {
      onNavigateToInventory();
    } else {
      setActiveTab('inventory');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Widget Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'লো স্টক ও রি-অর্ডার এলার্ট' : 'Low Stock & Reorder Alert'}
              </h3>
              {lowStockProducts.length > 0 && (
                <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {lowStockProducts.length} {isBn ? 'টি পণ্য' : 'items'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isBn
                ? 'যেসব পণ্য পুনঃঅর্ডার সীমার নিচে পৌঁছেছে বা ফুরিয়ে গেছে'
                : 'Products at or below reorder threshold needing immediate restock'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {lowStockProducts.length > 0 && (
            <button
              type="button"
              onClick={handleRestockAll}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Restock all items to safe buffer level"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'সব পণ্য একসাথে রিস্টক' : 'Restock All to Target'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGoToInventory}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>{isBn ? 'ইনভেন্টরিতে দেখুন' : 'Full Inventory'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {lowStockProducts.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">
            {isBn ? 'সকল পণ্যের স্টক পর্যাপ্ত রয়েছে' : 'All Products Sufficiently Stocked'}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-sm">
            {isBn
              ? 'বর্তমানে কোনো পণ্য রি-অর্ডার সীমার নিচে নেই। বিক্রয় স্বাভাবিকভাবে চলবে।'
              : 'No items have reached their reorder alert threshold. Inventory levels are healthy.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Summary Strip */}
          <div className="px-5 py-2.5 bg-amber-50/50 flex flex-wrap items-center justify-between text-xs text-amber-900 border-b border-amber-100 gap-2 font-medium">
            <span>
              {isBn ? 'প্রয়োজনীয় ইউনিট সংখ্যা:' : 'Estimated Units Needed:'}{' '}
              <strong className="font-mono tabular-nums font-bold">
                {totalUnitsDeficit} units
              </strong>
            </span>
            <span>
              {isBn ? 'আনুমানিক ক্রয় বিনিয়োগ:' : 'Estimated Restock Cost:'}{' '}
              <strong className="font-mono tabular-nums font-bold">
                {settings.currencySymbol}{totalRestockCost.toLocaleString()}
              </strong>
            </span>
          </div>

          {/* List of Low Stock Products */}
          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {lowStockProducts.map((product) => {
              const isOut = product.stock <= 0;
              const reorderThreshold = product.minStockAlert;
              const suggestedRestock = Math.max(reorderThreshold * 2, 10) - product.stock;
              const stockPercentage = Math.min(
                100,
                Math.round((product.stock / Math.max(reorderThreshold, 1)) * 100)
              );

              return (
                <div
                  key={product.id}
                  className="px-5 py-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Product Details & Level */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {isBn && product.bnName ? product.bnName : product.name}
                      </span>
                      {isOut ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-100 text-rose-700">
                          {isBn ? 'স্টক শেষ' : 'Out of Stock'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-800">
                          {isBn ? 'লো স্টক' : 'Reorder Now'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono tabular-nums">
                      <span>SKU: {product.sku}</span>
                      <span>·</span>
                      <span>
                        {isBn ? 'ক্রয়মূল্য' : 'Cost'}: {settings.currencySymbol}
                        {product.costPrice}
                      </span>
                      <span>·</span>
                      <span>
                        {isBn ? 'বিক্রয়' : 'Price'}: {settings.currencySymbol}
                        {product.sellingPrice}
                      </span>
                    </div>

                    {/* Stock level bar */}
                    <div className="flex items-center gap-2 pt-1 max-w-xs">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOut
                              ? 'bg-rose-500'
                              : stockPercentage <= 50
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(6, stockPercentage)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-slate-600 font-semibold shrink-0">
                        {product.stock} / {reorderThreshold} {product.unit} (reorder level)
                      </span>
                    </div>
                  </div>

                  {/* Restock Action Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(product, 10)}
                      className="px-2.5 py-1 text-xs font-semibold font-mono tabular-nums text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                      title="Add 10 units"
                    >
                      +10
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRestock(product, 25)}
                      className="px-2.5 py-1 text-xs font-semibold font-mono tabular-nums text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                      title="Add 25 units"
                    >
                      +25
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickRestock(product, Math.max(suggestedRestock, 10))
                      }
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      title={`Restock +${Math.max(suggestedRestock, 10)} units to safe target`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isBn ? 'রিস্টক' : 'Quick Restock'}</span>
                      <span className="font-mono tabular-nums">
                        (+{Math.max(suggestedRestock, 10)})
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
