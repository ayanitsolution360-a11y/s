import React from 'react';
import { usePos } from '../context/PosContext';
import {
  ShoppingCart,
  Package,
  Receipt,
  Users,
  BookOpen,
  TrendingUp,
  Settings,
  Volume2,
  VolumeX,
  Globe,
  Coins,
  PauseCircle,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  onOpenParkedModal: () => void;
  onOpenCashModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenParkedModal, onOpenCashModal }) => {
  const {
    activeTab,
    setActiveTab,
    products,
    parkedOrders,
    settings,
    updateSettings,
    isSoundEnabled,
    toggleSound,
  } = usePos();

  const isBn = settings.language === 'bn';
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  const toggleLanguage = () => {
    updateSettings({ language: isBn ? 'en' : 'bn' });
  };

  const toggleCurrency = () => {
    updateSettings({
      currency: settings.currency === 'BDT' ? 'USD' : 'BDT',
      currencySymbol: settings.currency === 'BDT' ? '$' : '৳',
    });
  };

  return (
    <header className="flex items-center justify-between gap-8 px-5 py-3 border-b border-slate-200 bg-white text-slate-800 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            e
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
              {isBn ? 'ই-সেবা স্মার্ট পিওএস' : 'eSheba Smart POS'}
            </span>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {settings.storeName}
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'pos'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span>{isBn ? 'পিওএস কাউন্টার' : 'POS Terminal'}</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4 text-slate-500" />
          <span>{isBn ? 'পণ্য ও স্টক' : 'Inventory'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'sales'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-slate-500" />
          <span>{isBn ? 'বিক্রয় ইতিহাস' : 'Sales Orders'}</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>{isBn ? 'গ্রাহক / কাস্টমার' : 'Customers'}</span>
        </button>

        <button
          onClick={() => setActiveTab('due')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'due'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>{isBn ? 'বাকি খাতা' : 'Due Ledger'}</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-4 h-4 text-rose-500" />
          <span>{isBn ? 'দৈনিক খরচ' : 'Expenses'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>{isBn ? 'রিপোর্ট' : 'Reports'}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-emerald-50 text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
        </button>
      </nav>

      {/* Zone 3: Fast Actions & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Parked Orders Quick Badge */}
        {parkedOrders.length > 0 && (
          <button
            onClick={onOpenParkedModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors whitespace-nowrap"
            title="View Parked Orders"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{isBn ? 'হোল্ড অর্ডার' : 'Hold'}: {parkedOrders.length}</span>
          </button>
        )}

        {/* Low Stock Quick Alert */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap"
            title="View Products at Reorder Level"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isBn ? 'লো স্টক' : 'Low Stock'}: {lowStockCount}</span>
          </button>
        )}

        {/* Currency Switcher */}
        <button
          onClick={toggleCurrency}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          title="Toggle Currency"
        >
          {settings.currencySymbol} {settings.currency}
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{isBn ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title={isSoundEnabled ? 'Sound On' : 'Sound Muted'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Cash Register Drawer quick button */}
        <button
          onClick={onOpenCashModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shadow-sm"
        >
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isBn ? 'ক্যাশ ড্রয়ার' : 'Cash Drawer'}</span>
        </button>
      </div>
    </header>
  );
};
