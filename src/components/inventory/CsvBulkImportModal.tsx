import React, { useState, useRef, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  Package,
  Boxes,
  DollarSign,
  Search,
  Check,
} from 'lucide-react';
import { DuplicateStrategy, Product } from '../../types';

interface ParsedRow {
  index: number;
  selected: boolean;
  name: string;
  bnName: string;
  sku: string;
  barcode: string;
  categoryInput: string;
  matchedCategoryId: string;
  isNewCategory: boolean;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  brand: string;
  status: 'new' | 'existing_match' | 'invalid';
  existingProduct?: Product;
  errors: string[];
}

interface CsvBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (stats: { added: number; updated: number; newCats: number; totalStock: number }) => void;
}

export const CsvBulkImportModal: React.FC<CsvBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { products, categories, bulkImportProducts, settings, playBeep } = usePos();
  const isBn = settings.language === 'bn';

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('update_stock');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'new' | 'existing' | 'new_cat' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
    newCats: number;
    totalStock: number;
  } | null>(null);

  if (!isOpen) return null;

  // Helper to parse CSV text into matrix handling quotes and commas
  const parseCsvText = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    // Clean BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip CRLF
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        lines.push(currentRow);
      }
    }

    return lines;
  };

  // Process the uploaded file
  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const matrix = parseCsvText(content);
      if (matrix.length < 2) {
        alert(isBn ? 'সিএসভি ফাইলে কোনো ডেটা পাওয়া যায়নি।' : 'No data rows found in the CSV file.');
        return;
      }

      // 1. Identify header indices
      const headers = matrix[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));

      const findHeaderIndex = (aliases: string[]) => {
        return headers.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
      };

      const nameIdx = findHeaderIndex(['name', 'productname', 'itemname', 'product', 'item', 'নাম', 'পণ্য']);
      const bnNameIdx = findHeaderIndex(['bnname', 'banglaname', 'bengaliname', 'bangla', 'বাংলা']);
      const skuIdx = findHeaderIndex(['sku', 'itemcode', 'code', 'skucode', 'এসকেইউ']);
      const barcodeIdx = findHeaderIndex(['barcode', 'upc', 'ean', 'code128', 'বারকোড']);
      const catIdx = findHeaderIndex(['category', 'cat', 'categoryname', 'ক্যাটাগরি']);
      const costIdx = findHeaderIndex(['costprice', 'cost', 'buyprice', 'purchaseprice', 'ক্রয়মূল্য', 'কেনাদাম']);
      const priceIdx = findHeaderIndex(['sellingprice', 'price', 'saleprice', 'mrp', 'বিক্রয়মূল্য', 'বিক্রিদাম']);
      const stockIdx = findHeaderIndex(['stock', 'qty', 'quantity', 'currentstock', 'স্টক', 'পরিমাণ']);
      const minAlertIdx = findHeaderIndex(['minstockalert', 'minstock', 'minalert', 'alertqty', 'সতর্কীকরণ']);
      const unitIdx = findHeaderIndex(['unit', 'uom', 'একক']);
      const brandIdx = findHeaderIndex(['brand', 'company', 'manufacturer', 'ব্র্যান্ড']);

      // 2. Parse data rows
      const parsed: ParsedRow[] = [];
      const dataRows = matrix.slice(1);

      dataRows.forEach((row, idx) => {
        // Skip empty row
        if (row.every((cell) => !cell || cell.trim() === '')) return;

        const name = (nameIdx >= 0 ? row[nameIdx] : row[0]) || '';
        const bnName = bnNameIdx >= 0 ? row[bnNameIdx] || '' : '';
        let sku = (skuIdx >= 0 ? row[skuIdx] : '') || '';
        let barcode = (barcodeIdx >= 0 ? row[barcodeIdx] : '') || '';
        const catInput = (catIdx >= 0 ? row[catIdx] : '') || 'Grocery';
        const costPrice = Math.max(0, parseFloat((costIdx >= 0 ? row[costIdx] : '0') || '0') || 0);
        const sellingPrice = Math.max(0, parseFloat((priceIdx >= 0 ? row[priceIdx] : '0') || '0') || 0);
        const stock = Math.max(0, parseFloat((stockIdx >= 0 ? row[stockIdx] : '0') || '0') || 0);
        const minStockAlert = Math.max(0, parseFloat((minAlertIdx >= 0 ? row[minAlertIdx] : '5') || '5') || 5);
        const unit = (unitIdx >= 0 ? row[unitIdx] : 'pcs') || 'pcs';
        const brand = (brandIdx >= 0 ? row[brandIdx] : '') || '';

        const errors: string[] = [];
        if (!name.trim()) {
          errors.push(isBn ? 'পণ্যের নাম অনুপস্থিত' : 'Product name missing');
        }

        // Auto-generate SKU if blank
        if (!sku.trim()) {
          const prefix = name
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 3)
            .toUpperCase() || 'ITM';
          sku = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        } else {
          sku = sku.trim().toUpperCase();
        }

        // Auto-generate barcode if blank
        if (!barcode.trim()) {
          barcode = `894${Date.now().toString().slice(-7)}${idx % 10}`;
        } else {
          barcode = barcode.trim();
        }

        // Resolve Category
        const cleanCat = catInput.trim();
        const matchedCat = categories.find(
          (c) =>
            c.id.toLowerCase() === cleanCat.toLowerCase() ||
            c.name.toLowerCase() === cleanCat.toLowerCase() ||
            c.bnName.toLowerCase() === cleanCat.toLowerCase()
        );

        const isNewCategory = !matchedCat && cleanCat.length > 0;
        const matchedCategoryId = matchedCat
          ? matchedCat.id
          : `cat_${cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 16)}`;

        // Check duplicate with existing store products
        const existingProduct = products.find(
          (p) =>
            (sku && p.sku.toUpperCase() === sku) ||
            (barcode && p.barcode === barcode)
        );

        let status: ParsedRow['status'] = 'new';
        if (errors.length > 0) {
          status = 'invalid';
        } else if (existingProduct) {
          status = 'existing_match';
        }

        parsed.push({
          index: idx + 1,
          selected: errors.length === 0,
          name: name.trim(),
          bnName: bnName.trim(),
          sku,
          barcode,
          categoryInput: cleanCat || 'General',
          matchedCategoryId,
          isNewCategory,
          costPrice,
          sellingPrice,
          stock,
          minStockAlert,
          unit,
          brand: brand.trim(),
          status,
          existingProduct,
          errors,
        });
      });

      setRawRows(parsed);
      playBeep('scan');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Bengali Name',
      'SKU',
      'Barcode',
      'Category',
      'Cost Price',
      'Selling Price',
      'Stock',
      'Min Stock Alert',
      'Unit',
      'Brand',
    ];

    const sampleRows = [
      [
        'Miniket Premium Rice 5kg',
        'মিনিকেট চাল ৫ কেজি',
        'RIC-MIN-5K',
        '89411009001',
        'Grocery & Rice',
        '360',
        '410',
        '30',
        '5',
        'bag',
        'Rashid',
      ],
      [
        'Radhuni Pure Mustard Oil 500ml',
        'রাঁধুনী খাঁটি সরিষার তেল ৫০০ মি.লি.',
        'OIL-RAD-500',
        '89411009002',
        'Oil & Spices',
        '145',
        '165',
        '45',
        '10',
        'bottle',
        'Square',
      ],
      [
        'Pran Frooto Mango Juice 250ml',
        'প্রাণ ফ্রুটো ম্যাঙ্গো জুস ২৫০ মি.লি.',
        'BEV-FRO-250',
        '89411009003',
        'Beverages & Drinks',
        '28',
        '35',
        '60',
        '12',
        'bottle',
        'Pran',
      ],
      [
        'Nescafe Classic Instant Coffee 50g',
        'নেসক্যাফে ক্লাসিক কফি ৫০ গ্রাম',
        'COF-NES-50G',
        '89411009004',
        'Beverages & Drinks',
        '280',
        '320',
        '25',
        '6',
        'jar',
        'Nestle',
      ],
      [
        'Savlon Antiseptic Liquid 112ml',
        'স্যাভলন অ্যান্টিসেপটিক ১১২ মি.লি.',
        'PHA-SAV-112',
        '89411009005',
        'Pharmacy & Health',
        '72',
        '85',
        '40',
        '8',
        'bottle',
        'ACI',
      ],
      [
        'Kazi Farms Frozen Plain Paratha 10pcs',
        'কাজী ফার্মস ফ্রোজেন পরোটা ১০টি',
        'FRZ-PAR-10P',
        '89411009006',
        'Frozen Foods',
        '130',
        '160',
        '20',
        '5',
        'packet',
        'Kazi Farms',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'esheba_inventory_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle selection for all or individual
  const handleToggleSelectAll = (select: boolean) => {
    setRawRows((prev) =>
      prev.map((r) => (r.status !== 'invalid' ? { ...r, selected: select } : r))
    );
  };

  const handleToggleRow = (index: number) => {
    setRawRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, selected: !r.selected } : r))
    );
  };

  // Compute distinct new categories to create
  const distinctNewCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; bnName: string }>();
    rawRows.forEach((r) => {
      if (r.selected && r.isNewCategory && r.categoryInput) {
        const key = r.categoryInput.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            id: r.matchedCategoryId,
            name: r.categoryInput,
            bnName: r.categoryInput,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [rawRows]);

  // Filtered rows for the preview table
  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      // Filter tab
      if (previewFilter === 'new' && r.status !== 'new') return false;
      if (previewFilter === 'existing' && r.status !== 'existing_match') return false;
      if (previewFilter === 'new_cat' && !r.isNewCategory) return false;
      if (previewFilter === 'invalid' && r.status !== 'invalid') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.name.toLowerCase().includes(q) ||
          r.bnName.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.barcode.toLowerCase().includes(q) ||
          r.categoryInput.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rawRows, previewFilter, searchQuery]);

  // Statistics
  const selectedRows = rawRows.filter((r) => r.selected && r.status !== 'invalid');
  const validNewCount = rawRows.filter((r) => r.selected && r.status === 'new').length;
  const existingCount = rawRows.filter((r) => r.selected && r.status === 'existing_match').length;
  const invalidCount = rawRows.filter((r) => r.status === 'invalid').length;
  const totalStockToAdd = selectedRows.reduce((sum, r) => sum + r.stock, 0);
  const totalCostValue = selectedRows.reduce((sum, r) => sum + r.stock * r.costPrice, 0);
  const totalRetailValue = selectedRows.reduce((sum, r) => sum + r.stock * r.sellingPrice, 0);

  // Execute the import
  const handleCommitImport = () => {
    if (selectedRows.length === 0) return;

    setIsImporting(true);

    try {
      const itemsToImport = selectedRows.map((r) => ({
        name: r.name,
        bnName: r.bnName || r.name,
        sku: r.sku,
        barcode: r.barcode,
        category: r.matchedCategoryId,
        costPrice: r.costPrice,
        sellingPrice: r.sellingPrice,
        stock: r.stock,
        minStockAlert: r.minStockAlert,
        unit: r.unit,
        brand: r.brand,
      }));

      const res = bulkImportProducts({
        products: itemsToImport,
        newCategories: distinctNewCategories.map((c) => ({
          id: c.id,
          name: c.name,
          bnName: c.bnName,
          icon: 'Package',
        })),
        duplicateStrategy,
      });

      const stats = {
        added: res.addedCount,
        updated: res.updatedCount,
        newCats: res.newCategoriesCount,
        totalStock: res.totalStockAdded,
      };

      setImportResult(stats);
      if (onSuccess) {
        onSuccess(stats);
      }
    } catch (err) {
      console.error('Failed to commit bulk import:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'বাল্ক সিএসভি ইম্পোর্ট (CSV Bulk Importer)' : 'CSV Bulk Product & Category Importer'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'একসাথে একাধিক পণ্য, নতুন ক্যাটাগরি এবং স্টক সংখ্যা আপলোড বা আপডেট করুন'
                  : 'Batch upload multiple products, auto-create categories, and update inventory stocks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
              title="Download Sample CSV Template"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {isBn ? 'নমুনা টেমপ্লেট' : 'Download Sample CSV'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Upload Dropzone if no rows yet or file re-upload */}
          {rawRows.length === 0 ? (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-800">
                  {isBn
                    ? 'আপনার সিএসভি ফাইলটি এখানে ড্র্যাগ করুন অথবা ব্রাউজ করুন'
                    : 'Drag & drop your inventory CSV file here, or click to browse'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
                  {isBn
                    ? 'ফাইলের কলামগুলো স্বয়ংক্রিয়ভাবে শনাক্ত হবে (Name, SKU, Barcode, Category, Cost, Price, Stock ইত্যাদি)'
                    : 'Supports UTF-8 CSVs. Columns like Name, SKU, Barcode, Category, Cost, Price, and Stock are auto-mapped.'}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    {isBn ? 'ফাইল সিলেক্ট করুন (.csv)' : 'Select CSV File'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadTemplate();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isBn ? 'নমুনা টেমপ্লেট ডাউনলোড' : 'Download Sample Template'}</span>
                  </button>
                </div>
              </div>

              {/* Format Guide Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'সিএসভি ফাইল স্ট্রাকচার নির্দেশিকা' : 'CSV Structure & Auto-Mapping Guide'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-900 block">Name *</span>
                    <span className="text-slate-500">Product Title (EN / BN)</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-900 block">Category</span>
                    <span className="text-slate-500">Auto-creates if new</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-900 block">SKU / Barcode</span>
                    <span className="text-slate-500">Auto-generated if empty</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-900 block">Cost / Price / Stock</span>
                    <span className="text-slate-500">Numbers & Quantities</span>
                  </div>
                </div>
              </div>
            </div>
          ) : importResult ? (
            /* Success State */
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">
                  {isBn ? 'ইম্পোর্ট সফলভাবে সম্পন্ন হয়েছে!' : 'Bulk Import Completed Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isBn
                    ? 'আপনার নির্বাচিত পণ্য, ক্যাটাগরি ও স্টক ইনভেন্টরিতে আপডেট করা হয়েছে।'
                    : 'All selected products, categories, and inventory stock quantities have been committed to the store.'}
                </p>
              </div>

              {/* Result KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'নতুন পণ্য যুক্ত' : 'New Products Added'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                    +{importResult.added}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'পণ্য আপডেট / রিস্টক' : 'Existing Updated'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
                    {importResult.updated}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'নতুন ক্যাটাগরি' : 'New Categories'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                    +{importResult.newCats}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'মোট স্টক যুক্ত' : 'Total Units Added'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    +{importResult.totalStock.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRawRows([]);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  {isBn ? 'আরেকটি ফাইল আপলোড করুন' : 'Import Another File'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  {isBn ? 'ইনভেন্টরিতে ফিরে যান' : 'Done & Return to Inventory'}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Interactive Pre-Commit Table & Controls */
            <div className="space-y-4">
              {/* File Info & Strategy Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>{fileName}</span>
                      <span className="text-[10px] font-normal text-slate-400">({fileSize})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rawRows.length} {isBn ? 'টি সারি শনাক্ত করা হয়েছে' : 'rows parsed from CSV'}
                    </div>
                  </div>
                </div>

                {/* Duplicate Strategy Selector */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">
                    {isBn ? 'পূর্ববর্তী পণ্যের ক্ষেত্রে:' : 'If duplicate SKU/Barcode:'}
                  </span>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                    className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  >
                    <option value="update_stock">
                      {isBn ? 'মজুদ সংখ্যা যোগ করুন (Add to Current Stock)' : 'Add Quantity to Current Stock'}
                    </option>
                    <option value="replace_stock">
                      {isBn ? 'মজুদ প্রতিস্থাপন করুন (Replace Stock Count)' : 'Replace Stock Count with CSV Qty'}
                    </option>
                    <option value="skip">
                      {isBn ? 'পূর্ববর্তী পণ্য এড়িয়ে যান (Skip Existing)' : 'Skip Existing (Only Add New)'}
                    </option>
                    <option value="create_new">
                      {isBn ? 'নতুন পণ্য হিসেবে যুক্ত করুন (Create Distinct Items)' : 'Create Distinct Duplicate Items'}
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setRawRows([]);
                      setFileName('');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
                  >
                    {isBn ? 'ফাইল পরিবর্তন' : 'Change File'}
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'নির্বাচিত পণ্য' : 'Selected Products'}
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {selectedRows.length} <span className="text-xs font-normal text-slate-400">/ {rawRows.length}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'নতুন ক্যাটাগরি' : 'New Categories'}
                  </div>
                  <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5 flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4" />
                    <span>+{distinctNewCategories.length}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'স্টক পরিমাণ' : 'Total Stock Units'}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                    +{totalStockToAdd.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'ক্রয় মূল্য (ইনভেস্ট)' : 'Cost Value'}
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                    {settings.currencySymbol}{totalCostValue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {isBn ? 'বিক্রয় মূল্য (রিটেল)' : 'Retail Value'}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                    {settings.currencySymbol}{totalRetailValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* New Categories Detected Banner */}
              {distinctNewCategories.length > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {distinctNewCategories.length} {isBn ? 'টি নতুন ক্যাটাগরি স্বয়ংক্রিয়ভাবে তৈরি হবে:' : 'new categories will be auto-created:'}
                    </span>{' '}
                    <span className="font-medium text-indigo-800">
                      {distinctNewCategories.map((c) => c.name).join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      previewFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? 'সব' : 'All'} ({rawRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('new')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      previewFilter === 'new'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? 'নতুন পণ্য' : 'New Items'} ({validNewCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('existing')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      previewFilter === 'existing'
                        ? 'bg-white text-amber-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? 'ম্যাচ/আপডেট' : 'Existing Matches'} ({existingCount})
                  </button>
                  {distinctNewCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('new_cat')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        previewFilter === 'new_cat'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isBn ? 'নতুন ক্যাটাগরি পণ্য' : 'New Cat Items'}
                    </button>
                  )}
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        previewFilter === 'invalid'
                          ? 'bg-white text-rose-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isBn ? 'ত্রুটি' : 'Errors'} ({invalidCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isBn ? 'খুঁজুন...' : 'Filter rows...'}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200"
                    title="Select All"
                  >
                    {isBn ? 'সব সিলেক্ট' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200"
                    title="Deselect All"
                  >
                    {isBn ? 'বাতিল' : 'Clear'}
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'পণ্যের নাম' : 'Product Name'}</th>
                      <th className="py-2.5 px-3 font-mono">{isBn ? 'SKU' : 'SKU'}</th>
                      <th className="py-2.5 px-3 font-mono">{isBn ? 'বারকোড' : 'Barcode'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'ক্রয় মূল্য' : 'Cost'}</th>
                      <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'বিক্রয় মূল্য' : 'Price'}</th>
                      <th className="py-2.5 px-3 text-right font-mono">{isBn ? 'স্টক' : 'Stock'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'একক' : 'Unit'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          {isBn ? 'কোনো সারি পাওয়া যায়নি' : 'No rows match the filter'}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isInvalid = row.status === 'invalid';
                        return (
                          <tr
                            key={row.index}
                            className={`hover:bg-slate-50 transition-colors ${
                              !row.selected ? 'opacity-40 bg-slate-50/50' : ''
                            } ${isInvalid ? 'bg-rose-50/40' : ''}`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={isInvalid}
                                checked={row.selected}
                                onChange={() => handleToggleRow(row.index)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-2 px-3">
                              {isInvalid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{isBn ? 'ত্রুটি' : 'Error'}</span>
                                </span>
                              ) : row.status === 'existing_match' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <RefreshCw className="w-3 h-3" />
                                  <span>{isBn ? 'আপডেট' : 'Update'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Plus className="w-3 h-3" />
                                  <span>{isBn ? 'নতুন' : 'New'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                {row.name}
                              </div>
                              {row.bnName && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                  {row.bnName}
                                </div>
                              )}
                              {row.errors.length > 0 && (
                                <div className="text-[10px] text-rose-600 font-medium">
                                  {row.errors.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] font-medium text-slate-700">
                              {row.sku}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                              {row.barcode}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-800 font-medium truncate max-w-[110px]">
                                  {row.categoryInput}
                                </span>
                                {row.isNewCategory && (
                                  <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[9px] font-bold">
                                    NEW
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                              ৳{row.costPrice}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                              ৳{row.sellingPrice}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                              {row.stock}
                              {row.existingProduct && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  (curr: {row.existingProduct.stock})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {row.unit}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {rawRows.length > 0 && !importResult && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{selectedRows.length}</span> {isBn ? 'টি পণ্য ইম্পোর্টের জন্য নির্বাচিত' : 'products selected to commit'}.
              {distinctNewCategories.length > 0 && (
                <span className="text-indigo-700 font-medium ml-1">
                  (+{distinctNewCategories.length} {isBn ? 'নতুন ক্যাটাগরি তৈরি হবে' : 'new categories will be created'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={selectedRows.length === 0 || isImporting}
                onClick={handleCommitImport}
                className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isBn ? 'ইম্পোর্ট করা হচ্ছে...' : 'Importing Products...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {isBn
                        ? `${selectedRows.length} টি পণ্য ও ক্যাটাগরি ইম্পোর্ট করুন`
                        : `Import ${selectedRows.length} Products & Categories`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
