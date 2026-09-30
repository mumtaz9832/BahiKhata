import React, { useState } from 'react';
import {
  BusinessProfile,
  SavedInvoice,
  SubscriptionState,
  AppMode,
  AppLanguage,
  CustomerRecord,
  ProductRecord,
  PaymentMode,
} from '../types';
import {
  FileText,
  UserPlus,
  PackagePlus,
  ArrowRight,
  Printer,
  MessageCircle,
  Eye,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Crown,
  ChevronRight,
  Store,
  Car,
  QrCode,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { openWhatsAppCustomerReminder } from '../utils/whatsapp';

interface HomePageProps {
  profile: BusinessProfile;
  invoices: SavedInvoice[];
  subscription: SubscriptionState;
  mode: AppMode;
  lang: AppLanguage;
  customers: CustomerRecord[];
  products: ProductRecord[];
  onGenerateBill: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
  onOpenQuickQR: () => void;
  onOpenKhata: () => void;
  onNavigateToSales: () => void;
  onNavigateToParties: () => void;
  onNavigateToItems: () => void;
  onSelectInvoiceToView: (invoice: SavedInvoice) => void;
  onPrintInvoice: (invoice: SavedInvoice) => void;
  onWhatsAppInvoice: (invoice: SavedInvoice) => void;
  onRecordPayment: (invoiceId: string, amount: number, mode: PaymentMode, note: string) => void;
  onClearAllData?: () => void;
  onSwitchMode: (mode: AppMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  invoices,
  subscription,
  mode,
  lang,
  customers,
  products,
  onGenerateBill,
  onAddCustomer,
  onAddProduct,
  onOpenQuickQR,
  onOpenKhata,
  onNavigateToSales,
  onNavigateToParties,
  onNavigateToItems,
  onSelectInvoiceToView,
  onPrintInvoice,
  onWhatsAppInvoice,
  onRecordPayment,
  onClearAllData,
  onSwitchMode,
}) => {
  const isHindi = lang === 'hi';
  const isPro = subscription && subscription.tier !== 'free';

  const [transactionTab, setTransactionTab] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<SavedInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Financial calculations
  let totalGross = 0;
  let totalAdvance = 0;
  let totalBalance = 0;
  let pendingCount = 0;

  invoices.forEach((inv) => {
    if (inv.mode === 'auto_dealer' && inv.autoData) {
      const sale = inv.autoData.pricing.totalSaleValue || 0;
      const adv = inv.autoData.pricing.advanceReceived || 0;
      const bal = inv.autoData.pricing.balanceAmount || 0;
      totalGross += sale;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount += 1;
    } else if (inv.retailData) {
      const total = inv.retailData.grandTotal || 0;
      const adv = inv.retailData.advanceReceived || 0;
      const bal = inv.retailData.balanceAmount || 0;
      totalGross += total;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount += 1;
    }
  });

  // Total inventory stock value
  const totalStockValuation = products.reduce((sum, p) => sum + (p.rate || 0) * (p.stockQty || 0), 0);
  const lowStockProducts = products.filter((p) => (p.stockQty || 0) <= 2);

  // Top Debtors with balance due
  const debtorsInvoices = invoices.filter((inv) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    return bal > 0;
  });

  // Filtered recent invoices
  const filteredRecentInvoices = invoices.filter((inv) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    if (transactionTab === 'UNPAID') return bal > 0;
    if (transactionTab === 'PAID') return bal <= 0;
    return true;
  }).slice(0, 6);

  const handleOpenPayment = (inv: SavedInvoice) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    setActivePaymentInvoice(inv);
    setPaymentAmount(bal);
  };

  const handleSavePayment = () => {
    if (!activePaymentInvoice || paymentAmount <= 0) return;
    onRecordPayment(activePaymentInvoice.id, paymentAmount, 'UPI / QR', 'Settlement from Dashboard');
    setActivePaymentInvoice(null);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* 1. Welcoming Business Banner (Zoho / Vyapar Header) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                {mode === 'auto_dealer'
                  ? (isHindi ? '🚗 ऑटो डीलरशिप मोड (2W/4W/EV)' : '🚗 Auto Dealership Mode (2W/4W/EV)')
                  : (isHindi ? '🏪 जनरल रिटेल मोड' : '🏪 General Retail Mode')}
              </span>
              {isPro ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  <Crown className="w-3 h-3 text-amber-400" /> Pro Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                  Starter ({subscription.invoiceCountThisMonth}/5 Bills)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {profile.name || (isHindi ? 'व्यापार एवं जोहो बुक्स सूट' : 'Vyapar & Zoho Books Dealership')}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
              {profile.tagline ||
                'Vyapar & Zoho Books Accounting: GST Invoicing, Delivery Challans, Customer Khata & Inventory'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              {invoices.length === 0 && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {isHindi ? 'डैशबोर्ड साफ है • कोई फर्जी डेटा नहीं' : 'Clean Dashboard • No False Data'}
                </span>
              )}
              {profile.gstin && (
                <span className="bg-slate-800/90 px-2 py-0.5 rounded font-mono text-[11px] text-slate-300 border border-slate-700">
                  GSTIN: {profile.gstin}
                </span>
              )}
              {profile.city && (
                <span>📍 {profile.city}{profile.state ? `, ${profile.state}` : ''}</span>
              )}
              {profile.phone && <span>📞 {profile.phone}</span>}
            </div>
          </div>

          {/* Quick Payment QR & Clean Dashboard Buttons */}
          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {onClearAllData && (
              <button
                type="button"
                onClick={onClearAllData}
                className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold rounded-xl border border-rose-400/40 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-2xs text-xs"
                title={isHindi ? 'सभी फर्जी डेटा और पुरानी तारीखें साफ करें' : 'Delete all false/mock data and clean dashboard'}
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{isHindi ? 'डैशबोर्ड साफ करें' : 'Clean Dashboard'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenQuickQR}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-2xs text-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{isHindi ? 'पेमेंट QR कोड' : 'Payment QR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE 3 CORE PRIMARY ACTION CARDS (Clean & Prominent as explicitly requested) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {isHindi ? 'त्वरित प्राथमिक कार्य' : 'Primary Quick Actions'}
            </h2>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'नया बिल बनाएं, ग्राहक जोड़ें या सामान/गाड़ी कैटलॉग में शामिल करें'
                : '1-click billing, customer ledger registration, and stock catalog'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* Action 1: GENERATE BILL */}
          <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <FileText className="w-6.5 h-6.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {isHindi ? 'त्वरित बिल' : 'Fast Billing'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  {isHindi ? 'बिल बनाएं (Generate Bill)' : 'Generate Bill'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'टैक्स इनवॉइस, सेल बिल या वाहन डिलीवरी चालान तैयार करें (A4 प्रिंट व QR कोड सहित)'
                    : 'Create GST Tax Invoice, Sale Bill or Vehicle Delivery Challan with live receipt preview & A4 printing.'}
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">🖨️ A4 Print</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">📄 PDF Export</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">📱 UPI QR</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onGenerateBill}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-2xs group-hover:shadow-md cursor-pointer"
              >
                <span>{isHindi ? 'बिल बनाएं' : 'Generate Bill Now'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Action 2: ADD CUSTOMER */}
          <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-emerald-500/80 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <UserPlus className="w-6.5 h-6.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {isHindi ? 'खाता लेजर' : 'Khata Linked'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {isHindi ? 'ग्राहक जोड़ें (Add Customer)' : 'Add Customer'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'ग्राहक का नाम, फोन, आधार/पैन, जीएसटी और उधारी-जमा खाता बही में दर्ज करें'
                    : 'Register party contact, Aadhaar/PAN identity, address, and outstanding credit account.'}
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">👥 Contact Book</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">📒 Khata Ledger</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">💬 WhatsApp</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onAddCustomer}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-2xs group-hover:shadow-md cursor-pointer"
              >
                <span>{isHindi ? 'नया ग्राहक जोड़ें' : 'Add New Customer'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Action 3: ADD PRODUCT */}
          <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-sky-500/80 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <PackagePlus className="w-6.5 h-6.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  {isHindi ? 'स्टॉक कैटलॉग' : 'Stock & Catalog'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                  {isHindi ? 'सामान जोड़ें (Add Product)' : 'Add Product'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'गाड़ियों (2W/EV/4W), स्पेयर पार्ट्स या रिटेल सामान को HSN, रेट और जीएसटी के साथ जोड़ें'
                    : 'Add vehicle models (2W / EV / 4W) or retail products with HSN codes, rates, and GST slabs.'}
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="bg-slate-100 px-2 py-0.5 rounded">📦 Inventory</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">🏷️ HSN &amp; GST</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">⚡ EV / 2W Models</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onAddProduct}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-2xs group-hover:shadow-md cursor-pointer"
              >
                <span>{isHindi ? 'नया सामान / गाड़ी जोड़ें' : 'Add Product / Vehicle'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Vypaar / Zoho Financial Pulse KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Sales */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>{isHindi ? 'कुल बिक्री' : 'Total Sales'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ₹{totalGross.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{invoices.length} {isHindi ? 'बिल' : 'Bills generated'}</span>
            <button
              type="button"
              onClick={onNavigateToSales}
              className="text-amber-600 hover:underline font-bold cursor-pointer inline-flex items-center"
            >
              <span>{isHindi ? 'देखें' : 'View'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* You'll Receive (Lena Hai) */}
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
            <span>{isHindi ? 'आपको लेना है (Lena Hai)' : "You'll Receive (Due)"}</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800">
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
            <span>{pendingCount} {isHindi ? 'ग्राहकों पर बकाया' : 'pending dues'}</span>
            <button
              type="button"
              onClick={onOpenKhata}
              className="text-amber-800 font-bold hover:underline cursor-pointer inline-flex items-center"
            >
              <span>{isHindi ? 'खाता खोलें' : 'Khata'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Collected Payment */}
        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <span>{isHindi ? 'प्राप्त रोकड़ / बैंक' : 'Received Payments'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800">
            ₹{totalAdvance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center justify-between">
            <span>{isHindi ? 'चुकता भुगतान' : 'Realized collections'}</span>
            <span className="font-bold">
              {totalGross > 0 ? Math.round((totalAdvance / totalGross) * 100) : 100}%
            </span>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4.5 rounded-2xl border border-sky-200/80 bg-sky-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sky-700 mb-1">
            <span>{isHindi ? 'स्टॉक मूल्य' : 'Stock Valuation'}</span>
            <Store className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-900">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-sky-700 mt-1 flex items-center justify-between">
            <span>{products.length} {isHindi ? 'उत्पाद स्टॉक' : 'items catalog'}</span>
            <button
              type="button"
              onClick={onNavigateToItems}
              className="text-sky-700 hover:underline font-bold cursor-pointer inline-flex items-center"
            >
              <span>{isHindi ? 'इन्वेंट्री' : 'Items'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transactions Ledger (Zoho Books / Vyapar Sale Book Feed) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isHindi ? 'हालिया लेनदेन व इनवॉइस (Recent Invoices)' : 'Recent Transactions & Invoices'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isHindi ? 'बिक्री बिल, चालान और भुगतान स्थिति' : 'Real-time billing transactions feed'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setTransactionTab('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  transactionTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isHindi ? 'सभी' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setTransactionTab('UNPAID')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  transactionTab === 'UNPAID' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isHindi ? 'उधारी (Due)' : 'Pending'}
              </button>
              <button
                type="button"
                onClick={() => setTransactionTab('PAID')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  transactionTab === 'PAID' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isHindi ? 'चुकता' : 'Paid'}
              </button>
            </div>

            <button
              type="button"
              onClick={onNavigateToSales}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isHindi ? 'सभी देखें' : 'View All'} ({invoices.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredRecentInvoices.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs">
                {isHindi ? 'डैशबोर्ड साफ है • अभी कोई बिल नहीं बना है' : 'Clean Dashboard • No Bills Generated Yet'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isHindi
                  ? 'पहला टैक्स इनवॉइस या चालान बनाने के लिए ऊपर दिए गए "बिल बनाएं" बटन पर क्लिक करें।'
                  : 'Click "Generate Bill Now" above to create your first tax invoice or delivery agreement.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {filteredRecentInvoices.map((inv) => {
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
                ? `${inv.autoData?.vehicle.make || ''} ${inv.autoData?.vehicle.model || ''}`
                : `${inv.retailData?.items.length || 0} items`;

              return (
                <div
                  key={inv.id}
                  className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{customerName}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {inv.invoiceNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          balance === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {balance === 0 ? (isHindi ? 'चुकता' : 'PAID') : `DUE ₹${balance.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {titleDesc} &bull; {inv.invoiceDate} {customerPhone && `&bull; ${customerPhone}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="font-black text-slate-900 text-sm mr-2">
                      ₹{total.toLocaleString('en-IN')}
                    </span>

                    {/* Quick Pay */}
                    {balance > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(inv)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer text-[11px]"
                      >
                        {isHindi ? 'पेमेंट' : 'Pay'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectInvoiceToView(inv)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Open & view document in editor"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrintInvoice(inv)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Direct print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onWhatsAppInvoice(inv)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Send WhatsApp reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Zoho / Vyapar Side-by-side Widgets (Parties Due & Low Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget 1: Parties to Collect From */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHindi ? 'उधारी वाले ग्राहक (Top Receivables)' : 'Parties to Collect From'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isHindi ? 'तकादा भेजें और खाता चुकता करें' : 'Outstanding balances awaiting payment'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToParties}
              className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
            >
              {isHindi ? 'पार्टी खाता देखें' : 'View Parties'} &rarr;
            </button>
          </div>

          {debtorsInvoices.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <span>{isHindi ? 'शानदार! कोई उधारी बकाया नहीं है' : 'Great! No outstanding balances'}</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {debtorsInvoices.slice(0, 4).map((inv) => {
                const isAuto = inv.mode === 'auto_dealer';
                const name = isAuto ? inv.autoData?.buyer.fullName : inv.retailData?.customer.fullName;
                const phone = isAuto ? inv.autoData?.buyer.phone : inv.retailData?.customer.phone;
                const balance = isAuto
                  ? inv.autoData?.pricing?.balanceAmount || 0
                  : inv.retailData?.balanceAmount || 0;

                return (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {phone} &bull; Inv #{inv.invoiceNo}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-700 text-sm">
                        ₹{balance.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => openWhatsAppCustomerReminder(inv)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Widget 2: Low Stock & Catalog Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHindi ? 'कम स्टॉक व इन्वेंट्री अलर्ट' : 'Stock & Inventory Watch'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isHindi ? 'रीस्टॉक करने योग्य आइटम' : 'Items needing restocking or attention'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToItems}
              className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
            >
              {isHindi ? 'स्टॉक देखें' : 'View Stock'} &rarr;
            </button>
          </div>

          {products.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <PackagePlus className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <span>{isHindi ? 'कैटलॉग में कोई सामान नहीं है' : 'No items in catalog yet'}</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {products.slice(0, 4).map((p) => {
                const isLow = (p.stockQty || 0) <= 2;
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.category} &bull; HSN: {p.hsn}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        ₹{p.rate.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stockQty || 0} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Payment Settlement Dialog */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="text-base font-black text-slate-900 mb-1">
              {isHindi ? 'भुगतान दर्ज करें' : 'Record Payment'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Invoice #{activePaymentInvoice.invoiceNo}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isHindi ? 'प्राप्त राशि (₹)' : 'Received Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  {isHindi ? 'दर्ज करें' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
