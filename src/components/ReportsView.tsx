import React, { useState } from 'react';
import { SavedInvoice, BusinessProfile, AppLanguage } from '../types';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Receipt,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { SalesPerformanceChart } from './SalesPerformanceChart';

interface ReportsViewProps {
  invoices: SavedInvoice[];
  profile: BusinessProfile;
  lang: AppLanguage;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  profile,
  lang,
}) => {
  const isHindi = lang === 'hi';
  const [selectedRange, setSelectedRange] = useState<'ALL' | 'THIS_MONTH' | 'TODAY'>('ALL');

  // Filter invoices by range
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-09"

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedRange === 'TODAY') {
      return inv.invoiceDate === todayStr;
    }
    if (selectedRange === 'THIS_MONTH') {
      return inv.invoiceDate && inv.invoiceDate.startsWith(currentMonthStr);
    }
    return true;
  });

  // Calculate Tax breakdown & payment modes
  let totalGross = 0;
  let totalAdvance = 0;
  let totalDue = 0;
  let totalTaxableValue = 0;
  let totalGstCollected = 0;

  const paymentModeBreakdown: Record<string, number> = {
    'UPI / QR': 0,
    Cash: 0,
    'Bank Transfer (NEFT/IMPS)': 0,
    Cheque: 0,
    'Finance / Loan': 0,
  };

  filteredInvoices.forEach((inv) => {
    if (inv.mode === 'auto_dealer' && inv.autoData) {
      const gross = inv.autoData.pricing.totalSaleValue || 0;
      const adv = inv.autoData.pricing.advanceReceived || 0;
      const bal = inv.autoData.pricing.balanceAmount || 0;
      totalGross += gross;
      totalAdvance += adv;
      totalDue += bal;

      // Estimate taxable value & GST: average 18% GST embedded or applied
      const estimatedBase = gross / 1.18;
      const estimatedTax = gross - estimatedBase;
      totalTaxableValue += estimatedBase;
      totalGstCollected += estimatedTax;

      const pMode = inv.autoData.pricing.paymentMode || 'UPI / QR';
      paymentModeBreakdown[pMode] = (paymentModeBreakdown[pMode] || 0) + adv;
    } else if (inv.retailData) {
      const gross = inv.retailData.grandTotal || 0;
      const adv = inv.retailData.advanceReceived || 0;
      const bal = inv.retailData.balanceAmount || 0;
      const gst = inv.retailData.totalGst || 0;
      const subtotal = inv.retailData.subtotal || gross - gst;

      totalGross += gross;
      totalAdvance += adv;
      totalDue += bal;
      totalTaxableValue += subtotal;
      totalGstCollected += gst;

      const pMode = inv.retailData.paymentMode || 'UPI / QR';
      paymentModeBreakdown[pMode] = (paymentModeBreakdown[pMode] || 0) + adv;
    }
  });

  const cgst = totalGstCollected / 2;
  const sgst = totalGstCollected / 2;

  const handleExportGSTR1 = () => {
    const headers = ['Metric', 'Amount (INR)'];
    const rows = [
      ['Business Name', `"${profile.name}"`],
      ['GSTIN', `"${profile.gstin || 'Unregistered'}"`],
      ['Total Gross Turnover', totalGross],
      ['Total Taxable Value', Math.round(totalTaxableValue)],
      ['CGST (Central GST)', Math.round(cgst)],
      ['SGST (State GST)', Math.round(sgst)],
      ['Total Tax Liability', Math.round(totalGstCollected)],
      ['Total Collected Amount', totalAdvance],
      ['Total Pending Dues', totalDue],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR1_Summary_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isHindi ? 'व्यापार रिपोर्ट्स व जीएसटी विवरण' : 'Business Reports & GST Filing'}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              GSTR-1 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? 'बिक्री का मासिक सार, सीजीएसटी / एसजीएसटी टैक्स गणना, और भुगतान माध्यम ब्रेकडाउन'
              : 'GSTR-1 tax audit summary, CGST/SGST liabilities, payment collection channels, and day book'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportGSTR1}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isHindi ? 'GSTR-1 CSV' : 'Export GSTR-1'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isHindi ? 'रिपोर्ट प्रिंट करें' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between no-print">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setSelectedRange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRange === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'सभी समय' : 'All Time'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRange === 'THIS_MONTH' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'इस महीने' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange('TODAY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRange === 'TODAY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'आज का दिन' : 'Today'}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {filteredInvoices.length} {isHindi ? 'इनवॉइस शामिल' : 'invoices evaluated'}
        </div>
      </div>

      {/* 3. Visual Sales Performance & Growth Chart (Recharts) */}
      <SalesPerformanceChart invoices={invoices} lang={lang} />

      {/* 4. GSTR-1 Tax Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isHindi ? 'GSTR-1 सेल्स टैक्स ऑडिट' : 'GSTR-1 Sales Tax Summary'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              GSTIN: {profile.gstin || 'Not registered'} &bull; State: {profile.state || 'Maharashtra'}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
            {isHindi ? 'सत्यापित' : 'Audit Ready'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isHindi ? 'कुल टर्नओवर (Gross)' : 'Gross Turnover'}
            </span>
            <span className="text-xl font-black text-slate-900">
              ₹{totalGross.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {isHindi ? 'कर योग्य मूल्य (Taxable)' : 'Taxable Value'}
            </span>
            <span className="text-xl font-black text-slate-900">
              ₹{Math.round(totalTaxableValue).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">
              CGST + SGST (50:50)
            </span>
            <span className="text-xl font-black text-indigo-900">
              ₹{Math.round(cgst).toLocaleString('en-IN')} / ₹{Math.round(sgst).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">
              {isHindi ? 'कुल जीएसटी देयता' : 'Total GST Liability'}
            </span>
            <span className="text-xl font-black text-amber-900">
              ₹{Math.round(totalGstCollected).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Payment Modes Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              {isHindi ? 'भुगतान माध्यम अनुसार वसूली' : 'Collections by Payment Mode'}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Total: ₹{totalAdvance.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(paymentModeBreakdown).map(([modeName, amount]) => {
              const pct = totalAdvance > 0 ? Math.round((amount / totalAdvance) * 100) : 0;
              return (
                <div key={modeName} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{modeName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{amount.toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        modeName === 'UPI / QR'
                          ? 'bg-emerald-500'
                          : modeName === 'Cash'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Book / Today's Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              {isHindi ? 'डे बुक (दैनिक बहीखाता)' : 'Day Book & Settlement Activity'}
            </h3>
            <span className="text-[11px] text-slate-400">{todayStr}</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Calendar className="w-5 h-5 text-slate-300 mx-auto mb-1" />
              <div className="font-semibold text-slate-600">
                {isHindi ? 'कोई लेन-देन दर्ज नहीं है' : 'No transactions recorded'}
              </div>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'नया बिल बनाने पर डे बुक यहाँ दिखेगा' : 'Day book settlements will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.slice(0, 5).map((inv) => {
                const isAuto = inv.mode === 'auto_dealer';
                const name = isAuto ? inv.autoData?.buyer.fullName : inv.retailData?.customer.fullName;
                const total = isAuto ? inv.autoData?.pricing?.totalSaleValue : inv.retailData?.grandTotal;
                const adv = isAuto ? inv.autoData?.pricing?.advanceReceived : inv.retailData?.advanceReceived;
                return (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.invoiceNo} &bull; {inv.invoiceDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">₹{total?.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Recv: ₹{adv?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
