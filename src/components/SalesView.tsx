import React, { useState } from 'react';
import { SavedInvoice, PaymentMode, AppLanguage } from '../types';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Printer,
  MessageCircle,
  Eye,
  Trash2,
  Download,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Car,
  Store,
} from 'lucide-react';

interface SalesViewProps {
  invoices: SavedInvoice[];
  lang: AppLanguage;
  onSelectInvoiceToView: (invoice: SavedInvoice) => void;
  onPrintInvoice: (invoice: SavedInvoice) => void;
  onWhatsAppInvoice: (invoice: SavedInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onRecordPayment: (invoiceId: string, amount: number, mode: PaymentMode, note: string) => void;
  onNewInvoice: () => void;
  searchQuery?: string;
}

export const SalesView: React.FC<SalesViewProps> = ({
  invoices,
  lang,
  onSelectInvoiceToView,
  onPrintInvoice,
  onWhatsAppInvoice,
  onDeleteInvoice,
  onRecordPayment,
  onNewInvoice,
  searchQuery = '',
}) => {
  const isHindi = lang === 'hi';
  const [internalSearch, setInternalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'auto_dealer' | 'general_retail'>('ALL');

  // Payment Recording Modal state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<SavedInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / QR');
  const [paymentNote, setPaymentNote] = useState<string>('');

  const activeSearch = (searchQuery || internalSearch).toLowerCase().trim();

  // Metrics calculation
  let totalSalesVal = 0;
  let totalAdvanceVal = 0;
  let totalDueVal = 0;

  invoices.forEach((inv) => {
    const isAuto = inv.mode === 'auto_dealer';
    const total = isAuto ? inv.autoData?.pricing?.totalSaleValue || 0 : inv.retailData?.grandTotal || 0;
    const advance = isAuto ? inv.autoData?.pricing?.advanceReceived || 0 : inv.retailData?.advanceReceived || 0;
    const balance = isAuto ? inv.autoData?.pricing?.balanceAmount || 0 : inv.retailData?.balanceAmount || 0;

    totalSalesVal += total;
    totalAdvanceVal += advance;
    totalDueVal += balance;
  });

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const isAuto = inv.mode === 'auto_dealer';
    const customerName = isAuto
      ? inv.autoData?.buyer.fullName || ''
      : inv.retailData?.customer.fullName || '';
    const phone = isAuto
      ? inv.autoData?.buyer.phone || ''
      : inv.retailData?.customer.phone || '';
    const invNo = inv.invoiceNo || '';
    const desc = isAuto
      ? `${inv.autoData?.vehicle.make || ''} ${inv.autoData?.vehicle.model || ''} ${inv.autoData?.vehicle.registrationNo || ''}`
      : (inv.retailData?.items || []).map((i) => i.description).join(' ');

    const matchesSearch =
      !activeSearch ||
      customerName.toLowerCase().includes(activeSearch) ||
      phone.includes(activeSearch) ||
      invNo.toLowerCase().includes(activeSearch) ||
      desc.toLowerCase().includes(activeSearch);

    const balance = isAuto ? inv.autoData?.pricing?.balanceAmount || 0 : inv.retailData?.balanceAmount || 0;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNPAID' && balance > 0) ||
      (statusFilter === 'PAID' && balance <= 0);

    const matchesMode = modeFilter === 'ALL' || inv.mode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Customer Name',
      'Phone',
      'Mode',
      'Total Amount (INR)',
      'Advance Received (INR)',
      'Balance Due (INR)',
      'Status',
    ];
    const rows = filteredInvoices.map((inv) => {
      const isAuto = inv.mode === 'auto_dealer';
      const name = isAuto ? inv.autoData?.buyer.fullName : inv.retailData?.customer.fullName;
      const phone = isAuto ? inv.autoData?.buyer.phone : inv.retailData?.customer.phone;
      const total = isAuto ? inv.autoData?.pricing?.totalSaleValue : inv.retailData?.grandTotal;
      const adv = isAuto ? inv.autoData?.pricing?.advanceReceived : inv.retailData?.advanceReceived;
      const bal = isAuto ? inv.autoData?.pricing?.balanceAmount : inv.retailData?.balanceAmount;
      return [
        inv.invoiceNo,
        inv.invoiceDate,
        `"${name || ''}"`,
        `"${phone || ''}"`,
        inv.mode,
        total || 0,
        adv || 0,
        bal || 0,
        bal && bal > 0 ? 'DUE' : 'PAID',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPayment = (inv: SavedInvoice) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    setActivePaymentInvoice(inv);
    setPaymentAmount(bal);
    setPaymentMode('UPI / QR');
    setPaymentNote('Partial / Full settlement');
  };

  const handleConfirmPayment = () => {
    if (!activePaymentInvoice || paymentAmount <= 0) return;
    onRecordPayment(activePaymentInvoice.id, paymentAmount, paymentMode, paymentNote);
    setActivePaymentInvoice(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Bar (Zoho / Vyapar Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isHindi ? 'बिक्री रजिस्टर (Sale Invoices)' : 'Sales Register & Invoices'}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              {invoices.length} {isHindi ? 'बिल' : 'Bills'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? 'सभी टैक्स इनवॉइस, सेल बिल और चालान का विवरण व भुगतान नियंत्रण'
              : 'Complete ledger of all customer bills, payment collections, and delivery challans'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isHindi ? 'एक्सेल/CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? '+ नया बिल बनाएं' : '+ Create Invoice'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {isHindi ? 'कुल बिक्री (Total Sales)' : 'Total Sales Turnover'}
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{totalSalesVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {invoices.length} {isHindi ? 'इनवॉइस दर्ज' : 'invoices issued'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
            {isHindi ? 'प्राप्त भुगतान (Collected)' : 'Total Collected'}
          </div>
          <div className="text-2xl font-black text-emerald-800">
            ₹{totalAdvanceVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {isHindi ? 'नकद, UPI व बैंक जमा' : 'Cash, UPI & Bank transfer'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
            {isHindi ? 'बाकी उधारी (To Receive)' : 'Receivables / Due'}
          </div>
          <div className="text-2xl font-black text-amber-800">
            ₹{totalDueVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {invoices.filter((i) => {
              const b = i.mode === 'auto_dealer' ? i.autoData?.pricing?.balanceAmount : i.retailData?.balanceAmount;
              return b && b > 0;
            }).length}{' '}
            {isHindi ? 'बिलों में बकाया शेष' : 'invoices with pending balance'}
          </div>
        </div>
      </div>

      {/* 3. Filters Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs (Segmented control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'सभी' : 'All'} ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'UNPAID'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'बाकी / उधारी' : 'Pending / Due'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'PAID'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'पूर्ण चुकता' : 'Paid'}
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setModeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isHindi ? 'सभी मोड' : 'All Modes'}
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('auto_dealer')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modeFilter === 'auto_dealer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Auto / EV
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('general_retail')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modeFilter === 'general_retail' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Retail
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder={isHindi ? 'खोजें...' : 'Search invoices...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {isHindi ? 'कोई इनवॉइस नहीं मिला' : 'No invoices found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isHindi
                ? 'नया बिल बनाने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                : 'Start creating bills to track all transactions, dues and print documents.'}
            </p>
            <button
              type="button"
              onClick={onNewInvoice}
              className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
            >
              {isHindi ? '+ नया बिल बनाएं' : '+ Create Invoice'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'बिल #' : 'Invoice #'}</th>
                  <th className="py-3 px-4">{isHindi ? 'तारीख' : 'Date'}</th>
                  <th className="py-3 px-4">{isHindi ? 'ग्राहक / पार्टी' : 'Party / Customer'}</th>
                  <th className="py-3 px-4">{isHindi ? 'विवरण' : 'Description'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कुल राशि' : 'Amount'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'बाकी देय' : 'Balance'}</th>
                  <th className="py-3 px-4 text-center">{isHindi ? 'स्थिति' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isAuto = inv.mode === 'auto_dealer';
                  const customerName = isAuto
                    ? inv.autoData?.buyer.fullName || 'Walk-in Buyer'
                    : inv.retailData?.customer.fullName || 'Retail Customer';
                  const customerPhone = isAuto
                    ? inv.autoData?.buyer.phone || ''
                    : inv.retailData?.customer.phone || '';
                  const total = isAuto
                    ? inv.autoData?.pricing?.totalSaleValue || 0
                    : inv.retailData?.grandTotal || 0;
                  const balance = isAuto
                    ? inv.autoData?.pricing?.balanceAmount || 0
                    : inv.retailData?.balanceAmount || 0;
                  const titleDesc = isAuto
                    ? `${inv.autoData?.vehicle.make || ''} ${inv.autoData?.vehicle.model || ''} (${inv.autoData?.vehicle.registrationNo || 'NEW'})`
                    : `${inv.retailData?.items.length || 0} items (${inv.retailData?.items[0]?.description || 'General'})`;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customerName}</div>
                        {customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">{customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        <span className="inline-flex items-center gap-1">
                          {isAuto ? (
                            <Car className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Store className="w-3 h-3 text-sky-500 shrink-0" />
                          )}
                          <span className="truncate">{titleDesc}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-right whitespace-nowrap">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {balance > 0 ? (
                          <span className="font-bold text-amber-700 font-mono">
                            ₹{balance.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            balance <= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {balance <= 0 ? (isHindi ? 'चुकता' : 'PAID') : (isHindi ? 'बाकी' : 'DUE')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Record Payment Button */}
                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer text-[11px]"
                              title="Record payment"
                            >
                              {isHindi ? 'पेमेंट' : 'Pay'}
                            </button>
                          )}

                          {/* View in Editor */}
                          <button
                            type="button"
                            onClick={() => onSelectInvoiceToView(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print A4 */}
                          <button
                            type="button"
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Reminder */}
                          <button
                            type="button"
                            onClick={() => onWhatsAppInvoice(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="WhatsApp reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this invoice permanently?')) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete invoice"
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

      {/* 5. Payment Recording Dialog (Vyapar / Zoho style Payment Collection) */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {isHindi ? 'भुगतान दर्ज करें (Record Payment)' : 'Record Invoice Payment'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice #{activePaymentInvoice.invoiceNo} &bull;{' '}
              {activePaymentInvoice.mode === 'auto_dealer'
                ? activePaymentInvoice.autoData?.buyer.fullName
                : activePaymentInvoice.retailData?.customer.fullName}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isHindi ? 'भुगतान राशि (₹)' : 'Payment Amount (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isHindi ? 'भुगतान माध्यम' : 'Payment Mode'}
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="UPI / QR">UPI / QR (Google Pay, PhonePe, Paytm)</option>
                  <option value="Cash">Cash (नकद)</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Finance / Loan">Finance / Loan Disbursal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isHindi ? 'टिप्पणी / संदर्भ' : 'Reference / Note'}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. UTR / Cheque # / Cash receipt"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  {isHindi ? 'भुगतान सेव करें' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
