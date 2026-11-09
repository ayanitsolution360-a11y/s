import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  Receipt,
  ShoppingCart,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Star,
  Gift,
  FileSpreadsheet,
  Coins,
  History,
  Tag,
  ArrowRight,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import { Customer, SaleInvoice } from '../../types';
import { CustomerFormModal } from './CustomerFormModal';

export const CustomerManager: React.FC = () => {
  const {
    customers,
    invoices,
    dueTransactions,
    settings,
    setActiveTab,
    setSelectedCustomer,
    deleteCustomer,
    adjustCustomerPoints,
    collectDuePayment,
    openReceiptModal,
    playBeep,
  } = usePos();

  const isBn = settings.language === 'bn';

  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'points' | 'vip'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[1]?.id || customers[0]?.id || 'cust-walkin');
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'loyalty' | 'favorites' | 'due'>('history');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Quick Points Adjustment Modal
  const [pointsAdjustModal, setPointsAdjustModal] = useState<{ customer: Customer; delta: number; type: 'add' | 'set' } | null>(null);

  // Quick Due Collection Modal
  const [dueCollectModal, setDueCollectModal] = useState<{ customer: Customer; amount: number; method: 'cash' | 'bkash' | 'nagad' | 'bank' } | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.bnName && c.bnName.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterType === 'due') {
        return c.dueAmount > 0;
      }
      if (filterType === 'points') {
        return (c.loyaltyPoints || 0) > 0;
      }
      if (filterType === 'vip') {
        return c.totalSpent >= 25000;
      }

      return true;
    });
  }, [customers, searchQuery, filterType]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Customer specific shopping invoices
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return invoices.filter((inv) => inv.customerId === selectedCustomer.id);
  }, [invoices, selectedCustomer]);

  // Customer specific due transactions
  const customerDueTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return dueTransactions.filter((tx) => tx.customerId === selectedCustomer.id);
  }, [dueTransactions, selectedCustomer]);

  // Purchased products aggregated ranking
  const favoriteProducts = useMemo(() => {
    if (!customerInvoices.length) return [];
    const map = new Map<string, { product: any; totalQty: number; totalSpent: number; lastDate: string }>();

    customerInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prodId = item.product.id;
        const current = map.get(prodId) || {
          product: item.product,
          totalQty: 0,
          totalSpent: 0,
          lastDate: inv.date,
        };

        map.set(prodId, {
          product: item.product,
          totalQty: current.totalQty + item.quantity,
          totalSpent: current.totalSpent + item.total,
          lastDate: new Date(inv.date) > new Date(current.lastDate) ? inv.date : current.lastDate,
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [customerInvoices]);

  // High-level KPI aggregations
  const totalRegistered = customers.filter((c) => c.id !== 'cust-walkin').length;
  const totalDueAmount = customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0);
  const totalLifetimeRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalPointsValue = totalLoyaltyPoints * (settings.pointValue || 1);

  // Start new sale with selected customer
  const handleStartSale = (cust: Customer) => {
    setSelectedCustomer(cust);
    setActiveTab('pos');
    playBeep('scan');
  };

  // Delete customer with confirmation
  const handleDeleteCustomer = (cust: Customer) => {
    if (cust.id === 'cust-walkin') {
      alert(isBn ? 'খুচরা ক্রেতা প্রোফাইল মুছে ফেলা যাবে না।' : 'Default Walk-in customer cannot be deleted.');
      return;
    }
    if (cust.dueAmount > 0) {
      if (!confirm(isBn
        ? `এই গ্রাহকের ৳${cust.dueAmount} বাকি রয়েছে। আপনি কি নিশ্চিত মুছে ফেলতে চান?`
        : `This customer has an outstanding due balance of ${settings.currencySymbol}${cust.dueAmount}. Are you sure you want to delete them?`)) {
        return;
      }
    } else {
      if (!confirm(isBn ? 'আপনি কি এই গ্রাহক প্রোফাইল মুছে ফেলতে চান?' : 'Are you sure you want to delete this customer profile?')) {
        return;
      }
    }

    deleteCustomer(cust.id);
    if (selectedCustomerId === cust.id) {
      setSelectedCustomerId(customers[0]?.id || 'cust-walkin');
    }
  };

  // Export Customers to CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Bengali Name',
      'Phone',
      'Email',
      'Address',
      'Total Spent',
      'Due Balance',
      'Credit Limit',
      'Loyalty Points',
      'Notes',
    ];

    const rows = customers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.bnName || '').replace(/"/g, '""')}"`,
      c.phone,
      c.email || '',
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.totalSpent || 0,
      c.dueAmount || 0,
      c.creditLimit || 0,
      c.loyaltyPoints || 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esheba_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Points adjustment
  const handleSavePointsAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsAdjustModal) return;

    let targetPoints = pointsAdjustModal.customer.loyaltyPoints || 0;
    if (pointsAdjustModal.type === 'add') {
      targetPoints = Math.max(0, targetPoints + pointsAdjustModal.delta);
    } else {
      targetPoints = Math.max(0, pointsAdjustModal.delta);
    }

    adjustCustomerPoints(pointsAdjustModal.customer.id, targetPoints);
    setPointsAdjustModal(null);
  };

  // Handle Due Collection
  const handleSaveDueCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueCollectModal || dueCollectModal.amount <= 0) return;

    collectDuePayment(
      dueCollectModal.customer.id,
      dueCollectModal.amount,
      dueCollectModal.method,
      'Customer manager direct payment collection'
    );
    playBeep('success');
    setDueCollectModal(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isBn ? 'গ্রাহক ও কাস্টমার ডিরেক্টরি' : 'Customer Management & CRM'}
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
              {customers.length} {isBn ? 'জন' : 'Profiles'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'গ্রাহকদের ঠিকানা, ফোন ডিরেক্টরি, কেনাকাটার ইতিহাস ও লয়্যালটি রিওয়ার্ড পয়েন্ট'
              : 'Store customer contact info, purchase orders history, credit limits, and lifetime loyalty rewards'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
            title="Export all customers to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isBn ? 'এক্সপোর্ট CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'নতুন কাস্টমার' : '+ Add Customer'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {isBn ? 'নিবন্ধিত গ্রাহক' : 'Registered Customers'}
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totalRegistered}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'নিয়মিত ও পাইকারি ক্রেতা' : 'Excluding walk-in guests'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {isBn ? 'মোট বিক্রয় আয়' : 'Lifetime Customer Sales'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {settings.currencySymbol}{totalLifetimeRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'গ্রাহকদের মোট কেনাকাটা' : 'Total store revenue generated'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {isBn ? 'মোট বাকি ব্যালেন্স' : 'Outstanding Due'}
            </span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {settings.currencySymbol}{totalDueAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {customers.filter((c) => c.dueAmount > 0).length} {isBn ? 'জন গ্রাহকের বাকি আছে' : 'customers with pending due'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {isBn ? 'সক্রিয় লয়্যালটি পয়েন্ট' : 'Active Loyalty Points'}
            </span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            {totalLoyaltyPoints.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? `রিডিম মান: ৳${totalPointsValue.toLocaleString()}` : `Redeemable value: ${settings.currencySymbol}${totalPointsValue.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Master List (Left) + Detailed Profile (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* Left Column: Customer List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'নাম, মোবাইল নম্বর বা ঠিকানা দিয়ে খুঁজুন...' : 'Search by name, phone, email or address...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Filter Segment Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBn ? 'সকল' : 'All'} ({customers.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('due')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === 'due'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBn ? 'বাকি আছে' : 'Has Due'} ({customers.filter((c) => c.dueAmount > 0).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('points')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === 'points'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBn ? 'পয়েন্ট আছে' : 'Loyalty Points'}
            </button>

            <button
              type="button"
              onClick={() => setFilterType('vip')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === 'vip'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBn ? 'ভিআইপি (Top)' : 'VIP Buyers'}
            </button>
          </div>

          {/* Customer Cards List */}
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto pr-1 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  {isBn ? 'কোনো গ্রাহক পাওয়া যায়নি' : 'No matching customers found'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isBn ? 'অন্য নাম বা নম্বর দিয়ে খুঁজুন' : 'Try adjusting your search or filter'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                const initials = c.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'C';

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-500 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            c.id === 'cust-walkin'
                              ? 'bg-slate-200 text-slate-700'
                              : isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {c.name}
                            </span>
                            {c.bnName && (
                              <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                                ({c.bnName})
                              </span>
                            )}
                            {c.totalSpent >= 35000 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                VIP
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{c.phone}</span>
                            {c.address && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="truncate max-w-[130px]">{c.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right quick stats */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-slate-800">
                          {settings.currencySymbol}{c.totalSpent.toLocaleString()}
                        </div>
                        {c.dueAmount > 0 && (
                          <div className="text-[10px] font-bold font-mono text-rose-600">
                            Due: {settings.currencySymbol}{c.dueAmount.toLocaleString()}
                          </div>
                        )}
                        {(c.loyaltyPoints || 0) > 0 && (
                          <div className="text-[10px] font-semibold text-indigo-600 flex items-center justify-end gap-0.5">
                            <Award className="w-3 h-3 text-indigo-500" />
                            <span>{c.loyaltyPoints} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Detailed Profile & History View */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
          {selectedCustomer ? (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    {selectedCustomer.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'C'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedCustomer.name}
                      </h3>
                      {selectedCustomer.bnName && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({selectedCustomer.bnName})
                        </span>
                      )}
                      {selectedCustomer.totalSpent >= 35000 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-md">
                          VIP Gold Customer
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <div className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.phone}</span>
                      </div>

                      {selectedCustomer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}

                      {selectedCustomer.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[220px]">{selectedCustomer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartSale(selectedCustomer)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                    title="Select this customer and jump to POS counter"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বিক্রয় শুরু' : 'New Sale'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomer(selectedCustomer);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    title="Edit Customer Info"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {selectedCustomer.id !== 'cust-walkin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(selectedCustomer)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Financial Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    {isBn ? 'মোট কেনাকাটা' : 'Total Spent'}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                    {settings.currencySymbol}{selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {customerInvoices.length} {isBn ? 'টি চালান' : 'orders placed'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    {isBn ? 'বাকি ব্যালেন্স' : 'Current Due'}
                  </span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${selectedCustomer.dueAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {settings.currencySymbol}{selectedCustomer.dueAmount.toLocaleString()}
                  </span>
                  {selectedCustomer.dueAmount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setDueCollectModal({ customer: selectedCustomer, amount: selectedCustomer.dueAmount, method: 'cash' })}
                      className="text-[10px] font-bold text-amber-700 hover:underline inline-block mt-0.5"
                    >
                      {isBn ? 'বাকি পরিশোধ আদায়' : 'Collect Due'} &rarr;
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {isBn ? 'পরিশোধিত' : 'Zero balance'}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-indigo-700 uppercase block">
                      {isBn ? 'লয়্যালটি পয়েন্ট' : 'Loyalty Points'}
                    </span>
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-base font-bold font-mono text-indigo-900 mt-0.5 block">
                    {selectedCustomer.loyaltyPoints || 0} <span className="text-xs font-normal text-indigo-600">pts</span>
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-indigo-700 font-medium">
                      = {settings.currencySymbol}{(selectedCustomer.loyaltyPoints || 0) * (settings.pointValue || 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPointsAdjustModal({ customer: selectedCustomer, delta: 50, type: 'add' })}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      {isBn ? 'পয়েন্ট সমন্বয়' : 'Adjust'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    {isBn ? 'বাকি সীমা' : 'Credit Limit'}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-800 mt-0.5 block">
                    {settings.currencySymbol}{(selectedCustomer.creditLimit || 5000).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isBn ? 'অবশিষ্ট:' : 'Available:'} {settings.currencySymbol}{Math.max(0, (selectedCustomer.creditLimit || 5000) - selectedCustomer.dueAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sub-Tabs: Invoices / Loyalty / Favorites / Due Ledger */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors ${
                      activeSubTab === 'history'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{isBn ? 'কেনাকাটার চালান' : 'Shopping Orders'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                      {customerInvoices.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('loyalty')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors ${
                      activeSubTab === 'loyalty'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{isBn ? 'লয়্যালটি রিওয়ার্ডস' : 'Loyalty Rewards'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('favorites')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors ${
                      activeSubTab === 'favorites'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ক্রয়কৃত পণ্যের তালিকা' : 'Frequent Items'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                      {favoriteProducts.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('due')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors ${
                      activeSubTab === 'due'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বাকি ও পেমেন্ট খাতা' : 'Due Ledger'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                      {customerDueTransactions.length}
                    </span>
                  </button>
                </div>

                {/* SubTab 1: Shopping History / Invoices */}
                {activeSubTab === 'history' && (
                  <div className="space-y-2">
                    {customerInvoices.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600">
                          {isBn ? 'এই গ্রাহকের কোনো বিক্রয় চালান নেই' : 'No purchase history found for this customer'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStartSale(selectedCustomer)}
                          className="mt-2.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isBn ? 'প্রথম বিক্রয় শুরু করুন' : 'Start First Sale'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {customerInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {inv.invoiceNo}
                                  </span>
                                  <span
                                    className={`px-2 py-0.2 text-[10px] font-bold rounded uppercase ${
                                      inv.status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : inv.status === 'due'
                                        ? 'bg-rose-100 text-rose-800'
                                        : inv.status === 'partial'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {inv.paymentMethod}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{new Date(inv.date).toLocaleString()}</span>
                                  <span>·</span>
                                  <span>{inv.items.length} {isBn ? 'টি পণ্য' : 'items'}</span>
                                  {inv.cashier && (
                                    <>
                                      <span>·</span>
                                      <span>Cashier: {inv.cashier}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-bold font-mono text-slate-900">
                                    {settings.currencySymbol}{inv.grandTotal.toLocaleString()}
                                  </div>
                                  {(inv.pointsEarned || 0) > 0 && (
                                    <div className="text-[10px] text-indigo-600 font-semibold">
                                      +{inv.pointsEarned} pts earned
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openReceiptModal(inv)}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                  title="View Printable Receipt"
                                >
                                  {isBn ? 'রশিদ' : 'Receipt'}
                                </button>
                              </div>
                            </div>

                            {/* Itemized preview summary */}
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-1.5">
                              {inv.items.slice(0, 4).map((it, idx) => (
                                <span key={idx} className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                  {it.product.name} &times; {it.quantity}
                                </span>
                              ))}
                              {inv.items.length > 4 && (
                                <span className="text-slate-400 self-center">
                                  +{inv.items.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SubTab 2: Loyalty Rewards */}
                {activeSubTab === 'loyalty' && (
                  <div className="space-y-4">
                    {/* Points Balance Card */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                            {isBn ? 'বর্তমান লয়্যালটি পয়েন্ট ব্যালেন্স' : 'Available Loyalty Points Balance'}
                          </div>
                          <div className="text-2xl font-bold font-mono text-indigo-950 mt-0.5">
                            {selectedCustomer.loyaltyPoints || 0} <span className="text-sm font-normal text-indigo-700">pts</span>
                          </div>
                          <div className="text-xs text-indigo-700 mt-0.5">
                            {isBn
                              ? `নগদ মূল্য: ৳${(selectedCustomer.loyaltyPoints || 0) * (settings.pointValue || 1)} (পরবর্তী কেনাকাটায় ছাড় পাওয়া যাবে)`
                              : `Cash value: ${settings.currencySymbol}${(selectedCustomer.loyaltyPoints || 0) * (settings.pointValue || 1)} (Redeemable at POS checkout)`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPointsAdjustModal({ customer: selectedCustomer, delta: 100, type: 'add' })}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isBn ? 'বোনাস পয়েন্ট দিন' : '+ Add Bonus'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPointsAdjustModal({ customer: selectedCustomer, delta: selectedCustomer.loyaltyPoints || 0, type: 'set' })}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                        >
                          {isBn ? 'সংশোধন' : 'Edit Balance'}
                        </button>
                      </div>
                    </div>

                    {/* Store Loyalty Policy Info */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-indigo-600" />
                        <span>{isBn ? 'দোকানের লয়্যালটি প্রোগ্রাম পলিসি' : 'Store Loyalty Rewards Rule'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        • {isBn ? `প্রতি ৳${settings.pointsEarnRate || 100} কেনাকাটায় ১ পয়েন্ট অর্জন হয়।` : `Earn 1 point for every ${settings.currencySymbol}${settings.pointsEarnRate || 100} spent.`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        • {isBn ? `প্রতি ১ পয়েন্টের মূল্য ৳${settings.pointValue || 1} সমপরিমাণ সরাসরি পিওএস বিলে ছাড় হিসেবে গ্রহণ করা যায়।` : `1 point is worth ${settings.currencySymbol}${settings.pointValue || 1} instant discount at checkout.`}
                      </p>
                    </div>

                    {/* Points Transactions Log */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800">
                        {isBn ? 'পয়েন্ট অর্জন ও খরচের ইতিহাস' : 'Points Activity & Redemption History'}
                      </h4>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs">
                        {customerInvoices
                          .filter((inv) => (inv.pointsEarned || 0) > 0 || (inv.pointsRedeemed || 0) > 0)
                          .map((inv) => (
                            <div key={inv.id} className="p-3 flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-slate-900">{inv.invoiceNo}</span>
                                <div className="text-[11px] text-slate-400">
                                  {new Date(inv.date).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {(inv.pointsEarned || 0) > 0 && (
                                  <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                    +{inv.pointsEarned} Earned
                                  </span>
                                )}
                                {(inv.pointsRedeemed || 0) > 0 && (
                                  <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                                    -{inv.pointsRedeemed} Redeemed (৳{inv.pointsDiscountAmount})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                        {customerInvoices.filter((inv) => (inv.pointsEarned || 0) > 0 || (inv.pointsRedeemed || 0) > 0).length === 0 && (
                          <div className="py-6 text-center text-slate-400 text-xs">
                            {isBn ? 'এখনও কোনো পয়েন্ট লেনদেন রেকর্ড হয়নি' : 'No point transactions logged yet'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 3: Frequently Purchased Items */}
                {activeSubTab === 'favorites' && (
                  <div className="space-y-3">
                    {favoriteProducts.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Package className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600">
                          {isBn ? 'কোনো পণ্য ক্রয়ের রেকর্ড নেই' : 'No items purchased yet by this customer'}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">{isBn ? 'পণ্যের নাম' : 'Product Name'}</th>
                              <th className="py-2.5 px-3 font-mono">{isBn ? 'SKU' : 'SKU'}</th>
                              <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'মোট সংখ্যা' : 'Units Bought'}</th>
                              <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'মোট ব্যয়' : 'Total Spent'}</th>
                              <th className="py-2.5 px-3 text-right">{isBn ? 'সর্বশেষ ক্রয়' : 'Last Purchased'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {favoriteProducts.map((fav, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{fav.product.name}</div>
                                  <div className="text-[10px] text-slate-400 capitalize">{fav.product.category}</div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                  {fav.product.sku || 'SKU-000'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                                  {fav.totalQty} {fav.product.unit || 'pcs'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                                  {settings.currencySymbol}{fav.totalSpent.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-right text-[11px] text-slate-500">
                                  {new Date(fav.lastDate).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SubTab 4: Due Khata Ledger */}
                {activeSubTab === 'due' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-amber-900 block">
                          {isBn ? 'বর্তমান বকেয়া বাকি:' : 'Outstanding Due Balance:'}{' '}
                          <span className="font-mono text-sm">{settings.currencySymbol}{selectedCustomer.dueAmount.toLocaleString()}</span>
                        </span>
                        <span className="text-[11px] text-amber-700">
                          {isBn ? 'অনুমোদিত বাকি সীমা: ' : 'Permitted credit limit: '}{settings.currencySymbol}{(selectedCustomer.creditLimit || 5000).toLocaleString()}
                        </span>
                      </div>

                      {selectedCustomer.dueAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setDueCollectModal({ customer: selectedCustomer, amount: selectedCustomer.dueAmount, method: 'cash' })}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors shrink-0"
                        >
                          {isBn ? 'বাকি আদায় করুন' : 'Collect Payment'}
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">{isBn ? 'তারিখ' : 'Date'}</th>
                            <th className="py-2.5 px-3">{isBn ? 'ধরন' : 'Type'}</th>
                            <th className="py-2.5 px-3 font-mono">{isBn ? 'চালান / রেফারেন্স' : 'Invoice Ref'}</th>
                            <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                            <th className="py-2.5 px-3">{isBn ? 'নোট' : 'Note'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerDueTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                {isBn ? 'কোনো বাকি লেনদেন নেই' : 'No credit transactions found'}
                              </td>
                            </tr>
                          ) : (
                            customerDueTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-slate-600">
                                  {new Date(tx.date).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      tx.type === 'sale_due'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {tx.type === 'sale_due' ? (isBn ? 'বাকি বিক্রয়' : 'Sale Due') : (isBn ? 'আদায়' : 'Payment')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                                  {tx.invoiceNo || 'N/A'}
                                </td>
                                <td
                                  className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                                    tx.type === 'sale_due' ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {tx.type === 'sale_due' ? '+' : '-'}{settings.currencySymbol}{tx.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {tx.note || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
              <p className="font-semibold text-slate-600">
                {isBn ? 'কোনো গ্রাহক নির্বাচিত নেই' : 'Select a customer from the left to view profile'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customerToEdit={editingCustomer}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSaved={(cust) => {
          setSelectedCustomerId(cust.id);
        }}
      />

      {/* Quick Points Adjustment Popover Modal */}
      {pointsAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isBn ? 'লয়্যালটি পয়েন্ট সমন্বয়' : 'Adjust Loyalty Points'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPointsAdjustModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePointsAdjust} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">
                  {pointsAdjustModal.customer.name} · {isBn ? 'বর্তমান পয়েন্ট:' : 'Current balance:'}{' '}
                  <span className="font-bold text-indigo-700 font-mono">{pointsAdjustModal.customer.loyaltyPoints || 0} pts</span>
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPointsAdjustModal((prev) => prev && { ...prev, type: 'add' })}
                    className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                      pointsAdjustModal.type === 'add'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    + Add Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsAdjustModal((prev) => prev && { ...prev, type: 'set' })}
                    className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                      pointsAdjustModal.type === 'set'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Set Fixed Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {pointsAdjustModal.type === 'add'
                    ? (isBn ? 'যোগ করার পয়েন্ট সংখ্যা' : 'Points to Add')
                    : (isBn ? 'নতুন নির্ধারিত ব্যালেন্স' : 'New Fixed Point Balance')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={pointsAdjustModal.delta}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPointsAdjustModal((prev) => prev && { ...prev, delta: val });
                  }}
                  className="w-full px-3 py-2 font-mono text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPointsAdjustModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {isBn ? 'সংরক্ষণ' : 'Save Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Due Collection Modal */}
      {dueCollectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isBn ? 'বাকি আদায় গ্রহণ' : 'Collect Due Payment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDueCollectModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDueCollection} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">
                  {dueCollectModal.customer.name} · {isBn ? 'বর্তমান বাকি:' : 'Total due:'}{' '}
                  <span className="font-bold text-rose-600 font-mono">৳{dueCollectModal.customer.dueAmount}</span>
                </span>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isBn ? 'আদায়ের পরিমাণ (৳)' : 'Payment Amount (BDT)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={dueCollectModal.customer.dueAmount}
                  value={dueCollectModal.amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDueCollectModal((prev) => prev && { ...prev, amount: val });
                  }}
                  className="w-full px-3 py-2 font-mono text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <select
                  value={dueCollectModal.method}
                  onChange={(e) => {
                    const m = e.target.value as any;
                    setDueCollectModal((prev) => prev && { ...prev, method: m });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                >
                  <option value="cash">Cash (নগদ)</option>
                  <option value="bkash">bKash (বিকাশ)</option>
                  <option value="nagad">Nagad (নগদ ওয়ালেট)</option>
                  <option value="bank">Bank Transfer (ব্যাংক)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDueCollectModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  {isBn ? 'আদায় নিশ্চিত করুন' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
