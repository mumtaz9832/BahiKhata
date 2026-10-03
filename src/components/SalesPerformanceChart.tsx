import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SavedInvoice, AppLanguage } from '../types';
import {
  TrendingUp,
  Calendar,
  IndianRupee,
  Receipt,
  Award,
  Layers,
  BarChart2,
  ArrowUpRight,
} from 'lucide-react';

interface SalesPerformanceChartProps {
  invoices: SavedInvoice[];
  lang?: AppLanguage;
  initialYear?: number;
}

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES_HI = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

const MONTH_FULL_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SalesPerformanceChart: React.FC<SalesPerformanceChartProps> = ({
  invoices,
  lang = 'en',
  initialYear,
}) => {
  const isHindi = lang === 'hi';
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentCalendarYear);
  const [chartType, setChartType] = useState<'combo' | 'revenue' | 'volume'>('combo');

  // Available years from invoice data (fallback to current year)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentCalendarYear);
    invoices.forEach((inv) => {
      if (inv.invoiceDate) {
        const yr = parseInt(inv.invoiceDate.slice(0, 4), 10);
        if (!isNaN(yr) && yr > 2000 && yr < 2100) {
          years.add(yr);
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices, currentCalendarYear]);

  // Aggregate monthly data for the selected year
  const monthlyData = useMemo(() => {
    // 12 months array initialized to 0
    const months = Array.from({ length: 12 }, (_, index) => {
      return {
        monthIndex: index,
        monthCode: (index + 1).toString().padStart(2, '0'),
        name: isHindi ? MONTH_NAMES_HI[index] : MONTH_NAMES_EN[index],
        fullName: isHindi ? MONTH_NAMES_HI[index] : MONTH_FULL_EN[index],
        grossSales: 0,
        collections: 0,
        balanceDue: 0,
        invoiceCount: 0,
        averageTicket: 0,
      };
    });

    invoices.forEach((inv) => {
      if (!inv.invoiceDate) return;
      const [yearStr, monthStr] = inv.invoiceDate.split('-');
      const invYear = parseInt(yearStr, 10);
      const invMonthIndex = parseInt(monthStr, 10) - 1;

      if (invYear === selectedYear && invMonthIndex >= 0 && invMonthIndex < 12) {
        let gross = 0;
        let advance = 0;
        let balance = 0;

        if (inv.mode === 'auto_dealer' && inv.autoData) {
          gross = inv.autoData.pricing?.totalSaleValue || 0;
          advance = inv.autoData.pricing?.advanceReceived || 0;
          balance = inv.autoData.pricing?.balanceAmount || 0;
        } else if (inv.retailData) {
          gross = inv.retailData.grandTotal || 0;
          advance = inv.retailData.advanceReceived || 0;
          balance = inv.retailData.balanceAmount || 0;
        }

        months[invMonthIndex].grossSales += gross;
        months[invMonthIndex].collections += advance;
        months[invMonthIndex].balanceDue += balance;
        months[invMonthIndex].invoiceCount += 1;
      }
    });

    // Calculate average ticket
    months.forEach((m) => {
      m.averageTicket = m.invoiceCount > 0 ? Math.round(m.grossSales / m.invoiceCount) : 0;
    });

    return months;
  }, [invoices, selectedYear, isHindi]);

  // Yearly Statistics
  const yearlyStats = useMemo(() => {
    let totalGross = 0;
    let totalCollections = 0;
    let totalDue = 0;
    let totalInvoices = 0;
    let peakMonth = monthlyData[0];

    monthlyData.forEach((m) => {
      totalGross += m.grossSales;
      totalCollections += m.collections;
      totalDue += m.balanceDue;
      totalInvoices += m.invoiceCount;
      if (m.grossSales > peakMonth.grossSales) {
        peakMonth = m;
      }
    });

    const activeMonthsCount = monthlyData.filter((m) => m.invoiceCount > 0).length || 1;
    const avgMonthlySales = Math.round(totalGross / activeMonthsCount);

    return {
      totalGross,
      totalCollections,
      totalDue,
      totalInvoices,
      peakMonth,
      avgMonthlySales,
    };
  }, [monthlyData]);

  // Formatter for Currency
  const formatINR = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-amber-400">
            <span>{dataPoint.fullName} {selectedYear}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {dataPoint.invoiceCount} {isHindi ? 'बिल' : 'bills'}
            </span>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {isHindi ? 'कुल बिक्री (Gross)' : 'Gross Sales'}:
              </span>
              <span className="font-mono font-bold text-white">
                ₹{dataPoint.grossSales.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isHindi ? 'वसूल भुगतान (Paid)' : 'Collected'}:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{dataPoint.collections.toLocaleString('en-IN')}
              </span>
            </div>
            {dataPoint.balanceDue > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  {isHindi ? 'उधार बकाया (Due)' : 'Balance Due'}:
                </span>
                <span className="font-mono font-bold text-rose-400">
                  ₹{dataPoint.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {dataPoint.invoiceCount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>{isHindi ? 'औसत बिल आकार' : 'Avg Bill Value'}:</span>
                <span className="font-mono text-slate-200">
                  ₹{dataPoint.averageTicket.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {isHindi ? 'मासिक बिक्री परफॉर्मेंस व बिज़नेस ग्रोथ' : 'Sales Performance & Monthly Growth'}
            </h3>
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
              {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? `चालू वर्ष ${selectedYear} के लिए महीने-दर-महीने इनवॉइस टर्नओवर और भुगतान वसूली का विश्लेषण`
              : `Visual breakdown of monthly invoice sales, collections, and growth trajectory for ${selectedYear}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('combo')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'combo'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isHindi ? 'ग्रॉस vs वसूली' : 'Sales & Collections'}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('revenue')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'revenue'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'टर्नओवर ट्रेंड' : 'Turnover Trend'}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('volume')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'volume'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बिल संख्या' : 'Bill Volume'}</span>
            </button>
          </div>

          {/* Year Selector */}
          {availableYears.length > 1 && (
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4 Mini Stat Badges for Selected Year */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {isHindi ? `वर्ष ${selectedYear} कुल टर्नओवर` : `${selectedYear} Total Sales`}
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            ₹{yearlyStats.totalGross.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">
            {yearlyStats.totalInvoices} {isHindi ? 'इनवॉइस जारी' : 'bills issued'}
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            {isHindi ? 'प्राप्त कुल भुगतान' : 'Total Collected'}
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-900 mt-0.5">
            ₹{yearlyStats.totalCollections.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {yearlyStats.totalGross > 0
              ? `${Math.round((yearlyStats.totalCollections / yearlyStats.totalGross) * 100)}% realized`
              : '100% realized'}
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            {isHindi ? 'मासिक औसत बिक्री' : 'Avg Monthly Sales'}
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
            ₹{yearlyStats.avgMonthlySales.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-700">
            {isHindi ? 'सक्रिय महीनों के आधार पर' : 'based on active months'}
          </span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
            {isHindi ? 'सर्वोत्तम महीना (Peak Month)' : 'Peak Sales Month'}
          </span>
          <div className="text-lg sm:text-xl font-black text-indigo-950 mt-0.5">
            {yearlyStats.peakMonth.grossSales > 0
              ? yearlyStats.peakMonth.name
              : '—'}
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold">
            {yearlyStats.peakMonth.grossSales > 0
              ? `₹${yearlyStats.peakMonth.grossSales.toLocaleString('en-IN')}`
              : (isHindi ? 'कोई डेटा नहीं' : 'No sales yet')}
          </span>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'combo' ? (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="paidBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatINR}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  if (value === 'grossSales') return isHindi ? 'कुल बिक्री (Gross Sales)' : 'Gross Turnover';
                  if (value === 'collections') return isHindi ? 'वसूल भुगतान (Collections)' : 'Realized Collections';
                  return value;
                }}
              />
              <Bar
                dataKey="grossSales"
                name="grossSales"
                fill="url(#salesBarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="collections"
                name="collections"
                fill="url(#paidBarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          ) : chartType === 'revenue' ? (
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="areaPaidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatINR}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  if (value === 'grossSales') return isHindi ? 'कुल बिक्री ट्रेंड' : 'Turnover Trend';
                  if (value === 'collections') return isHindi ? 'भुगतान ट्रेंड' : 'Collections Trend';
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="grossSales"
                name="grossSales"
                stroke="#d97706"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaSalesGrad)"
              />
              <Area
                type="monotone"
                dataKey="collections"
                name="collections"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaPaidGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="countBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={() => (isHindi ? 'मासिक इनवॉइस बिल संख्या' : 'Monthly Invoices Issued')}
              />
              <Bar
                dataKey="invoiceCount"
                name="invoiceCount"
                fill="url(#countBarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {yearlyStats.totalInvoices === 0
              ? (isHindi
                  ? 'चालू वर्ष में अभी तक कोई इनवॉइस नहीं है। बिल बनाने पर ग्राफ स्वतः अपडेट होगा।'
                  : 'No invoices recorded for this year yet. Create bills to visualize your growth.')
              : (isHindi
                  ? `उच्चतम बिक्री वाला महीना: ${yearlyStats.peakMonth.fullName} (₹${yearlyStats.peakMonth.grossSales.toLocaleString('en-IN')})`
                  : `Top revenue month: ${yearlyStats.peakMonth.fullName} with ₹${yearlyStats.peakMonth.grossSales.toLocaleString('en-IN')} sales`)}
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Recharts &bull; Auto-synced
        </div>
      </div>
    </div>
  );
};
