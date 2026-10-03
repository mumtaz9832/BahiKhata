import React from 'react';
import {
  FileText,
  Building2,
  BookOpen,
  Cloud,
  ArrowRight,
  UserPlus,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { BahiKhataLogo } from './BahiKhataLogo';

interface WelcomeScreenProps {
  isOpen: boolean;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onContinueAsGuest?: () => void;
  lang?: 'en' | 'hi';
  onToggleLang?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isOpen,
  onOpenLogin,
  onOpenRegister,
  onContinueAsGuest,
  lang = 'en',
  onToggleLang,
}) => {
  if (!isOpen) return null;

  const isHindi = lang === 'hi';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white selection:bg-amber-400 selection:text-slate-950 no-print animate-in fade-in duration-300">
      <div className="min-h-full flex flex-col justify-between relative">
        {/* Background Decorative Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-rose-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Top Bar with Language Switcher */}
        <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <BahiKhataLogo variant="icon" size="sm" />
            </div>
            <div className="flex items-center tracking-tight font-black text-lg sm:text-xl">
              <span className="text-white">Bahi</span>
              <span className="text-rose-500">Khata</span>
            </div>
          </div>

          {onToggleLang && (
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs min-h-[36px] touch-manipulation"
              title="Toggle Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'English' : 'हिंदी'}</span>
            </button>
          )}
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto flex flex-col items-center text-center">
          {/* Logo Shield */}
          <div className="mb-6 relative">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 shadow-2xl relative z-10">
              <BahiKhataLogo variant="icon" size="lg" />
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-amber-400/20 blur-xl -z-10" />
          </div>

          {/* Branding & Typography */}
          <div className="flex items-center justify-center tracking-tight font-black text-4xl sm:text-5xl lg:text-6xl mb-3">
            <span className="text-white">Bahi</span>
            <span className="text-rose-500">Khata</span>
          </div>

          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold mb-4 tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? 'स्मार्ट बिलिंग। सरल व्यापार।' : 'Smart Billing. Simple Business.'}</span>
          </div>

          {/* Welcome Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 font-medium max-w-xl mb-8 leading-relaxed">
            {isHindi
              ? 'अपने व्यापार को आसानी से प्रबंधित करें। बिलिंग, डिजिटल खाता, इन्वेंटरी और ग्राहक प्रबंधन एक ही स्थान पर।'
              : 'Manage your business with ease. Complete GST & Non-GST billing, digital khata, multi-industry catalog, and cloud ledger.'}
          </p>

          {/* Prominent Action Buttons */}
          <div className="w-full max-w-md flex flex-col sm:flex-row gap-3.5 sm:gap-4 mb-10">
            {/* Login Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex-1 py-3.5 px-6 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm sm:text-base rounded-2xl border border-slate-700/80 hover:border-amber-400/50 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 min-h-[48px] touch-manipulation"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>{isHindi ? 'खाता लॉगिन' : 'Login'}</span>
            </button>

            {/* Create New Account Button */}
            <button
              type="button"
              onClick={onOpenRegister}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 min-h-[48px] touch-manipulation"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span>{isHindi ? 'नया खाता बनाएं' : 'Create New Account'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950 ml-0.5" />
            </button>
          </div>

          {/* 4 Feature Badges / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-3xl text-left">
            <div className="p-3 sm:p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">GST &amp; Non-GST</div>
                <div className="text-[10px] text-slate-400">Fast A4 &amp; POS Billing</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">26 Industries</div>
                <div className="text-[10px] text-slate-400">Pre-Built Catalogs</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-400/10 text-sky-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Digital Khata</div>
                <div className="text-[10px] text-slate-400">Customer Ledgers</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-400/10 text-rose-400 shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Cloud Backup</div>
                <div className="text-[10px] text-slate-400">Google Drive &amp; Sync</div>
              </div>
            </div>
          </div>

          {/* Optional Guest Access Link */}
          {onContinueAsGuest && (
            <div className="mt-8">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 underline cursor-pointer transition-colors min-h-[36px] touch-manipulation"
              >
                {isHindi ? 'या पहले एक डेमो के रूप में देखें (Guest Mode)' : 'Or explore BahiKhata in Demo / Guest Mode'}
              </button>
            </div>
          )}
        </main>

        {/* Footer Note */}
        <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHindi ? '100% सुरक्षित और स्थानीय डेटा सुरक्षा' : '100% Secure & Local Hybrid Offline Storage'}</span>
          </div>
          <div className="text-slate-600 text-[11px]">
            &copy; {new Date().getFullYear()} BahiKhata &bull; All Rights Reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};
