import React, { useState } from 'react';
import { CustomerRecord, SavedInvoice, AppLanguage, PaymentMode } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  MessageCircle,
  Trash2,
  Receipt,
  Download,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { openWhatsAppCustomerReminder } from '../utils/whatsapp';

interface PartiesViewProps {
  customers: CustomerRecord[];
  invoices: SavedInvoice[];
  lang: AppLanguage;
  onAddCustomer: () => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomerForBill: (customer: CustomerRecord) => void;
  onRecordPayment: (invoiceId: string, amount: number, mode: PaymentMode, note: string) => void;
  searchQuery?: string;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  customers,
  invoices,
  lang,
  onAddCustomer,
  onDeleteCustomer,
  onSelectCustomerForBill,
  onRecordPayment,
  searchQuery = '',
}) => {
  const isHindi = lang === 'hi';
  const [internalSearch, setInternalSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DUE' | 'SETTLED'>('ALL');
  const [selectedParty, setSelectedParty] = useState<CustomerRecord | null>(null);

  const activeSearch = (searchQuery || internalSearch).toLowerCase().trim();

  // Map each customer to their invoices and calculate their total balance
  const customerStats = customers.map((c) => {
    const matchingInvoices = invoices.filter((inv) => {
      if (inv.mode === 'auto_dealer') {
        const phone = inv.autoData?.buyer.phone;
        const name = inv.autoData?.buyer.fullName?.toLowerCase();
        return phone === c.phone || (name && name === c.fullName.toLowerCase());
      } else {
        const phone = inv.retailData?.customer.phone;
        const name = inv.retailData?.customer.fullName?.toLowerCase();
        return phone === c.phone || (name && name === c.fullName.toLowerCase());
      }
    });

    let totalBilled = 0;
    let totalDue = 0;

    matchingInvoices.forEach((inv) => {
      if (inv.mode === 'auto_dealer' && inv.autoData) {
        totalBilled += inv.autoData.pricing.totalSaleValue || 0;
        totalDue += inv.autoData.pricing.balanceAmount || 0;
      } else if (inv.retailData) {
        totalBilled += inv.retailData.grandTotal || 0;
        totalDue += inv.retailData.balanceAmount || 0;
      }
    });

    return {
      customer: c,
      invoices: matchingInvoices,
      totalBilled,
      totalDue,
    };
  });

  // Calculate totals
  const totalReceivable = customerStats.reduce((sum, item) => sum + item.totalDue, 0);
  const dueCustomersCount = customerStats.filter((item) => item.totalDue > 0).length;

  // Filter
  const filteredParties = customerStats.filter((item) => {
    const c = item.customer;
    const matchesSearch =
      !activeSearch ||
      c.fullName.toLowerCase().includes(activeSearch) ||
      c.phone.includes(activeSearch) ||
      (c.city && c.city.toLowerCase().includes(activeSearch)) ||
      (c.gstin && c.gstin.toLowerCase().includes(activeSearch));

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'DUE' && item.totalDue > 0) ||
      (filterType === 'SETTLED' && item.totalDue === 0);

    return matchesSearch && matchesFilter;
  });

  const handleExportParties = () => {
    const headers = ['Party Name', 'Phone', 'City', 'GSTIN', 'ID Type', 'ID Number', 'Total Bills', 'Balance Due'];
    const rows = filteredParties.map((p) => [
      `"${p.customer.fullName}"`,
      `"${p.customer.phone}"`,
      `"${p.customer.city || ''}"`,
      `"${p.customer.gstin || ''}"`,
      `"${p.customer.idType || ''}"`,
      `"${p.customer.idNumber || ''}"`,
      p.invoices.length,
      p.totalDue,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Parties_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isHindi ? 'पार्टी व ग्राहक डायरेक्टरी (Khata)' : 'Parties & Customer Khata'}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-full">
              {customers.length} {isHindi ? 'पार्टियां' : 'Parties'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? 'ग्राहकों का संपर्क, पता, आधार/पैन, उधारी-जमा खाता और सीधे बिल बनाने की सुविधा'
              : 'Customer contact book, KYC identifiers, Khata ledger balances, and 1-click billing'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportParties}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isHindi ? 'एक्सेल/CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isHindi ? '+ नया ग्राहक जोड़ें' : '+ Add Party'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {isHindi ? 'कुल ग्राहक (Total Parties)' : 'Total Registered Parties'}
          </div>
          <div className="text-2xl font-black text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {customerStats.filter((p) => p.invoices.length > 0).length}{' '}
            {isHindi ? 'सक्रिय ग्राहक' : 'with active billing history'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
            {isHindi ? 'कुल उधारी बाकी (Receivables)' : 'Total Khata Balance Due'}
          </div>
          <div className="text-2xl font-black text-amber-800">
            ₹{totalReceivable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {dueCustomersCount} {isHindi ? 'ग्राहकों से भुगतान लेना है' : 'parties with pending balance'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
            {isHindi ? 'खाता स्थिति' : 'Settlement Ratio'}
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {customers.length > 0
              ? Math.round(((customers.length - dueCustomersCount) / customers.length) * 100)
              : 100}
            %
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {customers.length - dueCustomersCount} {isHindi ? 'ग्राहकों का खाता चुकता' : 'parties fully settled'}
          </div>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'सभी पार्टियां' : 'All Parties'} ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('DUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'DUE' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'उधारी वाले (Due)' : 'With Balance Due'} ({dueCustomersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('SETTLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'SETTLED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            {isHindi ? 'चुकता' : 'Settled'}
          </button>
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder={isHindi ? 'पार्टी नाम, फोन, जीएसटी...' : 'Search party, phone, GSTIN...'}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* 4. Parties Table / Directory */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredParties.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {isHindi ? 'कोई पार्टी नहीं मिली' : 'No parties found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isHindi
                ? 'नया ग्राहक जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                : 'Register your customers and track their billing history and outstanding Khata.'}
            </p>
            <button
              type="button"
              onClick={onAddCustomer}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
            >
              {isHindi ? '+ नया ग्राहक जोड़ें' : '+ Add Party'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'पार्टी नाम' : 'Party Name'}</th>
                  <th className="py-3 px-4">{isHindi ? 'संपर्क / फोन' : 'Contact / Phone'}</th>
                  <th className="py-3 px-4">{isHindi ? 'पहचान / GSTIN' : 'KYC / GSTIN'}</th>
                  <th className="py-3 px-4">{isHindi ? 'शहर / पता' : 'City / Location'}</th>
                  <th className="py-3 px-4 text-center">{isHindi ? 'कुल बिल' : 'Total Bills'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'उधारी बाकी' : 'Balance Due'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((item) => {
                  const c = item.customer;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {c.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{c.fullName}</div>
                            {c.email && <div className="text-[10px] text-slate-400 font-normal">{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        {c.altPhone && <div className="text-[10px] text-slate-400">{c.altPhone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {c.gstin ? (
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {c.gstin}
                          </span>
                        ) : c.idNumber ? (
                          <div className="text-[11px] font-mono text-slate-600">
                            <span className="text-[10px] text-slate-400">{c.idType?.split(' ')[0]}: </span>
                            {c.idNumber}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {c.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>
                              {c.city}
                              {c.state ? `, ${c.state}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-slate-100 text-slate-700">
                          {item.invoices.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.totalDue > 0 ? (
                          <span className="font-mono font-black text-amber-700 text-sm">
                            ₹{item.totalDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs">{isHindi ? 'चुकता' : 'Settled'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Bill for this Customer */}
                          <button
                            type="button"
                            onClick={() => onSelectCustomerForBill(c)}
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px] shadow-2xs"
                            title="Generate new invoice for this party"
                          >
                            {isHindi ? 'बिल बनाएं' : 'New Bill'}
                          </button>

                          {/* WhatsApp Reminder if balance due */}
                          {item.totalDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const latestInv = item.invoices[0];
                                if (latestInv) {
                                  openWhatsAppCustomerReminder(latestInv);
                                } else {
                                  const text = `Namaste ${c.fullName}, this is a gentle reminder regarding your pending balance of Rs. ${item.totalDue} with Apex Motors. Kindly settle at your earliest convenience. Thank you!`;
                                  window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                }
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Send WhatsApp payment reminder"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Party */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete customer ${c.fullName}?`)) {
                                onDeleteCustomer(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
