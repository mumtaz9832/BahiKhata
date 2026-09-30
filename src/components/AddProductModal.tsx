import React, { useState } from 'react';
import { ProductRecord } from '../types';
import {
  X,
  PackagePlus,
  Package,
  Search,
  IndianRupee,
  Percent,
  Check,
  Trash2,
  Receipt,
  Car,
  Tag,
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRecord[];
  onSaveProduct: (product: ProductRecord) => void;
  onDeleteProduct: (id: string) => void;
  onSelectProductForBill?: (product: ProductRecord) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProduct,
  onDeleteProduct,
  onSelectProductForBill,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductRecord['category']>('two_wheeler');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [hsn, setHsn] = useState('8711');
  const [rate, setRate] = useState<number>(0);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [unit, setUnit] = useState('Unit');
  const [stockQty, setStockQty] = useState<number>(1);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setName('');
    setCategory('two_wheeler');
    setMake('');
    setModel('');
    setVariant('');
    setHsn('8711');
    setRate(0);
    setGstPercent(18);
    setUnit('Unit');
    setStockQty(1);
    setDescription('');
  };

  const handleCategoryChange = (newCat: ProductRecord['category']) => {
    setCategory(newCat);
    if (newCat === 'electric_vehicle') {
      setGstPercent(5);
      setHsn('8711');
    } else if (newCat === 'two_wheeler' || newCat === 'four_wheeler') {
      setGstPercent(28);
      setHsn(newCat === 'four_wheeler' ? '8703' : '8711');
    } else if (newCat === 'spare_parts') {
      setGstPercent(18);
      setHsn('8714');
    } else if (newCat === 'service') {
      setGstPercent(18);
      setHsn('9987');
      setUnit('Job');
    } else {
      setGstPercent(18);
      setHsn('8708');
    }
  };

  const handleSubmit = (e: React.FormEvent, addToBillAfter = false) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product or vehicle name.');
      return;
    }
    if (rate <= 0) {
      alert('Please enter a valid price/rate greater than zero.');
      return;
    }

    const newProduct: ProductRecord = {
      id: 'prod_' + Date.now(),
      name: name.trim(),
      category,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      variant: variant.trim() || undefined,
      hsn: hsn.trim() || '8711',
      rate: Number(rate),
      gstPercent: Number(gstPercent),
      unit: unit.trim() || 'Unit',
      stockQty: Number(stockQty) || 0,
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveProduct(newProduct);
    setSuccessMsg('Product saved to catalog successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);

    if (addToBillAfter && onSelectProductForBill) {
      onSelectProductForBill(newProduct);
      onClose();
      return;
    }

    handleResetForm();
    setActiveTab('list');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.make && p.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.hsn.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">Product &amp; Vehicle Catalog</h3>
              <p className="text-xs text-slate-400">Add vehicles, spare parts or retail items with HSN &amp; GST</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'border-sky-600 text-sky-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Add New Product / Vehicle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-sky-600 text-sky-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Catalog ({products.length})</span>
          </button>
        </div>

        {successMsg && (
          <div className="bg-sky-50 border-b border-sky-200 text-sky-800 text-xs px-4 py-2 flex items-center gap-2">
            <Check className="w-4 h-4 text-sky-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-slate-700">
          {activeTab === 'add' ? (
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              {/* Product Category */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Product / Inventory Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'two_wheeler', label: '🏍️ Two-Wheeler' },
                    { id: 'electric_vehicle', label: '⚡ Electric Vehicle (EV)' },
                    { id: 'four_wheeler', label: '🚗 Four-Wheeler / Car' },
                    { id: 'spare_parts', label: '🔧 Spare Parts / Helmets' },
                    { id: 'goods', label: '📦 General Retail Goods' },
                    { id: 'service', label: '🛠️ Service / Labor' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id as any)}
                      className={`p-2 rounded-lg text-left font-bold border transition-all cursor-pointer ${
                        category === cat.id
                          ? 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Product / Vehicle Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Honda Activa 6G DLX or 15W-40 Synthetic Engine Oil"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Make & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Make / Brand</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Honda / Castrol / Ola"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Model / Variant</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Activa 6G / 1 Litre"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    placeholder="e.g. 8711"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Selling Price / Rate (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rate || ''}
                      onChange={(e) => setRate(Number(e.target.value))}
                      placeholder="e.g. 78500"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (EV Concessional)</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18% (Standard / Spares)</option>
                    <option value={28}>28% (Automobiles 2W/4W)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit of Measurement</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="Unit">Unit (Vehicle)</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Ltr">Ltr (Litres)</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Job">Job / Service</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Specifications / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Engine displacement, fuel economy, color variants, warranty specifics..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Save &amp; Add to Active Bill</span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by product name, make, model or HSN..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-600">No products found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add items or vehicles to your product catalog.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{prod.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            HSN: {prod.hsn}
                          </span>
                          <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded">
                            {prod.gstPercent}% GST
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-900 text-xs">
                            ₹{prod.rate.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">/ {prod.unit}</span>
                          </span>
                          {prod.stockQty !== undefined && (
                            <span className="text-slate-500">
                              Stock: <span className="font-semibold text-slate-800">{prod.stockQty}</span>
                            </span>
                          )}
                          {prod.make && <span className="text-slate-500">Brand: {prod.make}</span>}
                        </div>
                        {prod.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{prod.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectProductForBill && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProductForBill(prod);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Add item to current bill"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${prod.name} from catalog?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
