import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { X, Check, Banknote, Smartphone, Receipt } from 'lucide-react';
import { Customer } from '../../types';

interface DuePaymentModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DuePaymentModal: React.FC<DuePaymentModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { collectDuePayment, settings } = usePos();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [note, setNote] = useState<string>('');

  React.useEffect(() => {
    if (customer) {
      setAmount(customer.dueAmount);
      setNote('');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;
  const isBn = settings.language === 'bn';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    collectDuePayment(customer.id, amount, method, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'বাকি টাকা আদায় / জমা গ্রহণ' : 'Collect Due Payment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">{customer.name}</h4>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">{customer.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                {isBn ? 'বর্তমান বকেয়া' : 'Current Due'}
              </span>
              <div className="text-lg font-bold font-mono tabular-nums text-rose-600">
                {settings.currencySymbol}{customer.dueAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {isBn ? 'আদায়কৃত টাকার পরিমাণ *' : 'Amount Received *'}
              </label>
              <button
                type="button"
                onClick={() => setAmount(customer.dueAmount)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                {isBn ? 'সম্পূর্ণ বকেয়া' : 'Full Due'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                max={customer.dueAmount}
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              {isBn ? 'পরিশোধের মাধ্যম' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: isBn ? 'ক্যাশ' : 'Cash', icon: Banknote },
                { id: 'bkash', label: 'bKash', icon: Smartphone },
                { id: 'nagad', label: 'Nagad', icon: Smartphone },
                { id: 'bank', label: isBn ? 'ব্যাংক' : 'Bank', icon: Receipt },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as 'cash' | 'bkash' | 'nagad' | 'bank')}
                    className={`py-2 px-1 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'মন্তব্য বা ট্রানজেকশন রেফারেন্স' : 'Note / Reference (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isBn ? 'যেমন: বিকাশ ট্রানজেকশন বা মেমো রসিদ নং' : 'e.g. Receipt # or bKash TrxID'}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Remaining After Payment */}
          <div className="text-[11px] font-mono tabular-nums text-slate-500 flex justify-between px-1">
            <span>{isBn ? 'পেমেন্টের পর অবশিষ্ট বাকি থাকবে:' : 'Remaining Due Balance:'}</span>
            <strong className="text-slate-800">
              {settings.currencySymbol}
              {Math.max(0, customer.dueAmount - amount).toLocaleString()}
            </strong>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={amount <= 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? 'জমা নিশ্চিত করুন' : 'Confirm Collection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
