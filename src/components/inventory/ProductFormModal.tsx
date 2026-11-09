import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { X, Check, PackagePlus, Edit, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit: Product | null;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  onClose,
}) => {
  const { addProduct, updateProduct, categories, settings, products } = usePos();
  const isBn = settings.language === 'bn';

  const [name, setName] = useState('');
  const [bnName, setBnName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [skuError, setSkuError] = useState<string | null>(null);
  const [category, setCategory] = useState(categories[1]?.id || 'grocery');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState<string>('pcs');
  const [brand, setBrand] = useState<string>('');

  const generateUniqueSku = (catId?: string, prodName?: string) => {
    const cat = catId || category;
    const catPrefix = cat.length >= 3 ? cat.slice(0, 3).toUpperCase() : 'ITM';
    const namePrefix = prodName ? prodName.trim().slice(0, 3).toUpperCase() : '';
    let candidate = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 50) {
      const rand = Math.floor(100 + Math.random() * 900);
      candidate = namePrefix ? `${catPrefix}-${namePrefix}-${rand}` : `${catPrefix}-${rand}`;
      const exists = products.some(
        (p) => p.sku.toLowerCase() === candidate.toLowerCase() && p.id !== productToEdit?.id
      );
      if (!exists) {
        isUnique = true;
      }
      attempts++;
    }
    return candidate;
  };

  const handleSkuChange = (val: string) => {
    const upper = val.toUpperCase();
    setSku(upper);
    const trimmed = upper.trim();
    if (!trimmed) {
      setSkuError(isBn ? 'এসকেইউ (SKU) আবশ্যক' : 'SKU is required');
      return;
    }
    const duplicate = products.find(
      (p) => p.sku.toLowerCase() === trimmed.toLowerCase() && p.id !== productToEdit?.id
    );
    if (duplicate) {
      setSkuError(
        isBn
          ? `এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে: "${duplicate.bnName || duplicate.name}"`
          : `SKU already used by: "${duplicate.name}"`
      );
    } else {
      setSkuError(null);
    }
  };

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBnName(productToEdit.bnName || '');
      setBarcode(productToEdit.barcode);
      setSku(productToEdit.sku);
      setSkuError(null);
      setCategory(productToEdit.category);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStock(productToEdit.stock);
      setMinStockAlert(productToEdit.minStockAlert);
      setUnit(productToEdit.unit);
      setBrand(productToEdit.brand || '');
    } else {
      // Auto-generate SKU & barcode for new product
      const rand = Math.floor(1000000000 + Math.random() * 9000000000);
      setName('');
      setBnName('');
      setBarcode(`894${rand.toString().slice(0, 8)}`);
      const initialCat = categories[1]?.id || 'grocery';
      setCategory(initialCat);
      setSku(generateUniqueSku(initialCat));
      setSkuError(null);
      setCostPrice(0);
      setSellingPrice(0);
      setStock(10);
      setMinStockAlert(5);
      setUnit('pcs');
      setBrand('');
    }
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) {
      setSkuError(isBn ? 'এসকেইউ (SKU) আবশ্যক' : 'SKU is required');
      return;
    }

    // Verify SKU uniqueness
    const duplicate = products.find(
      (p) => p.sku.toLowerCase() === trimmedSku.toLowerCase() && p.id !== productToEdit?.id
    );
    if (duplicate) {
      setSkuError(
        isBn
          ? `এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে: "${duplicate.bnName || duplicate.name}"`
          : `SKU already used by: "${duplicate.name}"`
      );
      return;
    }

    if (productToEdit) {
      updateProduct({
        ...productToEdit,
        name: name.trim(),
        bnName: bnName.trim(),
        barcode: barcode.trim(),
        sku: trimmedSku,
        category,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit,
        brand: brand.trim() || undefined,
      });
    } else {
      addProduct({
        name: name.trim(),
        bnName: bnName.trim(),
        barcode: barcode.trim(),
        sku: trimmedSku,
        category,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit,
        brand: brand.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {productToEdit ? (
              <Edit className="w-4 h-4 text-emerald-600" />
            ) : (
              <PackagePlus className="w-4 h-4 text-emerald-600" />
            )}
            <h3 className="text-sm font-bold text-slate-900">
              {productToEdit
                ? isBn
                  ? 'পণ্য সম্পাদনা করুন'
                  : 'Edit Product Details'
                : isBn
                ? 'নতুন পণ্য যুক্ত করুন'
                : 'Add New Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'পণ্যের নাম (English) *' : 'Product Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Miniket Rice 25kg"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'পণ্যের বাংলা নাম' : 'Product Name (বাংলা)'}
              </label>
              <input
                type="text"
                value={bnName}
                onChange={(e) => setBnName(e.target.value)}
                placeholder="যেমন: মিনিকেট চাল ২৫ কেজি"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ক্যাটাগরি *' : 'Category *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              >
                {categories
                  .filter((c) => c.id !== 'all')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {isBn ? c.bnName : c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'বারকোড (Barcode) *' : 'Barcode / UPC *'}
              </label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {isBn ? 'এসকেইউ (SKU) *' : 'SKU (Unique) *'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const unique = generateUniqueSku(category, name);
                    setSku(unique);
                    setSkuError(null);
                  }}
                  className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  title="Generate a guaranteed unique SKU"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{isBn ? 'স্বয়ংক্রিয় SKU' : 'Auto Generate'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  placeholder="e.g. BEV-NES-100"
                  className={`w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border rounded-lg focus:outline-none uppercase ${
                    skuError
                      ? 'border-rose-400 focus:border-rose-600 pr-8 bg-rose-50/20'
                      : sku.trim()
                      ? 'border-slate-300 focus:border-emerald-600 pr-8'
                      : 'border-slate-300 focus:border-emerald-600'
                  }`}
                />
                {sku.trim() && !skuError && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
                {skuError && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {skuError ? (
                <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                  <span>{skuError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  {isBn ? 'প্রতিটি পণ্যের জন্য একটি স্বতন্ত্র SKU কোড' : 'Unique identifier for inventory tracking and POS search'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'ব্র্যান্ড / প্রস্তুতকারক' : 'Brand / Manufacturer'}
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Unilever, Square, Teer"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isBn ? 'পরিমাপক একক (Unit)' : 'Unit'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="packet">Packet (pkt)</option>
                <option value="litre">Litre (ltr)</option>
                <option value="bottle">Bottle</option>
                <option value="box">Box</option>
                <option value="bag">Bag / বস্তা</option>
                <option value="tin">Tin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                {isBn ? 'ক্রয়মূল্য (Cost)' : 'Cost Price'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                {isBn ? 'বিক্রয়মূল্য (Price)' : 'Selling Price *'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-emerald-800 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                {isBn ? 'বর্তমান স্টক' : 'Initial Stock'}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                {isBn ? 'লো স্টক এলার্ট' : 'Min Alert Qty'}
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Profit estimation notice */}
          {sellingPrice > 0 && costPrice > 0 && (
            <div className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center justify-between px-1">
              <span>{isBn ? 'আনুমানিক মুনাফা প্রতি একক:' : 'Estimated Margin per unit:'}</span>
              <strong className="text-emerald-700">
                +{settings.currencySymbol}{(sellingPrice - costPrice).toFixed(1)} (
                {(((sellingPrice - costPrice) / costPrice) * 100).toFixed(0)}%)
              </strong>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
