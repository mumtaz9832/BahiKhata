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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SavedInvoice, ProductRecord, AppLanguage } from '../types';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Layers,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';

interface HomeSalesSummaryChartProps {
  invoices: SavedInvoice[];
  products: ProductRecord[];
  lang?: AppLanguage;
  onNavigateToReports?: () => void;
  onNavigateToSales?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'two_wheeler': '#f59e0b', // Amber
  'four_wheeler': '#3b82f6', // Blue
  'electric_vehicle': '#10b981', // Emerald
  'commercial': '#8b5cf6', // Violet
  'spare_parts': '#ec4899', // Pink
  'goods': '#06b6d4', // Cyan
  'service': '#f97316', // Orange
  'other': '#64748b', // Slate
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  'two_wheeler': 'Two-Wheeler (2W)',
  'four_wheeler': 'Four-Wheeler (4W)',
  'electric_vehicle': 'Electric Vehicle (EV)',
  'commercial': 'Commercial Auto',
  'spare_parts': 'Spare Parts & Tyres',
  'goods': 'Retail Goods & Stock',
  'service': 'Service & Repairs',
  'other': 'General / Other',
};

const CATEGORY_LABELS_HI: Record<string, string> = {
  'two_wheeler': 'दुपहिया वाहन (2W)',
  'four_wheeler': 'चार पहिया वाहन (4W)',
  'electric_vehicle': 'इलेक्ट्रिक व्हीकल (EV)',
  'commercial': 'कमर्शियल वाहन',
  'spare_parts': 'स्पेयर पार्ट्स व टायर',
  'goods': 'सामान व इन्वेंट्री',
  'service': 'सर्विस व मरम्मत',
  'other': 'अन्य',
};

interface MonthlyBucket {
  key: string;
  monthName: string;
  year: number;
  grossSales: number;
  collections: number;
  invoiceCount: number;
}

