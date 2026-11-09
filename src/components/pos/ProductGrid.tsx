import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Search,
  Barcode,
  Plus,
  AlertTriangle,
  PackageX,
  Sparkles,
  Camera,
} from 'lucide-react';

interface ProductGridProps {
  onOpenScanner: () => void;
  onOpenPhoneCameraScanner?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  onOpenScanner,
  onOpenPhoneCameraScanner,
}) => {
  const { products, categories, addToCart, settings, playBeep } = usePos();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const isBn = settings.language === 'bn';

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.bnName && product.bnName.toLowerCase().includes(q)) ||
        product.barcode.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Enter key on main search input (instant add for exact SKU or barcode match)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // 1. Check exact SKU or barcode match first
      const exactMatch = products.find(
        (p) => p.sku.toLowerCase() === q || p.barcode.toLowerCase() === q
      );

      if (exactMatch) {
        if (exactMatch.stock > 0) {
          addToCart(exactMatch);
          setSearchQuery('');
        } else {
          playBeep('alert');
        }
        return;
      }

      // 2. If filtered result has exactly 1 product, add it directly
      if (filteredProducts.length === 1) {
        const item = filteredProducts[0];
        if (item.stock > 0) {
          addToCart(item);
          setSearchQuery('');
        } else {
          playBeep('alert');
        }
      }
    }
  };

  // Count how many products matched specifically by SKU
  const skuMatchCount = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return 0;
    return filteredProducts.filter((p) => p.sku.toLowerCase().includes(q)).length;
  }, [filteredProducts, searchQuery]);

  // Handle direct barcode/SKU input submission (simulate hardware scanner or quick entry)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const trimmed = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === trimmed ||
        p.sku.toLowerCase() === trimmed
    );

    if (found) {
      if (found.stock > 0) {
        addToCart(found);
      } else {
        playBeep('alert');
      }
      setBarcodeInput('');
    } else {
      playBeep('alert');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Top Search & Filter Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                isBn
                  ? 'পণ্য SKU (যেমন RIC-NAZ-5K), নাম বা বারকোড দিয়ে খুঁজুন [Enter চাপুন]...'
                  : 'Search by SKU (e.g. RIC-NAZ-5K), product name, or barcode [Press Enter]...'
              }
              className="w-full pl-9 pr-24 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg outline-none transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {skuMatchCount > 0 && searchQuery && (
                <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  SKU ({skuMatchCount})
                </span>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Barcode / SKU Quick Entry & Scanner Launcher */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative w-44 sm:w-56">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={isBn ? 'বারকোড / SKU স্ক্যান...' : 'Scan Barcode / SKU...'}
                className="w-full pl-8 pr-2 py-2 text-sm font-mono tabular-nums bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
              title="Open Barcode Scanner Tool"
            >
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">{isBn ? 'স্ক্যানার' : 'Scanner'}</span>
            </button>

            {onOpenPhoneCameraScanner && (
              <button
                type="button"
                onClick={onOpenPhoneCameraScanner}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                title="Scan Barcode with Camera"
              >
                <Camera className="w-4 h-4 text-slate-600" />
                <span className="hidden md:inline">{isBn ? 'ক্যামেরা' : 'Camera'}</span>
              </button>
            )}
          </form>
        </div>

        {/* Category Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {isBn ? cat.bnName : cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Cards Grid Viewport */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <PackageX className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              {isBn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isBn
                ? 'অন্য কোনো নাম বা বারকোড দিয়ে চেষ্টা করুন'
                : 'Try searching with another keyword or category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = !isOutOfStock && product.stock <= product.minStockAlert;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`group relative flex flex-col justify-between p-3.5 bg-white border rounded-xl transition-all select-none text-left ${
                    isOutOfStock
                      ? 'border-slate-200 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-emerald-500 hover:shadow-sm cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Top Metadata */}
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] mb-1.5">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors truncate max-w-[130px] ${
                          searchQuery && product.sku.toLowerCase().includes(searchQuery.toLowerCase().trim())
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold ring-1 ring-emerald-400'
                            : 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
                        }`}
                        title={`SKU: ${product.sku}`}
                      >
                        SKU: {product.sku}
                      </span>
                      {product.brand && (
                        <span className="truncate max-w-[90px] text-[10px] text-slate-500 font-medium">
                          {product.brand}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {isBn && product.bnName ? product.bnName : product.name}
                    </h4>

                    {isBn && product.bnName && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {product.name}
                      </p>
                    )}
                  </div>

                  {/* Bottom Price & Stock Row */}
                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">
                        {product.unit}
                      </div>
                      <div className="text-base font-bold text-emerald-700 font-mono tabular-nums leading-none mt-0.5">
                        {settings.currencySymbol}
                        {product.sellingPrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <div className="text-[11px] font-medium text-rose-600 flex items-center gap-1 justify-end">
                          <PackageX className="w-3 h-3" />
                          <span>{isBn ? 'স্টক শেষ' : 'Out'}</span>
                        </div>
                      ) : isLowStock ? (
                        <div className="text-[11px] font-medium text-amber-600 flex items-center gap-0.5 justify-end">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-mono tabular-nums">
                            {product.stock} {isBn ? 'বাকি' : 'left'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {isBn ? 'স্টক' : 'Stock'}: {product.stock}
                        </div>
                      )}

                      {!isOutOfStock && (
                        <button
                          type="button"
                          className="mt-1 w-6 h-6 rounded bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors ml-auto"
                          title="Add to Cart"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
