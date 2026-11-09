import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  BookOpen,
  Search,
  DollarSign,
  Send,
  History,
  Copy,
  Check,
  UserPlus,
  AlertCircle,
  X,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Customer } from '../../types';
import { DuePaymentModal } from './DuePaymentModal';
import { CustomerAddModal } from '../pos/CustomerAddModal';

export const DueKhata: React.FC = () => {
  const { customers, dueTransactions, settings } = usePos();
  const isBn = settings.language === 'bn';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(true);

  // Selected customer for Due Collection
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null);

  // Selected customer for Ledger History
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  // SMS Reminder modal
  const [smsCustomer, setSmsCustomer] = useState<Customer | null>(null);
  const [copiedSms, setCopiedSms] = useState<boolean>(false);

  // Add Customer modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Financial aggregates
  const debtors = customers.filter((c) => c.dueAmount > 0 && c.id !== 'cust-walkin');
  const totalOutstandingDue = debtors.reduce((sum, c) => sum + c.dueAmount, 0);
  const totalCollectedRecent = dueTransactions
    .filter((tx) => tx.type === 'payment_collected')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (cust.id === 'cust-walkin') return false;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        (cust.bnName && cust.bnName.toLowerCase().includes(q)) ||
        cust.phone.includes(q);

      const matchDue = filterDueOnly ? cust.dueAmount > 0 : true;

      return matchSearch && matchDue;
    });
  }, [customers, searchQuery, filterDueOnly]);

  const handleCopySms = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'বাকি খাতা ও গ্রাহক লেজার' : 'Due Khata & Customer Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'দোকানের সকল গ্রাহকদের বাকি বিক্রয়, জমা আদায় এবং দেনা-পাওনার হিসাব'
              : 'Track customer credit limits, outstanding balances, collections and SMS reminders'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isBn ? '+ নতুন গ্রাহক' : '+ New Customer'}</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট বকেয়া বাকি' : 'Total Outstanding Due'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
            {settings.currencySymbol}{totalOutstandingDue.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'দেনাদার কাস্টমার সংখ্যা' : 'Customers with Due'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {debtors.length} / {customers.length - 1}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'সর্বশেষ আদায়কৃত বাকি' : 'Recently Collected'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {settings.currencySymbol}{totalCollectedRecent.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'নিবন্ধিত গ্রাহক' : 'Total Customers'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-800 mt-1">
            {customers.length - 1}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'গ্রাহকের নাম বা ফোন দিয়ে খুঁজুন...' : 'Search by name or phone...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterDueOnly}
                onChange={(e) => setFilterDueOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{isBn ? 'শুধুমাত্র বাকি আছে এমন গ্রাহক' : 'Show Only Customers with Due'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isBn ? 'গ্রাহকের নাম ও ফোন' : 'Customer Name & Contact'}</th>
                <th className="py-3 px-3">{isBn ? 'ঠিকানা' : 'Address'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'লয়্যালটি পয়েন্ট' : 'Loyalty Points'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'মোট কেনাকাটা' : 'Total Spent'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ক্রেডিট লিমিট' : 'Credit Limit'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'বর্তমান বকেয়া' : 'Outstanding Due'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="font-semibold text-slate-700">
                      {isBn ? 'কোনো বাকি খাতা তথ্য পাওয়া যায়নি' : 'No customer due records found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-tight">
                        {isBn && cust.bnName ? cust.bnName : cust.name}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                        {cust.phone}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[200px] truncate">
                      {cust.address || '—'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className="font-bold text-amber-700 text-xs">
                        ⭐ {(cust.loyaltyPoints || 0).toLocaleString()} {isBn ? 'পয়েন্ট' : 'pts'}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ≈ {settings.currencySymbol}{((cust.loyaltyPoints || 0) * (settings.pointValue || 1)).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {settings.currencySymbol}{cust.totalSpent.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                      {settings.currencySymbol}{cust.creditLimit.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                      {cust.dueAmount > 0 ? (
                        <span className="text-rose-600 text-sm">
                          {settings.currencySymbol}{cust.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Collect Payment */}
                        {cust.dueAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCollectCustomer(cust)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          >
                            {isBn ? 'টাকা আদায়' : 'Collect'}
                          </button>
                        )}

                        {/* Send SMS Reminder */}
                        {cust.dueAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSmsCustomer(cust);
                              setCopiedSms(false);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Generate SMS Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* View Ledger Transactions History */}
                        <button
                          type="button"
                          onClick={() => setLedgerCustomer(cust)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Customer Ledger Statement"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Due Payment Modal */}
      <DuePaymentModal
        isOpen={!!collectCustomer}
        customer={collectCustomer}
        onClose={() => setCollectCustomer(null)}
      />

      {/* Customer Quick Add Modal */}
      <CustomerAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* SMS Reminder Generator Modal */}
      {smsCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'বাকি তাগাদা মেসেজ (SMS)' : 'Due Payment Reminder SMS'}</span>
              </h3>
              <button
                onClick={() => setSmsCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed select-all">
              {isBn
                ? `প্রিয় ${smsCustomer.name}, ${settings.storeBnName || settings.storeName} এ আপনার বর্তমান বকেয়া বাকি ${settings.currencySymbol}${smsCustomer.dueAmount.toLocaleString()}। অনুগ্রহ করে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হচ্ছে। যোগাযোগ: ${settings.phone}। ধন্যবাদ!`
                : `Dear ${smsCustomer.name}, your outstanding due balance at ${settings.storeName} is ${settings.currencySymbol}${smsCustomer.dueAmount.toLocaleString()}. Please clear your due balance at your earliest convenience. Contact: ${settings.phone}. Thank you!`}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {isBn ? 'কপি করে WhatsApp বা SMS এ পাঠান' : 'Copy and send via SMS or WhatsApp'}
              </span>

              <button
                type="button"
                onClick={() =>
                  handleCopySms(
                    isBn
                      ? `প্রিয় ${smsCustomer.name}, ${settings.storeBnName || settings.storeName} এ আপনার বর্তমান বকেয়া বাকি ${settings.currencySymbol}${smsCustomer.dueAmount.toLocaleString()}। অনুগ্রহ করে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হচ্ছে। যোগাযোগ: ${settings.phone}। ধন্যবাদ!`
                      : `Dear ${smsCustomer.name}, your outstanding due balance at ${settings.storeName} is ${settings.currencySymbol}${smsCustomer.dueAmount.toLocaleString()}. Please clear your due balance at your earliest convenience. Contact: ${settings.phone}. Thank you!`
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSms ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'কপি করুন' : 'Copy SMS')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isBn ? 'গ্রাহক লেজার স্টেটমেন্ট' : 'Customer Ledger Statement'}
                </h3>
                <p className="text-xs text-slate-500">
                  {ledgerCustomer.name} ({ledgerCustomer.phone})
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">{isBn ? 'বর্তমান বকেয়া:' : 'Current Due:'}</span>
                  <div className="text-base font-bold font-mono tabular-nums text-rose-600">
                    {settings.currencySymbol}{ledgerCustomer.dueAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">{isBn ? 'লয়্যালটি পয়েন্ট:' : 'Loyalty Points:'}</span>
                  <div className="text-base font-bold font-mono tabular-nums text-amber-700">
                    ⭐ {(ledgerCustomer.loyaltyPoints || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">{isBn ? 'মোট কেনাকাটা:' : 'Total Volume:'}</span>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {settings.currencySymbol}{ledgerCustomer.totalSpent.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {dueTransactions
                  .filter((t) => t.customerId === ledgerCustomer.id)
                  .map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {tx.type === 'sale_due' ? (
                          <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <ArrowDownLeft className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {tx.type === 'sale_due'
                              ? isBn
                                ? 'বাকি বিক্রয়'
                                : 'Sale Due Added'
                              : isBn
                              ? 'বাকি জমা প্রদান'
                              : 'Due Payment Collected'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(tx.date).toLocaleDateString()} · {tx.note}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`font-mono tabular-nums font-bold ${
                          tx.type === 'sale_due' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {tx.type === 'sale_due' ? '+' : '-'}
                        {settings.currencySymbol}{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
