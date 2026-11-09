import React, { useState } from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Navbar } from './components/Navbar';
import { PosTerminal } from './components/pos/PosTerminal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SalesHistory } from './components/sales/SalesHistory';
import { DueKhata } from './components/due/DueKhata';
import { ExpenseTracker } from './components/expenses/ExpenseTracker';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { StoreSettingsView } from './components/settings/StoreSettingsView';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';
import { ParkedOrdersModal } from './components/pos/ParkedOrdersModal';
import { CashRegisterModal } from './components/cash/CashRegisterModal';
import {
  ShoppingCart,
  Package,
  Receipt,
  Users,
  BookOpen,
  Coins,
  TrendingUp,
  Settings,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentInvoiceForReceipt,
    showReceiptModal,
    closeReceiptModal,
    settings,
  } = usePos();

  const [isParkedModalOpen, setIsParkedModalOpen] = useState<boolean>(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);

  const isBn = settings.language === 'bn';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 select-none">
      {/* Top Bar Header */}
      <Navbar
        onOpenParkedModal={() => setIsParkedModalOpen(true)}
        onOpenCashModal={() => setIsCashModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'pos' && (
          <PosTerminal onOpenParkedModal={() => setIsParkedModalOpen(true)} />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'sales' && <SalesHistory />}
        {activeTab === 'customers' && <CustomerManager />}
        {activeTab === 'due' && <DueKhata />}
        {activeTab === 'expenses' && <ExpenseTracker />}
        {activeTab === 'reports' && <ReportsDashboard />}
        {activeTab === 'settings' && <StoreSettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on smaller viewports) */}
      <nav className="lg:hidden flex items-center justify-around border-t border-slate-200 bg-white py-2 px-1 shrink-0 text-[10px] font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'pos' ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isBn ? 'পিওএস' : 'POS'}</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'inventory' ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isBn ? 'স্টক' : 'Stock'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'sales' ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isBn ? 'মেমো' : 'Orders'}</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'customers' ? 'text-indigo-700 font-bold' : ''
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isBn ? 'গ্রাহক' : 'Clients'}</span>
        </button>

        <button
          onClick={() => setActiveTab('due')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'due' ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>{isBn ? 'বাকি' : 'Due'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'reports' ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{isBn ? 'রিপোর্ট' : 'Reports'}</span>
        </button>
      </nav>

      {/* Global Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        invoice={currentInvoiceForReceipt}
        onClose={closeReceiptModal}
      />

      {/* Global Parked Orders Modal */}
      <ParkedOrdersModal
        isOpen={isParkedModalOpen}
        onClose={() => setIsParkedModalOpen(false)}
      />

      {/* Global Cash Register Drawer Modal */}
      <CashRegisterModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <PosProvider>
      <AppContent />
    </PosProvider>
  );
}
