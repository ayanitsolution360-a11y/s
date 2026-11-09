import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Coins,
  Printer,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose }) => {
  const { invoices, expenses, dueTransactions, settings } = usePos();
  const [openingFloat, setOpeningFloat] = useState<number>(3000);
  const isBn = settings.language === 'bn';

  if (!isOpen) return null;

  // Filter today's cash flows
  const today = new Date().toISOString().slice(0, 10);

  const cashSales = invoices
    .filter((inv) => inv.status !== 'returned' && inv.date.slice(0, 10) === today)
    .reduce((sum, inv) => {
      if (inv.paymentMethod === 'cash') return sum + inv.paidAmount;
      if (inv.paymentMethod === 'split' && inv.splitDetails) {
        const cashPart = inv.splitDetails.find((s) => s.method === 'cash');
        return sum + (cashPart ? cashPart.amount : 0);
      }
      return sum;
    }, 0);

  const cashDueCollected = dueTransactions
    .filter((tx) => tx.type === 'payment_collected' && tx.paymentMethod === 'cash' && tx.date.slice(0, 10) === today)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cashExpenses = expenses
    .filter((e) => e.paymentMethod === 'cash' && e.date.slice(0, 10) === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const expectedDrawerCash = openingFloat + cashSales + cashDueCollected - cashExpenses;

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'ক্যাশ কাউন্টার ড্রয়ার ও শিফট অডিট' : 'Cash Drawer & Shift Register'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Tally Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
              {isBn ? 'ড্রয়ারে প্রত্যাশিত নগদ ক্যাশ' : 'Expected Cash in Drawer'}
            </span>
            <div className="text-3xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {settings.currencySymbol}{expectedDrawerCash.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBn ? 'দৈনিক স্বয়ংক্রিয় ব্যালেন্স চেক' : 'Automated daily drawer balance'}</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {isBn ? 'প্রারম্ভিক ব্যালেন্স (Opening Float):' : 'Opening Cash Float:'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">{settings.currencySymbol}</span>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 text-right font-mono tabular-nums font-bold bg-white border border-slate-200 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isBn ? 'আজকের ক্যাশ বিক্রয়' : "Today's Cash Sales"}:</span>
              </span>
              <strong className="font-mono tabular-nums text-emerald-700 font-bold">
                +{settings.currencySymbol}{cashSales.toLocaleString()}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isBn ? 'বাকি জমা নগদ আদায়' : 'Due Collections (Cash)'}:</span>
              </span>
              <strong className="font-mono tabular-nums text-emerald-700 font-bold">
                +{settings.currencySymbol}{cashDueCollected.toLocaleString()}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1 text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{isBn ? 'নগদ ক্যাশ খরচ' : 'Cash Expenses'}:</span>
              </span>
              <strong className="font-mono tabular-nums text-rose-600 font-bold">
                -{settings.currencySymbol}{cashExpenses.toLocaleString()}
              </strong>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>{isBn ? 'মোট ড্রয়ার ক্যাশ:' : 'Total Drawer Balance:'}</span>
              <span className="font-mono tabular-nums text-emerald-700">
                {settings.currencySymbol}{expectedDrawerCash.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handlePrintZReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isBn ? 'Z-রিপোর্ট প্রিন্ট করুন' : 'Print Shift Z-Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
