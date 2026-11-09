import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Trash2,
  Plus,
  Minus,
  User,
  UserPlus,
  Percent,
  PauseCircle,
  RotateCcw,
  CreditCard,
  AlertCircle,
  Tag,
  Sparkles,
  Gift,
} from 'lucide-react';
import { Customer } from '../../types';

interface CartPanelProps {
  onOpenCheckout: () => void;
  onOpenAddCustomer: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenCheckout,
  onOpenAddCustomer,
}) => {
  const {
    cart,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    updateQuantity,
    removeFromCart,
    clearCart,
    parkCurrentOrder,
    cartSubtotal,
    cartDiscount,
    cartDiscountType,
    setCartDiscount,
    setCartDiscountType,
    cartDiscountAmount,
    redeemedPoints,
    setRedeemedPoints,
    pointsDiscountAmount,
    pointsToEarn,
    cartVatAmount,
    cartGrandTotal,
    settings,
  } = usePos();

  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);
  const [showPointsInput, setShowPointsInput] = useState<boolean>(false);
  const isBn = settings.language === 'bn';

  return (
    <div className="w-full lg:w-96 xl:w-[420px] 2xl:w-[460px] flex flex-col h-full bg-white border-l border-slate-200 shrink-0">
      {/* Customer Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>{isBn ? 'গ্রাহক / কাস্টমার' : 'Customer'}</span>
          </label>

          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <UserPlus className="w-3 h-3" />
            <span>{isBn ? '+ নতুন গ্রাহক' : '+ New Customer'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCustomer.id}
            onChange={(e) => {
              const found = customers.find((c) => c.id === e.target.value);
              if (found) setSelectedCustomer(found);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
                {settings.loyaltyPointsEnabled && c.loyaltyPoints ? ` [⭐ ${c.loyaltyPoints} pts]` : ''}
                {c.dueAmount > 0 ? ` [Due: ${settings.currencySymbol}${c.dueAmount}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Loyalty Points Balance preview for selected customer */}
        {selectedCustomer.id !== 'cust-walkin' && settings.loyaltyPointsEnabled && (
          <div className="mt-2 text-xs flex items-center justify-between text-amber-800 bg-amber-50/90 px-2.5 py-1.5 rounded-lg border border-amber-200">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{isBn ? 'লয়্যালটি পয়েন্ট' : 'Loyalty Points'}:</span>
              <strong className="font-mono tabular-nums font-bold text-amber-900">
                {(selectedCustomer.loyaltyPoints || 0).toLocaleString()} {isBn ? 'পয়েন্ট' : 'pts'}
              </strong>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-amber-700 font-semibold">
              ≈ {settings.currencySymbol}{((selectedCustomer.loyaltyPoints || 0) * (settings.pointValue || 1)).toLocaleString()}
            </span>
          </div>
        )}

        {/* If customer has prior due, show quiet unboxed warning */}
        {selectedCustomer.id !== 'cust-walkin' && selectedCustomer.dueAmount > 0 && (
          <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isBn ? 'পূর্বের বকেয়া বাকি' : 'Previous Outstanding Due'}:{' '}
              <strong className="font-mono tabular-nums">
                {settings.currencySymbol}{selectedCustomer.dueAmount.toLocaleString()}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <Tag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {isBn ? 'কার্ট খালি আছে' : 'Cart is Empty'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {isBn
                ? 'পণ্য তালিকায় ক্লিক করুন অথবা বারকোড স্ক্যান করুন'
                : 'Click products on the left or scan barcodes to begin sale'}
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-semibold text-slate-900 truncate">
                  {isBn && item.product.bnName ? item.product.bnName : item.product.name}
                </h5>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                  <span>
                    {settings.currencySymbol}{item.unitPrice.toLocaleString()}
                  </span>
                  <span>×</span>
                  <span className="font-semibold text-slate-700">{item.quantity}</span>
                  {item.discount > 0 && (
                    <span className="text-emerald-600">
                      (-{item.discount}{item.discountType === 'percentage' ? '%' : settings.currencySymbol})
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    updateQuantity(item.product.id, val);
                  }}
                  className="w-8 text-center text-xs font-bold font-mono tabular-nums bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Total */}
              <div className="w-16 text-right font-mono tabular-nums font-bold text-xs text-slate-900 shrink-0">
                {settings.currencySymbol}{item.total.toLocaleString()}
              </div>

              {/* Delete line */}
              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bill Calculation & Summary */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{isBn ? 'উপমোট (সাবটোটাল)' : 'Subtotal'}</span>
          <span className="font-mono tabular-nums font-medium text-slate-900">
            {settings.currencySymbol}{cartSubtotal.toLocaleString()}
          </span>
        </div>

        {/* Order Discount Trigger & Inputs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-emerald-700 font-medium hover:underline flex items-center gap-1"
            >
              <Percent className="w-3 h-3" />
              <span>{isBn ? 'ডিসকাউন্ট / ছাড়' : 'Discount'}</span>
            </button>
            <span className="font-mono tabular-nums text-emerald-700 font-medium">
              -{settings.currencySymbol}{cartDiscountAmount.toLocaleString()}
            </span>
          </div>

          {showDiscountInput && (
            <div className="flex items-center gap-1.5 bg-white p-1.5 border border-slate-200 rounded-lg">
              <input
                type="number"
                min="0"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs font-mono tabular-nums px-2 py-1 border border-slate-200 rounded outline-none"
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setCartDiscountType('percentage')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    cartDiscountType === 'percentage'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setCartDiscountType('flat')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    cartDiscountType === 'flat'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {settings.currencySymbol}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loyalty Points Redemption (if enabled and customer selected) */}
        {settings.loyaltyPointsEnabled && selectedCustomer.id !== 'cust-walkin' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setShowPointsInput(!showPointsInput)}
                className="text-amber-700 font-medium hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{isBn ? 'পয়েন্ট রিডিম (ছাড়)' : 'Redeem Points'}</span>
                {(selectedCustomer.loyaltyPoints || 0) > 0 && (
                  <span className="text-[10px] text-amber-600 font-mono">
                    ({(selectedCustomer.loyaltyPoints || 0).toLocaleString()} {isBn ? 'পয়েন্ট' : 'pts'})
                  </span>
                )}
              </button>
              {pointsDiscountAmount > 0 ? (
                <span className="font-mono tabular-nums text-amber-700 font-medium">
                  -{settings.currencySymbol}{pointsDiscountAmount.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-amber-600">({redeemedPoints} pts)</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">0</span>
              )}
            </div>

            {showPointsInput && (
              <div className="bg-amber-50/70 p-2.5 border border-amber-200/90 rounded-lg space-y-2">
                {(selectedCustomer.loyaltyPoints || 0) < (settings.minPointsToRedeem || 20) ? (
                  <div className="text-[11px] text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>
                      {isBn
                        ? `রিডিম করতে সর্বনিম্ন ${settings.minPointsToRedeem || 20} পয়েন্ট প্রয়োজন (গ্রাহকের আছে: ${selectedCustomer.loyaltyPoints || 0} পয়েন্ট)`
                        : `Minimum ${settings.minPointsToRedeem || 20} points required to redeem (has ${selectedCustomer.loyaltyPoints || 0} pts).`}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(
                          selectedCustomer.loyaltyPoints || 0,
                          Math.floor(Math.max(0, cartSubtotal - cartDiscountAmount) / (settings.pointValue || 1))
                        )}
                        value={redeemedPoints || ''}
                        onChange={(e) => {
                          const maxRedeem = Math.min(
                            selectedCustomer.loyaltyPoints || 0,
                            Math.floor(Math.max(0, cartSubtotal - cartDiscountAmount) / (settings.pointValue || 1))
                          );
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setRedeemedPoints(Math.min(val, maxRedeem));
                        }}
                        placeholder={isBn ? 'পয়েন্ট সংখ্যা' : 'Points to redeem'}
                        className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 bg-white border border-amber-300 rounded outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const maxRedeem = Math.min(
                            selectedCustomer.loyaltyPoints || 0,
                            Math.floor(Math.max(0, cartSubtotal - cartDiscountAmount) / (settings.pointValue || 1))
                          );
                          setRedeemedPoints(maxRedeem);
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-200/90 hover:bg-amber-300 text-amber-900 rounded shrink-0 transition-colors"
                      >
                        {isBn ? 'সর্বোচ্চ' : 'Max'}
                      </button>
                      {redeemedPoints > 0 && (
                        <button
                          type="button"
                          onClick={() => setRedeemedPoints(0)}
                          className="px-2 py-1.5 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded shrink-0 transition-colors"
                        >
                          {isBn ? 'মুছুন' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
                      <span>
                        {isBn ? 'ছাড়ের সমমূল্য:' : 'Discount Value:'}{' '}
                        <strong className="font-mono text-amber-900">
                          {settings.currencySymbol}
                          {pointsDiscountAmount.toLocaleString()}
                        </strong>
                      </span>
                      <span className="text-[10px] text-amber-700">
                        1 pt = {settings.currencySymbol}{settings.pointValue || 1}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* VAT / Tax */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            {isBn ? 'ভ্যাট / ট্যাক্স' : 'VAT'} ({settings.vatPercent}%)
          </span>
          <span className="font-mono tabular-nums font-medium text-slate-900">
            +{settings.currencySymbol}{cartVatAmount.toLocaleString()}
          </span>
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              {isBn ? 'মোট পরিশোধযোগ্য' : 'Net Payable'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 leading-tight">
              {settings.currencySymbol}{cartGrandTotal.toLocaleString()}
            </div>
          </div>

          {/* Cart Utility actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => parkCurrentOrder()}
              disabled={cart.length === 0}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              title="Park / Hold Order"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 rounded-lg transition-colors"
              title="Clear Cart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Points to earn on this order banner */}
        {settings.loyaltyPointsEnabled && selectedCustomer.id !== 'cust-walkin' && pointsToEarn > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/90 px-3 py-2 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-1.5 font-medium">
              <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isBn ? 'এই বিক্রয়ে অর্জিত পয়েন্ট:' : 'Points to Earn on Sale:'}</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-emerald-700">
              +{pointsToEarn} {isBn ? 'পয়েন্ট' : 'pts'}
            </span>
          </div>
        )}

        {/* Primary Checkout CTA */}
        <button
          type="button"
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <CreditCard className="w-4 h-4" />
          <span>
            {isBn ? 'বিল পরিশোধ ও রসিদ (পেমেন্ট)' : 'Pay & Print Receipt'}
          </span>
          <span className="font-mono tabular-nums">
            ({settings.currencySymbol}{cartGrandTotal.toLocaleString()})
          </span>
        </button>
      </div>
    </div>
  );
};
