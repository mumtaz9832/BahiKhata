import React, { useState } from 'react';
import { AppView, AppLanguage } from '../types';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  Menu,
  Plus,
  X,
  FileText,
  UserPlus,
  PackagePlus,
  CreditCard,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onNewBill: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
  onRecordPayment: () => void;
  onOpenMore: () => void;
  pendingKhataCount?: number;
  lang?: AppLanguage;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onNewBill,
  onAddCustomer,
  onAddProduct,
  onRecordPayment,
  onOpenMore,
  pendingKhataCount = 0,
  lang = 'en',
}) => {
  const isHindi = lang === 'hi';
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  return (
    <>
      {/* 1. Floating "+" Quick Action Bottom Sheet */}
      {isActionMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end no-print">
          {/* Backdrop */}
          <div
            onClick={() => setIsActionMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          />

          {/* Action Sheet */}
          <div className="relative z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="font-black text-slate-900 text-sm">
                  {isHindi ? 'त्वरित कार्रवाई (Quick Actions)' : 'Quick Create & Actions'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsActionMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Action 1: New Bill */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onNewBill();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-950 text-xs">
                    {isHindi ? 'नया बिल' : 'New Bill'}
                  </div>
                  <div className="text-[10px] text-amber-800">
                    {isHindi ? 'टैक्स बिल / चालान' : 'Invoice & Challan'}
                  </div>
                </div>
              </button>

              {/* Action 2: Add Customer */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onAddCustomer();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-950 text-xs">
                    {isHindi ? 'ग्राहक जोड़ें' : 'Customer'}
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    {isHindi ? 'खाता पार्टी लेजर' : 'Add Party / Khata'}
                  </div>
                </div>
              </button>

              {/* Action 3: Add Product */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onAddProduct();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-950 text-xs">
                    {isHindi ? 'सामान जोड़ें' : 'Add Product'}
                  </div>
                  <div className="text-[10px] text-sky-800">
                    {isHindi ? 'गाड़ी / इन्वेंट्री' : 'Vehicle / Item Stock'}
                  </div>
                </div>
              </button>

              {/* Action 4: Record Payment */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onRecordPayment();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-950 text-xs">
                    {isHindi ? 'पेमेंट दर्ज करें' : 'Payment'}
                  </div>
                  <div className="text-[10px] text-indigo-800">
                    {isHindi ? 'उधार वसूली व रसीद' : 'Record Due Recovery'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 no-print safe-area-bottom">
        <div className="flex items-center justify-around relative">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'text-amber-600 font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </button>

          {/* Tab 2: Bills */}
          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'sales' || currentView === 'generate_bill'
                ? 'text-amber-600 font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isHindi ? 'बिल' : 'Bills'}</span>
          </button>

          {/* Floating Center Primary "+" Action Button */}
          <div className="relative -mt-6">
            <button
              type="button"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                isActionMenuOpen
                  ? 'bg-slate-900 text-white rotate-45'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
              }`}
              title="Quick Create & Record Actions"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3: Khata */}
          <button
            type="button"
            onClick={() => onNavigate('parties')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              currentView === 'parties'
                ? 'text-amber-600 font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isHindi ? 'खाता' : 'Khata'}</span>
            {pendingKhataCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Tab 4: Stock */}
          <button
            type="button"
            onClick={() => onNavigate('items')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'items'
                ? 'text-amber-600 font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isHindi ? 'स्टॉक' : 'Stock'}</span>
          </button>

          {/* Tab 5: More Drawer */}
          <button
            type="button"
            onClick={onOpenMore}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isHindi ? 'अन्य' : 'More'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
