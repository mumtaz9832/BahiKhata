import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppMode, AppLanguage, SubscriptionState, AppView, BusinessProfile, SavedInvoice } from '../types';
import { User } from 'firebase/auth';
import { BizcoreLogo } from './BizcoreLogo';
import {
  Car,
  Store,
  Menu,
  Crown,
  ArrowLeft,
  Search,
  Plus,
  QrCode,
  Globe,
  FileText,
  UserPlus,
  PackagePlus,
  CreditCard,
  ChevronDown,
  LogOut,
  Cloud,
  Database,
  X,
  User as UserIcon,
  Phone,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  Clock,
  Hash,
} from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenKhata: () => void;
  onNewInvoice: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
  onOpenQuickQR: () => void;
  onOpenBackupModal?: () => void;
  onToggleSidebarMobile: () => void;
  pendingBalanceCount: number;
  subscription?: SubscriptionState;
  lang?: AppLanguage;
  onToggleLang?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'pending' | 'error';
  profile?: BusinessProfile;
  invoices?: SavedInvoice[];
  onSelectInvoiceToView?: (invoice: SavedInvoice) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  currentView,
  onNavigate,
  onOpenKhata,
  onNewInvoice,
  onAddCustomer,
  onAddProduct,
  onOpenQuickQR,
  onOpenBackupModal,
  onToggleSidebarMobile,
  pendingBalanceCount,
  subscription,
  lang = 'en',
  onToggleLang,
  searchQuery = '',
  onSearchChange,
  user,
  onOpenAuthModal,
  onSignOut,
  syncStatus = 'offline',
  profile,
  invoices = [],
  onSelectInvoiceToView,
}) => {
  const isPro = subscription && subscription.tier !== 'free';
  const isHindi = lang === 'hi';
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search preview dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Text highlight component
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

  // Real-time matching invoices based on customer name, mobile number, or invoice number
  const matchingInvoices = useMemo(() => {
    if (!invoices || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');

    return invoices.filter((inv) => {
      const isAuto = inv.mode === 'auto_dealer';
      const customerName = isAuto
        ? (inv.autoData?.buyer.fullName || '').toLowerCase()
        : (inv.retailData?.customer.fullName || '').toLowerCase();
      const phone = isAuto
        ? (inv.autoData?.buyer.phone || '')
        : (inv.retailData?.customer.phone || '');
      const altPhone = isAuto ? (inv.autoData?.buyer.altPhone || '') : '';
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanAltPhone = altPhone.replace(/\D/g, '');
      const invNo = (inv.invoiceNo || '').toLowerCase();
      const invId = (inv.id || '').toLowerCase();

      // 1. Customer Name Match
      if (customerName.includes(q)) return true;

      // 2. Mobile Number Match (Exact or normalized digits)
      if (phone.toLowerCase().includes(q) || altPhone.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 2 && (cleanPhone.includes(qDigits) || cleanAltPhone.includes(qDigits))) return true;

      // 3. Invoice Number Match
      if (invNo.includes(q) || invId.includes(q)) return true;
      if (invNo.replace(/[^a-z0-9]/g, '').includes(q.replace(/[^a-z0-9]/g, ''))) return true;

      return false;
    });
  }, [invoices, searchQuery]);

  // Handler for global search query changes
  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
      // Auto-switch to SalesView so user sees the list updating in real-time
      if (val.trim() && currentView !== 'sales') {
        onNavigate('sales');
      }
    }
  };

  // View title translation
  const getViewTitle = () => {
    switch (currentView) {
      case 'home':
        return isHindi ? 'व्यापार डैशबोर्ड' : 'Dashboard';
      case 'sales':
        return isHindi ? 'बिक्री व इनवॉइस' : 'Sales Invoices';
      case 'parties':
        return isHindi ? 'पार्टी व ग्राहक खाता' : 'Parties & Khata';
      case 'items':
        return isHindi ? 'सामान व इन्वेंट्री' : 'Items & Stock';
      case 'reports':
        return isHindi ? 'रिपोर्ट्स व जीएसटी' : 'Reports & GST';
      case 'generate_bill':
        return isHindi ? 'बिल व चालान जनरेटर' : 'Invoice & Challan Generator';
      default:
        return 'BIZCORE';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-2xs no-print">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-3">
          {/* Left section: Hamburger button + View Title / Back button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={onToggleSidebarMobile}
              className="md:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back button if in Bill Generator */}
            {currentView === 'generate_bill' ? (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHindi ? 'डैशबोर्ड पर लौटें' : 'Back to Dashboard'}</span>
                <span className="sm:hidden">{isHindi ? 'पीछे' : 'Back'}</span>
              </button>
            ) : null}

            {/* Title / Breadcrumb */}
            <div className="flex items-center gap-2.5">
              <div className="md:hidden shrink-0">
                <BizcoreLogo variant="icon" size="sm" />
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {getViewTitle()}
              </h1>
              {profile?.industryCategory ? (
                <span className="hidden lg:inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs">
                  🏢 {profile.industryCategory}
                </span>
              ) : null}
            </div>
          </div>

          {/* Center: Global Real-Time Search Bar for Invoices */}
          {onSearchChange && (
            <div ref={searchContainerRef} className="relative hidden sm:flex flex-1 max-w-md lg:max-w-lg mx-2 lg:mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleQueryChange('');
                      setIsSearchFocused(false);
                    } else if (e.key === 'Enter') {
                      onNavigate('sales');
                      setIsSearchFocused(false);
                    }
                  }}
                  placeholder={
                    isHindi
                      ? 'बिल #, ग्राहक नाम या 10-अंकीय फोन से खोजें...'
                      : 'Search by customer name, mobile #, or invoice #...'
                  }
                  className="w-full pl-9 pr-16 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all font-medium shadow-2xs"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery ? (
                    <>
                      {invoices && invoices.length > 0 && (
                        <span className="hidden md:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          {matchingInvoices.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          handleQueryChange('');
                          setIsSearchFocused(false);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={isHindi ? 'सर्च हटाएं' : 'Clear search'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                      /
                    </kbd>
                  )}
                </div>
              </div>

              {/* Real-Time Dropdown Results Preview */}
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {isHindi
                          ? `${matchingInvoices.length} बिल मिले`
                          : `${matchingInvoices.length} matching invoices`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('sales');
                        setIsSearchFocused(false);
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isHindi ? 'बिक्री रजिस्टर में देखें' : 'View in Sales Register'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {matchingInvoices.length > 0 ? (
                      matchingInvoices.slice(0, 6).map((inv) => {
                        const isAuto = inv.mode === 'auto_dealer';
                        const custName = isAuto
                          ? inv.autoData?.buyer.fullName || 'Unknown Customer'
                          : inv.retailData?.customer.fullName || 'Walk-in Customer';
                        const phone = isAuto
                          ? inv.autoData?.buyer.phone || ''
                          : inv.retailData?.customer.phone || '';
                        const total = isAuto
                          ? inv.autoData?.pricing?.netPayableAmount || inv.autoData?.pricing?.totalSaleValue || 0
                          : inv.retailData?.grandTotal || 0;
                        const balance = isAuto
                          ? inv.autoData?.pricing?.balanceAmount || 0
                          : inv.retailData?.balanceAmount || 0;

                        return (
                          <div
                            key={inv.id}
                            onClick={() => {
                              if (onSelectInvoiceToView) {
                                onSelectInvoiceToView(inv);
                              } else {
                                onNavigate('sales');
                              }
                              setIsSearchFocused(false);
                            }}
                            className="p-3 hover:bg-amber-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 group-hover:text-amber-900 bg-slate-100 group-hover:bg-amber-100/70 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                  <HighlightText text={inv.invoiceNo || inv.id} query={searchQuery} />
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {inv.invoiceDate}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-slate-700 font-medium">
                                <span className="truncate max-w-[150px] sm:max-w-[180px]">
                                  <HighlightText text={custName} query={searchQuery} />
                                </span>
                                {phone && (
                                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <HighlightText text={phone} query={searchQuery} />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-bold text-slate-900 text-xs">
                                {formatCurrency(total)}
                              </div>
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                                  balance > 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {balance > 0
                                  ? (isHindi ? `बाकी: ${formatCurrency(balance)}` : `Due: ${formatCurrency(balance)}`)
                                  : (isHindi ? 'चुकता' : 'Paid')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">
                          {isHindi ? 'कोई मेल खाता बिल नहीं मिला' : 'No matching invoices found'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isHindi
                            ? `"${searchQuery}" के लिए ग्राहक नाम, फोन या बिल # पुनः जांचें।`
                            : `Check the customer name, phone number, or invoice ID for "${searchQuery}".`}
                        </p>
                      </div>
                    )}
                  </div>

                  {matchingInvoices.length > 6 && (
                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('sales');
                          setIsSearchFocused(false);
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                      >
                        {isHindi
                          ? `और ${matchingInvoices.length - 6} बिल देखने के लिए क्लिक करें →`
                          : `View remaining ${matchingInvoices.length - 6} invoices in Sales Register →`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right section: Quick Action + QR + Lang + User Account */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle button */}
            {onSearchChange && (
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className={`sm:hidden p-2 rounded-xl transition-colors cursor-pointer relative ${
                  isMobileSearchOpen || searchQuery
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Search Invoices"
              >
                <Search className="w-4 h-4" />
                {searchQuery && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </button>
            )}
            {/* Quick UPI QR code shortcut */}
            <button
              type="button"
              onClick={onOpenQuickQR}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Show payment QR code"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>UPI QR</span>
            </button>

            {/* Quick Manual Backup shortcut */}
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title={isHindi ? 'स्थानीय JSON बैकअप व रिस्टोर' : 'Manual JSON Backup & Restore'}
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isHindi ? 'डेटा बैकअप' : 'Backup'}</span>
              </button>
            )}

            {/* Language toggle button */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{isHindi ? 'ENG' : 'हिन्दी'}</span>
              </button>
            )}

            {/* User Account / Cloud Sync Area */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 pl-2 sm:pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-6 h-6 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-bold text-[11px] flex items-center justify-center">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-800 leading-tight max-w-[90px] truncate">
                      {user.displayName || 'User'}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold leading-tight">
                      {syncStatus === 'synced' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-600">Cloud Synced</span>
                        </>
                      )}
                      {syncStatus === 'syncing' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                          <span className="text-sky-600">Syncing...</span>
                        </>
                      )}
                      {syncStatus === 'pending' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-amber-700">Pending Sync</span>
                        </>
                      )}
                      {syncStatus === 'offline' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="text-slate-500">Offline</span>
                        </>
                      )}
                      {syncStatus === 'error' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="text-rose-600">Sync Error</span>
                        </>
                      )}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-3">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-10 h-10 rounded-full border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center">
                            {user.displayName ? user.displayName[0] : 'U'}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 truncate">
                            {user.displayName || 'Google User'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ● Cloud Synced
                          </div>
                        </div>
                      </div>

                      {onOpenBackupModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenBackupModal();
                          }}
                          className="w-full flex items-center gap-2 py-2 px-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isHindi ? 'डेटा बैकअप व रिस्टोर' : 'Backup & Restore Data'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onSignOut) onSignOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'साइन आउट' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
                title="Login or register with Google"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-3.5 h-3.5 shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="hidden sm:inline">{isHindi ? 'लॉगिन / रजिस्टर' : 'Login / Register'}</span>
                <span className="sm:hidden">{isHindi ? 'लॉगिन' : 'Login'}</span>
              </button>
            )}

            {/* Quick Create Dropdown Menu ("+ Create") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHindi ? '+ नया जोड़ें' : '+ Create'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCreateMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCreateMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCreateMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isHindi ? 'त्वरित कार्रवाई' : 'Quick Actions'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        onNewInvoice();
                        onNavigate('generate_bill');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition-colors font-medium cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-bold">{isHindi ? 'नया बिल बनाएं' : 'New Sale Bill / Invoice'}</div>
                        <div className="text-[10px] text-slate-400">{isHindi ? 'टैक्स बिल या चालान' : 'Tax invoice or challan'}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        onAddCustomer();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors font-medium cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-bold">{isHindi ? 'नया ग्राहक जोड़ें' : 'Add New Customer'}</div>
                        <div className="text-[10px] text-slate-400">{isHindi ? 'पार्टी संपर्क व खाता' : 'Contact & credit khata'}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        onAddProduct();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors font-medium cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4 text-sky-500" />
                      <div>
                        <div className="font-bold">{isHindi ? 'नया सामान / गाड़ी जोड़ें' : 'Add Item / Vehicle'}</div>
                        <div className="text-[10px] text-slate-400">{isHindi ? 'इन्वेंट्री कैटलॉग' : 'Stock catalog & HSN'}</div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        onOpenKhata();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-800 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="font-bold">{isHindi ? 'खाता / पेमेंट दर्ज करें' : 'Record Payment / Khata'}</div>
                        <div className="text-[10px] text-slate-400">{isHindi ? 'उधार वसूली व रसीद' : 'Collect dues & receipt'}</div>
                      </div>
                    </button>

                    {onOpenBackupModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenBackupModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 transition-colors font-medium cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-bold">{isHindi ? 'डेटा बैकअप व रिस्टोर' : 'Backup & Restore Data'}</div>
                          <div className="text-[10px] text-slate-400">{isHindi ? 'ऑफ़लाइन JSON बैकअप' : 'Offline local storage JSON'}</div>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {onSearchChange && isMobileSearchOpen && (
          <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-100 animate-in slide-in-from-top-2 duration-150 bg-white">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={
                  isHindi
                    ? 'ग्राहक नाम, मोबाइल # या बिल संख्या...'
                    : 'Customer name, mobile #, or invoice #...'
                }
                className="w-full pl-9 pr-9 py-2 bg-slate-50 focus:bg-white text-xs border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>
                  {isHindi
                    ? `${matchingInvoices.length} बिल मिले`
                    : `${matchingInvoices.length} invoices found`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('sales');
                    setIsMobileSearchOpen(false);
                  }}
                  className="text-amber-700 font-bold hover:underline"
                >
                  {isHindi ? 'बिक्री सूची देखें →' : 'View in Sales →'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
