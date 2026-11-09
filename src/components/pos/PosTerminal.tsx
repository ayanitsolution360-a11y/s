import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePos } from '../../context/PosContext';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CustomerAddModal } from './CustomerAddModal';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import {
  Barcode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';

interface PosTerminalProps {
  onOpenParkedModal: () => void;
}

interface ScanNotification {
  type: 'success' | 'warning' | 'error';
  message: string;
  subMessage?: string;
  product?: Product;
}

export const PosTerminal: React.FC<PosTerminalProps> = () => {
  const { products, addToCart, playBeep, settings, cart } = usePos();
  const isBn = settings.language === 'bn';

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);

  // Scan feedback toast state
  const [scanNotification, setScanNotification] = useState<ScanNotification | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((notif: ScanNotification) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setScanNotification(notif);
    notificationTimerRef.current = setTimeout(() => {
      setScanNotification(null);
    }, 3200);
  }, []);

  // Central Barcode Process Logic: searches product and automatically adds to cart
  const handleBarcodeScanned = useCallback(
    (scannedCode: string) => {
      const code = scannedCode.trim().toLowerCase();
      if (!code) return;

      // 1. Search products by barcode or SKU
      const foundProduct = products.find(
        (p) =>
          p.barcode.toLowerCase() === code ||
          p.sku.toLowerCase() === code
      );

      if (foundProduct) {
        if (foundProduct.stock <= 0) {
          playBeep('alert');
          showNotification({
            type: 'warning',
            message: isBn ? 'পণ্যটির স্টক শেষ' : 'Product Out of Stock',
            subMessage: isBn && foundProduct.bnName ? foundProduct.bnName : foundProduct.name,
            product: foundProduct,
          });
        } else {
          // Add to cart
          addToCart(foundProduct);

          // Find current quantity in cart to display in notification
          const existingInCart = cart.find((i) => i.product.id === foundProduct.id);
          const newQty = existingInCart ? existingInCart.quantity + 1 : 1;

          showNotification({
            type: 'success',
            message: isBn
              ? `${foundProduct.bnName || foundProduct.name} কার্টে যুক্ত হয়েছে`
              : `${foundProduct.name} added to cart`,
            subMessage: `SKU: ${foundProduct.sku} · Barcode: ${foundProduct.barcode} · ${settings.currencySymbol}${foundProduct.sellingPrice} (${newQty} in cart)`,
            product: foundProduct,
          });
        }
      } else {
        playBeep('alert');
        showNotification({
          type: 'error',
          message: isBn ? 'বারকোড বা SKU পাওয়া যায়নি' : 'Unrecognized Barcode or SKU',
          subMessage: `Searched: ${scannedCode}`,
        });
      }
    },
    [products, addToCart, playBeep, isBn, settings.currencySymbol, cart, showNotification]
  );

  // Global Hardware Barcode Scanner Listener (USB / Bluetooth HID keyboard emulation)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // If a modal is open that needs text entry, don't interfere
      if (isCheckoutOpen || isAddCustomerOpen) return;

      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Hardware scanners send characters in rapid succession (< 50ms per key)
      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          // Trigger scan
          e.preventDefault();
          handleBarcodeScanned(buffer);
          buffer = '';
        }
        return;
      }

      // If typed character is a standard printable character (single character)
      if (e.key.length === 1) {
        if (timeDiff > 80 && !isInput) {
          // If slow typing outside input, reset buffer
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleBarcodeScanned, isCheckoutOpen, isAddCustomerOpen]);

  return (
    <div className="relative flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* Floating Scan Notification Toast */}
      {scanNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-3.5 rounded-xl border shadow-lg flex items-center gap-3 backdrop-blur-md ${
              scanNotification.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : scanNotification.type === 'warning'
                ? 'bg-amber-900/90 text-white border-amber-700'
                : 'bg-rose-900/90 text-white border-rose-700'
            }`}
          >
            <div className="shrink-0">
              {scanNotification.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : scanNotification.type === 'warning' ? (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold truncate leading-snug">
                {scanNotification.message}
              </h5>
              {scanNotification.subMessage && (
                <p className="text-[11px] opacity-80 font-mono truncate mt-0.5">
                  {scanNotification.subMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setScanNotification(null)}
              className="text-white/60 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Product Catalog & Search Column */}
      <ProductGrid
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPhoneCameraScanner={() => setIsCameraScannerOpen(true)}
      />

      {/* Cart & Billing Column */}
      <CartPanel
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
      />

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Hardware / Simulated Barcode Scanner Tool */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onScan={handleBarcodeScanned}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Live Webcam / Camera Barcode Scanner */}
      <CameraBarcodeScanner
        isOpen={isCameraScannerOpen}
        onScan={(code) => {
          handleBarcodeScanned(code);
          setIsCameraScannerOpen(false);
        }}
        onClose={() => setIsCameraScannerOpen(false)}
      />

      {/* Customer Quick Add Modal */}
      <CustomerAddModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
    </div>
  );
};
