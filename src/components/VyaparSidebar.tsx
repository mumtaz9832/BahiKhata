import React from 'react';
import { User } from 'firebase/auth';
import {
  AppView,
  AppMode,
  AppLanguage,
  BusinessProfile,
  SubscriptionState,
} from '../types';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  BookOpen,
  BarChart3,
  FilePlus,
  QrCode,
  Settings,
  Cloud,
  Crown,
  Car,
  Store,
  Globe,
  ChevronRight,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface VyaparSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  profile: BusinessProfile;
  subscription: SubscriptionState;
  pendingBalanceCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenQuickQR: () => void;
  onOpenSettings: () => void;
  onOpenDriveModal: () => void;
  onOpenSubscription: () => void;
  onNewInvoice: () => void;
  onClearAllData?: () => void;
  lang: AppLanguage;
  onToggleLang: () => void;
}

export const VyaparSidebar: React.FC<VyaparSidebarProps> = ({
  currentView,
  onNavigate,
  mode,
  onModeChange,
  profile,
  subscription,
  pendingBalanceCount,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickQR,
  onOpenSettings,
  onOpenDriveModal,
  onOpenSubscription,
  onNewInvoice,
  onClearAllData,
  lang,
  onToggleLang,
}) => {
  const isPro = subscription && subscription.tier !== 'free';
  const isHindi = lang === 'hi';

  const navItems = [
    {
      id: 'home' as AppView,
      label: isHindi ? 'डैशबोर्ड' : 'Dashboard',
      sub: isHindi ? 'व्यापार सार' : 'Business Pulse',
      icon: LayoutDashboard,
    },
    {
      id: 'sales' as AppView,
      label: isHindi ? 'बिक्री / इनवॉइस' : 'Sale Invoices',
      sub: isHindi ? 'टैक्स बिल व चालान' : 'Tax Bills & Challans',
      icon: Receipt,
    },
    {
      id: 'parties' as AppView,
      label: isHindi ? 'पार्टी / ग्राहक' : 'Parties & Khata',
      sub: isHindi ? 'उधार-जमा ग्राहक' : 'Customer Ledger',
      icon: Users,
      badge: pendingBalanceCount > 0 ? pendingBalanceCount : undefined,
    },
    {
      id: 'items' as AppView,
      label: isHindi ? 'सामान व स्टॉक' : 'Items & Stock',
      sub: isHindi ? 'इन्वेंट्री कैटलॉग' : 'Inventory Catalog',
      icon: Package,
    },
    {
      id: 'reports' as AppView,
      label: isHindi ? 'रिपोर्ट्स व जीएसटी' : 'Reports & GST',
      sub: isHindi ? 'GSTR-1 व डे बुक' : 'GSTR-1 & Day Book',
      icon: BarChart3,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* 1. App Brand & Business Identity Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            onNavigate('home');
            onCloseMobile();
          }}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md group-hover:scale-105 transition-transform">
            <span>VP</span>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-base tracking-tight truncate max-w-[140px]">
                {profile.name || 'BahiKhata'}
              </span>
            </div>
            <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
              {isHindi ? 'व्यापार व जोहो बुक्स एडिशन' : 'Vyapar & Zoho Edition'}
            </p>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Business Mode Selector Switcher */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
          <span>{isHindi ? 'बिजनेस मोड' : 'Business Mode'}</span>
          <span className="text-[9px] font-mono text-slate-500">
            {mode === 'auto_dealer' ? '2W/4W/EV' : 'Retail'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800/90 rounded-xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => onModeChange('auto_dealer')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'auto_dealer'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span className="truncate">Auto / EV</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('general_retail')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'general_retail'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span className="truncate">Retail</span>
          </button>
        </div>
      </div>

      {/* 3. Hero Quick Action: + New Bill / Fast Billing */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            onNewInvoice();
            onNavigate('generate_bill');
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-all active:scale-[0.98]"
        >
          <FilePlus className="w-4 h-4" />
          <span>{isHindi ? '+ नया बिल बनाएं' : '+ Create New Bill'}</span>
        </button>
      </div>

      {/* 4. Primary Zoho / Vyapar Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
          {isHindi ? 'मुख्य मेनू' : 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                isActive
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
                  }`}
                />
                <div>
                  <div className="font-bold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.sub}</div>
                </div>
              </div>

              {item.badge ? (
                <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Quick Tools Divider */}
        <div className="pt-3 pb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            {isHindi ? 'क्विक टूल्स' : 'Quick Tools'}
          </div>
        </div>

        {/* Quick UPI QR Code */}
        <button
          type="button"
          onClick={() => {
            onOpenQuickQR();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold text-slate-200">{isHindi ? 'पेमेंट QR कोड' : 'Payment UPI QR'}</div>
              <div className="text-[10px] text-slate-500">{isHindi ? 'तुरंत स्कैन व भुगतान' : 'Scan & Pay'}</div>
            </div>
          </div>
        </button>

        {/* Google Drive / Cloud Sync */}
        <button
          type="button"
          onClick={() => {
            onOpenDriveModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <Cloud className="w-4 h-4 text-sky-400" />
            <div>
              <div className="font-semibold text-slate-200">{isHindi ? 'क्लाउड बैकअप' : 'Cloud Sync & Drive'}</div>
              <div className="text-[10px] text-slate-500">{isHindi ? 'डेटा सुरक्षित रखें' : 'Auto Backup'}</div>
            </div>
          </div>
        </button>

        {/* Business Profile & Settings */}
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <div>
              <div className="font-semibold text-slate-200">{isHindi ? 'सेटिंग्स व जीएसटी' : 'Settings & GSTIN'}</div>
              <div className="text-[10px] text-slate-500">{isHindi ? 'कंपनी प्रोफाइल, बैंक' : 'Company & Bank Details'}</div>
            </div>
          </div>
        </button>

        {/* Clean Dashboard & Reset Data */}
        {onClearAllData && (
          <button
            type="button"
            onClick={() => {
              onClearAllData();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-rose-300/80 hover:bg-rose-950/40 hover:text-rose-200 transition-all cursor-pointer text-left"
            title="Clean all data and reset dashboard"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <div>
                <div className="font-semibold">{isHindi ? 'डेटा साफ करें' : 'Clean Dashboard Data'}</div>
                <div className="text-[10px] text-rose-400/60">{isHindi ? 'सभी झूठा/डेमो डेटा हटाएं' : 'Delete all mock/false data'}</div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 5. Footer: Plan Upgrade & Language Switch */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {/* Subscription pill */}
        <button
          type="button"
          onClick={() => {
            onOpenSubscription();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>{isPro ? 'Pro Showroom' : 'Vyapar Starter'}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {isPro ? 'Unlimited Invoices' : `${subscription.invoiceCountThisMonth}/5 Bills used`}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            {isPro ? 'ACTIVE' : 'UPGRADE'}
          </span>
        </button>

        {/* Language switcher */}
        <button
          type="button"
          onClick={onToggleLang}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
        >
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{isHindi ? 'भाषा: हिन्दी' : 'Language: English'}</span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 uppercase">
            {isHindi ? 'English' : 'हिन्दी'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Zoho / Vyapar Layout) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 shadow-xl border-r border-slate-800 no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive Overlay) */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
