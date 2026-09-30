import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  User,
  Phone,
  Hash,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type SearchTarget = 'all' | 'customer' | 'phone' | 'invoiceNo';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'balance_desc'
  | 'customer_asc';

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

// Clean phone helper for normalized digit comparisons (+91, spaces, dashes stripped)
const matchPhone = (phone: string, query: string): boolean => {
  if (!phone || !query) return false;
  if (phone.toLowerCase().includes(query.toLowerCase())) return true;

  const cleanPhone = phone.replace(/\D/g, '');
  const cleanQuery = query.replace(/\D/g, '');
  if (cleanQuery.length >= 2 && cleanPhone.includes(cleanQuery)) {
    return true;
  }
  return false;
};

// Text highlight component for matches
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const cleanQ = query.trim();
  if (!cleanQ) return <>{text}</>;

  try {
    const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    if (parts.length === 1) return <>{text}</>;

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQ.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded-xs">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
};

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter state
  const [internalSearch, setInternalSearch] = useState(searchQuery || '');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('all');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'auto_dealer' | 'general_retail'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Payment Recording Modal state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<SavedInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / QR');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Keep internalSearch in sync when external searchQuery prop changes
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== internalSearch) {
      setInternalSearch(searchQuery);
    }
  }, [searchQuery]);

  const activeSearch = internalSearch.trim();
  const lowerActiveSearch = activeSearch.toLowerCase();

  // Metrics calculation
  let totalSalesVal = 0;
  let totalAdvanceVal = 0;
  let totalDueVal = 0;
  let unpaidCount = 0;
  let paidCount = 0;

  invoices.forEach((inv) => {
    const isAuto = inv.mode === 'auto_dealer';
    const total = isAuto ? inv.autoData?.pricing?.totalSaleValue || 0 : inv.retailData?.grandTotal || 0;
    const advance = isAuto ? inv.autoData?.pricing?.advanceReceived || 0 : inv.retailData?.advanceReceived || 0;
    const balance = isAuto ? inv.autoData?.pricing?.balanceAmount || 0 : inv.retailData?.balanceAmount || 0;

    totalSalesVal += total;
    totalAdvanceVal += advance;
    totalDueVal += balance;

    if (balance > 0) {
      unpaidCount++;
    } else {
      paidCount++;
    }
  });

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return invoices.filter((inv) => {
      const isAuto = inv.mode === 'auto_dealer';
      const customerName = isAuto
        ? inv.autoData?.buyer.fullName || ''
        : inv.retailData?.customer.fullName || '';
      const phone = isAuto
        ? inv.autoData?.buyer.phone || ''
        : inv.retailData?.customer.phone || '';
      const altPhone = isAuto ? inv.autoData?.buyer.altPhone || '' : '';
      const invNo = inv.invoiceNo || '';
      const invId = inv.id || '';
      const desc = isAuto
        ? `${inv.autoData?.vehicle.make || ''} ${inv.autoData?.vehicle.model || ''} ${inv.autoData?.vehicle.registrationNo || ''}`
        : (inv.retailData?.items || []).map((i) => i.description).join(' ');

      // 1. Search Query & Target Filter
      let matchesSearch = true;
      if (lowerActiveSearch) {
        switch (searchTarget) {
          case 'customer':
            matchesSearch = customerName.toLowerCase().includes(lowerActiveSearch);
            break;
          case 'phone':
            matchesSearch =
              matchPhone(phone, lowerActiveSearch) ||
              matchPhone(altPhone, lowerActiveSearch);
            break;
          case 'invoiceNo':
            matchesSearch =
              invNo.toLowerCase().includes(lowerActiveSearch) ||
              invId.toLowerCase().includes(lowerActiveSearch) ||
              invNo.toLowerCase().replace(/[^a-z0-9]/g, '').includes(lowerActiveSearch.replace(/[^a-z0-9]/g, ''));
            break;
          case 'all':
          default:
            matchesSearch =
              customerName.toLowerCase().includes(lowerActiveSearch) ||
              matchPhone(phone, lowerActiveSearch) ||
              matchPhone(altPhone, lowerActiveSearch) ||
              invNo.toLowerCase().includes(lowerActiveSearch) ||
              invId.toLowerCase().includes(lowerActiveSearch) ||
              desc.toLowerCase().includes(lowerActiveSearch);
            break;
        }
      }

      if (!matchesSearch) return false;

      // 2. Status Filter
      const balance = isAuto ? inv.autoData?.pricing?.balanceAmount || 0 : inv.retailData?.balanceAmount || 0;
      if (statusFilter === 'UNPAID' && balance <= 0) return false;
      if (statusFilter === 'PAID' && balance > 0) return false;

      // 3. Mode Filter
      if (modeFilter !== 'ALL' && inv.mode !== modeFilter) return false;

      // 4. Date Filter
      const invDate = inv.invoiceDate || '';
      if (dateFilter === 'today' && invDate !== todayStr) {
        return false;
      }
      if (dateFilter === 'week' && (invDate < sevenDaysAgoStr || invDate > todayStr)) {
        return false;
      }
      if (dateFilter === 'month' && !invDate.startsWith(currentYearMonth)) {
        return false;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && invDate < customStartDate) return false;
        if (customEndDate && invDate > customEndDate) return false;
      }

      return true;
    });
  }, [
    invoices,
    lowerActiveSearch,
    searchTarget,
    statusFilter,
    modeFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Sort filtered invoices
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const isAutoA = a.mode === 'auto_dealer';
      const isAutoB = b.mode === 'auto_dealer';

      const totalA = isAutoA ? a.autoData?.pricing?.totalSaleValue || 0 : a.retailData?.grandTotal || 0;
      const totalB = isAutoB ? b.autoData?.pricing?.totalSaleValue || 0 : b.retailData?.grandTotal || 0;

      const balanceA = isAutoA ? a.autoData?.pricing?.balanceAmount || 0 : a.retailData?.balanceAmount || 0;
      const balanceB = isAutoB ? b.autoData?.pricing?.balanceAmount || 0 : b.retailData?.balanceAmount || 0;

      const nameA = (isAutoA ? a.autoData?.buyer.fullName : a.retailData?.customer.fullName) || '';
      const nameB = (isAutoB ? b.autoData?.buyer.fullName : b.retailData?.customer.fullName) || '';

      const dateA = a.invoiceDate || '';
      const dateB = b.invoiceDate || '';

      switch (sortOption) {
        case 'date_asc':
          return dateA.localeCompare(dateB);
        case 'amount_desc':
          return totalB - totalA;
        case 'amount_asc':
          return totalA - totalB;
        case 'balance_desc':
          return balanceB - balanceA;
        case 'customer_asc':
          return nameA.localeCompare(nameB);
        case 'date_desc':
        default:
          return dateB.localeCompare(dateA);
      }
    });
  }, [filteredInvoices, sortOption]);

  const hasActiveFilters =
    Boolean(activeSearch) ||
    searchTarget !== 'all' ||
    statusFilter !== 'ALL' ||
    modeFilter !== 'ALL' ||
    dateFilter !== 'all' ||
    Boolean(customStartDate) ||
    Boolean(customEndDate);

  const handleResetFilters = () => {
    setInternalSearch('');
    setSearchTarget('all');
    setStatusFilter('ALL');
    setModeFilter('ALL');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

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
    const rows = sortedInvoices.map((inv) => {
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

  // Dynamic placeholder text based on selected search target
  const getSearchPlaceholder = () => {
    if (isHindi) {
      switch (searchTarget) {
        case 'customer':
          return 'ग्राहक का नाम खोजें (उदा. राहुल, राजेश शर्मा)...';
        case 'phone':
          return '10 अंकों का मोबाइल नंबर खोजें (उदा. 9876543210)...';
        case 'invoiceNo':
          return 'बिल या इनवॉइस नंबर खोजें (उदा. INV-001, 2026)...';
        case 'all':
        default:
          return 'ग्राहक का नाम, मोबाइल नंबर या बिल # खोजें...';
      }
    } else {
      switch (searchTarget) {
        case 'customer':
          return 'Search by customer name (e.g. Rahul Sharma, Gupta Traders)...';
        case 'phone':
          return 'Search by mobile number (e.g. 9876543210, +91)...';
        case 'invoiceNo':
          return 'Search by invoice number or ID (e.g. INV-001, AD-102)...';
        case 'all':
        default:
          return 'Search by Customer Name, Mobile Number, or Invoice ID...';
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Bar */}
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
              ? 'सभी टैक्स इनवॉइस, सेल बिल और चालान का विवरण व त्वरित खोज'
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
            {paidCount} {isHindi ? 'बिल पूर्ण चुकता' : 'invoices paid in full'}
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
            {unpaidCount} {isHindi ? 'बिलों में बकाया शेष' : 'invoices with pending balance'}
          </div>
        </div>
      </div>

      {/* 3. Dedicated Searchable Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* 3A. Primary Search Bar with Target Field Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-col lg:flex-row gap-2.5">
            {/* Main Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setInternalSearch('');
                  }
                }}
                placeholder={getSearchPlaceholder()}
                className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/80 focus:border-amber-400 transition-all font-medium"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {activeSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setInternalSearch('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title={isHindi ? 'सर्च हटाएं (Esc)' : 'Clear search (Esc)'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                    Esc
                  </kbd>
                )}
              </div>
            </div>

            {/* Quick Search Target Selector (Tabs) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0 text-xs">
              <span className="hidden xl:inline-block px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isHindi ? 'खोजें:' : 'Field:'}
              </span>
              <button
                type="button"
                onClick={() => setSearchTarget('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  searchTarget === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3 h-3" />
                <span>{isHindi ? 'सभी फ़ील्ड' : 'All Fields'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTarget('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  searchTarget === 'customer'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3 h-3" />
                <span>{isHindi ? 'ग्राहक नाम' : 'Customer Name'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTarget('phone')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  searchTarget === 'phone'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchTarget('invoiceNo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  searchTarget === 'invoiceNo'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>{isHindi ? 'बिल #' : 'Invoice ID'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3B. Multi-facet Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Segmented Control */}
            <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'सभी स्थिति' : 'All Status'} ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'UNPAID'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'उधारी' : 'Due'} ({unpaidCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'चुकता' : 'Paid'} ({paidCount})
              </button>
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl text-xs">
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
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modeFilter === 'auto_dealer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Car className="w-3 h-3 text-amber-500" />
                <span>Auto</span>
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('general_retail')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modeFilter === 'general_retail' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Store className="w-3 h-3 text-sky-500" />
                <span>Retail</span>
              </button>
            </div>

            {/* Date Preset Selector */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="all">{isHindi ? 'सभी तारीख' : 'All Time'}</option>
                  <option value="today">{isHindi ? 'आज (Today)' : 'Today'}</option>
                  <option value="week">{isHindi ? 'पिछले 7 दिन' : 'Last 7 Days'}</option>
                  <option value="month">{isHindi ? 'इस महीने' : 'This Month'}</option>
                  <option value="custom">{isHindi ? 'कस्टम तारीख' : 'Custom Range'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sort Selector & Reset Button */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <option value="date_desc">{isHindi ? 'तारीख (नई पहले)' : 'Date: Newest'}</option>
                <option value="date_asc">{isHindi ? 'तारीख (पुरानी पहले)' : 'Date: Oldest'}</option>
                <option value="amount_desc">{isHindi ? 'राशि (ज्यादा से कम)' : 'Amount: High → Low'}</option>
                <option value="amount_asc">{isHindi ? 'राशि (कम से ज्यादा)' : 'Amount: Low → High'}</option>
                <option value="balance_desc">{isHindi ? 'बकाया देय (अधिकतम)' : 'Balance Due: High'}</option>
                <option value="customer_asc">{isHindi ? 'ग्राहक नाम (A to Z)' : 'Customer: A → Z'}</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title={isHindi ? 'सभी फ़िल्टर हटाएं' : 'Reset all filters'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isHindi ? 'रीसेट' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3C. Custom Date Inputs (when DateFilter === 'custom') */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs animate-in slide-in-from-top-2 duration-150">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              {isHindi ? 'कस्टम तारीख सीमा:' : 'Custom Date Range:'}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">{isHindi ? 'से' : 'From'}:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">{isHindi ? 'तक' : 'To'}:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-amber-800 hover:text-amber-950 underline font-bold cursor-pointer ml-auto"
              >
                {isHindi ? 'तारीख साफ़ करें' : 'Clear dates'}
              </button>
            )}
          </div>
        )}

        {/* 3D. Active Search & Filter Feedback Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-700">
              {isHindi
                ? `${invoices.length} में से ${sortedInvoices.length} बिल प्रदर्शित`
                : `Showing ${sortedInvoices.length} of ${invoices.length} invoices`}
            </span>

            {/* Active Query Chip */}
            {activeSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-medium text-[11px] border border-amber-200">
                <span>
                  {searchTarget === 'customer'
                    ? (isHindi ? 'ग्राहक:' : 'Customer:')
                    : searchTarget === 'phone'
                    ? (isHindi ? 'मोबाइल:' : 'Phone:')
                    : searchTarget === 'invoiceNo'
                    ? (isHindi ? 'बिल #:' : 'Invoice #:')
                    : (isHindi ? 'खोज:' : 'Query:')}{' '}
                  "{activeSearch}"
                </span>
                <button
                  type="button"
                  onClick={() => setInternalSearch('')}
                  className="hover:text-amber-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Target Filter Chip if not 'all' */}
            {searchTarget !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                <span>
                  {isHindi ? 'फ़ील्ड:' : 'Target:'}{' '}
                  {searchTarget === 'customer'
                    ? (isHindi ? 'ग्राहक नाम' : 'Customer')
                    : searchTarget === 'phone'
                    ? (isHindi ? 'मोबाइल नंबर' : 'Phone')
                    : (isHindi ? 'बिल #' : 'Invoice ID')}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchTarget('all')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Status Filter Chip if not ALL */}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                <span>
                  {isHindi ? 'स्थिति:' : 'Status:'}{' '}
                  {statusFilter === 'UNPAID' ? (isHindi ? 'उधारी' : 'Due') : (isHindi ? 'चुकता' : 'Paid')}
                </span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Mode Filter Chip if not ALL */}
            {modeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                <span>
                  {isHindi ? 'मोड:' : 'Mode:'} {modeFilter === 'auto_dealer' ? 'Auto / EV' : 'Retail'}
                </span>
                <button
                  type="button"
                  onClick={() => setModeFilter('ALL')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Date Filter Chip if not all */}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                <span>
                  {isHindi ? 'तारीख:' : 'Date:'}{' '}
                  {dateFilter === 'today'
                    ? (isHindi ? 'आज' : 'Today')
                    : dateFilter === 'week'
                    ? (isHindi ? '7 दिन' : 'Last 7 Days')
                    : dateFilter === 'month'
                    ? (isHindi ? 'इस महीने' : 'This Month')
                    : `${customStartDate || '...'} ~ ${customEndDate || '...'}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-slate-500 hover:text-slate-900 underline font-semibold cursor-pointer"
            >
              {isHindi ? 'सभी फ़िल्टर साफ़ करें' : 'Clear all filters'}
            </button>
          )}
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {sortedInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
              {hasActiveFilters ? <Search className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {hasActiveFilters
                ? isHindi
                  ? 'दिए गए फ़िल्टर के अनुसार कोई इनवॉइस नहीं मिला'
                  : 'No invoices match your search filters'
                : isHindi
                ? 'कोई इनवॉइस नहीं मिला'
                : 'No invoices found'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? isHindi
                  ? activeSearch
                    ? `"${activeSearch}" के लिए कोई परिणाम नहीं मिला। कृपया ग्राहक नाम, 10-अंक का मोबाइल या बिल नंबर जांचें।`
                    : 'फ़िल्टर मापदंडों में कोई बिल उपलब्ध नहीं है।'
                  : activeSearch
                  ? `No bills matched "${activeSearch}". Try checking customer spelling, mobile number digits, or invoice number.`
                  : 'Try adjusting your search criteria, dates, or status filters.'
                : isHindi
                ? 'नया बिल बनाने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                : 'Start creating bills to track all transactions, dues and print documents.'}
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'फ़िल्टर हटाएं व सभी बिल देखें' : 'Clear Search & Show All'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNewInvoice}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                >
                  {isHindi ? '+ नया बिल बनाएं' : '+ Create Invoice'}
                </button>
              )}
            </div>
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
                {sortedInvoices.map((inv) => {
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
                        <HighlightText text={inv.invoiceNo} query={activeSearch} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          <HighlightText text={customerName} query={activeSearch} />
                        </div>
                        {customerPhone && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            <HighlightText text={customerPhone} query={activeSearch} />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        <span className="inline-flex items-center gap-1">
                          {isAuto ? (
                            <Car className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Store className="w-3 h-3 text-sky-500 shrink-0" />
                          )}
                          <span className="truncate">
                            <HighlightText text={titleDesc} query={activeSearch} />
                          </span>
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

      {/* 5. Payment Recording Dialog (Payment Collection) */}
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
