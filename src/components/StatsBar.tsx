import React from 'react';
import { SavedInvoice } from '../types';
import { formatINR } from '../utils/numberToWords';
import { FileText, IndianRupee, Clock, CheckCircle2 } from 'lucide-react';

interface StatsBarProps {
  invoices: SavedInvoice[];
  onFilterPendingClick?: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  invoices,
  onFilterPendingClick,
}) => {
  const totalInvoices = invoices.length;

  let totalSales = 0;
  let totalAdvance = 0;
  let totalBalance = 0;
  let pendingCount = 0;

  invoices.forEach((inv) => {
    if (inv.mode === 'auto_dealer' && inv.autoData) {
      const sale = inv.autoData.pricing.totalSaleValue || 0;
      const adv = inv.autoData.pricing.advanceReceived || 0;
      const bal = inv.autoData.pricing.balanceAmount || 0;
      totalSales += sale;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount++;
    } else if (inv.mode === 'general_retail' && inv.retailData) {
      const total = inv.retailData.grandTotal || 0;
      const adv = inv.retailData.advanceReceived || 0;
      const bal = inv.retailData.balanceAmount || 0;
      totalSales += total;
      totalAdvance += adv;
      totalBalance += bal;
      if (bal > 0) pendingCount++;
    }
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 no-print">
      {/* Total Invoices */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Total Invoices</span>
          <FileText className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {totalInvoices}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Across all sales &amp; challans
        </div>
      </div>

      {/* Total Sales Value */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Total Sales Volume</span>
          <IndianRupee className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
          {formatINR(totalSales)}
        </div>
        <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
          Gross deal value
        </div>
      </div>

      {/* Advance Received */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Cash &amp; Tokens Collected</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight truncate">
          {formatINR(totalAdvance)}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Realized revenue
        </div>
      </div>

      {/* Outstanding Balance Due */}
      <div
        onClick={onFilterPendingClick}
        className={`bg-white p-3.5 sm:p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
          totalBalance > 0
            ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
            : 'border-slate-200'
        }`}
        title="Click to view pending Khata balances"
      >
        <div className="flex items-center justify-between text-amber-700 mb-1">
          <span className="text-xs font-medium">Khata Balance Due</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight truncate">
          {formatINR(totalBalance)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-amber-700 font-medium mt-0.5">
          <span>{pendingCount} buyer{pendingCount === 1 ? '' : 's'} pending</span>
          <span className="underline text-[10px]">Open Khata &rarr;</span>
        </div>
      </div>
    </div>
  );
};
