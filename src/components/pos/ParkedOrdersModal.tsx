import React from 'react';
import { usePos } from '../../context/PosContext';
import { X, Play, Trash2, Clock, PauseCircle, ShoppingBag } from 'lucide-react';

interface ParkedOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParkedOrdersModal: React.FC<ParkedOrdersModalProps> = ({ isOpen, onClose }) => {
  const {
    parkedOrders,
    restoreParkedOrder,
    deleteParkedOrder,
    settings,
  } = usePos();

  if (!isOpen) return null;
  const isBn = settings.language === 'bn';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isBn ? 'হোল্ড / সংরক্ষিত অর্ডার তালিকা' : 'Held / Parked Orders'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {parkedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">
                {isBn ? 'কোনো হোল্ড করা অর্ডার নেই' : 'No parked orders found'}
              </p>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'কার্টে পণ্য রেখে "হোল্ড" আইকনে ক্লিক করলে তা এখানে জমা থাকবে'
                  : 'Items in cart can be held/parked for later checkout'}
              </p>
            </div>
          ) : (
            parkedOrders.map((order) => {
              const orderTotal = order.items.reduce((sum, item) => sum + item.total, 0);
              const timeString = new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {order.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {timeString}
                      </span>
                      <span>·</span>
                      <span>{order.items.length} {isBn ? 'টি আইটেম' : 'items'}</span>
                      <span>·</span>
                      <strong className="text-slate-900 font-mono tabular-nums">
                        {settings.currencySymbol}{orderTotal.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        restoreParkedOrder(order.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isBn ? 'চালু করুন' : 'Resume'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteParkedOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
