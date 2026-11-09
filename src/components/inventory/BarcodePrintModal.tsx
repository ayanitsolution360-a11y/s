import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Printer,
  Barcode,
  Layers,
  Settings2,
  Check,
  Eye,
  Store,
  Tag,
} from 'lucide-react';
import { Product } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';

interface BarcodePrintModalProps {
  product: Product | null;
  bulkProducts?: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  product,
  bulkProducts,
  isOpen,
  onClose,
}) => {
  const { settings, products: allProducts } = usePos();
  const isBn = settings.language === 'bn';

  // State for label printing
  const [labelCount, setLabelCount] = useState<number>(8);
  const [labelStyle, setLabelStyle] = useState<'shelf' | 'sticker' | 'minimal'>('shelf');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBnName, setShowBnName] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);

  if (!isOpen) return null;

  // Determine which products to print
  const productsToPrint: Product[] = bulkProducts && bulkProducts.length > 0
    ? bulkProducts
    : product
    ? [product]
    : [];

  if (productsToPrint.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'বারকোড ও শেল্ফ প্রাইস ট্যাগ জেনারেটর' : 'Printable Barcode & Shelf Label Generator'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {productsToPrint.length > 1
                  ? isBn
                    ? `${productsToPrint.length} টি নির্বাচিত পণ্যের স্টিকার প্রিন্ট`
                    : `Printing shelf labels for ${productsToPrint.length} products`
                  : isBn
                  ? `${productsToPrint[0]?.name} এর জন্য বারকোড তৈরি হচ্ছে`
                  : `Generating scannable barcode for ${productsToPrint[0]?.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 text-xs">
          {/* Label Style Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'লেবেল ফরম্যাট' : 'Label Format Style'}</span>
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLabelStyle('shelf')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  labelStyle === 'shelf'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isBn ? 'শেল্ফ ট্যাগ' : 'Shelf Tag'}
              </button>
              <button
                type="button"
                onClick={() => setLabelStyle('sticker')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  labelStyle === 'sticker'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isBn ? 'স্টিকার' : 'Sticker'}
              </button>
              <button
                type="button"
                onClick={() => setLabelStyle('minimal')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  labelStyle === 'minimal'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isBn ? 'মিনিমাল' : 'Minimal'}
              </button>
            </div>
          </div>

          {/* Copies Per Product */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'কপি সংখ্যা (প্রতি পণ্য)' : 'Copies per Product'}</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[2, 4, 8, 12, 24].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setLabelCount(c)}
                  className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-center border transition-all ${
                    labelCount === c
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Display Toggles */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'লেবেলের তথ্য টগল' : 'Content Toggles'}</span>
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <label className="flex items-center gap-1 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isBn ? 'দোকানের নাম' : 'Store'}</span>
              </label>

              <label className="flex items-center gap-1 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isBn ? 'মূল্য' : 'Price'}</span>
              </label>

              <label className="flex items-center gap-1 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBnName}
                  onChange={(e) => setShowBnName(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isBn ? 'বাংলা নাম' : 'Bangla'}</span>
              </label>

              <label className="flex items-center gap-1 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>SKU</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable Labels Canvas Viewport */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div
            id="shelf-labels-print-area"
            className="w-full max-w-3xl bg-white p-6 shadow-sm border border-slate-200 rounded-xl"
          >
            {/* Sheet Grid */}
            <div
              className={`grid gap-3 ${
                labelStyle === 'shelf'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : labelStyle === 'sticker'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              }`}
            >
              {productsToPrint.flatMap((prod) =>
                Array.from({ length: labelCount }).map((_, idx) => (
                  <div
                    key={`${prod.id}-${idx}`}
                    className={`border border-slate-300 bg-white rounded-lg flex flex-col justify-between text-center overflow-hidden break-inside-avoid shadow-2xs select-text ${
                      labelStyle === 'shelf'
                        ? 'p-3 min-h-[145px]'
                        : labelStyle === 'sticker'
                        ? 'p-2 min-h-[120px]'
                        : 'p-2 min-h-[95px]'
                    }`}
                  >
                    {/* Top: Store Name */}
                    {showStoreName && (
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600 truncate border-b border-dashed border-slate-200 pb-1 w-full">
                        {settings.storeName}
                      </div>
                    )}

                    {/* Middle: Product Name */}
                    <div className="py-1">
                      <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {showBnName && prod.bnName ? prod.bnName : prod.name}
                      </div>
                      {showBnName && prod.bnName && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {prod.name}
                        </div>
                      )}
                    </div>

                    {/* Barcode Generated via JsBarcode */}
                    <div className="py-1 flex items-center justify-center">
                      <BarcodeSvg
                        value={prod.barcode}
                        format="CODE128"
                        height={labelStyle === 'shelf' ? 36 : labelStyle === 'sticker' ? 28 : 24}
                        width={1.4}
                        fontSize={10}
                        displayValue={true}
                      />
                    </div>

                    {/* Bottom: SKU and Large Price Banner */}
                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between gap-1 w-full mt-auto">
                      {showSku ? (
                        <span className="text-[9px] font-mono text-slate-500 truncate">
                          {prod.sku} · {prod.unit}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400">
                          {prod.unit}
                        </span>
                      )}

                      {showPrice && (
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900 leading-none">
                          {settings.currencySymbol}
                          {prod.sellingPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            {productsToPrint.length * labelCount} {isBn ? 'টি লেবেল তৈরি হয়েছে' : 'labels ready to print'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'প্রিন্ট করুন (Print Labels)' : 'Print Shelf Labels'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
