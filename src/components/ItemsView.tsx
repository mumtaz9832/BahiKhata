import React, { useState } from 'react';
import { ProductRecord, AppLanguage } from '../types';
import {
  Package,
  PackagePlus,
  Search,
  IndianRupee,
  Car,
  Tag,
  AlertTriangle,
  Download,
  Trash2,
  FilePlus,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface ItemsViewProps {
  products: ProductRecord[];
  lang: AppLanguage;
  onAddProduct: () => void;
  onDeleteProduct: (id: string) => void;
  onSelectProductForBill: (product: ProductRecord) => void;
  searchQuery?: string;
}

export const ItemsView: React.FC<ItemsViewProps> = ({
  products,
  lang,
  onAddProduct,
  onDeleteProduct,
  onSelectProductForBill,
  searchQuery = '',
}) => {
  const isHindi = lang === 'hi';
  const [internalSearch, setInternalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const activeSearch = (searchQuery || internalSearch).toLowerCase().trim();

  // Metrics
  const totalStockQty = products.reduce((sum, p) => sum + (p.stockQty || 0), 0);
  const totalStockValuation = products.reduce((sum, p) => sum + (p.rate || 0) * (p.stockQty || 0), 0);
  const lowStockCount = products.filter((p) => (p.stockQty || 0) <= 2).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !activeSearch ||
      p.name.toLowerCase().includes(activeSearch) ||
      (p.make && p.make.toLowerCase().includes(activeSearch)) ||
      (p.model && p.model.toLowerCase().includes(activeSearch)) ||
      p.hsn.includes(activeSearch) ||
      p.category.toLowerCase().includes(activeSearch);

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Make', 'Model', 'HSN Code', 'Rate (INR)', 'GST %', 'Stock Qty', 'Stock Value'];
    const rows = filteredProducts.map((p) => [
      `"${p.name}"`,
      p.category,
      `"${p.make || ''}"`,
      `"${p.model || ''}"`,
      p.hsn,
      p.rate,
      `${p.gstPercent}%`,
      p.stockQty || 0,
      (p.rate || 0) * (p.stockQty || 0),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Items_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryLabel = (cat: ProductRecord['category']) => {
    switch (cat) {
      case 'electric_vehicle':
        return '⚡ Electric EV';
      case 'two_wheeler':
        return '🏍️ 2-Wheeler';
      case 'four_wheeler':
        return '🚗 4-Wheeler';
      case 'commercial':
        return '🚚 Commercial';
      case 'spare_parts':
        return '🔧 Spare Parts';
      case 'goods':
        return '📦 Goods & Retail';
      case 'service':
        return '🛠️ Service / RTO';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isHindi ? 'सामान व इन्वेंट्री स्टॉक' : 'Items & Stock Inventory'}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-sky-100 text-sky-900 rounded-full">
              {products.length} {isHindi ? 'आइटम' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? 'गाड़ियों, स्पेयर पार्ट्स, और रिटेल सामानों का स्टॉक, HSN कोड, जीएसटी दर व मूल्य प्रबंधन'
              : 'Product catalog, HSN codes, GST tax rates, stock tracking, and 1-click invoice billing'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isHindi ? 'एक्सेल/CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{isHindi ? '+ नया सामान जोड़ें' : '+ Add Item'}</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {isHindi ? 'कुल स्टॉक इकाइयां' : 'Total Stock Units'}
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStockQty}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {products.length} {isHindi ? 'उत्पाद कैटलॉग में' : 'unique catalog items'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-sky-200/80 bg-sky-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-700 mb-1">
            {isHindi ? 'कुल स्टॉक मूल्य' : 'Total Stock Valuation'}
          </div>
          <div className="text-2xl font-black text-sky-900">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-sky-600 mt-0.5">
            {isHindi ? 'विक्रय मूल्य के आधार पर' : 'Based on selling rates'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
            {isHindi ? 'कम स्टॉक चेतावनी' : 'Low Stock Alerts'}
          </div>
          <div className="text-2xl font-black text-amber-800">{lowStockCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {lowStockCount > 0
              ? isHindi
                ? 'जल्द रीस्टॉक करने की आवश्यकता है'
                : 'Items with ≤ 2 units remaining'
              : isHindi
                ? 'सभी उत्पाद पर्याप्त मात्रा में उपलब्ध हैं'
                : 'All items well-stocked'}
          </div>
        </div>
      </div>

      {/* 3. Filters & Categories */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {isHindi ? 'सभी' : 'All'} ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('electric_vehicle')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'electric_vehicle' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              ⚡ EV
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('two_wheeler')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'two_wheeler' ? 'bg-white text-sky-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              🏍️ 2-Wheeler
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('four_wheeler')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'four_wheeler' ? 'bg-white text-indigo-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              🚗 4-Wheeler
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('spare_parts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'spare_parts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              🔧 Spares
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('goods')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'goods' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              📦 Goods
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder={isHindi ? 'आइटम, HSN, मेक खोजें...' : 'Search item, make, HSN...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 4. Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {isHindi ? 'कोई सामान नहीं मिला' : 'No items found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isHindi
                ? 'स्टॉक में नया सामान या गाड़ी जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                : 'Add products and vehicle models to quickly populate your invoices.'}
            </p>
            <button
              type="button"
              onClick={onAddProduct}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
            >
              {isHindi ? '+ नया सामान जोड़ें' : '+ Add Item'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'सामान / गाड़ी का नाम' : 'Item / Vehicle Name'}</th>
                  <th className="py-3 px-4">{isHindi ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-3 px-4">{isHindi ? 'HSN कोड' : 'HSN / SAC'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'दर / मूल्य' : 'Rate (₹)'}</th>
                  <th className="py-3 px-4 text-center">{isHindi ? 'जीएसटी' : 'GST %'}</th>
                  <th className="py-3 px-4 text-center">{isHindi ? 'उपलब्ध स्टॉक' : 'Stock Qty'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = (p.stockQty || 0) <= 2;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {(p.make || p.model) && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {p.make} {p.model} {p.variant && `(${p.variant})`}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <span className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                          {getCategoryLabel(p.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                        {p.hsn || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-right whitespace-nowrap">
                        ₹{p.rate.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                          {p.gstPercent}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                          <span>
                            {p.stockQty || 0} {p.unit || 'Unit'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add to Bill */}
                          <button
                            type="button"
                            onClick={() => onSelectProductForBill(p)}
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px] shadow-2xs flex items-center gap-1"
                            title="Add this product to new bill"
                          >
                            <FilePlus className="w-3 h-3" />
                            <span>{isHindi ? 'बिल में जोड़ें' : 'Bill Item'}</span>
                          </button>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete product ${p.name}?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
