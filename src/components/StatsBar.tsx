import React from 'react';
import { SavedInvoice, SubscriptionState } from '../types';
import { formatINR } from '../utils/numberToWords';
import { FileText, IndianRupee, Clock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

interface StatsBarProps {
  invoices: SavedInvoice[];
  subscription?: SubscriptionState;
  onFilterPendingClick?: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  invoices,
  subscription,
  onFilterPendingClick,
}) => {
  const totalInvoices = invoices.length;

  let totalSales = 0;
  let totalAdvance = 0;
  let totalBalance = 0;
  let pendingCount = 0;

  invoices.forEach((inv) => {
    if (inv.mode === 'auto_dealer' && inv.autoData) {
      const sale = inv.autoData?.pricing?.totalSaleValue || 0;
      const adv = inv.autoData?.pricing?.advanceReceived || 0;
      const bal = inv.autoData?.pricing?.balanceAmount || 0;
      totalSales += sale;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount++;
    } else if (inv.mode === 'general_retail' && inv.retailData) {
      const total = inv.retailData?.grandTotal || 0;
      const adv = inv.retailData?.advanceReceived || 0;
      const bal = inv.retailData?.balanceAmount || 0;
      totalSales += total;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount++;
    }
  });

  const monthCount = subscription?.invoiceCountThisMonth ?? totalInvoices;
  const isPro = subscription?.tier !== 'free';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 no-print">
      {/* 1. Total Sales Volume */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Sales
          </span>
          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono truncate">
          {formatINR(totalSales)}
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          Gross deal value booked
        </div>
      </div>

      {/* 2. Outstanding Udhar Due */}
      <div
        onClick={onFilterPendingClick}
        className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
          totalBalance > 0
            ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400 hover:bg-amber-50'
            : 'bg-white border-slate-200/90'
        }`}
        title="Click to view pending Khata balances"
      >
        <div className="flex items-center justify-between text-amber-800 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Outstanding Udhar
          </span>
          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight font-mono truncate">
          {formatINR(totalBalance)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold mt-1">
          <span>{pendingCount} buyer{pendingCount === 1 ? '' : 's'} pending</span>
          <span className="underline hover:text-amber-950">View List &rarr;</span>
        </div>
      </div>

      {/* 3. Cash & Advances Realized */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cash / Tokens Collected
          </span>
          <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight font-mono truncate">
          {formatINR(totalAdvance)}
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          Realized revenue in hand
        </div>
      </div>

      {/* 4. Invoices Generated */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Invoices This Month
          </span>
          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {monthCount}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {isPro ? '/ Unlimited' : '/ 5 Free'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          {isPro ? 'Pro plan active (zero cap)' : `${Math.max(0, 5 - monthCount)} free bills remaining`}
        </div>
      </div>
    </div>
  );
};
