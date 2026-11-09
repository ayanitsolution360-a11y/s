import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Barcode,
  Zap,
  CheckCircle,
  Scan,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onScan?: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onScan,
  onClose,
}) => {
  const { products, addToCart, playBeep, settings } = usePos();
  const [manualCode, setManualCode] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  if (!isOpen) return null;
  const isBn = settings.language === 'bn';

  const handleSimulateScan = (code: string) => {
    const normalized = code.trim().toLowerCase();
    if (onScan) {
      onScan(code.trim());
      const prod = products.find(
        (p) => p.barcode.toLowerCase() === normalized || p.sku.toLowerCase() === normalized
      );
      if (prod) {
        setLastScanned(isBn && prod.bnName ? prod.bnName : prod.name);
        setTimeout(() => setLastScanned(null), 2500);
      }
      return;
    }

    const prod = products.find(
      (p) => p.barcode.toLowerCase() === normalized || p.sku.toLowerCase() === normalized
    );
    if (prod) {
      addToCart(prod);
      setLastScanned(isBn && prod.bnName ? prod.bnName : prod.name);
      setTimeout(() => setLastScanned(null), 2500);
    } else {
      playBeep('alert');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSimulateScan(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isBn ? 'বারকোড স্ক্যানার ও সিমুলেটর' : 'Barcode Scanner Terminal'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Laser Scanner Graphic Simulation */}
          <div className="relative h-28 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent pointer-events-none" />
            {/* Animated Red Laser scan line */}
            <div className="absolute w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
            
            <Scan className="w-8 h-8 text-emerald-400 opacity-60 mb-1" />
            <span className="text-xs text-slate-300 font-mono">
              {isBn ? 'বারকোড স্ক্যানার সক্রিয়' : 'Barcode Scanner Ready'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isBn
                ? 'USB বা ব্লুটুথ স্ক্যানার সরাসরি কাজ করবে'
                : 'Any USB or Bluetooth Handheld scanner works directly'}
            </span>
          </div>

          {/* Feedback banner */}
          {lastScanned && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isBn ? 'কার্টে যুক্ত হয়েছে:' : 'Scanned & Added to Cart:'} {lastScanned}
              </span>
            </div>
          )}

          {/* Manual Input form */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {isBn ? 'বারকোড বা পণ্যের SKU কোড লিখুন' : 'Enter Barcode or Product SKU'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={isBn ? 'যেমন: RIC-NAZ-5K বা 89411001001' : 'e.g. RIC-NAZ-5K or 89411001001'}
                className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isBn ? 'স্ক্যান' : 'Scan'}</span>
              </button>
            </div>
          </form>

          {/* Click to Simulate Barcode Scan for Demo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{isBn ? 'দ্রুত স্ক্যান করার জন্য ক্লিক করুন (ডেমো)' : 'Click to Simulate Quick Scan'}</span>
              <span>{products.length} {isBn ? 'পণ্য' : 'items'}</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="pt-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 p-1.5 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {isBn && p.bnName ? p.bnName : p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {p.barcode} · {settings.currencySymbol}{p.sellingPrice}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateScan(p.barcode)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shrink-0"
                  >
                    {isBn ? 'স্ক্যান করুন' : 'Simulate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isBn ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
