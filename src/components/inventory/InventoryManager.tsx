import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  PackageX,
  Edit,
  Trash2,
  Barcode,
  ArrowUpDown,
  Download,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { BarcodePrintModal } from './BarcodePrintModal';
import { CsvBulkImportModal } from './CsvBulkImportModal';

export const InventoryManager: React.FC = () => {
  const { products, categories, deleteProduct, adjustStock, settings } = usePos();
  const isBn = settings.language === 'bn';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [bulkBarcodeProducts, setBulkBarcodeProducts] = useState<Product[] | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Quick stock adjustment modal / popover
  const [stockAdjustItem, setStockAdjustItem] = useState<{ product: Product; addedQty: number } | null>(null);

  // Financial statistics
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.bnName && product.bnName.toLowerCase().includes(q)) ||
        product.barcode.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q));

      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = product.stock > 0 && product.stock <= product.minStockAlert;
      } else if (stockFilter === 'out') {
        matchStock = product.stock <= 0;
      }

      return matchCategory && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustItem || stockAdjustItem.addedQty <= 0) return;
    adjustStock(
      stockAdjustItem.product.id,
      stockAdjustItem.product.stock + stockAdjustItem.addedQty
    );
    setStockAdjustItem(null);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Barcode', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Unit'];
    const rows = products.map((p) => [
      p.sku,
      p.barcode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.unit,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esheba_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'ইনভেন্টরি ও পণ্য ব্যবস্থাপনা' : 'Inventory & Products'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'দোকানের সকল পণ্যের তালিকা, স্টক কাউন্ট ও মূল্য নির্ধারণ'
              : 'Manage store catalog, stock counts, cost margins and barcodes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setBulkBarcodeProducts(filteredProducts.slice(0, 12));
              setBarcodeProduct(filteredProducts[0] || null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
            title="Generate and print barcode shelf labels"
          >
            <Barcode className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'শেল্ফ লেবেল' : 'Print Labels'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-xs"
            title="Upload CSV to bulk import products, categories, and stock quantities"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'বাল্ক CSV ইম্পোর্ট' : 'Bulk Import CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isBn ? 'এক্সপোর্ট CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন পণ্য' : '+ Add Product'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip (Single Elevation) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট পণ্য' : 'Total Items'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {products.length}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'মোট মজুদ সংখ্যা' : 'Stock Units'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalStockUnits.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'স্টক বিক্রয় মূল্য' : 'Stock Value (Retail)'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {settings.currencySymbol}{totalRetailValue.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'স্টক ক্রয় মূল্য' : 'Stock Value (Cost)'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-700 mt-1">
            {settings.currencySymbol}{totalCostValue.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {isBn ? 'স্টক সতর্কবার্তা' : 'Stock Alerts'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1 flex items-center gap-2">
            <span>{lowStockCount} low</span>
            <span className="text-slate-300">/</span>
            <span className="text-rose-600">{outOfStockCount} out</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'পণ্য SKU (যেমন RIC-NAZ-5K), নাম বা বারকোড দিয়ে খুঁজুন...' : 'Search by SKU (e.g. RIC-NAZ-5K), product name, or barcode...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Stock state filter segmented buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                stockFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'সব' : 'All'} ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                stockFilter === 'low'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'কম স্টক' : 'Low Stock'} ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                stockFilter === 'out'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBn ? 'স্টক শূন্য' : 'Out of Stock'} ({outOfStockCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.bnName : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* High Density Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isBn ? 'পণ্য ও বিবরণ' : 'Product Details'}</th>
                <th className="py-3 px-3">{isBn ? 'এসকেইউ (SKU)' : 'SKU'}</th>
                <th className="py-3 px-3">{isBn ? 'বারকোড' : 'Barcode'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ক্রয়মূল্য' : 'Cost'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'বিক্রয়মূল্য' : 'Price'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'মুনাফা' : 'Margin'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'স্টক অবস্থা' : 'Stock Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <PackageX className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="font-semibold text-slate-700">
                      {isBn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isBn ? 'বাল্ক CSV ইম্পোর্ট করুন' : 'Bulk Import via CSV'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = !isOutOfStock && p.stock <= p.minStockAlert;
                  const marginPct =
                    p.costPrice > 0
                      ? Math.round(((p.sellingPrice - p.costPrice) / p.costPrice) * 100)
                      : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {isBn && p.bnName ? p.bnName : p.name}
                        </div>
                        {isBn && p.bnName && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{p.name}</div>
                        )}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.brand ? `${p.brand} · ` : ''}{p.unit}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border tracking-wide select-all ${
                            searchQuery && p.sku.toLowerCase().includes(searchQuery.toLowerCase().trim())
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold ring-1 ring-emerald-400'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                          title={`SKU: ${p.sku}`}
                        >
                          {p.sku}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600 text-xs select-all">
                        {p.barcode}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {settings.currencySymbol}{p.costPrice.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-800">
                        {settings.currencySymbol}{p.sellingPrice.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700">
                        {marginPct > 0 ? `+${marginPct}%` : `${marginPct}%`}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold text-xs">
                          {isOutOfStock ? (
                            <span className="text-rose-600 flex items-center gap-1">
                              <PackageX className="w-3.5 h-3.5" />
                              0 {p.unit}
                            </span>
                          ) : isLowStock ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {p.stock} {p.unit}
                            </span>
                          ) : (
                            <span className="text-slate-800">
                              {p.stock} {p.unit}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Add Stock button */}
                          <button
                            type="button"
                            onClick={() =>
                              setStockAdjustItem({ product: p, addedQty: 10 })
                            }
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-md transition-colors"
                            title="Add Stock replenishment"
                          >
                            + Stock
                          </button>

                          {/* Print Barcode Label */}
                          <button
                            type="button"
                            onClick={() => {
                              setBulkBarcodeProducts(undefined);
                              setBarcodeProduct(p);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Print Barcode Labels"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(isBn ? 'আপনি কি নিশ্চিত এই পণ্যটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this product?')) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Quick Stock Replenish Modal */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'স্টক বৃদ্ধি / রিস্টক' : 'Restock Product'}
            </h3>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {isBn && stockAdjustItem.product.bnName
                  ? stockAdjustItem.product.bnName
                  : stockAdjustItem.product.name}
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                SKU: <span className="font-semibold text-slate-700">{stockAdjustItem.product.sku}</span> · Barcode: {stockAdjustItem.product.barcode}
              </p>
            </div>

            <form onSubmit={handleQuickAddStock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'যুক্ত করার পরিমাণ (Quantity to Add)' : 'Units to Add'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockAdjustItem.addedQty}
                  onChange={(e) =>
                    setStockAdjustItem({
                      ...stockAdjustItem,
                      addedQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-base font-bold font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                {[5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() =>
                      setStockAdjustItem({ ...stockAdjustItem, addedQty: qty })
                    }
                    className="flex-1 py-1 text-xs font-mono tabular-nums font-semibold bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustItem(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {isBn ? 'যুক্ত করুন' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        productToEdit={editingProduct}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
      />

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={!!barcodeProduct}
        product={barcodeProduct}
        bulkProducts={bulkBarcodeProducts}
        onClose={() => {
          setBarcodeProduct(null);
          setBulkBarcodeProducts(undefined);
        }}
      />

      {/* CSV Bulk Importer Modal */}
      <CsvBulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(stats) => {
          const msg = isBn
            ? `সফলভাবে ${stats.added} টি নতুন পণ্য, ${stats.updated} টি আপডেট এবং ${stats.newCats} টি নতুন ক্যাটাগরি যুক্ত হয়েছে (মোট +${stats.totalStock} স্টক)।`
            : `Bulk import successful: +${stats.added} new products, ${stats.updated} updated, and +${stats.newCats} new categories (+${stats.totalStock} units added).`;
          setImportNotification(msg);
          setTimeout(() => setImportNotification(null), 6000);
        }}
      />

      {/* Import Notification Toast */}
      {importNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <p className="font-medium">{importNotification}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportNotification(null)}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
