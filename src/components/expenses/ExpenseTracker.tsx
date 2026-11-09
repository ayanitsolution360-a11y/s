import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Coins,
  Plus,
  Trash2,
  Calendar,
  X,
  Check,
  TrendingDown,
  Tag,
} from 'lucide-react';
import { Expense } from '../../types';

export const ExpenseTracker: React.FC = () => {
  const { expenses, addExpense, deleteExpense, settings } = usePos();
  const isBn = settings.language === 'bn';

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Expense['category']>('Snacks & Tea');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'bank'>('cash');
  const [notes, setNotes] = useState<string>('');

  // Financial aggregates
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayExpenses = expenses
    .filter((e) => e.date.slice(0, 10) === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    addExpense({
      title: title.trim(),
      category,
      amount,
      date: new Date().toISOString(),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount(0);
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'দোকানের দৈনিক খরচ (Expense Tracker)' : 'Store Expense Tracker'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'বিদ্যুৎ বিল, দোকান ভাড়া, স্টাফ নাস্তা ও অন্যান্য আনুষঙ্গিক ব্যয়ের হিসাব'
              : 'Track daily overhead expenses, utilities, snacks, delivery and maintenance'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? '+ নতুন খরচ যুক্ত করুন' : '+ Log Expense'}</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট খরচ' : 'Total Expenses'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
            {settings.currencySymbol}{totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'আজকের খরচ' : "Today's Expenses"}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {settings.currencySymbol}{todayExpenses.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট খরচ এন্ট্রি' : 'Total Entries'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-800 mt-1">
            {expenses.length}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isBn ? 'খরচের বিবরণ' : 'Expense Title & Reason'}</th>
                <th className="py-3 px-3">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3 px-3">{isBn ? 'তারিখ' : 'Date'}</th>
                <th className="py-3 px-3">{isBn ? 'মাধ্যম' : 'Payment Method'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="font-semibold text-slate-700">
                      {isBn ? 'কোনো খরচ লিপিবদ্ধ নেই' : 'No expenses recorded yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium text-[11px]">
                      {exp.category}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-3 uppercase text-[11px] font-mono font-semibold text-slate-700">
                      {exp.paymentMethod}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-rose-600 text-sm">
                      {settings.currencySymbol}{exp.amount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'নতুন খরচ লিপিবদ্ধ করুন' : 'Record New Expense'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'খরচের শিরোনাম *' : 'Expense Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: বিকেলের চা-নাস্তা বা বিদ্যুৎ বিল' : 'e.g. Shop electricity or staff tea'}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isBn ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Snacks & Tea">Snacks & Tea</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Rent">Shop Rent</option>
                    <option value="Staff Salary">Staff Salary</option>
                    <option value="Transport">Transport</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isBn ? 'পরিমাণ *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bkash' | 'bank')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="cash">Cash (ক্যাশ)</option>
                  <option value="bkash">bKash (বিকাশ)</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'মন্তব্য (ঐচ্ছিক)' : 'Notes / Remarks (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'কোনো বিশেষ তথ্য থাকলে' : 'e.g. Paid online by cashier'}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
