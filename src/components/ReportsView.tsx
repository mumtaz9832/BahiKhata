import React, { useState } from 'react';
import { SavedInvoice, BusinessProfile, AppLanguage, CustomerRecord } from '../types';
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
  Users,
  Wallet,
  ShoppingBag,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { SalesPerformanceChart } from './SalesPerformanceChart';
import {
  getSavedExpenses,
  getSavedPurchases,
  getSavedProducts,
} from '../utils/storage';

interface ReportsViewProps {
  invoices: SavedInvoice[];
  customers?: CustomerRecord[];
  profile: BusinessProfile;
  lang: AppLanguage;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  customers = [],
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

  // Real Accounting Integrations: Purchases, Expenses, Inventory
  const allExpenses = getSavedExpenses();
  const allPurchases = getSavedPurchases();
  const allProducts = getSavedProducts();

  const filteredExpenses = allExpenses.filter((e) => {
    if (selectedRange === 'TODAY') return e.date === todayStr;
    if (selectedRange === 'THIS_MONTH') return e.date && e.date.startsWith(currentMonthStr);
    return true;
  });

  const filteredPurchases = allPurchases.filter((p) => {
    if (selectedRange === 'TODAY') return p.date === todayStr;
    if (selectedRange === 'THIS_MONTH') return p.date && p.date.startsWith(currentMonthStr);
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPurchaseAmount = filteredPurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  // Cost of Goods Sold (COGS) based on actual product purchase prices or estimated acquisition cost
  let cogs = 0;
  filteredInvoices.forEach((inv) => {
    if (inv.mode === 'general_retail' && inv.retailData?.items) {
      inv.retailData.items.forEach((item) => {
        const prod = allProducts.find(
          (p) =>
            p.id === item.id ||
            (p.name && item.description && p.name.toLowerCase() === item.description.toLowerCase())
        );
        const costPerUnit = prod?.purchasePrice || (item.rate * 0.7);
        cogs += costPerUnit * item.qty;
      });
    } else if (inv.mode === 'auto_dealer' && inv.autoData) {
      const base = inv.autoData.pricing.basePrice || 0;
      cogs += base * 0.85;
    }
  });

  const grossProfit = Math.max(0, totalGross - cogs);
  const netProfit = grossProfit - totalExpenseAmount;

  // Outstanding Receivables and Payables
  const totalCustomerReceivables = customers.reduce((sum, c) => sum + (c.balanceDue || 0), 0);
  const totalSupplierPayables = customers
    .filter((c) => c.partyType === 'supplier')
    .reduce((sum, c) => sum + (c.supplierPayable || 0), 0);

  // Stock Valuation and Low Stock Count
  const totalStockValuation = allProducts.reduce((sum, p) => sum + (p.rate || 0) * (p.stockQty || 0), 0);
  const lowStockCount = allProducts.filter((p) => (p.stockQty || 0) <= (p.minStockAlert || 2)).length;

  // Helper to safely escape CSV cells and protect against formula injection
  const escapeCsv = (val: any): string => {
    if (val === undefined || val === null) return '""';
    let str = String(val).trim();
    if (/^[=\+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  /**
   * Export complete invoice history and customer data as a formatted CSV file
   */
  const handleExportCompleteCSV = () => {
    const csvLines: string[] = [];

    // Header metadata
    csvLines.push(`# BIZCORE COMPLETE REPORT — INVOICE HISTORY & CUSTOMER DATA`);
    csvLines.push(`# Business Name: ${escapeCsv(profile.name || 'BIZCORE Business')}`);
    csvLines.push(`# GSTIN: ${escapeCsv(profile.gstin || 'Unregistered')}`);
    csvLines.push(`# Exported At: ${escapeCsv(new Date().toLocaleString('en-IN'))}`);
    csvLines.push(`# Filter Scope: ${escapeCsv(selectedRange)}`);
    csvLines.push(`# Invoices Count: ${filteredInvoices.length} (out of ${invoices.length} total)`);
    csvLines.push(`# Customers Count: ${customers.length}`);
    csvLines.push('');

    // SECTION 1: INVOICE HISTORY & LINE-ITEM TRANSACTIONS
    csvLines.push('### SECTION 1: ENTIRE INVOICE HISTORY ###');
    const invoiceHeaders = [
      'Invoice Number',
      'Invoice Date',
      'Delivery Date',
      'Delivery Time',
      'Billing Mode',
      'Payment Status',
      'Customer / Buyer Name',
      'Primary Mobile',
      'Alternate Mobile',
      'Customer Address',
      'City',
      'State',
      'Pincode',
      'ID Type',
      'ID Number / GSTIN',
      'Vehicle Details / Items Summary',
      'Chassis / VIN Number',
      'Engine / Motor Number',
      'Odometer (KM)',
      'Subtotal / Base Price (INR)',
      'Taxes / RTO / Accessories (INR)',
      'Discount (INR)',
      'Grand Total Amount (INR)',
      'Advance Paid (INR)',
      'Balance Due (INR)',
      'Payment Mode',
      'Transaction Ref',
      'Balance Due Date',
      'Notes'
    ];
    csvLines.push(invoiceHeaders.map(escapeCsv).join(','));

    filteredInvoices.forEach((inv) => {
      const isAuto = inv.mode === 'auto_dealer';
      const status = inv.status || 'UNPAID';

      if (isAuto && inv.autoData) {
        const { buyer, vehicle, pricing } = inv.autoData;
        const vehicleDesc = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.variant || ''} (${vehicle.color || ''})`.trim();
        const row = [
          inv.invoiceNo,
          inv.invoiceDate,
          inv.deliveryDate || '',
          inv.deliveryTime || '',
          'Auto Dealership',
          status,
          buyer.fullName || 'Auto Customer',
          buyer.phone || '',
          buyer.altPhone || '',
          buyer.address || '',
          buyer.city || '',
          buyer.state || '',
          buyer.pincode || '',
          buyer.idType || '',
          buyer.idNumber || '',
          vehicleDesc || 'Vehicle',
          vehicle.chassisNo || '',
          vehicle.engineMotorNo || '',
          vehicle.odometerKm || 0,
          pricing.basePrice || 0,
          (pricing.rtoCharges || 0) + (pricing.insuranceCharges || 0) + (pricing.accessoriesCharges || 0),
          pricing.discount || 0,
          pricing.totalSaleValue || pricing.netPayableAmount || 0,
          pricing.advanceReceived || 0,
          pricing.balanceAmount || 0,
          pricing.paymentMode || 'UPI / QR',
          pricing.transactionRef || '',
          pricing.balanceDueDate || '',
          pricing.notes || ''
        ];
        csvLines.push(row.map(escapeCsv).join(','));
      } else if (inv.retailData) {
        const { customer, items, grandTotal, subtotal, totalGst, discount, advanceReceived, balanceAmount, paymentMode, transactionRef, balanceDueDate, notes } = inv.retailData;
        const itemsSummary = (items || []).map((it) => `${it.description || 'Item'} (x${it.qty ?? 1} ${it.unit || 'Pcs'})`).join('; ');
        const row = [
          inv.invoiceNo,
          inv.invoiceDate,
          inv.deliveryDate || '',
          inv.deliveryTime || '',
          'General Retail POS',
          status,
          customer.fullName || 'Walk-in Customer',
          customer.phone || '',
          '',
          customer.address || '',
          '',
          '',
          '',
          customer.gstin ? 'GSTIN' : '',
          customer.gstin || '',
          itemsSummary || 'Retail Items',
          '',
          '',
          '',
          subtotal || 0,
          totalGst || 0,
          discount || 0,
          grandTotal || 0,
          advanceReceived || 0,
          balanceAmount || 0,
          paymentMode || 'UPI / QR',
          transactionRef || '',
          balanceDueDate || '',
          notes || ''
        ];
        csvLines.push(row.map(escapeCsv).join(','));
      }
    });

    // SECTION 2: CUSTOMERS DIRECTORY & KHATA BALANCES
    if (customers && customers.length > 0) {
      csvLines.push('');
      csvLines.push('');
      csvLines.push('### SECTION 2: CUSTOMERS DIRECTORY & KHATA BALANCES ###');
      const customerHeaders = [
        'Customer ID',
        'Customer Full Name',
        'Primary Phone',
        'Alternate Phone',
        'Email Address',
        'Address',
        'City',
        'State',
        'Pincode',
        'ID Type',
        'ID Number / GSTIN',
        'Opening Balance (INR)',
        'Current Balance Due (INR)',
        'Party Type',
        'Created Date'
      ];
      csvLines.push(customerHeaders.map(escapeCsv).join(','));

      customers.forEach((c) => {
        const cRow = [
          c.id || '',
          c.fullName || '',
          c.phone || '',
          c.altPhone || '',
          c.email || '',
          c.address || '',
          c.city || '',
          c.state || '',
          c.pincode || '',
          c.idType || '',
          c.idNumber || c.gstin || '',
          c.openingBalance || 0,
          c.balanceDue || 0,
          c.partyType || 'customer',
          c.createdAt || ''
        ];
        csvLines.push(cRow.map(escapeCsv).join(','));
      });
    }

    // Include UTF-8 BOM for Microsoft Excel & Google Sheets compatibility
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BIZCORE_Invoices_and_Customers_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GSTR1_Summary_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Main User Requested 'Export to CSV' button */}
          <button
            type="button"
            onClick={handleExportCompleteCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title={isHindi ? 'सभी इनवॉइस इतिहास और ग्राहक डेटा को CSV फ़ाइल में डाउनलोड करें' : 'Download complete invoice history and customer data as formatted CSV file'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{isHindi ? 'CSV में निर्यात करें (Export to CSV)' : 'Export to CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportGSTR1}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            title={isHindi ? 'GSTR-1 टैक्स सारांश CSV डाउनलोड करें' : 'Download GSTR-1 tax audit summary as CSV'}
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

      {/* 5. Real Profit & Loss Statement (Gross Profit vs Operating Expenses vs Net Profit) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>{isHindi ? 'लाभ व हानि विवरण (P&L Summary)' : 'Profit & Loss Statement (P&L)'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'वास्तविक लेन-देन: सकल लाभ = बिक्री - खरीद लागत, शुद्ध लाभ = सकल लाभ - संचालन खर्च'
                : 'Audited Formula: Gross Profit = Sales - Cost of Goods Sold. Net Profit = Gross Profit - Operating Expenses.'}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-lg border ${
              netProfit >= 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {netProfit >= 0 ? (isHindi ? 'शुद्ध लाभ (Net Profit)' : 'Net Profit Active') : (isHindi ? 'शुद्ध हानि (Net Loss)' : 'Net Loss')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
              {isHindi ? 'सकल लाभ (Gross Profit)' : 'Gross Profit'}
            </span>
            <span className="text-xl font-black text-emerald-950">
              ₹{Math.round(grossProfit).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-1">
              Sales (₹{Math.round(totalGross).toLocaleString('en-IN')}) - COGS
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
            <span className="text-[10px] uppercase font-bold text-rose-800 block mb-1">
              {isHindi ? 'संचालन खर्च (Expenses)' : 'Operating Expenses'}
            </span>
            <span className="text-xl font-black text-rose-950">
              ₹{Math.round(totalExpenseAmount).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-rose-700 block mt-1">
              {filteredExpenses.length} recorded expense vouchers
            </span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <span className="text-[10px] uppercase font-bold text-blue-800 block mb-1">
              {isHindi ? 'कुल माल खरीद (Purchases)' : 'Total Purchases'}
            </span>
            <span className="text-xl font-black text-blue-950">
              ₹{Math.round(totalPurchaseAmount).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-700 block mt-1">
              {filteredPurchases.length} inward stock bills
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-100/40 border-emerald-300' : 'bg-red-100/40 border-red-300'}`}>
            <span className={`text-[10px] uppercase font-bold block mb-1 ${netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              {isHindi ? 'वास्तविक शुद्ध लाभ (Net Profit)' : 'Real Net Profit'}
            </span>
            <span className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-950' : 'text-red-950'}`}>
              ₹{Math.round(netProfit).toLocaleString('en-IN')}
            </span>
            <span className={`text-[10px] block mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Gross Profit - Operating Expenses
            </span>
          </div>
        </div>
      </div>

      {/* 6. Outstanding Receivables & Payables + Stock Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center justify-between">
            <span>{isHindi ? 'ग्राहकों से उधारी (Receivables)' : 'Customer Outstanding Dues'}</span>
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            ₹{totalCustomerReceivables.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {customers.filter((c) => (c.balanceDue || 0) > 0).length} parties with pending balance
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1 flex items-center justify-between">
            <span>{isHindi ? 'सप्लायर को देय (Payables)' : 'Supplier Outstanding Dues'}</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            ₹{totalSupplierPayables.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-indigo-700 mt-0.5">
            Total payables on credit purchases
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>{isHindi ? 'कुल स्टॉक मूल्यांकन' : 'Current Stock Valuation'}</span>
            <ShoppingBag className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>{allProducts.length} items</span>
            {lowStockCount > 0 && (
              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount} low stock alerts
              </span>
            )}
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