export const HomeSalesSummaryChart: React.FC<HomeSalesSummaryChartProps> = ({
  invoices,
  products,
  lang = 'en',
  onNavigateToReports,
  onNavigateToSales,
}) => {
  const isHindi = lang === 'hi';
  const [activeTab, setActiveTab] = useState<'monthly' | 'categories'>('monthly');

  // Month names
  const monthNames = useMemo(() => {
    return isHindi
      ? ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }, [isHindi]);

  // Aggregate Last 6 Months Performance
  const monthlyData = useMemo(() => {
    const today = new Date();
    const result: MonthlyBucket[] = [];

    // Calculate last 6 rolling calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthKey = `${year}-${(monthIdx + 1).toString().padStart(2, '0')}`;
      const label = `${monthNames[monthIdx]} '${year.toString().slice(-2)}`;

      result.push({
        key: monthKey,
        monthName: label,
        year,
        grossSales: 0,
        collections: 0,
        invoiceCount: 0,
      });
    }

    // Populate with actual invoice data
    invoices.forEach((inv) => {
      if (!inv.invoiceDate) return;
      const invMonthKey = inv.invoiceDate.slice(0, 7); // "YYYY-MM"
      const bucket = result.find((item) => item.key === invMonthKey);

      if (bucket) {
        let gross = 0;
        let advance = 0;

        if (inv.mode === 'auto_dealer' && inv.autoData) {
          gross = inv.autoData.pricing?.totalSaleValue || 0;
          advance = inv.autoData.pricing?.advanceReceived || 0;
        } else if (inv.retailData) {
          gross = inv.retailData.grandTotal || 0;
          advance = inv.retailData.advanceReceived || 0;
        }

        bucket.grossSales += gross;
        bucket.collections += advance;
        bucket.invoiceCount += 1;
      }
    });

    return result;
  }, [invoices, monthNames]);

  // Aggregate Category Breakdown from Invoices & Products
  const categoryData = useMemo(() => {
    const totals: Record<string, { revenue: number; count: number }> = {
      two_wheeler: { revenue: 0, count: 0 },
      four_wheeler: { revenue: 0, count: 0 },
      electric_vehicle: { revenue: 0, count: 0 },
      commercial: { revenue: 0, count: 0 },
      spare_parts: { revenue: 0, count: 0 },
      goods: { revenue: 0, count: 0 },
      service: { revenue: 0, count: 0 },
    };

    // Product lookup map for retail items
    const productCategoryMap = new Map<string, string>();
    products.forEach((p) => {
      productCategoryMap.set(p.name.toLowerCase().trim(), p.category);
    });

    invoices.forEach((inv) => {
      if (inv.mode === 'auto_dealer' && inv.autoData) {
        const vType = inv.autoData.vehicle?.vehicleType || 'two_wheeler';
        const saleVal = inv.autoData.pricing?.totalSaleValue || 0;
        if (!totals[vType]) {
          totals[vType] = { revenue: 0, count: 0 };
        }
        totals[vType].revenue += saleVal;
        totals[vType].count += 1;
      } else if (inv.retailData) {
        const items = inv.retailData.items || [];
        if (items.length === 0) {
          totals['goods'].revenue += inv.retailData.grandTotal || 0;
          totals['goods'].count += 1;
        } else {
          items.forEach((item) => {
            const desc = (item.description || '').toLowerCase().trim();
            const matchedCategory =
              productCategoryMap.get(desc) ||
              (desc.includes('service') || desc.includes('repair') || desc.includes('labor') || desc.includes('wash')
                ? 'service'
                : desc.includes('part') || desc.includes('tyre') || desc.includes('battery') || desc.includes('oil') || desc.includes('filter')
                ? 'spare_parts'
                : 'goods');

            if (!totals[matchedCategory]) {
              totals[matchedCategory] = { revenue: 0, count: 0 };
            }
            totals[matchedCategory].revenue += item.amount || 0;
            totals[matchedCategory].count += item.qty || 1;
          });
        }
      }
    });

    const totalCategoryRevenue = Object.values(totals).reduce((sum, item) => sum + item.revenue, 0);

    const result = Object.entries(totals)
      .map(([catKey, data]) => {
        const label = isHindi ? CATEGORY_LABELS_HI[catKey] || catKey : CATEGORY_LABELS_EN[catKey] || catKey;
        const color = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
        const share = totalCategoryRevenue > 0 ? Math.round((data.revenue / totalCategoryRevenue) * 100) : 0;
        return {
          key: catKey,
          name: label,
          revenue: data.revenue,
          count: data.count,
          share,
          color,
        };
      })
      .filter((item) => item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return {
      items: result,
      totalRevenue: totalCategoryRevenue,
      topCategory: result[0] || null,
    };
  }, [invoices, products, isHindi]);

  // Overall summary metrics
  const summaryMetrics = useMemo(() => {
    let recentGross = 0;
    let recentCollections = 0;
    let maxMonth = monthlyData[0];

    monthlyData.forEach((m) => {
      recentGross += m.grossSales;
      recentCollections += m.collections;
      if (m.grossSales > maxMonth.grossSales) {
        maxMonth = m;
      }
    });

    return {
      recentGross,
      recentCollections,
      maxMonth,
    };
  }, [monthlyData]);

  // Currency Formatter
  const formatINR = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Custom Monthly Tooltip
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[170px]">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex justify-between">
            <span>{dataPoint.monthName}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataPoint.invoiceCount} {isHindi ? 'बिल' : 'bills'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 pt-1">
            <span>{isHindi ? 'बिक्री (Gross)' : 'Gross Sales'}:</span>
            <span className="font-mono font-bold text-white">₹{dataPoint.grossSales.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isHindi ? 'वसूल रोकड़' : 'Collected'}:</span>
            <span className="font-mono font-bold text-emerald-400">₹{dataPoint.collections.toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Category Tooltip
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[170px]">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1">
            {data.name}
          </div>
          <div className="flex justify-between items-center text-slate-300 pt-1">
            <span>{isHindi ? 'राजस्व (Sales)' : 'Revenue'}:</span>
            <span className="font-mono font-bold text-white">₹{data.revenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{isHindi ? 'मार्केट शेयर' : 'Sales Share'}:</span>
            <span className="font-mono font-bold text-amber-400">{data.share}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      {/* Chart Top Header & Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
              {activeTab === 'monthly' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <PieIcon className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>
                  {activeTab === 'monthly'
                    ? (isHindi ? 'मासिक बिक्री परफॉर्मेंस' : 'Monthly Sales Performance')
                    : (isHindi ? 'शीर्ष उत्पाद व वाहन श्रेणियां' : 'Top Product & Vehicle Categories')}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                  Recharts
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'monthly'
                  ? (isHindi
                      ? 'पिछले 6 महीनों की कुल बिक्री और भुगतान वसूली का लाइव विश्लेषण'
                      : 'Live visual breakdown of monthly revenue & collections over the last 6 months')
                  : (isHindi
                      ? 'श्रेणी अनुसार कुल व्यापार और राजस्व में हिस्सेदारी (Revenue Share)'
                      : 'Sales revenue distribution by vehicle and product category')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isHindi ? 'मासिक ट्रेंड' : 'Monthly Sales'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>{isHindi ? 'श्रेणी विवरण' : 'Top Categories'}</span>
            </button>
          </div>

          {onNavigateToReports && (
            <button
              type="button"
              onClick={onNavigateToReports}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Full GSTR-1 & Sales Reports"
            >
              <span>{isHindi ? 'विस्तृत रिपोर्ट' : 'Full Reports'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isHindi ? '6 माह कुल बिक्री' : '6-Month Turnover'}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
            ₹{summaryMetrics.recentGross.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
            {isHindi ? 'कुल वसूली (Realized)' : 'Collected Payments'}
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-950 mt-0.5 block">
            ₹{summaryMetrics.recentCollections.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            {isHindi ? 'सर्वोत्तम महीना (Peak)' : 'Peak Sales Month'}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-950 mt-0.5 block truncate">
            {summaryMetrics.maxMonth.grossSales > 0 ? summaryMetrics.maxMonth.monthName : '—'}
          </span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-indigo-800 block">
            {isHindi ? 'शीर्ष श्रेणी (Top Segment)' : 'Top Sales Category'}
          </span>
          <span className="text-base sm:text-lg font-black text-indigo-950 mt-0.5 block truncate">
            {categoryData.topCategory ? categoryData.topCategory.name : (isHindi ? 'उपलब्ध नहीं' : 'N/A')}
          </span>
        </div>
      </div>

      {/* Chart Visualizer */}
      {activeTab === 'monthly' ? (
        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="homeSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="homePaidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="monthName"
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
              <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  if (value === 'grossSales') return isHindi ? 'कुल बिक्री (Gross Sales)' : 'Gross Sales';
                  if (value === 'collections') return isHindi ? 'वसूल भुगतान (Collections)' : 'Collected Payments';
                  return value;
                }}
              />
              <Bar
                dataKey="grossSales"
                name="grossSales"
                fill="url(#homeSalesGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="collections"
                name="collections"
                fill="url(#homePaidGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>
          {categoryData.items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <PackageCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">
                {isHindi ? 'कोई श्रेणी डेटा उपलब्ध नहीं है' : 'No categorized sales data yet'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isHindi
                  ? 'वाहन या रीटेल सामान के इनवॉइस बनाने पर श्रेणियों का ब्रेकडाउन यहाँ दिखेगा'
                  : 'Generate vehicle or retail invoices to view category breakdowns'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Donut Chart */}
              <div className="md:col-span-5 h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.items}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryData.items.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomCategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Progress List */}
              <div className="md:col-span-7 space-y-2.5 text-xs">
                {categoryData.items.map((cat) => (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-800">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          ₹{cat.revenue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {cat.share}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.share}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer link to Sales View */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {isHindi ? 'रियल-टाइम इनवॉइस डेटा से स्वतः सिंक' : 'Synchronized with your digital billing ledger'}
        </span>
        {onNavigateToSales && (
          <button
            type="button"
            onClick={onNavigateToSales}
            className="text-amber-700 hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
          >
            <span>{isHindi ? 'सभी बिक्री बिल देखें' : 'View all bills'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
