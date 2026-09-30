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
  Trash2,
  LogOut,
  CreditCard,
  FileText,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { BahiKhataLogo } from './BahiKhataLogo';

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
  onOpenKhata: () => void;
  onNewInvoice: () => void;
  onClearAllData?: () => void;
  lang: AppLanguage;
  onToggleLang: () => void;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  syncStatus?: 'synced' | 'offline';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onOpenKhata,
  onNewInvoice,
  onClearAllData,
  lang,
  onToggleLang,
  user,
  onOpenAuthModal,
  onSignOut,
  syncStatus = 'offline',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const isPro = subscription && subscription.tier !== 'free';
  const isHindi = lang === 'hi';

  const navItems = [
    {
      id: 'home' as AppView,
      label: isHindi ? 'डैशबोर्ड' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'sales' as AppView,
      label: isHindi ? 'बिलिंग व इनवॉइस' : 'Billing',
      icon: Receipt,
    },
    {
      id: 'parties' as AppView,
      label: isHindi ? 'ग्राहक संपर्क' : 'Customers',
      icon: Users,
    },
    {
      id: 'khata' as const,
      label: isHindi ? 'डिजिटल खाता' : 'Digital Khata',
      icon: BookOpen,
      badge: pendingBalanceCount > 0 ? pendingBalanceCount : undefined,
      action: onOpenKhata,
    },
    {
      id: 'items' as AppView,
      label: isHindi ? 'सामान व उत्पाद' : 'Products',
      icon: Package,
    },
    {
      id: 'inventory' as const,
      label: isHindi ? 'स्टॉक इन्वेंट्री' : 'Inventory',
      icon: Store,
      action: () => onNavigate('items'),
    },
    {
      id: 'payments' as const,
      label: isHindi ? 'पेमेंट वसूली' : 'Payments',
      icon: CreditCard,
      action: onOpenKhata,
    },
    {
      id: 'reports' as AppView,
      label: isHindi ? 'रिपोर्ट्स व जीएसटी' : 'Reports',
      icon: BarChart3,
    },
    {
      id: 'documents' as const,
      label: isHindi ? 'दस्तावेज व चालान' : 'Documents',
      icon: FileText,
      action: () => onNavigate('sales'),
    },
    {
      id: 'drive' as const,
      label: isHindi ? 'गूगल ड्राइव' : 'Google Drive',
      icon: Cloud,
      action: onOpenDriveModal,
    },
    {
      id: 'settings' as const,
      label: isHindi ? 'सेटिंग्स व प्रोफाइल' : 'Settings',
      icon: Settings,
      action: onOpenSettings,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* 1. App Brand & Logo Header */}
      <div className={`border-b border-slate-800 flex items-center justify-between transition-all ${isCollapsed ? 'p-3' : 'p-4'}`}>
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => {
              onNavigate('home');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer overflow-hidden"
          >
            <BahiKhataLogo variant="icon" size="sm" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="font-black text-white text-base tracking-tight truncate max-w-[130px]">
                  BahiKhata
                </span>
              </div>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase truncate">
                {isHindi ? 'स्मार्ट बिलिंग एवं खाता' : 'Smart Billing & Khata'}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="mx-auto cursor-pointer"
            title="BahiKhata"
          >
            <BahiKhataLogo variant="icon" size="sm" />
          </button>
        )}

        {/* Desktop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

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
      {!isCollapsed ? (
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
              <span>{isHindi ? 'डीलरशिप' : 'Auto 2W'}</span>
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
              <span>{isHindi ? 'जनरल' : 'Retail'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={() => onModeChange(mode === 'auto_dealer' ? 'general_retail' : 'auto_dealer')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
            title={`Switch to ${mode === 'auto_dealer' ? 'Retail' : 'Auto Showroom'}`}
          >
            {mode === 'auto_dealer' ? <Car className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* 3. Primary "+ New Bill" Action Button */}
      <div className={isCollapsed ? 'p-2' : 'p-3'}>
        <button
          type="button"
          onClick={() => {
            onNewInvoice();
            onNavigate('generate_bill');
            onCloseMobile();
          }}
          className={`w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
            isCollapsed ? 'px-0' : 'px-3'
          }`}
          title={isHindi ? 'नया बिल बनाएं' : 'Create New Bill'}
        >
          <FilePlus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{isHindi ? '+ नया बिल बनाएं' : '+ Create New Bill'}</span>}
        </button>
      </div>

      {/* 4. Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {!isCollapsed && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            {isHindi ? 'मुख्य मेनू' : 'Main Menu'}
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const handleClick = () => {
            if (item.action) {
              item.action();
            } else if (item.id === 'home' || item.id === 'sales' || item.id === 'parties' || item.id === 'items' || item.id === 'reports') {
              onNavigate(item.id as AppView);
            }
            onCloseMobile();
          };

          return (
            <button
              key={item.id}
              type="button"
              onClick={handleClick}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={item.label}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
                  }`}
                />
                {!isCollapsed && <span className="font-bold leading-tight truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                item.badge ? (
                  <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-500 text-slate-950">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                )
              )}
            </button>
          );
        })}

        {/* Clear Data Reset Option */}
        {onClearAllData && !isCollapsed && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClearAllData();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400/80 hover:bg-rose-950/40 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{isHindi ? 'डेटा साफ करें' : 'Clean Dashboard Data'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. User Account & Cloud Sync Status */}
      <div className={`border-t border-slate-800 bg-slate-950/80 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {user ? (
          <div className={`flex items-center rounded-xl bg-slate-900 border border-slate-800 ${isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'}`}>
            <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'justify-center' : 'mr-2'}`}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                  {user.displayName ? user.displayName[0] : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isHindi ? 'क्लाउड सिंक' : 'Cloud Synced'}</span>
                  </div>
                </div>
              )}
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onCloseMobile();
                }}
                className={`p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 ${isCollapsed ? 'hidden' : ''}`}
                title={isHindi ? 'साइन आउट' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div>
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>{isHindi ? 'लॉगिन / रजिस्टर' : 'Login / Register'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  onCloseMobile();
                }}
                className="w-full p-2 flex justify-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer"
                title="Login / Register"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Footer Language Toggle */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
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
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30 shadow-xl border-r border-slate-800 transition-all duration-200 no-print ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive Overlay) */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
