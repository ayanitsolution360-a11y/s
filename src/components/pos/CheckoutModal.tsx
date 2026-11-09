import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Split,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethod, SplitPaymentDetail } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const {
    cartGrandTotal,
    selectedCustomer,
    completeSale,
    settings,
  } = usePos();

  const isBn = settings.language === 'bn';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(cartGrandTotal);
  const [trxId, setTrxId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Split payment state
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitDigital, setSplitDigital] = useState<number>(0);
  const [splitDigitalMethod, setSplitDigitalMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [splitDue, setSplitDue] = useState<number>(0);

  // Sync tendered amount when total changes
  useEffect(() => {
    setTenderedAmount(cartGrandTotal);
    setSplitCash(cartGrandTotal);
    setSplitDigital(0);
    setSplitDue(0);
  }, [cartGrandTotal]);

  if (!isOpen) return null;

  // Change and Due calculation
  const changeToReturn =
    paymentMethod === 'cash' && tenderedAmount > cartGrandTotal
      ? tenderedAmount - cartGrandTotal
      : 0;

  const dueAmount =
    paymentMethod === 'due'
      ? cartGrandTotal
      : paymentMethod === 'cash' && tenderedAmount < cartGrandTotal
      ? cartGrandTotal - tenderedAmount
      : isSplitMode
      ? splitDue
      : 0;

  const isDueValid =
    dueAmount === 0 ||
    selectedCustomer.id !== 'cust-walkin';

  // Quick cash buttons
  const quickCashOptions = [
    { label: isBn ? 'সঠিক টাকা' : 'Exact', val: cartGrandTotal },
    { label: '50', val: 50 },
    { label: '100', val: 100 },
    { label: '500', val: 500 },
    { label: '1000', val: 1000 },
    { label: '2000', val: 2000 },
    { label: '5000', val: 5000 },
  ];

  const handleComplete = () => {
    if (!isDueValid) {
      alert(
        isBn
          ? 'খুচরা ক্রেতাকে (Walk-in) বাকিতে পণ্য বিক্রি করা যাবে না। দয়া করে নির্দিষ্ট গ্রাহক সিলেক্ট করুন।'
          : 'Due sale is not allowed for Walk-in Customer. Please select a registered customer.'
      );
      return;
    }

    let splitDetails: SplitPaymentDetail[] | undefined = undefined;
    let actualPaid = tenderedAmount;

    if (isSplitMode) {
      splitDetails = [
        { method: 'cash', amount: splitCash },
        { method: splitDigitalMethod, amount: splitDigital, trxId },
      ];
      if (splitDue > 0) {
        splitDetails.push({ method: 'due', amount: splitDue });
      }
      actualPaid = splitCash + splitDigital;
    } else if (paymentMethod === 'due') {
      actualPaid = 0;
    } else if (paymentMethod !== 'cash') {
      actualPaid = cartGrandTotal;
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    completeSale({
      paidAmount: actualPaid,
      paymentMethod: isSplitMode ? 'split' : paymentMethod,
      splitDetails,
      trxId: trxId.trim() || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isBn ? 'বিল পরিশোধ ও পেমেন্ট সম্পন্নকরণ' : 'Payment & Checkout'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn ? 'গ্রাহক' : 'Customer'}: <span className="font-semibold text-slate-800">{selectedCustomer.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Total Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">
                {isBn ? 'মোট প্রদেয় বিল' : 'Grand Total Due'}
              </span>
              <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-white">
                {settings.currencySymbol}{cartGrandTotal.toLocaleString()}
              </div>
            </div>

            {/* Split toggle */}
            <button
              type="button"
              onClick={() => setIsSplitMode(!isSplitMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isSplitMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{isBn ? 'একাধিক মাধ্যম' : 'Split Payment'}</span>
            </button>
          </div>

          {!isSplitMode ? (
            <>
              {/* Payment Methods Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  {isBn ? 'পেমেন্টের মাধ্যম নির্বাচন করুন' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setTenderedAmount(cartGrandTotal);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold">{isBn ? 'ক্যাশ' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('bkash');
                      setTenderedAmount(cartGrandTotal);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50/60 text-pink-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-pink-600" />
                    <span className="text-xs font-semibold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('nagad');
                      setTenderedAmount(cartGrandTotal);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'nagad'
                        ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-semibold">Nagad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('rocket');
                      setTenderedAmount(cartGrandTotal);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'rocket'
                        ? 'border-purple-500 bg-purple-50/60 text-purple-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-semibold">Rocket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setTenderedAmount(cartGrandTotal);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50/60 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-semibold">{isBn ? 'কার্ড' : 'Card'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('due');
                      setTenderedAmount(0);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'due'
                        ? 'border-rose-500 bg-rose-50/60 text-rose-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-semibold">{isBn ? 'বাকি' : 'Due'}</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered Input & Change Display */}
              {paymentMethod === 'cash' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {isBn ? 'গৃহীত ক্যাশ টাকা (Tendered Amount)' : 'Cash Tendered'}
                    </label>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500">{isBn ? 'ফেরত টাকা' : 'Change'}:</span>
                      <strong className="font-mono tabular-nums text-emerald-700 font-bold">
                        {settings.currencySymbol}{changeToReturn.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={tenderedAmount || ''}
                      onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2.5 text-lg font-bold font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickCashOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTenderedAmount(opt.val)}
                        className="px-2.5 py-1 text-xs font-semibold font-mono tabular-nums bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      >
                        {opt.label === 'Exact' || opt.label === 'সঠিক টাকা'
                          ? opt.label
                          : `${settings.currencySymbol}${opt.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital Transaction ID for bKash, Nagad, Rocket, Card */}
              {['bkash', 'nagad', 'rocket', 'card'].includes(paymentMethod) && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    {isBn
                      ? 'লেনদেন ট্রানজেকশন আইডি (TrxID / Approval Code)'
                      : 'Transaction TrxID / Authorization Code (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. BKS94829104"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {/* Due Notice Warning */}
              {paymentMethod === 'due' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{isBn ? 'বাকি বিক্রয় সতর্কবার্তা' : 'Due Credit Sale Notice'}</span>
                  </div>
                  <p>
                    {isBn
                      ? `সম্পূর্ণ ${settings.currencySymbol}${cartGrandTotal.toLocaleString()} টাকা গ্রাহকের বাকি খাতায় যুক্ত হবে।`
                      : `The entire ${settings.currencySymbol}${cartGrandTotal.toLocaleString()} will be charged to ${selectedCustomer.name}'s credit ledger.`}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Split Payment Mode */
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                {isBn ? 'পেমেন্ট বিভাজন' : 'Split Payment Breakdown'}
              </h4>

              {/* Cash portion */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">
                    {isBn ? 'ক্যাশ পরিমাণ' : 'Cash Amount'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={splitCash || ''}
                    onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Digital portion */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <label>{isBn ? 'ডিজিটাল পেমেন্ট' : 'Digital Amount'}</label>
                    <select
                      value={splitDigitalMethod}
                      onChange={(e) =>
                        setSplitDigitalMethod(e.target.value as 'bkash' | 'nagad' | 'card')
                      }
                      className="text-[11px] bg-transparent border-0 font-bold text-emerald-700 outline-none"
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={splitDigital || ''}
                    onChange={(e) => setSplitDigital(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Due portion */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  {isBn ? 'অবশিষ্ট বাকি (Due Amount)' : 'Remaining Due Amount'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    cartGrandTotal - splitCash - splitDigital > 0
                      ? cartGrandTotal - splitCash - splitDigital
                      : 0
                  }
                  readOnly
                  className="w-full mt-1 px-3 py-2 text-sm font-mono tabular-nums bg-slate-100 border border-slate-200 rounded-lg font-bold text-rose-700"
                />
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'নোট / মন্তব্য (ঐচ্ছিক)' : 'Sale Memo / Reference Note (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isBn ? 'যেমন: অনলাইন ডেলিভারি বা কাস্টমার স্পেশাল রিকোয়েস্ট' : 'e.g. Home delivery, reference note...'}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={!isDueValid}
            className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isBn ? 'বিক্রয় সম্পন্ন ও রসিদ প্রিন্ট' : 'Complete Sale & Print Receipt'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
