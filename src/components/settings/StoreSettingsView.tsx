import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Settings,
  Store,
  Printer,
  RotateCcw,
  Check,
  Download,
  Upload,
  Globe,
  Coins,
  FileSpreadsheet,
  Package,
  Receipt,
  BookOpen,
  CheckCircle2,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../../types';

export const StoreSettingsView: React.FC = () => {
  const {
    products,
    invoices,
    customers,
    dueTransactions,
    settings,
    updateSettings,
    resetAllData,
  } = usePos();
  const isBn = settings.language === 'bn';

  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const notifyExport = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Helper to trigger clean CSV download with UTF-8 BOM
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dateTag = new Date().toISOString().slice(0, 10);

  // 1. Export Inventory CSV
  const handleExportInventoryCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Bengali Name',
      'Category',
      'Brand',
      'Cost Price',
      'Selling Price',
      'Gross Margin (%)',
      'Stock Qty',
      'Reorder Alert Level',
      'Unit',
    ];

    const rows = products.map((p) => {
      const margin = p.costPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.costPrice) * 100) : 0;
      return [
        p.sku,
        p.barcode,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.bnName || '').replace(/"/g, '""')}"`,
        p.category,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        p.costPrice,
        p.sellingPrice,
        `${margin}%`,
        p.stock,
        p.minStockAlert,
        p.unit,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(`esheba_inventory_${dateTag}.csv`, csv);
    notifyExport(isBn ? 'ইনভেন্টরি ডেটা CSV ডাউনলোড সম্পন্ন হয়েছে' : 'Inventory records exported to CSV');
  };

  // 2. Export Sales Invoices CSV
  const handleExportSalesCSV = () => {
    const headers = [
      'Invoice No',
      'Date Time',
      'Customer Name',
      'Customer Phone',
      'Items Count',
      'Subtotal',
      'Discount',
      'Points Redeemed',
      'Points Discount',
      'VAT (%)',
      'VAT Amount',
      'Grand Total',
      'Paid Amount',
      'Due Balance',
      'Points Earned',
      'Payment Mode',
      'TrxID',
      'Cashier',
      'Status',
      'Notes',
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNo,
      `"${new Date(inv.date).toLocaleString()}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerPhone || '',
      inv.items.length,
      inv.subtotal,
      inv.discountAmount,
      inv.pointsRedeemed || 0,
      inv.pointsDiscountAmount || 0,
      inv.vatPercent,
      inv.vatAmount,
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
      inv.pointsEarned || 0,
      inv.paymentMethod.toUpperCase(),
      inv.trxId || '',
      `"${inv.cashier.replace(/"/g, '""')}"`,
      inv.status.toUpperCase(),
      `"${(inv.note || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(`esheba_sales_invoices_${dateTag}.csv`, csv);
    notifyExport(isBn ? 'বিক্রয় মেমো ও ইনভয়েস CSV ডাউনলোড সম্পন্ন হয়েছে' : 'Sales invoice records exported to CSV');
  };

  // 3. Export Customer Ledger CSV
  const handleExportCustomersCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Bengali Name',
      'Phone Number',
      'Email',
      'Address',
      'Lifetime Purchases',
      'Current Outstanding Due',
      'Credit Limit',
      'Available Credit Limit',
      'Loyalty Points Balance',
    ];

    const registeredCustomers = customers.filter((c) => c.id !== 'cust-walkin');
    const rows = registeredCustomers.map((c) => {
      const availCredit = Math.max(0, c.creditLimit - c.dueAmount);
      return [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.bnName || '').replace(/"/g, '""')}"`,
        c.phone,
        c.email || '',
        `"${(c.address || '').replace(/"/g, '""')}"`,
        c.totalSpent,
        c.dueAmount,
        c.creditLimit,
        availCredit,
        c.loyaltyPoints || 0,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(`esheba_customer_due_ledger_${dateTag}.csv`, csv);
    notifyExport(isBn ? 'গ্রাহক বাকি খাতা লেজার CSV ডাউনলোড সম্পন্ন হয়েছে' : 'Customer ledger records exported to CSV');
  };

  // 4. Export All Records Combined Master CSV
  const handleExportAllCombinedCSV = () => {
    const sections: string[] = [];

    // Header info
    sections.push(`"ESHEBA SMART POS - COMPLETE STORE DATA EXPORT"`);
    sections.push(`"Store Name:","${settings.storeName}"`);
    sections.push(`"Export Date:","${new Date().toLocaleString()}"`);
    sections.push(`"Cashier/User:","${settings.cashierName}"`);
    sections.push('');

    // Section 1: Inventory
    sections.push('=== SECTION 1: INVENTORY & PRODUCT CATALOG ===');
    sections.push('SKU,Barcode,Product Name,Bengali Name,Category,Cost Price,Selling Price,Stock Qty,Unit,Reorder Alert');
    products.forEach((p) => {
      sections.push(
        [
          p.sku,
          p.barcode,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${(p.bnName || '').replace(/"/g, '""')}"`,
          p.category,
          p.costPrice,
          p.sellingPrice,
          p.stock,
          p.unit,
          p.minStockAlert,
        ].join(',')
      );
    });
    sections.push('');

    // Section 2: Sales
    sections.push('=== SECTION 2: SALES INVOICES & ORDERS ===');
    sections.push('Invoice No,Date,Customer,Phone,Items Qty,Grand Total,Paid Amount,Due Amount,Payment Method,Status');
    invoices.forEach((inv) => {
      sections.push(
        [
          inv.invoiceNo,
          `"${new Date(inv.date).toLocaleString()}"`,
          `"${inv.customerName.replace(/"/g, '""')}"`,
          inv.customerPhone || '',
          inv.items.length,
          inv.grandTotal,
          inv.paidAmount,
          inv.dueAmount,
          inv.paymentMethod.toUpperCase(),
          inv.status.toUpperCase(),
        ].join(',')
      );
    });
    sections.push('');

    // Section 3: Customer Due Ledger
    sections.push('=== SECTION 3: CUSTOMER DUE KHATA & LEDGER ===');
    sections.push('Customer Name,Phone,Address,Total Volume Spent,Outstanding Due Amount,Credit Limit,Loyalty Points');
    customers
      .filter((c) => c.id !== 'cust-walkin')
      .forEach((c) => {
        sections.push(
          [
            `"${c.name.replace(/"/g, '""')}"`,
            c.phone,
            `"${(c.address || '').replace(/"/g, '""')}"`,
            c.totalSpent,
            c.dueAmount,
            c.creditLimit,
            c.loyaltyPoints || 0,
          ].join(',')
        );
      });

    const masterCsv = sections.join('\r\n');
    downloadCSV(`esheba_complete_store_backup_${dateTag}.csv`, masterCsv);
    notifyExport(
      isBn
        ? 'ইনভেন্টরি, বিক্রয় ও বাকি খাতার সম্পূর্ণ মাস্টার CSV ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে'
        : 'All inventory, sales and customer ledger records exported as Master CSV'
    );
  };

  const handleBackup = () => {
    const data = {
      products: localStorage.getItem('esheba_smartpos_products'),
      customers: localStorage.getItem('esheba_smartpos_customers'),
      invoices: localStorage.getItem('esheba_smartpos_invoices'),
      expenses: localStorage.getItem('esheba_smartpos_expenses'),
      settings: localStorage.getItem('esheba_smartpos_settings'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esheba_pos_backup_${dateTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {isBn ? 'দোকানের সেটিংস ও কনফিগারেশন' : 'Store Settings & Configuration'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isBn
            ? 'দোকানের নাম, ঠিকানা, ভ্যাট ট্যাক্স রেট, থার্মাল প্রিন্টার সাইজ ও ব্যাকআপ'
            : 'Configure shop branding, receipt template, VAT tax, currency and data management'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{isBn ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings updated successfully!'}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Store Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'দোকানের বিবরণ ও যোগাযোগ' : 'Store Profile & Contact'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'দোকানের নাম (English) *' : 'Store Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'দোকানের বাংলা নাম' : 'Store Name (বাংলা)'}
              </label>
              <input
                type="text"
                value={formData.storeBnName}
                onChange={(e) => setFormData({ ...formData, storeBnName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'স্লোগান / ট্যাগলাইন' : 'Store Tagline / Slogan'}
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ক্যাশিয়ারের নাম / কাউন্টার নং' : 'Cashier Name / Counter ID'}
              </label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ফোন / হটলাইন নম্বর' : 'Phone / Contact Numbers'}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'দোকানের ঠিকানা (রসিদে মুদ্রিত হবে)' : 'Store Address (Printed on Receipts)'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Financial & Receipt Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'রসিদ ও আর্থিক কনফিগারেশন' : 'Billing & Thermal Receipt'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ডিফল্ট ভ্যাট / ট্যাক্স (%)' : 'Default VAT Rate (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.vatPercent}
                onChange={(e) =>
                  setFormData({ ...formData, vatPercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'মুদ্রা (Currency)' : 'Currency'}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const curr = e.target.value as 'BDT' | 'USD';
                  setFormData({
                    ...formData,
                    currency: curr,
                    currencySymbol: curr === 'BDT' ? '৳' : '$',
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              >
                <option value="BDT">Bangladeshi Taka (৳ BDT)</option>
                <option value="USD">US Dollar ($ USD)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'রসিদ প্রিন্টার সাইজ' : 'Thermal Printer Roll'}
              </label>
              <select
                value={formData.receiptWidth}
                onChange={(e) =>
                  setFormData({ ...formData, receiptWidth: e.target.value as '80mm' | '58mm' })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              >
                <option value="80mm">80mm (Standard POS Thermal)</option>
                <option value="58mm">58mm (Compact Mobile POS)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'রসিদের পাদটীকা (Receipt Footer Message)' : 'Receipt Footer Message'}
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Loyalty Rewards Program Configuration Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'লয়্যালটি রিওয়ার্ডস প্রোগ্রাম' : 'Customer Loyalty Points Program'}
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-700">
                {formData.loyaltyPointsEnabled ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'নিষ্ক্রিয়' : 'Disabled')}
              </span>
              <input
                type="checkbox"
                checked={formData.loyaltyPointsEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, loyaltyPointsEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
            </label>
          </div>

          <p className="text-xs text-slate-500">
            {isBn
              ? 'কাস্টমারদের প্রতিটি কেনাকাটায় স্বয়ংক্রিয় পয়েন্ট প্রদান এবং পরবর্তীতে বিল পরিশোধে পয়েন্ট দিয়ে ছাড় পাওয়ার নিয়ম নির্ধারণ করুন।'
              : 'Reward registered repeat customers with points on every sale and allow them to redeem points for cash discounts at checkout.'}
          </p>

          {formData.loyaltyPointsEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'পয়েন্ট অর্জনের হার (টাকা প্রতি ১ পয়েন্ট)' : 'Points Earn Rate (Spend per 1 pt)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    {formData.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={formData.pointsEarnRate || 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsEarnRate: Math.max(1, parseFloat(e.target.value) || 100),
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isBn
                    ? `প্রতি ${formData.currencySymbol}${formData.pointsEarnRate || 100} টাকার কেনাকাটায় ১ পয়েন্ট যোগ হবে`
                    : `Earns 1 point for every ${formData.currencySymbol}${formData.pointsEarnRate || 100} spent`}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'প্রতি পয়েন্টের মূল্য (Point Value)' : 'Point Monetary Value'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    {formData.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.pointValue || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointValue: Math.max(0.1, parseFloat(e.target.value) || 1),
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isBn
                    ? `১ পয়েন্টের সমমূল্য = ${formData.currencySymbol}${formData.pointValue || 1} ছাড়`
                    : `1 point = ${formData.currencySymbol}${formData.pointValue || 1} discount at checkout`}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'রিডিম করার সর্বনিম্ন পয়েন্ট' : 'Min Points to Redeem'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minPointsToRedeem || 20}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPointsToRedeem: Math.max(1, parseInt(e.target.value) || 20),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isBn
                    ? `কমপক্ষে ${formData.minPointsToRedeem || 20} পয়েন্ট জমা হলে রিডিম করা যাবে`
                    : `Threshold required before customer can claim point discount`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* Export Success Notification Banner */}
      {exportSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in max-w-4xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Export Data for Offline Backup (CSV) Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 max-w-4xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isBn
                  ? 'অফলাইন ব্যাকআপ ও ডেটা এক্সপোর্ট (CSV)'
                  : 'Export Data for Offline Backup (CSV)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'সকল ইনভেন্টরি, বিক্রয় মেমো এবং কাস্টমার বাকি খাতার রেকর্ড সরাসরি CSV ফাইলে ডাউনলোড করুন'
                  : 'Download complete inventory catalog, sales invoices, and customer ledger records for offline backup'}
              </p>
            </div>
          </div>

          {/* Master One-Click Combined Export Button */}
          <button
            type="button"
            onClick={handleExportAllCombinedCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            title="Download all datasets in one master combined CSV backup"
          >
            <FileDown className="w-4 h-4" />
            <span>{isBn ? 'সম্পূর্ণ ডেটা মাস্টার CSV ডাউনলোড' : 'Export All Data (Master CSV)'}</span>
          </button>
        </div>

        {/* 3 Modular Category Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Inventory Catalog */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {products.length} {isBn ? 'পণ্য' : 'items'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mt-2.5">
                {isBn ? 'পণ্য ও ইনভেন্টরি' : 'Inventory Catalog'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isBn
                  ? 'SKU, বারকোড, নাম, ক্রয়-বিক্রয় মূল্য, বর্তমান স্টক ও মার্জিন'
                  : 'SKUs, barcodes, names, cost, selling prices, stock levels & margins.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportInventoryCSV}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isBn ? 'ইনভেন্টরি CSV ডাউনলোড' : 'Download Inventory CSV'}</span>
            </button>
          </div>

          {/* Card 2: Sales Invoices */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                </span>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {invoices.length} {isBn ? 'মেমো' : 'orders'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mt-2.5">
                {isBn ? 'বিক্রয় ও ইনভয়েস রেকর্ড' : 'Sales Orders & Invoices'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isBn
                  ? 'মেমো নম্বর, তারিখ, কাস্টমার, মোট বিল, পরিশোধিত টাকা, ট্রানজেকশন আইডি'
                  : 'Invoice #, timestamp, items, subtotal, discounts, paid & due balances.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportSalesCSV}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isBn ? 'বিক্রয় CSV ডাউনলোড' : 'Download Sales CSV'}</span>
            </button>
          </div>

          {/* Card 3: Customer Due Ledger */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                </span>
                <span className="text-[11px] font-mono tabular-nums font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {customers.filter((c) => c.id !== 'cust-walkin').length} {isBn ? 'গ্রাহক' : 'clients'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mt-2.5">
                {isBn ? 'গ্রাহক বাকি খাতা (Ledger)' : 'Customer Due Ledger'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isBn
                  ? 'গ্রাহকের নাম, মোবাইল নম্বর, মোট কেনাকাটা, ক্রেডিট লিমিট ও বকেয়া বাকি'
                  : 'Customer accounts, contacts, lifetime spend, credit limit & due amounts.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCustomersCSV}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isBn ? 'বাকি খাতা CSV ডাউনলোড' : 'Download Ledger CSV'}</span>
            </button>
          </div>
        </div>

        {/* Informational tip */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            {isBn
              ? '💡 টিপ: ডাউনলোডকৃত CSV ফাইলগুলো সরাসরি Microsoft Excel, Google Sheets বা অ্যাকাউন্টিং সফটওয়্যারে ওপেন করা যাবে।'
              : '💡 Note: Exported CSV files use UTF-8 encoding and can be opened in Microsoft Excel, Google Sheets, or LibreOffice Calc without distortion.'}
          </span>
        </div>
      </div>

      {/* JSON Data Backup & Reset */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-4xl shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Download className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {isBn ? 'JSON ব্যাকআপ ও রিসেট' : 'JSON Backup & Factory Reset'}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              {isBn ? 'সম্পূর্ণ সিস্টেম ডাটাবেজ ব্যাকআপ (JSON)' : 'Full System Database Snapshot (JSON)'}
            </p>
            <p className="text-slate-400 mt-0.5">
              {isBn
                ? 'ব্রাউজারের সম্পূর্ণ ডেটাবেজ স্ন্যাপশট JSON ফাইলে সংরক্ষণ করুন'
                : 'Raw application state snapshot including configuration, expenses, and logs'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackup}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBn ? 'JSON ব্যাকআপ' : 'Download JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    isBn
                      ? 'আপনি কি নিশ্চিত যে ডেমো ডেটায় রিসেট করতে চান? আপনার সংরক্ষিত পরিবর্তন মুছে যাবে।'
                      : 'Reset all products, sales and customers back to initial demo dataset?'
                  )
                ) {
                  resetAllData();
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'ডেমো ডেটা রিসেট' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
