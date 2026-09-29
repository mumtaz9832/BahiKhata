import React from 'react';
import { AppMode } from '../types';
import {
  Car,
  Store,
  BookOpen,
  Settings,
  PlusCircle,
  FileCheck,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenKhata: () => void;
  onOpenSettings: () => void;
  onNewInvoice: () => void;
  pendingBalanceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onOpenKhata,
  onOpenSettings,
  onNewInvoice,
  pendingBalanceCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-sm shadow-slate-900/10 border border-slate-800">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  AutoBill <span className="text-amber-600 font-bold">&amp; Smart Khata</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  <Zap className="w-3 h-3 text-emerald-600" /> EV &amp; 2W/4W Ready
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 font-medium">
                Billing, Delivery Challan &amp; Khata Ledger for Auto Dealers &amp; Retail
              </p>
            </div>
          </div>

          {/* Mode Selector - Prominent Toggle on Top */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => onModeChange('auto_dealer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === 'auto_dealer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>Auto Dealer</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-normal">
                (2W / 4W / EV)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('general_retail')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === 'general_retail'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-sky-400" />
              <span>Shop &amp; Retail</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewInvoice}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Create new fresh draft"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>New Bill</span>
            </button>

            <button
              type="button"
              onClick={onOpenKhata}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xs:inline">Khata Ledger</span>
              {pendingBalanceCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold bg-amber-600 text-white rounded-full">
                  {pendingBalanceCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Dealership Profile &amp; Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
