import React, { useRef } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Printer,
  Share2,
  Check,
  Receipt,
  Download,
} from 'lucide-react';
import { SaleInvoice } from '../../types';

interface ThermalReceiptModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { settings, customers } = usePos();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const isBn = settings.language === 'bn';
  const customer = customers.find((c) => c.id === invoice.customerId);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.date).toLocaleString(isBn ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              {isBn ? 'থার্মাল মেমো / ক্যাশ রসিদ' : 'Thermal POS Invoice Receipt'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview (Printable element) */}
        <div className="p-4 overflow-y-auto bg-slate-100/70 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-5 shadow-sm border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] leading-relaxed select-text"
          >
            {/* Header / Store Profile */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans">
                {isBn && settings.storeBnName ? settings.storeBnName : settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">{settings.tagline}</p>
              <p className="text-[10px] text-slate-600 mt-1">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{invoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{invoice.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold">{invoice.customerName}</span>
              </div>
              {invoice.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] font-bold pb-1 border-b border-slate-200">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/4 text-center">QTY</span>
                <span className="w-1/4 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-slate-100 pt-1 space-y-1">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="font-bold text-[10px] truncate">
                      {isBn && item.product.bnName ? item.product.bnName : item.product.name}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.quantity} {item.product.unit} × {settings.currencySymbol}
                        {item.unitPrice}
                        {item.discount > 0 && ` (-${item.discount}%)`}
                      </span>
                      <span className="font-bold text-slate-900">
                        {settings.currencySymbol}
                        {item.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol}{invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{settings.currencySymbol}{invoice.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {invoice.pointsDiscountAmount && invoice.pointsDiscountAmount > 0 ? (
                <div className="flex justify-between text-amber-700">
                  <span>Points Discount ({invoice.pointsRedeemed} pts):</span>
                  <span>-{settings.currencySymbol}{invoice.pointsDiscountAmount.toLocaleString()}</span>
                </div>
              ) : null}
              {invoice.vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT ({invoice.vatPercent}%):</span>
                  <span>+{settings.currencySymbol}{invoice.vatAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300">
                <span>NET TOTAL:</span>
                <span>{settings.currencySymbol}{invoice.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{invoice.paymentMethod}</span>
              </div>
              {invoice.trxId && (
                <div className="flex justify-between">
                  <span>TrxID:</span>
                  <span>{invoice.trxId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span className="font-bold text-emerald-800">
                  {settings.currencySymbol}{invoice.paidAmount.toLocaleString()}
                </span>
              </div>
              {invoice.changeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Change Return:</span>
                  <span>{settings.currencySymbol}{invoice.changeAmount.toLocaleString()}</span>
                </div>
              )}
              {invoice.dueAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Due on Invoice:</span>
                  <span>{settings.currencySymbol}{invoice.dueAmount.toLocaleString()}</span>
                </div>
              )}

              {/* Total Customer Due Balance if customer has accumulated debt */}
              {customer && customer.id !== 'cust-walkin' && customer.dueAmount > 0 && (
                <div className="flex justify-between pt-1 text-[10px] text-rose-800 font-bold border-t border-dotted border-slate-200">
                  <span>Total Account Due:</span>
                  <span>{settings.currencySymbol}{customer.dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Loyalty Rewards Summary on Receipt */}
            {settings.loyaltyPointsEnabled && (
              ((invoice.pointsEarned && invoice.pointsEarned > 0) ||
               (invoice.pointsRedeemed && invoice.pointsRedeemed > 0) ||
               (customer && (customer.loyaltyPoints || 0) > 0))
            ) && (
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="font-bold text-center tracking-wider text-slate-700 text-[9px]">
                  --- LOYALTY REWARDS ---
                </div>
                {invoice.pointsEarned && invoice.pointsEarned > 0 ? (
                  <div className="flex justify-between text-emerald-800">
                    <span>Points Earned Today:</span>
                    <span className="font-bold font-mono">+{invoice.pointsEarned} pts</span>
                  </div>
                ) : null}
                {invoice.pointsRedeemed && invoice.pointsRedeemed > 0 ? (
                  <div className="flex justify-between text-amber-800">
                    <span>Points Redeemed:</span>
                    <span className="font-bold font-mono">
                      -{invoice.pointsRedeemed} pts ({settings.currencySymbol}{invoice.pointsDiscountAmount})
                    </span>
                  </div>
                ) : null}
                {customer && customer.id !== 'cust-walkin' && (
                  <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-200">
                    <span>Total Points Balance:</span>
                    <span className="font-mono">{(customer.loyaltyPoints || 0).toLocaleString()} pts</span>
                  </div>
                )}
              </div>
            )}

            {/* Simulated Barcode */}
            <div className="pt-3 text-center space-y-1">
              <div className="h-8 w-44 mx-auto flex items-center justify-center gap-0.5 opacity-80">
                {/* Visual Barcode pattern */}
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 1, 4, 1].map((w, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-slate-500 tracking-widest">{invoice.invoiceNo}</p>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 text-center text-[10px] text-slate-500 font-sans space-y-1">
              <p>{settings.receiptFooter}</p>
              <p className="text-[9px] text-slate-400 font-semibold">
                Software: smartpos.e-sheba.com
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt (80mm)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
