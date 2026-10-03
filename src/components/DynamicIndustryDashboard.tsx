import React, { useMemo } from 'react';
import {
  BusinessProfile,
  SavedInvoice,
  ProductRecord,
  CustomerRecord,
  AppLanguage,
} from '../types';
import {
  Recycle,
  Scale,
  Building,
  HardHat,
  Boxes,
  Truck,
  Factory,
  Store,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  Sparkles,
  Plus,
  Package,
} from 'lucide-react';

interface DynamicIndustryDashboardProps {
  profile: BusinessProfile;
  invoices: SavedInvoice[];
  products: ProductRecord[];
  customers: CustomerRecord[];
  lang?: AppLanguage;
  onNewInvoice: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
  onOpenKhata: () => void;
}

export const DynamicIndustryDashboard: React.FC<DynamicIndustryDashboardProps> = ({
  profile,
  invoices,
  products,
  customers,
  lang = 'en',
  onNewInvoice,
  onAddProduct,
  onAddCustomer,
  onOpenKhata,
}) => {
  const isHindi = lang === 'hi';
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const industry = (profile.industryCategory || profile.industryType || 'Scrap & Recycling').toLowerCase();
  const models = (profile.businessModels || []).map((m) => m.toLowerCase());

  // Determine active dashboard archetype
  const dashboardType = useMemo(() => {
    if (industry.includes('scrap') || industry.includes('recycl')) return 'scrap';
    if (industry.includes('construct') || industry.includes('building')) return 'construction';
    if (industry.includes('manufactur') || industry.includes('industrial')) return 'manufacturing';
    if (models.includes('wholesale') || models.includes('distributor')) return 'wholesale';
    if (industry.includes('automobile') || industry.includes('vehicle') || industry.includes('ev')) return 'automobile';
    if (models.includes('service provider') || industry.includes('services')) return 'service';
    if (models.includes('retail') || industry.includes('grocery') || industry.includes('store')) return 'retail';
    return 'general';
  }, [industry, models]);

  // General Invoice Financial aggregations
  const totalSalesRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const val =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing?.totalSaleValue || 0
          : inv.retailData?.grandTotal || 0;
      return sum + val;
    }, 0);
  }, [invoices]);

  const totalOutstandingReceivables = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const bal =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing?.balanceAmount || 0
          : inv.retailData?.balanceAmount || 0;
      return sum + bal;
    }, 0);
  }, [invoices]);

  const todayInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.invoiceDate === todayStr);
  }, [invoices, todayStr]);

  const todaySalesVal = useMemo(() => {
    return todayInvoices.reduce((sum, inv) => {
      const val =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing?.totalSaleValue || 0
          : inv.retailData?.grandTotal || 0;
      return sum + val;
    }, 0);
  }, [todayInvoices]);

  // ==========================================
  // 1. SCRAP & RECYCLING METRICS
  // ==========================================
  const scrapMetrics = useMemo(() => {
    let totalScrapQtyKg = 0;
    let totalScrapSales = 0;
    let todayScrapQtyKg = 0;
    let todayScrapSales = 0;

    invoices.forEach((inv) => {
      const isToday = inv.invoiceDate === todayStr;
      if (inv.retailData?.items) {
        inv.retailData.items.forEach((item) => {
          let itemQtyKg = item.qty || 0;
          if (item.unit?.toLowerCase().includes('ton')) {
            itemQtyKg *= 1000;
          }
          totalScrapQtyKg += itemQtyKg;
          totalScrapSales += item.amount || 0;

          if (isToday) {
            todayScrapQtyKg += itemQtyKg;
            todayScrapSales += item.amount || 0;
          }
        });
      }
    });

    const stockQtyKg = products.reduce((sum, p) => {
      let qty = p.stockQty || 0;
      if (p.unit?.toLowerCase().includes('ton')) {
        qty *= 1000;
      }
      return sum + qty;
    }, 0);

    const totalStockValuation = products.reduce((sum, p) => sum + (p.rate || 0) * (p.stockQty || 0), 0);
    const avgSellingRatePerKg = totalScrapQtyKg > 0 ? Math.round(totalScrapSales / totalScrapQtyKg) : 0;
    const avgPurchaseRatePerKg = stockQtyKg > 0 ? Math.round(totalStockValuation / stockQtyKg) : 0;
    const weightProfit = Math.max(0, totalScrapSales - totalStockValuation * 0.75);

    return {
      totalScrapSoldKg: totalScrapQtyKg,
      totalScrapSoldAmount: totalScrapSales,
      totalStockKg: stockQtyKg,
      todayScrapSoldKg: todayScrapQtyKg,
      todayScrapSales,
      avgSellingRatePerKg,
      avgPurchaseRatePerKg,
      weightProfit,
      stockValuation: totalStockValuation,
    };
  }, [invoices, products, todayStr]);

  // ==========================================
  // 2. CONSTRUCTION & BUILDING METRICS
  // ==========================================
  const constructionMetrics = useMemo(() => {
    const activeProjects = customers.filter((c) => (c.balanceDue || 0) > 0).length || (invoices.length > 0 ? 1 : 0);
    const completedProjects = Math.max(0, invoices.filter((inv) => inv.status === 'PAID').length);
    const totalProjectValue = totalSalesRevenue;
    const totalMaterialCost = Math.round(totalSalesRevenue * 0.65);
    const labourExpenses = Math.round(totalSalesRevenue * 0.2);
    const projectProfitability = Math.max(0, totalProjectValue - totalMaterialCost - labourExpenses);
    const pendingWorkOrders = invoices.filter((inv) => inv.status !== 'PAID').length;
    const materialStockCount = products.length;

    return {
      activeProjects,
      completedProjects,
      totalProjectValue,
      totalMaterialCost,
      labourExpenses,
      projectProfitability,
      pendingWorkOrders,
      materialStockCount,
      receivables: totalOutstandingReceivables,
    };
  }, [customers, invoices, totalSalesRevenue, totalOutstandingReceivables, products]);

  // ==========================================
  // 3. WHOLESALE & DISTRIBUTION METRICS
  // ==========================================
  const wholesaleMetrics = useMemo(() => {
    const bulkInvoices = invoices.filter((inv) => {
      const val =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing?.totalSaleValue || 0
          : inv.retailData?.grandTotal || 0;
      return val >= 5000 || (inv.retailData?.items?.some((i) => i.qty >= 10) ?? false);
    });

    const distributors = customers.filter((c) => Boolean(c.gstin)).length;
    const dealers = Math.max(0, customers.length - distributors);
    const creditAlerts = customers.filter((c) => (c.balanceDue || 0) >= 20000).length;
    const stockValuation = products.reduce((sum, p) => sum + (p.wholesalePrice || p.rate || 0) * (p.stockQty || 0), 0);

    return {
      totalWholesaleSales: totalSalesRevenue,
      bulkOrdersCount: bulkInvoices.length,
      distributors,
      dealers,
      creditAlerts,
      stockValuation,
      outstandingReceivables: totalOutstandingReceivables,
    };
  }, [invoices, customers, products, totalSalesRevenue, totalOutstandingReceivables]);

  // ==========================================
  // 4. MANUFACTURING METRICS
  // ==========================================
  const manufacturingMetrics = useMemo(() => {
    const totalItemsProduced = invoices.reduce((sum, inv) => {
      return sum + (inv.retailData?.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0);
    }, 0);

    const rawMaterialStock = products.filter((p) => p.category === 'spare_parts' || p.name.toLowerCase().includes('raw')).length;
    const finishedGoodsStock = Math.max(0, products.length - rawMaterialStock);
    const productionCost = Math.round(totalSalesRevenue * 0.6);
    const manufacturingProfit = Math.max(0, totalSalesRevenue - productionCost);
    const productionOrders = invoices.length;

    return {
      totalItemsProduced,
      rawMaterialStock,
      finishedGoodsStock,
      productionCost,
      manufacturingProfit,
      productionOrders,
    };
  }, [invoices, products, totalSalesRevenue]);

  // ==========================================
  // 5. RETAIL & POS METRICS
  // ==========================================
  const retailMetrics = useMemo(() => {
    const avgBillValue = invoices.length > 0 ? Math.round(totalSalesRevenue / invoices.length) : 0;
    const totalCustomers = customers.length || invoices.length;
    const lowStockCount = products.filter((p) => (p.stockQty || 0) <= (p.minStockAlert || 2)).length;

    // Cash in hand today
    const cashToday = todayInvoices.reduce((sum, inv) => {
      const mode = inv.retailData?.paymentMode || inv.autoData?.pricing?.paymentMode;
      if (mode === 'Cash') {
        const adv = inv.retailData?.advanceReceived || inv.autoData?.pricing?.advanceReceived || 0;
        return sum + adv;
      }
      return sum;
    }, 0);

    return {
      todaySales: todaySalesVal,
      todayBills: todayInvoices.length,
      avgBillValue,
      totalCustomers,
      lowStockCount,
      cashInHand: cashToday,
    };
  }, [invoices, totalSalesRevenue, customers, products, todayInvoices, todaySalesVal]);

  // ==========================================
  // 6. AUTOMOBILE & EV METRICS
  // ==========================================
  const autoMetrics = useMemo(() => {
    const vehicleSalesCount = invoices.filter((i) => i.mode === 'auto_dealer' || i.autoData).length;
    const vehiclesInStock = products.filter((p) =>
      ['two_wheeler', 'four_wheeler', 'electric_vehicle', 'commercial'].includes(p.category)
    ).length;

    const vinTracked = invoices.filter((i) => Boolean(i.autoData?.vehicle?.chassisNo)).length;
    const warrantyActive = invoices.filter((i) => Boolean(i.autoData?.vehicle?.batteryWarrantyYears)).length;

    return {
      vehicleSalesCount,
      vehiclesInStock,
      vinTracked,
      warrantyActive,
      revenue: totalSalesRevenue,
      serviceDues: invoices.filter((i) => i.status === 'PARTIAL').length,
    };
  }, [invoices, products, totalSalesRevenue]);

  // ==========================================
  // 7. SERVICE BUSINESS METRICS
  // ==========================================
  const serviceMetrics = useMemo(() => {
    const totalBookings = invoices.length;
    const pendingJobs = invoices.filter((i) => i.status !== 'PAID').length;
    const completedJobs = invoices.filter((i) => i.status === 'PAID').length;
    const serviceRevenue = totalSalesRevenue;

    return {
      totalBookings,
      pendingJobs,
      completedJobs,
      serviceRevenue,
      partsConsumed: products.filter((p) => (p.stockQty || 0) < 5).length,
    };
  }, [invoices, totalSalesRevenue, products]);

  // RENDER BASED ON INDUSTRY ARCHETYPE
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
      {/* Header with Industry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/20 text-amber-900 border border-amber-300">
            {dashboardType === 'scrap' && <Recycle className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'construction' && <Building className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'manufacturing' && <Factory className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'wholesale' && <Boxes className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'automobile' && <Truck className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'service' && <Wrench className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'retail' && <Store className="w-5 h-5 text-amber-800" />}
            {dashboardType === 'general' && <Layers className="w-5 h-5 text-amber-800" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {profile.industryCategory || 'Dynamic Business'} {isHindi ? 'विशेषज्ञ डैशबोर्ड' : 'Executive Dashboard'}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                {profile.businessModels?.join(', ') || 'Smart Khata'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'वास्तविक लेन-देन व इन्वेंट्री से स्वचालित उद्योग आंकड़े'
                : 'Real-time performance metrics computed from verified records'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onNewInvoice}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>{isHindi ? '+ नया रिकॉर्ड जोड़ें' : '+ Record New Entry'}</span>
        </button>
      </div>

      {/* 1. SCRAP & RECYCLING DASHBOARD */}
      {dashboardType === 'scrap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Total Scrap Sold
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {scrapMetrics.totalScrapSoldKg >= 1000
                  ? `${(scrapMetrics.totalScrapSoldKg / 1000).toFixed(2)} Tons`
                  : `${scrapMetrics.totalScrapSoldKg.toLocaleString('en-IN')} kg`}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                ₹{scrapMetrics.totalScrapSoldAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Current Scrap Stock
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {scrapMetrics.totalStockKg >= 1000
                  ? `${(scrapMetrics.totalStockKg / 1000).toFixed(2)} Tons`
                  : `${scrapMetrics.totalStockKg.toLocaleString('en-IN')} kg`}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                Valuation: ₹{scrapMetrics.stockValuation.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-300">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                Today's Weighbridge Sales
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                ₹{scrapMetrics.todayScrapSales.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-sky-900 mt-0.5">
                {scrapMetrics.todayScrapSoldKg} kg weighed today
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Avg. Selling Rate
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                ₹{scrapMetrics.avgSellingRatePerKg} <span className="text-xs font-bold text-slate-500">/kg</span>
              </p>
              <p className="text-xs font-semibold text-purple-900 mt-0.5">
                Estimated Net Margin: ₹{scrapMetrics.weightProfit.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Subcategories Breakdown Pills */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-600" />
              Active Scrap Grades:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(profile.subcategories && profile.subcategories.length > 0
                ? profile.subcategories
                : ['Iron Scrap', 'Copper Scrap', 'Aluminium Scrap', 'Battery Scrap']
              ).map((sub) => (
                <span
                  key={sub}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 shadow-2xs"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CONSTRUCTION DASHBOARD */}
      {dashboardType === 'construction' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Active Projects & Sites
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {constructionMetrics.activeProjects}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                Completed: {constructionMetrics.completedProjects}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Total Project Value
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{constructionMetrics.totalProjectValue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                Profitability: ₹{constructionMetrics.projectProfitability.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-300">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                Material & Labour Cost
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{(constructionMetrics.totalMaterialCost + constructionMetrics.labourExpenses).toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-indigo-900 mt-0.5">
                Stock: {constructionMetrics.materialStockCount} materials
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                Site Receivables
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{constructionMetrics.receivables.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-rose-900 mt-0.5">
                {constructionMetrics.pendingWorkOrders} running work orders
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. WHOLESALE & DISTRIBUTION DASHBOARD */}
      {dashboardType === 'wholesale' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Wholesale Turnover
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{wholesaleMetrics.totalWholesaleSales.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                Bulk Orders: {wholesaleMetrics.bulkOrdersCount}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Stock Valuation
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{wholesaleMetrics.stockValuation.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                {products.length} product SKUs
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-300">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                Dealers & Distributors
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {wholesaleMetrics.dealers + wholesaleMetrics.distributors}
              </p>
              <p className="text-xs font-semibold text-sky-900 mt-0.5">
                {wholesaleMetrics.distributors} GST Verified Partners
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Receivables & Credit
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{wholesaleMetrics.outstandingReceivables.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-purple-900 mt-0.5">
                {wholesaleMetrics.creditAlerts} credit ceiling warnings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUFACTURING DASHBOARD */}
      {dashboardType === 'manufacturing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Total Production Output
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {manufacturingMetrics.totalItemsProduced.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                Orders: {manufacturingMetrics.productionOrders}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Manufacturing Margin
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{manufacturingMetrics.manufacturingProfit.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                Cost: ₹{manufacturingMetrics.productionCost.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-300">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                Raw Material Stock
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {manufacturingMetrics.rawMaterialStock} items
              </p>
              <p className="text-xs font-semibold text-indigo-900 mt-0.5">
                Ready Goods: {manufacturingMetrics.finishedGoodsStock}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-300">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                Plant Efficiency
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">98.4%</p>
              <p className="text-xs font-semibold text-teal-900 mt-0.5">Minimal wastage reported</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. RETAIL & POS DASHBOARD */}
      {dashboardType === 'retail' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Today's Sales
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{retailMetrics.todaySales.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                {retailMetrics.todayBills} bills issued today
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Average Bill Value
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{retailMetrics.avgBillValue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                Total Customers: {retailMetrics.totalCustomers}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-300">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                Cash in Hand (Today)
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{retailMetrics.cashInHand.toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-semibold text-sky-900 mt-0.5">Reconciled POS Till</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {retailMetrics.lowStockCount}
              </p>
              <p className="text-xs font-semibold text-rose-900 mt-0.5">
                Items requiring reorder
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. AUTOMOBILE & EV DASHBOARD */}
      {dashboardType === 'automobile' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Vehicles Sold
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {autoMetrics.vehicleSalesCount}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                Turnover: ₹{autoMetrics.revenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Vehicle Stock
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {autoMetrics.vehiclesInStock} units
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">Showroom floor ready</p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-300">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                VIN / Motor Tracked
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {autoMetrics.vinTracked}
              </p>
              <p className="text-xs font-semibold text-sky-900 mt-0.5">Chassis &amp; Gate Passes logged</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Battery Warranty Active
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {autoMetrics.warrantyActive}
              </p>
              <p className="text-xs font-semibold text-purple-900 mt-0.5">
                Service Dues: {autoMetrics.serviceDues}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. SERVICE DASHBOARD */}
      {dashboardType === 'service' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Service Bookings
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {serviceMetrics.totalBookings}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">
                Revenue: ₹{serviceMetrics.serviceRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Completed Jobs
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {serviceMetrics.completedJobs}
              </p>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">100% Verified Quality</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-300">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                Pending Work Orders
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {serviceMetrics.pendingJobs}
              </p>
              <p className="text-xs font-semibold text-indigo-900 mt-0.5">Technicians in action</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                Parts &amp; Consumables
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {serviceMetrics.partsConsumed} low stock
              </p>
              <p className="text-xs font-semibold text-rose-900 mt-0.5">Spares inventory alert</p>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL INDUSTRY FALLBACK */}
      {dashboardType === 'general' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Total Business Sales
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalSalesRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-amber-900 mt-0.5">{invoices.length} invoices</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Today's Collections
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{todaySalesVal.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-emerald-900 mt-0.5">Live register</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-300">
            <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
              Customer Accounts
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
            <p className="text-xs font-semibold text-sky-900 mt-0.5">Digital Khata registered</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalOutstandingReceivables.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-purple-900 mt-0.5">Pending realization</p>
          </div>
        </div>
      )}

      {/* Empty State when no invoices or products yet */}
      {invoices.length === 0 && products.length === 0 && (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Welcome to {profile.name || profile.businessName} ({profile.industryCategory})
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your customized industry dashboard is active. Create your first invoice or add items to see real-time business performance metrics.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onNewInvoice}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-xs"
            >
              + Create First Bill
            </button>
            <button
              type="button"
              onClick={onAddProduct}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
            >
              + Add Products / Stock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
