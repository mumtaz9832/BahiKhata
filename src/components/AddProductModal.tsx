import React, { useState } from 'react';
import { ProductRecord, BusinessProfile } from '../types';
import { STANDARD_UNITS } from '../config/industryCategories';
import {
  X,
  PackagePlus,
  Package,
  Wrench,
  Search,
  IndianRupee,
  Percent,
  Check,
  Trash2,
  Receipt,
  Tag,
  Barcode,
  Clock,
  ShieldCheck,
  Layers,
  Plus,
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRecord[];
  profile?: BusinessProfile;
  onSaveProduct: (product: ProductRecord) => void;
  onDeleteProduct: (id: string) => void;
  onSelectProductForBill?: (product: ProductRecord) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  products,
  profile,
  onSaveProduct,
  onDeleteProduct,
  onSelectProductForBill,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Common fields
  const [name, setName] = useState('');
  const [industryCategory, setIndustryCategory] = useState(
    profile?.industryCategory || 'Scrap & Recycling'
  );
  const [subcategory, setSubcategory] = useState(
    profile?.subcategories?.[0] || 'Iron Scrap'
  );
  const [hsn, setHsn] = useState('7204');
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [unit, setUnit] = useState<string>('Kilograms');
  const [customUnit, setCustomUnit] = useState('');
  const [description, setDescription] = useState('');

  // Product specific fields
  const [rate, setRate] = useState<number>(0); // Selling price
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [stockQty, setStockQty] = useState<number>(100);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [warranty, setWarranty] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Service specific fields
  const [serviceCode, setServiceCode] = useState('');
  const [labourCharge, setLabourCharge] = useState<number>(0);
  const [partsRequired, setPartsRequired] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [serviceWarranty, setServiceWarranty] = useState('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setName('');
    setHsn('7204');
    setRate(0);
    setPurchasePrice(0);
    setWholesalePrice(0);
    setRetailPrice(0);
    setGstPercent(18);
    setUnit('Kilograms');
    setCustomUnit('');
    setStockQty(100);
    setMinStockAlert(10);
    setSku('');
    setBarcode('');
    setSupplier('');
    setWarranty('');
    setSerialNumber('');
    setBatchNumber('');
    setExpiryDate('');
    setDescription('');
    setServiceCode('');
    setLabourCharge(0);
    setPartsRequired('');
    setServiceDuration('');
    setAssignedTechnician('');
    setServiceWarranty('');
  };

  const handleSubmit = (e: React.FormEvent, addToBillAfter = false) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name.');
      return;
    }

    const effectiveRate = itemType === 'service' ? Number(labourCharge) : Number(rate);
    if (effectiveRate < 0) {
      alert('Please enter a valid rate.');
      return;
    }

    const resolvedUnit = unit === 'Custom Units' ? (customUnit.trim() || 'Unit') : unit;

    const newProduct: ProductRecord = {
      id: 'prod_' + Date.now(),
      businessId: profile?.id || 'biz_default',
      type: itemType,
      name: name.trim(),
      category: itemType === 'service' ? 'service' : 'goods',
      industryCategory,
      subcategory,
      hsn: hsn.trim() || (itemType === 'service' ? '9987' : '7204'),
      rate: effectiveRate,
      purchasePrice: Number(purchasePrice) || undefined,
      wholesalePrice: Number(wholesalePrice) || undefined,
      retailPrice: Number(retailPrice) || undefined,
      gstPercent: Number(gstPercent),
      unit: resolvedUnit,
      stockQty: itemType === 'product' ? Number(stockQty) || 0 : undefined,
      minStockAlert: itemType === 'product' ? Number(minStockAlert) || 0 : undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      supplier: supplier.trim() || undefined,
      warranty: warranty.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      description: description.trim() || undefined,
      serviceCode: serviceCode.trim() || undefined,
      labourCharge: Number(labourCharge) || undefined,
      partsRequired: partsRequired.trim() || undefined,
      serviceDuration: serviceDuration.trim() || undefined,
      assignedTechnician: assignedTechnician.trim() || undefined,
      serviceWarranty: serviceWarranty.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveProduct(newProduct);
    setSuccessMsg(`${itemType === 'service' ? 'Service' : 'Product'} saved to catalog successfully!`);
    setTimeout(() => setSuccessMsg(''), 2500);

    if (addToBillAfter && onSelectProductForBill) {
      onSelectProductForBill(newProduct);
      onClose();
    } else {
      handleResetForm();
    }
  };

  const filteredCatalog = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.hsn && p.hsn.toLowerCase().includes(term)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Product &amp; Service Management
              </h2>
              <p className="text-xs text-slate-500">
                {profile?.name || 'Business'} • {profile?.industryCategory || 'Smart Catalog'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'add' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                + Add New
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Catalog ({products.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: ADD NEW PRODUCT OR SERVICE */}
        {activeTab === 'add' ? (
          <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Product vs. Service Selector Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <span className="text-xs font-black text-slate-900 block">Item Classification</span>
                <span className="text-[11px] text-slate-500">Select whether you are adding physical goods or labour service</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setItemType('product')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    itemType === 'product' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Physical Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('service')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    itemType === 'service' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Service / Labour</span>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {itemType === 'product' ? 'Product / Material Name *' : 'Service Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={itemType === 'product' ? 'e.g. Copper Scrap Heavy / TMT Steel 12mm' : 'e.g. Weighbridge Processing / Civil Repair'}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subcategory</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none"
                >
                  {(profile?.subcategories && profile.subcategories.length > 0
                    ? profile.subcategories
                    : ['Iron Scrap', 'Copper Scrap', 'Aluminium Scrap', 'General Goods']
                  ).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & GST Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {itemType === 'product' ? 'Selling Price (₹) *' : 'Labour Charge (₹) *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={itemType === 'product' ? rate || '' : labourCharge || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (itemType === 'product') setRate(val);
                    else setLabourCharge(val);
                  }}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold outline-none"
                />
              </div>

              {itemType === 'product' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">HSN / SAC Code</label>
                <input
                  type="text"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  placeholder="HSN / SAC"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">GST Rate (%)</label>
                <select
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard)</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            {/* Units Selection with Standard & Custom Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Unit of Measurement</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  {STANDARD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {unit === 'Custom Units' ? (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700">Enter Custom Unit</label>
                  <input
                    type="text"
                    required
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g. Brass, Roll, Bundle, Tanker"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                  />
                </div>
              ) : (
                itemType === 'product' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Current Stock Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={stockQty || ''}
                        onChange={(e) => setStockQty(Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Low Stock Alert</label>
                      <input
                        type="number"
                        min="0"
                        value={minStockAlert || ''}
                        onChange={(e) => setMinStockAlert(Number(e.target.value))}
                        placeholder="10"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none"
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Additional Fields for Products (SKU, Barcode, Wholesale, Batch) */}
            {itemType === 'product' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Wholesale &amp; Inventory Details (Optional)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Wholesale Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={wholesalePrice || ''}
                      onChange={(e) => setWholesalePrice(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Retail Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={retailPrice || ''}
                      onChange={(e) => setRetailPrice(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">SKU / Item Code</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="SKU-100"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Batch / Heat No.</label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="B-2026-X"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Additional Fields for Services (Technician, Duration, Warranty) */
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Service Execution Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Assigned Technician</label>
                    <input
                      type="text"
                      value={assignedTechnician}
                      onChange={(e) => setAssignedTechnician(e.target.value)}
                      placeholder="e.g. Ramesh Mechanic"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Service Duration</label>
                    <input
                      type="text"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                      placeholder="e.g. 2 Hours / 1 Day"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Service Warranty</label>
                    <input
                      type="text"
                      value={serviceWarranty}
                      onChange={(e) => setServiceWarranty(e.target.value)}
                      placeholder="e.g. 30 Days Guarantee"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notes / Material Specifications</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Grade details, purity %, physical specifications or instructions..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {onSelectProductForBill && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black rounded-xl border border-amber-300 cursor-pointer shadow-2xs"
                >
                  Save &amp; Add to Invoice
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Save to Catalog
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: CATALOG LIST */
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog by name, HSN, subcategory or SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-400"
              />
            </div>

            <div className="space-y-2">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No items found matching "{searchTerm}".
                </div>
              ) : (
                filteredCatalog.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 truncate">{p.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                          {p.subcategory || p.category}
                        </span>
                        {p.type === 'service' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-900">
                            Service
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        HSN: {p.hsn || '7204'} • Rate: ₹{p.rate?.toLocaleString('en-IN')} / {p.unit || 'Unit'} • GST: {p.gstPercent}%
                        {p.stockQty !== undefined && ` • Stock: ${p.stockQty} ${p.unit || ''}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectProductForBill && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProductForBill(p);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-2xs"
                        >
                          + Add to Bill
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
