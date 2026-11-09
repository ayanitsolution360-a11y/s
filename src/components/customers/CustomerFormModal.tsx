import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  FileText,
  Check,
} from 'lucide-react';
import { Customer } from '../../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  customerToEdit: Customer | null;
  onClose: () => void;
  onSaved?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customerToEdit,
  onClose,
  onSaved,
}) => {
  const { addCustomer, updateCustomer, settings, playBeep } = usePos();
  const isBn = settings.language === 'bn';

  const [name, setName] = useState('');
  const [bnName, setBnName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setBnName(customerToEdit.bnName || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setCreditLimit(customerToEdit.creditLimit ?? 5000);
      setLoyaltyPoints(customerToEdit.loyaltyPoints ?? 0);
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setBnName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit(5000);
      setLoyaltyPoints(0);
      setNotes('');
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (customerToEdit) {
      const updated: Customer = {
        ...customerToEdit,
        name: name.trim(),
        bnName: bnName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: Math.max(0, creditLimit),
        loyaltyPoints: Math.max(0, loyaltyPoints),
        notes: notes.trim() || undefined,
      };
      updateCustomer(updated);
      if (onSaved) onSaved(updated);
    } else {
      const newCust = addCustomer({
        name: name.trim(),
        bnName: bnName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: Math.max(0, creditLimit),
        loyaltyPoints: Math.max(0, loyaltyPoints),
        notes: notes.trim() || undefined,
        memberSince: new Date().toISOString(),
      });
      if (onSaved) onSaved(newCust);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {customerToEdit
                  ? isBn
                    ? 'গ্রাহক তথ্য পরিবর্তন'
                    : 'Edit Customer Profile'
                  : isBn
                  ? 'নতুন কাস্টমার নিবন্ধন'
                  : 'Register New Customer'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'গ্রাহকের নাম, ফোন নম্বর ও বাকি সীমার তথ্য সংরক্ষণ করুন'
                  : 'Store customer contact details, loyalty points and credit limit'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Full Name & Bengali Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {isBn ? 'গ্রাহকের নাম (English) *' : 'Customer Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {isBn ? 'বাংলা নাম (ঐচ্ছিক)' : 'Bengali Name (Optional)'}
              </label>
              <input
                type="text"
                value={bnName}
                onChange={(e) => setBnName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {isBn ? 'মোবাইল নম্বর *' : 'Mobile Phone *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {isBn ? 'ঠিকানা ও এলাকা' : 'Address / Location'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, Road, Area, Thana, District"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 resize-none"
              />
            </div>
          </div>

          {/* Financial Limits: Credit Limit & Loyalty Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBn ? 'বাকি সীমা (Credit Limit ৳)' : 'Credit Limit (BDT)'}</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isBn ? 'সর্বোচ্চ কত টাকার বাকি দেওয়া যাবে' : 'Max due amount permitted'}
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isBn ? 'লয়্যালটি পয়েন্ট ব্যালেন্স' : 'Loyalty Points Balance'}</span>
              </label>
              <input
                type="number"
                min="0"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isBn
                  ? `মান: ৳${loyaltyPoints * (settings.pointValue || 1)} সমপরিমাণ`
                  : `Equivalent discount: ${settings.currencySymbol}${loyaltyPoints * (settings.pointValue || 1)}`}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{isBn ? 'বিশেষ নোট বা ট্যাগ' : 'Notes / Customer Tags'}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBn ? 'যেমন: নিয়মিত পাইকারি ক্রেতা, ভিআইপি' : 'e.g. VIP Customer, Wholesaler, Regular monthly buyer'}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{customerToEdit ? (isBn ? 'সংরক্ষণ করুন' : 'Save Changes') : (isBn ? 'নিবন্ধন সম্পন্ন' : 'Register Customer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
