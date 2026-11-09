import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { X, UserPlus, Check } from 'lucide-react';

interface CustomerAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerAddModal: React.FC<CustomerAddModalProps> = ({ isOpen, onClose }) => {
  const { addCustomer, setSelectedCustomer, settings } = usePos();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [initialPoints, setInitialPoints] = useState<number>(50);

  if (!isOpen) return null;
  const isBn = settings.language === 'bn';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newCust = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      creditLimit: creditLimit || 0,
      loyaltyPoints: Math.max(0, initialPoints || 0),
    });

    setSelectedCustomer(newCust);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'নতুন কাস্টমার / গ্রাহক যুক্ত করুন' : 'Add New Customer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'গ্রাহকের পুরো নাম *' : 'Customer Full Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isBn ? 'যেমন: আরিফুল ইসলাম' : 'e.g. Ariful Islam'}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01711-XXXXXX"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'ঠিকানা / এলাকা' : 'Address / Area'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isBn ? 'রোড, বাসা নম্বর, শহর' : 'Street address, city'}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'বাকি বিক্রয় সীমা (Credit Limit)' : 'Credit Limit'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isBn ? 'স্বাগত লয়্যালটি পয়েন্ট (Welcome Loyalty Points)' : 'Welcome Loyalty Points'}
            </label>
            <input
              type="number"
              min="0"
              value={initialPoints}
              onChange={(e) => setInitialPoints(parseInt(e.target.value) || 0)}
              placeholder="50"
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
