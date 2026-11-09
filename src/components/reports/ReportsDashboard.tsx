import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Printer,
  ShoppingBag,
  Award,
  Wallet,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { LowStockWidget } from '../widgets/LowStockWidget';
import { RestockPredictorWidget } from '../widgets/RestockPredictorWidget';

export const ReportsDashboard: React.FC = () => {
  const { invoices, expenses, customers, products, settings } = usePos();
  const isBn = settings.language === 'bn';

  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('month');

  // Last 7 Days Sales Revenue Trend (T-6 to T-0)
  const last7DaysData = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayInvoices = invoices.filter((inv) => {
        if (inv.status === 'returned') return false;
        const invTime = new Date(inv.date).getTime();
        return invTime >= startOfDay && invTime <= endOfDay;
      });

      const revenue = dayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const orders = dayInvoices.length;
      const collected = dayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const due = dayInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

      const weekdayStr = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' });
      const dayMonthStr = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' });

      days.push({
        dateKey: d.toISOString().slice(0, 10),
        displayDate: `${weekdayStr}, ${dayMonthStr}`,
        fullDate: d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        revenue,
        orders,
        collected,
        due,
      });
    }

    return days;
  }, [invoices, isBn]);

  const total7DayRevenue = useMemo(
    () => last7DaysData.reduce((sum, d) => sum + d.revenue, 0),
    [last7DaysData]
  );
  const avg7DayDailyRevenue = Math.round(total7DayRevenue / 7);
  const peakDay = useMemo(() => {
    if (last7DaysData.length === 0) return null;
    return [...last7DaysData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [last7DaysData]);

  // Filter invoices and expenses by date range
  const { filteredInvoices, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let startTimestamp = 0;

    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTimestamp = todayStart.getTime();
    } else if (dateRange === '7days') {
      startTimestamp = now.getTime() - 7 * 86400000;
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startTimestamp = monthStart.getTime();
    }

    const validInvoices = invoices.filter(
      (i) => i.status !== 'returned' && new Date(i.date).getTime() >= startTimestamp
    );

    const validExpenses = expenses.filter(
      (e) => new Date(e.date).getTime() >= startTimestamp
    );

    return { filteredInvoices: validInvoices, filteredExpenses: validExpenses };
  }, [invoices, expenses, dateRange]);

  // Financial Metrics
  const grossSales = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalCollected = filteredInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const salesDue = filteredInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  // Estimate COGS
  const totalCOGS = filteredInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((itemSum, item) => {
        return itemSum + item.product.costPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = Math.max(0, grossSales - totalCOGS);
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenseAmount;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      cash: 0,
      bkash: 0,
      nagad: 0,
      card: 0,
      due: 0,
      split: 0,
    };
    filteredInvoices.forEach((inv) => {
      counts[inv.paymentMethod] = (counts[inv.paymentMethod] || 0) + inv.grandTotal;
    });
    return counts;
  }, [filteredInvoices]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const itemMap = new Map<string, { name: string; bnName?: string; qty: number; revenue: number }>();
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const existing = itemMap.get(item.product.id);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.total;
        } else {
          itemMap.set(item.product.id, {
            name: item.product.name,
            bnName: item.product.bnName,
            qty: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredInvoices]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'ব্যবসায়িক রিপোর্ট ও আর্থিক বিশ্লেষণ' : 'Analytics & Financial Reports'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'মোট বিক্রয়, মুনাফা হিসাব, খরচের অডিট ও সর্বোচ্চ বিক্রিত পণ্য'
              : 'Gross margin, net profitability, payment channels and product performance'}
          </p>
        </div>

        {/* Date Filter Segmented control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'আজ' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('7days')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === '7days'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'গত ৭ দিন' : 'Last 7 Days'}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('month')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'চলতি মাস' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'সর্বকাল' : 'All Time'}
          </button>
        </div>
      </div>

      {/* Primary Financial P&L Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট বিক্রয়' : 'Gross Sales'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {settings.currencySymbol}{grossSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {filteredInvoices.length} {isBn ? 'টি অর্ডার' : 'orders'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'পণ্য ক্রয়মূল্য (COGS)' : 'Cost of Goods'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-600 mt-1">
            {settings.currencySymbol}{totalCOGS.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isBn ? 'বিক্রিত পণ্যের কেনা দাম' : 'Direct cost basis'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট লাভ (Gross Profit)' : 'Gross Profit'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {settings.currencySymbol}{grossProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-1">
            {grossSales > 0 ? `${Math.round((grossProfit / grossSales) * 100)}% margin` : '—'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'পরিচালন ব্যয় (Expenses)' : 'Overhead Expenses'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
            {settings.currencySymbol}{totalExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {filteredExpenses.length} {isBn ? 'টি খরচ' : 'entries'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 text-white rounded-xl col-span-2 lg:col-span-1 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {isBn ? 'প্রকৃত নীট লাভ (Net Profit)' : 'Net Profit'}
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {settings.currencySymbol}{netProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isBn ? 'সকল খরচ বাদে বাস্তব আয়' : 'After all expenses'}
          </div>
        </div>
      </div>

      {/* 7-Day Total Sales Revenue Trend Line Chart */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'দৈনিক বিক্রয় রাজস্ব ট্রেন্ড (গত ৭ দিন)' : '7-Day Total Sales Revenue Trend'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'গত ৭ দিনের দিনভিত্তিক মোট বিক্রয় আয় ও অর্ডারের গ্রাফিকাল বিশ্লেষণ'
                  : 'Daily gross sales revenue trajectory and transaction volume over the last 7 days'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3 text-xs font-mono self-start sm:self-auto">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 block font-sans font-semibold">
                {isBn ? '৭ দিনে মোট বিক্রয়' : '7-Day Total'}
              </span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                {settings.currencySymbol}{total7DayRevenue.toLocaleString()}
              </span>
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 block font-sans font-semibold">
                {isBn ? 'দৈনিক গড় আয়' : 'Daily Avg'}
              </span>
              <span className="font-bold text-emerald-700 text-sm tabular-nums">
                {settings.currencySymbol}{avg7DayDailyRevenue.toLocaleString()}
              </span>
            </div>

            {peakDay && peakDay.revenue > 0 && (
              <div className="hidden md:block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase tracking-wide text-slate-400 block font-sans font-semibold">
                  {isBn ? 'সর্বোচ্চ বিক্রির দিন' : 'Peak Day'}
                </span>
                <span className="font-bold text-slate-800 text-xs tabular-nums">
                  {peakDay.displayDate} ({settings.currencySymbol}{peakDay.revenue.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="w-full h-72 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7DaysData}
              margin={{ top: 12, right: 18, left: 0, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                dy={6}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  `${settings.currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}`
                }
                dx={-4}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[200px]">
                      <p className="text-slate-400 font-medium text-[11px] mb-1.5 pb-1 border-b border-slate-800">
                        {item.fullDate}
                      </p>
                      <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{isBn ? 'বিক্রয় রাজস্ব:' : 'Total Sales:'}</span>
                        </span>
                        <span className="font-mono tabular-nums text-sm">
                          {settings.currencySymbol}{item.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-300 text-[11px] pt-1">
                        <span>{isBn ? 'অর্ডার সংখ্যা:' : 'Total Orders:'}</span>
                        <span className="font-mono tabular-nums font-semibold">
                          {item.orders} {isBn ? 'টি' : 'sales'}
                        </span>
                      </div>
                      {item.collected > 0 && (
                        <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] pt-0.5">
                          <span>{isBn ? 'আদায়কৃত পেমেন্ট:' : 'Collected Cash:'}</span>
                          <span className="font-mono tabular-nums">
                            {settings.currencySymbol}{item.collected.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {item.due > 0 && (
                        <div className="flex items-center justify-between gap-3 text-rose-400 text-[10px] pt-0.5">
                          <span>{isBn ? 'বাকি বিক্রয়:' : 'Due Credit:'}</span>
                          <span className="font-mono tabular-nums">
                            {settings.currencySymbol}{item.due.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name={isBn ? 'দৈনিক বিক্রয়' : 'Sales Revenue'}
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#059669', stroke: '#a7f3d0', strokeWidth: 3 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI-Powered Restock Predictor Widget */}
      <RestockPredictorWidget />

      {/* Low Stock & Reorder Alert Widget */}
      <LowStockWidget />

      {/* Analytics 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products Leaderboard */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'সর্বোচ্চ বিক্রিত পণ্য (Top Products)' : 'Top Selling Products'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {isBn ? 'বিক্রয় পরিমাণ ও আয়' : 'By Volume & Revenue'}
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isBn ? 'কোনো বিক্রয় ডেটা নেই' : 'No sales records in selected period'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {isBn && p.bnName ? p.bnName : p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {p.qty} {isBn ? 'টি বিক্রি হয়েছে' : 'units sold'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums font-bold text-slate-900 shrink-0">
                    {settings.currencySymbol}{p.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'পেমেন্ট মাধ্যম অনুপাত' : 'Payment Methods Distribution'}</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {settings.currencySymbol}{grossSales.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { id: 'cash', label: isBn ? 'ক্যাশ (নগদ)' : 'Cash', color: 'bg-emerald-500' },
              { id: 'bkash', label: 'bKash (বিকাশ)', color: 'bg-pink-500' },
              { id: 'nagad', label: 'Nagad (নগদ)', color: 'bg-amber-500' },
              { id: 'card', label: isBn ? 'কার্ড' : 'Card', color: 'bg-blue-500' },
              { id: 'due', label: isBn ? 'বাকি' : 'Due Credit', color: 'bg-rose-500' },
            ].map((pm) => {
              const amount = paymentBreakdown[pm.id] || 0;
              const percent = grossSales > 0 ? Math.round((amount / grossSales) * 100) : 0;

              return (
                <div key={pm.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${pm.color}`} />
                      {pm.label}
                    </span>
                    <span className="font-mono tabular-nums">
                      {settings.currencySymbol}{amount.toLocaleString()}{' '}
                      <span className="text-slate-400">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${pm.color} rounded-full transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
