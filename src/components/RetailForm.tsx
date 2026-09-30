import React, { useState } from 'react';
import { RetailData, RetailItem, PaymentMode } from '../types';
import {
  User,
  Plus,
  Trash2,
  Percent,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';

interface RetailFormProps {
  data: RetailData;
  onChange: (updated: RetailData) => void;
  invoiceNo: string;
  onInvoiceNoChange: (no: string) => void;
  invoiceDate: string;
  onInvoiceDateChange: (date: string) => void;
}

export const RetailForm: React.FC<RetailFormProps> = ({
  data,
  onChange,
  invoiceNo,
  onInvoiceNoChange,
  invoiceDate,
  onInvoiceDateChange,
}) => {
  const [focusTab, setFocusTab] = useState<'all' | 'customer' | 'items' | 'settlement'>('all');
  const recalculateTotals = (items: RetailItem[], discountVal: number, advanceVal: number) => {
    let subtotal = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const lineBase = item.qty * item.rate;
      const gst = (lineBase * item.gstPercent) / 100;
      subtotal += lineBase;
      totalGst += gst;
    });

    const grand = Math.max(0, subtotal + totalGst - discountVal);
    const balance = Math.max(0, grand - advanceVal);

    return {
      subtotal,
      totalGst,
      grandTotal: grand,
      balanceAmount: balance,
    };
  };

  const handleCustomerChange = (field: keyof typeof data.customer, value: string) => {
    onChange({
      ...data,
      customer: {
        ...data.customer,
        [field]: value,
      },
    });
  };

  const handleItemChange = (index: number, field: keyof RetailItem, value: any) => {
    const updatedItems = [...data.items];
    const target = { ...updatedItems[index], [field]: value };

    if (field === 'qty' || field === 'rate' || field === 'gstPercent') {
      const qty = field === 'qty' ? parseFloat(value) || 0 : target.qty;
      const rate = field === 'rate' ? parseFloat(value) || 0 : target.rate;
      const gstP = field === 'gstPercent' ? parseFloat(value) || 0 : target.gstPercent;
      const lineBase = qty * rate;
      const lineGst = (lineBase * gstP) / 100;
      target.amount = lineBase + lineGst;
    }

    updatedItems[index] = target;
    const totals = recalculateTotals(updatedItems, data.discount, data.advanceReceived);

    onChange({
      ...data,
      items: updatedItems,
      ...totals,
    });
  };

  const addItem = () => {
    const newItem: RetailItem = {
      id: 'item_' + Date.now(),
      description: '',
      hsn: '',
      qty: 1,
      unit: 'Pcs',
      rate: 0,
      gstPercent: 18,
      amount: 0,
    };
    const updatedItems = [...data.items, newItem];
    const totals = recalculateTotals(updatedItems, data.discount, data.advanceReceived);

    onChange({
      ...data,
      items: updatedItems,
      ...totals,
    });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    const updatedItems = data.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(updatedItems, data.discount, data.advanceReceived);

    onChange({
      ...data,
      items: updatedItems,
      ...totals,
    });
  };

  const handleDiscountChange = (val: number) => {
    const totals = recalculateTotals(data.items, val, data.advanceReceived);
    onChange({
      ...data,
      discount: val,
      ...totals,
    });
  };

  const handleAdvanceChange = (val: number) => {
    const totals = recalculateTotals(data.items, data.discount, val);
    onChange({
      ...data,
      advanceReceived: val,
      ...totals,
    });
  };

  return (
    <div className="space-y-6">
      {/* Invoice Meta Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Retail Tax Invoice Details
          </span>
          <span className="text-[11px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Shop &amp; Retail Mode
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Invoice / Bill No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => onInvoiceNoChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => onInvoiceDateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Focus Mode Navigation Bar */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto border border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => setFocusTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          All Sections
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('customer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'customer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          1. Customer Details
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('items')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'items'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          2. Items &amp; Products ({data.items.length})
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('settlement')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'settlement'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          3. Total &amp; Payment
        </button>
      </div>

      {/* Customer Info */}
      {(focusTab === 'all' || focusTab === 'customer') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Customer Details
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Customer / Firm Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Amit Patel"
              value={data.customer.fullName}
              onChange={(e) => handleCustomerChange('fullName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Mobile Number (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g., +91 98765 43210"
              value={data.customer.phone}
              onChange={(e) => handleCustomerChange('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Customer GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 27AABCT1234F1Z5"
              value={data.customer.gstin || ''}
              onChange={(e) => handleCustomerChange('gstin', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Billing Address / City
            </label>
            <input
              type="text"
              placeholder="e.g., Shop 4, Market Yard, Pune"
              value={data.customer.address}
              onChange={(e) => handleCustomerChange('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>
      )}

      {/* Items Table */}
      {(focusTab === 'all' || focusTab === 'items') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Line Items &amp; Products
            </h3>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {data.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
            >
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  Item Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engine Oil, Brake Pads, Helmet"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  HSN / Code
                </label>
                <input
                  type="text"
                  placeholder="8708"
                  value={item.hsn}
                  onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  Rate (₹)
                </label>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  GST %
                </label>
                <select
                  value={item.gstPercent}
                  onChange={(e) => handleItemChange(idx, 'gstPercent', parseFloat(e.target.value))}
                  className="w-full px-1.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-1 text-right">
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                  Amount
                </label>
                <span className="font-mono font-bold text-slate-900 block py-1.5">
                  ₹{Math.round(item.amount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 flex justify-end items-end pt-4 sm:pt-0">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={data.items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Pricing & Settlement */}
      {(focusTab === 'all' || focusTab === 'settlement') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <IndianRupee className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Bill Calculation &amp; Khata Balance
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Subtotal (Excl. Tax)</label>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900">
              ₹{Math.round(data.subtotal).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Total GST Output</label>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900">
              ₹{Math.round(data.totalGst).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-rose-600">Special Discount (₹)</label>
            <input
              type="number"
              value={data.discount}
              onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-rose-600 font-mono font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Payment Mode</label>
            <select
              value={data.paymentMode}
              onChange={(e) => onChange({ ...data, paymentMode: e.target.value as PaymentMode })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="UPI / QR">UPI / QR</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Grand Total & Advance */}
        <div className="bg-slate-900 text-white p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Grand Total
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              ₹{Math.round(data.grandTotal).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-4">
            <label className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
              Advance / Paid Amount (₹)
            </label>
            <input
              type="number"
              value={data.advanceReceived}
              onChange={(e) => handleAdvanceChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Remaining Khata Balance
            </span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${data.balanceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{Math.round(data.balanceAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
