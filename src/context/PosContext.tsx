import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CartItem,
  Category,
  Customer,
  DueTransaction,
  Expense,
  ParkedOrder,
  Product,
  SaleInvoice,
  StoreSettings,
  BulkImportParams,
  BulkImportResult,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_DUE_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from '../data/initialData';

interface PosContextType {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: SaleInvoice[];
  expenses: Expense[];
  dueTransactions: DueTransaction[];
  parkedOrders: ParkedOrder[];
  settings: StoreSettings;
  activeTab: 'pos' | 'inventory' | 'sales' | 'customers' | 'due' | 'expenses' | 'reports' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'sales' | 'customers' | 'due' | 'expenses' | 'reports' | 'settings') => void;

  // Cart actions
  cart: CartItem[];
  selectedCustomer: Customer;
  setSelectedCustomer: (c: Customer) => void;
  cartDiscount: number;
  cartDiscountType: 'percentage' | 'flat';
  setCartDiscount: (val: number) => void;
  setCartDiscountType: (type: 'percentage' | 'flat') => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number, discountType?: 'percentage' | 'flat') => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountAmount: number;
  redeemedPoints: number;
  setRedeemedPoints: (pts: number) => void;
  pointsDiscountAmount: number;
  pointsToEarn: number;
  cartVatAmount: number;
  cartGrandTotal: number;

  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, newStock: number, reason?: string) => void;

  // Category & Bulk actions
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Category;
  bulkImportProducts: (params: BulkImportParams) => BulkImportResult;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'dueAmount'> & { loyaltyPoints?: number }) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => boolean;
  adjustCustomerPoints: (customerId: string, newPoints: number) => void;
  collectDuePayment: (customerId: string, amount: number, method: 'cash' | 'bkash' | 'nagad' | 'bank', note?: string) => void;

  // Invoice & Checkout actions
  completeSale: (saleData: {
    paidAmount: number;
    paymentMethod: SaleInvoice['paymentMethod'];
    splitDetails?: SaleInvoice['splitDetails'];
    trxId?: string;
    note?: string;
  }) => SaleInvoice;
  refundInvoice: (invoiceId: string) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Parked orders
  parkCurrentOrder: (customName?: string) => void;
  restoreParkedOrder: (orderId: string) => void;
  deleteParkedOrder: (orderId: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllData: () => void;

  // Receipt Modal State
  currentInvoiceForReceipt: SaleInvoice | null;
  showReceiptModal: boolean;
  openReceiptModal: (invoice: SaleInvoice) => void;
  closeReceiptModal: () => void;

  // Audio Beep
  playBeep: (type?: 'scan' | 'success' | 'alert') => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'esheba_smartpos_';

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Invoices
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Due Transactions
  const [dueTransactions, setDueTransactions] = useState<DueTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}due_tx`);
    return saved ? JSON.parse(saved) : INITIAL_DUE_TRANSACTIONS;
  });

  // Parked orders
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}parked`);
    return saved ? JSON.parse(saved) : [];
  });

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'sales' | 'customers' | 'due' | 'expenses' | 'reports' | 'settings'>('pos');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);

  // Receipt Modal State
  const [currentInvoiceForReceipt, setCurrentInvoiceForReceipt] = useState<SaleInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Sound State
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}due_tx`, JSON.stringify(dueTransactions));
  }, [dueTransactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}parked`, JSON.stringify(parkedOrders));
  }, [parkedOrders]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  // Audio feedback synthesis
  const playBeep = (type: 'scan' | 'success' | 'alert' = 'scan') => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch {
      // Audio might be blocked before user gesture; gracefully ignore
    }
  };

  const toggleSound = () => setIsSoundEnabled((prev) => !prev);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      playBeep('alert');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, total: calculateItemTotal(item.unitPrice, newQty, item.discount, item.discountType) }
            : item
        );
      } else {
        const newQty = Math.min(quantity, product.stock);
        const newItem: CartItem = {
          product,
          quantity: newQty,
          unitPrice: product.sellingPrice,
          discount: 0,
          discountType: 'percentage',
          total: calculateItemTotal(product.sellingPrice, newQty, 0, 'percentage'),
        };
        return [newItem, ...prev];
      }
    });

    playBeep('scan');
  };

  const calculateItemTotal = (price: number, qty: number, discount: number, discountType: 'percentage' | 'flat') => {
    const raw = price * qty;
    if (discount <= 0) return raw;
    if (discountType === 'percentage') {
      return Math.max(0, raw - (raw * discount) / 100);
    }
    return Math.max(0, raw - discount);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: clampedQty,
            total: calculateItemTotal(item.unitPrice, clampedQty, item.discount, item.discountType),
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discount: number, discountType: 'percentage' | 'flat' = 'percentage') => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            discount,
            discountType,
            total: calculateItemTotal(item.unitPrice, item.quantity, discount, discountType),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setRedeemedPoints(0);
    setSelectedCustomer(customers[0] || INITIAL_CUSTOMERS[0]);
  };

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  const cartDiscountAmount =
    cartDiscountType === 'percentage'
      ? (cartSubtotal * cartDiscount) / 100
      : Math.min(cartDiscount, cartSubtotal);

  const baseDiscountedSubtotal = Math.max(0, cartSubtotal - cartDiscountAmount);

  // Loyalty points discount calculation
  const pointsDiscountAmount =
    settings.loyaltyPointsEnabled && redeemedPoints > 0
      ? Math.min(
          redeemedPoints * (settings.pointValue || 1),
          baseDiscountedSubtotal
        )
      : 0;

  const discountedSubtotal = Math.max(0, baseDiscountedSubtotal - pointsDiscountAmount);
  const cartVatAmount = (discountedSubtotal * (settings.vatPercent || 0)) / 100;
  const cartGrandTotal = Math.round(discountedSubtotal + cartVatAmount);

  const pointsToEarn =
    settings.loyaltyPointsEnabled && selectedCustomer.id !== 'cust-walkin'
      ? Math.floor(cartGrandTotal / (settings.pointsEarnRate || 100))
      : 0;

  // Complete Sale & Checkout
  const completeSale = (saleData: {
    paidAmount: number;
    paymentMethod: SaleInvoice['paymentMethod'];
    splitDetails?: SaleInvoice['splitDetails'];
    trxId?: string;
    note?: string;
  }): SaleInvoice => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `POS-${dateStr}-${invoices.length + 1}-${randomHex}`;

    const paid = Math.min(saleData.paidAmount, cartGrandTotal);
    const due = Math.max(0, cartGrandTotal - saleData.paidAmount);
    const change = Math.max(0, saleData.paidAmount - cartGrandTotal);

    let status: SaleInvoice['status'] = 'paid';
    if (due > 0) {
      status = paid > 0 ? 'partial' : 'due';
    }

    const invoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      date: now.toISOString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount: cartDiscountAmount,
      vatPercent: settings.vatPercent,
      vatAmount: cartVatAmount,
      grandTotal: cartGrandTotal,
      paidAmount: paid,
      dueAmount: due,
      changeAmount: change,
      paymentMethod: saleData.paymentMethod,
      splitDetails: saleData.splitDetails,
      trxId: saleData.trxId,
      status,
      cashier: settings.cashierName,
      note: saleData.note,
      pointsEarned: pointsToEarn,
      pointsRedeemed: redeemedPoints,
      pointsDiscountAmount,
    };

    // 1. Deduct product stocks
    setProducts((prev) =>
      prev.map((prod) => {
        const cartMatch = cart.find((c) => c.product.id === prod.id);
        if (cartMatch) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartMatch.quantity),
          };
        }
        return prod;
      })
    );

    // 2. Update customer statistics, loyalty points & due
    if (selectedCustomer.id !== 'cust-walkin') {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === selectedCustomer.id) {
            const updatedPts = Math.max(
              0,
              (cust.loyaltyPoints || 0) - redeemedPoints + pointsToEarn
            );
            return {
              ...cust,
              totalSpent: cust.totalSpent + cartGrandTotal,
              dueAmount: cust.dueAmount + due,
              loyaltyPoints: updatedPts,
            };
          }
          return cust;
        })
      );

      // Record due transaction if any due remains
      if (due > 0) {
        const newDueTx: DueTransaction = {
          id: `due-${Date.now()}`,
          date: now.toISOString(),
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          amount: due,
          type: 'sale_due',
          invoiceNo,
          note: saleData.note || 'POS invoice balance added to due khata',
        };
        setDueTransactions((prev) => [newDueTx, ...prev]);
      }
    }

    // 3. Save invoice
    setInvoices((prev) => [invoice, ...prev]);

    // 4. Play audio beep and reset cart
    playBeep('success');
    clearCart();

    // 5. Open receipt modal
    setCurrentInvoiceForReceipt(invoice);
    setShowReceiptModal(true);

    return invoice;
  };

  // Refund / Cancel invoice
  const refundInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.status === 'returned') return;

    // Restore stock
    setProducts((prev) =>
      prev.map((prod) => {
        const item = inv.items.find((i) => i.product.id === prod.id);
        if (item) {
          return { ...prod, stock: prod.stock + item.quantity };
        }
        return prod;
      })
    );

    // Revert customer due and loyalty points if applicable
    if (inv.customerId !== 'cust-walkin') {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === inv.customerId) {
            const revertedPts = Math.max(
              0,
              (cust.loyaltyPoints || 0) - (inv.pointsEarned || 0) + (inv.pointsRedeemed || 0)
            );
            return {
              ...cust,
              dueAmount: Math.max(0, cust.dueAmount - inv.dueAmount),
              totalSpent: Math.max(0, cust.totalSpent - inv.grandTotal),
              loyaltyPoints: revertedPts,
            };
          }
          return cust;
        })
      );
    }

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'returned', note: (i.note ? `${i.note} - ` : '') + 'Returned / Refunded' } : i))
    );

    playBeep('alert');
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    let cleanSku = (productData.sku || '').trim().toUpperCase();
    if (!cleanSku) {
      cleanSku = `SKU-${Date.now().toString().slice(-6)}`;
    }
    // Ensure uniqueness
    if (products.some((p) => p.sku.toLowerCase() === cleanSku.toLowerCase())) {
      cleanSku = `${cleanSku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newProduct: Product = {
      ...productData,
      sku: cleanSku,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    playBeep('success');
  };

  const updateProduct = (updated: Product) => {
    let cleanSku = (updated.sku || '').trim().toUpperCase();
    if (!cleanSku) {
      cleanSku = `SKU-${Date.now().toString().slice(-6)}`;
    }
    if (products.some((p) => p.id !== updated.id && p.sku.toLowerCase() === cleanSku.toLowerCase())) {
      cleanSku = `${cleanSku}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const sanitized = {
      ...updated,
      sku: cleanSku,
    };
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? sanitized : p)));
    playBeep('success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  // Dynamic Category addition
  const addCategory = (categoryData: Omit<Category, 'id'> & { id?: string }): Category => {
    const cleanName = categoryData.name.trim();
    const existing = categories.find(
      (c) =>
        (categoryData.id && c.id === categoryData.id.trim()) ||
        c.name.toLowerCase() === cleanName.toLowerCase() ||
        (categoryData.bnName && c.bnName.toLowerCase() === categoryData.bnName.trim().toLowerCase())
    );
    if (existing) return existing;

    const catId =
      categoryData.id?.trim() ||
      `cat_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 16)}_${Date.now().toString().slice(-4)}`;

    const newCat: Category = {
      id: catId,
      name: cleanName,
      bnName: categoryData.bnName?.trim() || cleanName,
      icon: categoryData.icon || 'Package',
    };

    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  // Bulk Product & Category Importer
  const bulkImportProducts = (params: BulkImportParams): BulkImportResult => {
    const { products: itemsToImport, newCategories = [], duplicateStrategy } = params;

    let addedCatsCount = 0;
    // 1. Process new categories if any
    if (newCategories.length > 0) {
      setCategories((prevCats) => {
        const updated = [...prevCats];
        newCategories.forEach((nc) => {
          const name = nc.name.trim();
          if (!name) return;
          const exists = updated.some(
            (c) =>
              c.name.toLowerCase() === name.toLowerCase() ||
              (nc.id && c.id === nc.id.trim()) ||
              (nc.bnName && c.bnName.toLowerCase() === nc.bnName.trim().toLowerCase())
          );
          if (!exists) {
            const catId =
              nc.id?.trim() ||
              `cat_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 16)}_${Date.now().toString().slice(-4)}`;
            updated.push({
              id: catId,
              name,
              bnName: nc.bnName?.trim() || name,
              icon: nc.icon || 'Package',
            });
            addedCatsCount++;
          }
        });
        return updated;
      });
    }

    // 2. Process products and stocks
    let addedCount = 0;
    let updatedCount = 0;
    let totalStockAdded = 0;

    setProducts((prev) => {
      const productList = [...prev];

      itemsToImport.forEach((imported, idx) => {
        const rawSku = (imported.sku || '').trim().toUpperCase();
        const rawBarcode = (imported.barcode || '').trim();

        const matchIndex = productList.findIndex(
          (p) =>
            (rawSku && p.sku.toUpperCase() === rawSku) ||
            (rawBarcode && p.barcode === rawBarcode)
        );

        const importedStock = Math.max(0, Number(imported.stock) || 0);

        if (matchIndex >= 0) {
          const existing = productList[matchIndex];
          if (duplicateStrategy === 'skip') {
            return;
          } else if (duplicateStrategy === 'update_stock') {
            productList[matchIndex] = {
              ...existing,
              stock: existing.stock + importedStock,
              costPrice: imported.costPrice > 0 ? imported.costPrice : existing.costPrice,
              sellingPrice: imported.sellingPrice > 0 ? imported.sellingPrice : existing.sellingPrice,
              category: imported.category || existing.category,
              unit: imported.unit || existing.unit,
              brand: imported.brand || existing.brand,
            };
            totalStockAdded += importedStock;
            updatedCount++;
          } else if (duplicateStrategy === 'replace_stock') {
            productList[matchIndex] = {
              ...existing,
              stock: importedStock,
              costPrice: imported.costPrice > 0 ? imported.costPrice : existing.costPrice,
              sellingPrice: imported.sellingPrice > 0 ? imported.sellingPrice : existing.sellingPrice,
              category: imported.category || existing.category,
              unit: imported.unit || existing.unit,
              brand: imported.brand || existing.brand,
            };
            totalStockAdded += importedStock;
            updatedCount++;
          } else if (duplicateStrategy === 'create_new') {
            const uniqueSku = `${rawSku || 'SKU'}-${Date.now().toString().slice(-4)}-${idx + 1}`;
            const uniqueBarcode = rawBarcode ? `${rawBarcode}-${idx + 1}` : `894${Date.now().toString().slice(-6)}${idx}`;
            const newProd: Product = {
              ...imported,
              id: `prod-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
              sku: uniqueSku,
              barcode: uniqueBarcode,
              stock: importedStock,
            };
            productList.unshift(newProd);
            totalStockAdded += importedStock;
            addedCount++;
          }
        } else {
          let cleanSku = rawSku;
          if (!cleanSku) {
            cleanSku = `SKU-${Date.now().toString().slice(-5)}${idx}`;
          }
          if (productList.some((p) => p.sku.toUpperCase() === cleanSku)) {
            cleanSku = `${cleanSku}-${idx + 1}`;
          }

          let cleanBarcode = rawBarcode;
          if (!cleanBarcode) {
            cleanBarcode = `894${Date.now().toString().slice(-6)}${idx % 10}`;
          }

          const newProd: Product = {
            ...imported,
            id: `prod-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
            sku: cleanSku,
            barcode: cleanBarcode,
            stock: importedStock,
          };
          productList.unshift(newProd);
          totalStockAdded += importedStock;
          addedCount++;
        }
      });

      return productList;
    });

    playBeep('success');

    return {
      addedCount,
      updatedCount,
      newCategoriesCount: addedCatsCount,
      totalStockAdded,
    };
  };

  // Customer CRUD & Due Collection
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalSpent' | 'dueAmount'> & { loyaltyPoints?: number }) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
      dueAmount: 0,
      loyaltyPoints: customerData.loyaltyPoints || 0,
    };
    setCustomers((prev) => [...prev, newCustomer]);
    playBeep('success');
    return newCustomer;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedCustomer.id === updated.id) {
      setSelectedCustomer(updated);
    }
    playBeep('success');
  };

  const deleteCustomer = (id: string): boolean => {
    if (id === 'cust-walkin') return false;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomer.id === id) {
      setSelectedCustomer(customers[0] || INITIAL_CUSTOMERS[0]);
    }
    playBeep('alert');
    return true;
  };

  const adjustCustomerPoints = (customerId: string, newPoints: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, loyaltyPoints: Math.max(0, newPoints) } : c))
    );
    playBeep('success');
  };

  const collectDuePayment = (
    customerId: string,
    amount: number,
    method: 'cash' | 'bkash' | 'nagad' | 'bank',
    note?: string
  ) => {
    const target = customers.find((c) => c.id === customerId);
    if (!target || amount <= 0) return;

    const actualAmount = Math.min(amount, target.dueAmount);
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            dueAmount: Math.max(0, c.dueAmount - actualAmount),
          };
        }
        return c;
      })
    );

    const tx: DueTransaction = {
      id: `due-tx-${Date.now()}`,
      date: new Date().toISOString(),
      customerId,
      customerName: target.name,
      customerPhone: target.phone,
      amount: actualAmount,
      type: 'payment_collected',
      paymentMethod: method,
      note: note || `Due received via ${method.toUpperCase()}`,
    };

    setDueTransactions((prev) => [tx, ...prev]);
    playBeep('success');
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    playBeep('success');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Parked orders
  const parkCurrentOrder = (customName?: string) => {
    if (cart.length === 0) return;
    const newPark: ParkedOrder = {
      id: `park-${Date.now()}`,
      name: customName || `Parked #${parkedOrders.length + 1} (${selectedCustomer.name})`,
      customerId: selectedCustomer.id,
      items: [...cart],
      createdAt: new Date().toISOString(),
    };
    setParkedOrders((prev) => [newPark, ...prev]);
    clearCart();
    playBeep('success');
  };

  const restoreParkedOrder = (orderId: string) => {
    const order = parkedOrders.find((o) => o.id === orderId);
    if (!order) return;
    setCart(order.items);
    const cust = customers.find((c) => c.id === order.customerId);
    if (cust) setSelectedCustomer(cust);
    setParkedOrders((prev) => prev.filter((o) => o.id !== orderId));
    playBeep('scan');
  };

  const deleteParkedOrder = (orderId: string) => {
    setParkedOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setDueTransactions(INITIAL_DUE_TRANSACTIONS);
    setParkedOrders([]);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    setSelectedCustomer(INITIAL_CUSTOMERS[0]);
    playBeep('success');
  };

  const openReceiptModal = (invoice: SaleInvoice) => {
    setCurrentInvoiceForReceipt(invoice);
    setShowReceiptModal(true);
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
  };

  return (
    <PosContext.Provider
      value={{
        products,
        categories,
        customers,
        invoices,
        expenses,
        dueTransactions,
        parkedOrders,
        settings,
        activeTab,
        setActiveTab,
        cart,
        selectedCustomer,
        setSelectedCustomer,
        cartDiscount,
        cartDiscountType,
        setCartDiscount,
        setCartDiscountType,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemDiscount,
        clearCart,
        cartSubtotal,
        cartDiscountAmount,
        redeemedPoints,
        setRedeemedPoints,
        pointsDiscountAmount,
        pointsToEarn,
        cartVatAmount,
        cartGrandTotal,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCategory,
        bulkImportProducts,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        adjustCustomerPoints,
        collectDuePayment,
        completeSale,
        refundInvoice,
        addExpense,
        deleteExpense,
        parkCurrentOrder,
        restoreParkedOrder,
        deleteParkedOrder,
        updateSettings,
        resetAllData,
        currentInvoiceForReceipt,
        showReceiptModal,
        openReceiptModal,
        closeReceiptModal,
        playBeep,
        isSoundEnabled,
        toggleSound,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
