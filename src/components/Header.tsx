import React, { useState } from 'react';
import { AppMode, AppLanguage, SubscriptionState, AppView } from '../types';
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
}) => {
  const isPro = subscription && subscription.tier !== 'free';
  const isHindi = lang === 'hi';
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

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
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {getViewTitle()}
              </h1>
              <span className="hidden lg:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {mode === 'auto_dealer' ? '🚗 Auto Showroom' : '🏪 General Retail'}
              </span>
            </div>
          </div>

          {/* Center: Zoho/Vyapar Universal Search Bar */}
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

          {/* Right section: Quick Action + QR + Lang */}
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

            {/* Quick Create Dropdown Menu (Signature Zoho / Vyapar "+ Create") */}
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
