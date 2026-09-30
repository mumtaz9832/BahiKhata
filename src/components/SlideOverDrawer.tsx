import React from 'react';
import { User } from 'firebase/auth';
import { BusinessProfile, SubscriptionState, AppLanguage, AppMode } from '../types';
import {
  X,
  Home,
  FileText,
  UserPlus,
  PackagePlus,
  Building2,
  Crown,
  Cloud,
  Globe,
  Database,
  Download,
  Upload,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Car,
  Store,
  QrCode,
  Users,
  Package,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  subscription: SubscriptionState;
  lang: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onNavigateHome: () => void;
  onGenerateBill: () => void;
  onOpenCustomerHub: () => void;
  onOpenProductHub: () => void;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onOpenDriveModal: () => void;
  onOpenKhata: () => void;
  onOpenQuickQR: () => void;
  pendingBalanceCount: number;
  user: User | null;
  isAuthLoading: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  subscription,
  lang,
  onLanguageChange,
  mode,
  onModeChange,
  onNavigateHome,
  onGenerateBill,
  onOpenCustomerHub,
  onOpenProductHub,
  onOpenSettings,
  onOpenSubscription,
  onOpenDriveModal,
  onOpenKhata,
  onOpenQuickQR,
  pendingBalanceCount,
  user,
  isAuthLoading,
  onGoogleSignIn,
  onGoogleSignOut,
}) => {
  if (!isOpen) return null;

  const isPro = subscription.tier !== 'free';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                BK
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>BahiKhata Menu</span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">{profile.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs">
            {/* 1. Core Primary Workflows */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Main Actions
              </span>

              {/* Home Dashboard */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateHome();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Home Dashboard</h4>
                    <p className="text-[11px] text-slate-500">Quick action cards &amp; overview</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Generate Bill */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGenerateBill();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-xs flex items-center gap-1.5">
                      <span>Generate Bill</span>
                      <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                        New
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">Tax Invoice, Sale Bill &amp; Delivery Challan</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Add Customer Hub */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerHub();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Customer Hub &amp; Directory</h4>
                    <p className="text-[11px] text-slate-500">Add customers, contact list &amp; Aadhaar/ID</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Add Product Hub */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProductHub();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Product &amp; Vehicle Catalog</h4>
                    <p className="text-[11px] text-slate-500">Stock list, vehicle models, HSN &amp; GST rates</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Digital Khata Ledger */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKhata();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Digital Khata Ledger</span>
                      {pendingBalanceCount > 0 && (
                        <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                          {pendingBalanceCount} Due
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">All bills, payments, WhatsApp &amp; balances</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* 2. Business Mode Switcher */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Business Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onModeChange('auto_dealer')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    mode === 'auto_dealer'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto Dealer</span>
                  </div>
                  <p className="text-[10px] opacity-75 mt-0.5">2W, 4W, EV, Chassis &amp; Challan</p>
                </button>

                <button
                  type="button"
                  onClick={() => onModeChange('general_retail')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    mode === 'general_retail'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Store className="w-3.5 h-3.5 text-sky-400" />
                    <span>General Retail</span>
                  </div>
                  <p className="text-[10px] opacity-75 mt-0.5">Kirana, Shop, GST items &amp; Spares</p>
                </button>
              </div>
            </div>

            {/* 3. Dealership Profile & Settings */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Showroom Configuration &amp; Tools
              </span>

              {/* Business Profile */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Showroom &amp; Shop Profile</h4>
                    <p className="text-[11px] text-slate-500">GSTIN, Bank A/C, UPI VPA &amp; Terms</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Instant UPI QR */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickQR();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Customer Scan-to-Pay QR</h4>
                    <p className="text-[11px] text-slate-500">Dynamic UPI QR code for fast payment collection</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Google Drive Hub */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDriveModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Google Drive Cloud Hub</span>
                      {user && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">Sync PDF invoices &amp; cloud JSON backup</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* 4. Plan & Subscription */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className={`w-4 h-4 ${isPro ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {isPro ? 'Pro Subscription' : 'Starter Free Tier'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPro ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isPro ? 'ACTIVE' : `${subscription.invoiceCountThisMonth}/5 Bills`}
                </span>
              </div>

              <p className="text-slate-300 text-[11px] mb-3 leading-relaxed">
                {isPro
                  ? 'Unlimited invoices, zero watermark, custom showroom logo and priority cloud sync.'
                  : '5 bills/month allowance. Upgrade for unlimited bills, clean receipts and zero watermark.'}
              </p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscription();
                }}
                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span>{isPro ? 'Manage Subscription Plan' : 'Upgrade to Pro (₹299/mo)'}</span>
              </button>
            </div>

            {/* 5. Language Switcher */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>UI &amp; Document Language</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Language</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`py-2 px-3 rounded-lg text-center font-bold border transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">English</div>
                  <div className="text-[10px] opacity-75 font-normal">Default Global</div>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('hi')}
                  className={`py-2 px-3 rounded-lg text-center font-bold border transition-all cursor-pointer ${
                    lang === 'hi'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">हिन्दी (Hindi)</div>
                  <div className="text-[10px] opacity-75 font-normal">भारतीय भाषा</div>
                </button>
              </div>
            </div>

            {/* 6. Google Account Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive Sync</span>
                </span>
                {user ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Not Connected</span>
                )}
              </div>

              {user ? (
                <div className="flex items-center justify-between pt-1">
                  <div className="truncate mr-2">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {user.displayName || 'Google User'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Sign Out from Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connect Google Drive</span>
                </button>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">BahiKhata Platform</span> &bull; Production v3.0
          </div>
        </div>
      </div>
    </div>
  );
};
