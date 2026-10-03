import React, { useState } from 'react';
import { AppMode, AppLanguage, SubscriptionState, AppView, BusinessProfile } from '../types';
import { User } from 'firebase/auth';
import { BahiKhataLogo } from './BahiKhataLogo';
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
  syncStatus?: 'synced' | 'offline';
  profile?: BusinessProfile;
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
}) => {
  const isPro = subscription && subscription.tier !== 'free';
  const isHindi = lang === 'hi';
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        return 'BahiKhata';
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
                <BahiKhataLogo variant="icon" size="sm" />
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

          {/* Center: Universal Search Bar */}
          {onSearchChange && (
            <div className="hidden sm:flex flex-1 max-w-md mx-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'बिल #, ग्राहक नाम, फोन, गाड़ी या सामान खोजें...'
                      : 'Search bills, customer name, phone, item...'
                  }
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Right section: Quick Action + QR + Lang + User Account */}
          <div className="flex items-center gap-2">
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
                    <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cloud Synced
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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
