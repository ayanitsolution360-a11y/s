import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { SaleInvoice } from '../../types';

export const SalesHistory: React.FC = () => {
  const { invoices, openReceiptModal, refundInvoice, settings } = usePos();
  const isBn = settings.language === 'bn';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due' | 'returned'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Aggregated KPIs
  const totalSalesAmount = invoices
    .filter((i) => i.status !== 'returned')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalCollectedAmount = invoices
    .filter((i) => i.status !== 'returned')
    .reduce((sum, i) => sum + i.paidAmount, 0);

  const totalOutstandingDue = invoices
    .filter((i) => i.status !== 'returned')
    .reduce((sum, i) => sum + i.dueAmount, 0);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q)) ||
        (inv.trxId && inv.trxId.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'all' || inv.status === statusFilter;

      const matchMethod =
        methodFilter === 'all' || inv.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [invoices, searchQuery, statusFilter, methodFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Customer',
      'Phone',
      'Items Count',
      'Subtotal',
      'Discount',
      'VAT',
      'Grand Total',
      'Paid Amount',
      'Due Amount',
      'Payment Method',
      'TrxID',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNo,
      `"${new Date(inv.date).toLocaleString()}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerPhone || '',
      inv.items.length,
      inv.subtotal,
      inv.discountAmount,
      inv.vatAmount,
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
      inv.paymentMethod,
      inv.trxId || '',
      inv.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esheba_sales_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'বিক্রয় ও ইনভয়েস ইতিহাস' : 'Sales Orders & Invoices'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'সকল সম্পন্ন বিক্রয় মেমো, পেমেন্ট ট্র্যাকিং ও রসিদ রিপ্রিন্ট'
              : 'Complete record of customer sales, payment breakdowns and receipt reprinting'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>{isBn ? 'এক্সপোর্ট CSV' : 'Export Orders CSV'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট বিক্রয়' : 'Total Revenue'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {settings.currencySymbol}{totalSalesAmount.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'নগদ / পরিশোধিত' : 'Cash Collected'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {settings.currencySymbol}{totalCollectedAmount.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'বাকি বিক্রয়' : 'Sales on Due'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
            {settings.currencySymbol}{totalOutstandingDue.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট অর্ডার মেমো' : 'Total Invoices'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-800 mt-1">
            {invoices.length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'মেমো নং, কাস্টমার নাম বা TrxID দিয়ে খুঁজুন...' : 'Search by Invoice #, Customer or TrxID...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Segmented Status Filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-stretch sm:self-auto overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'সব' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'paid'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'পরিশোধিত' : 'Paid'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'partial'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'আংশিক বাকি' : 'Partial Due'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('due')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'due'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'বাকি' : 'Due'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'returned'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'ফেরত' : 'Returned'}
            </button>
          </div>

          {/* Payment Method Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option value="all">{isBn ? 'সকল পেমেন্ট মাধ্যম' : 'All Payment Methods'}</option>
              <option value="cash">Cash (ক্যাশ)</option>
              <option value="bkash">bKash (বিকাশ)</option>
              <option value="nagad">Nagad (নগদ)</option>
              <option value="card">Card (কার্ড)</option>
              <option value="due">Due (বাকি)</option>
              <option value="split">Split (মিশ্র)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isBn ? 'ইনভয়েস নং ও সময়' : 'Invoice & Time'}</th>
                <th className="py-3 px-3">{isBn ? 'কাস্টমার' : 'Customer'}</th>
                <th className="py-3 px-3">{isBn ? 'আইটেম সংখ্যা' : 'Items'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'মোট বিল' : 'Net Total'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'পরিশোধিত' : 'Paid'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'বকেয়া' : 'Due'}</th>
                <th className="py-3 px-3">{isBn ? 'মাধ্যম' : 'Method'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="font-semibold text-slate-700">
                      {isBn ? 'কোনো ইনভয়েস পাওয়া যায়নি' : 'No sales invoices found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const formattedDate = new Date(inv.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = new Date(inv.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div className="font-bold text-slate-900">{inv.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400">
                          {formattedDate} · {formattedTime}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {inv.customerName}
                        </div>
                        {inv.customerPhone && (
                          <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-0.5">
                            {inv.customerPhone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono tabular-nums">
                        {inv.items.length} {isBn ? 'টি পণ্য' : 'items'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {settings.currencySymbol}{inv.grandTotal.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                        {settings.currencySymbol}{inv.paidAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        {inv.dueAmount > 0 ? (
                          <span className="text-rose-600">
                            {settings.currencySymbol}{inv.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="uppercase text-[11px] font-mono font-semibold text-slate-700">
                          {inv.paymentMethod}
                        </span>
                        {inv.trxId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]">
                            {inv.trxId}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {inv.status === 'paid' ? (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            {isBn ? 'পরিশোধিত' : 'Paid'}
                          </span>
                        ) : inv.status === 'partial' ? (
                          <span className="text-amber-700 font-semibold text-[11px]">
                            {isBn ? 'আংশিক' : 'Partial'}
                          </span>
                        ) : inv.status === 'due' ? (
                          <span className="text-rose-700 font-semibold text-[11px]">
                            {isBn ? 'বাকি' : 'Due'}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold text-[11px]">
                            {isBn ? 'ফেরত' : 'Returned'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reprint Thermal Receipt */}
                          <button
                            type="button"
                            onClick={() => openReceiptModal(inv)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors"
                            title="View & Reprint Thermal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Return / Refund */}
                          {inv.status !== 'returned' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    isBn
                                      ? 'আপনি কি এই বিক্রয় মেমোটি ফেরত (Return) করতে চান? এতে পণ্য পুনরায় স্টকে যুক্ত হবে।'
                                      : 'Do you want to refund/return this sale order? Items will be restocked.'
                                  )
                                ) {
                                  refundInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Return / Refund Order"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
