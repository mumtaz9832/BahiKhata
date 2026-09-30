import React, { useState } from 'react';
import { SavedInvoice, PaymentMode } from '../types';
import { formatINR } from '../utils/numberToWords';
import {
  X,
  Search,
  BookOpen,
  Filter,
  IndianRupee,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  Download,
  Upload,
  PlusCircle,
  CheckCircle2,
  Clock,
  Car,
  Store,
  Database,
  Cloud,
} from 'lucide-react';
import { exportBackupData, importBackupData } from '../utils/storage';

interface KhataLedgerProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SavedInvoice[];
  onSelectInvoice: (invoice: SavedInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onRecordPayment: (invoiceId: string, amount: number, mode: PaymentMode, note: string) => void;
  onOpenWhatsApp: (invoice: SavedInvoice) => void;
  onRefreshInvoices: () => void;
  onOpenDriveModal?: () => void;
}

export const KhataLedger: React.FC<KhataLedgerProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onRecordPayment,
  onOpenWhatsApp,
  onRefreshInvoices,
  onOpenDriveModal,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  
  // Payment recording dialog state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<SavedInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / QR');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Filter logic
  const filtered = invoices.filter((inv) => {
    const isAuto = inv.mode === 'auto_dealer';
    const buyerName = isAuto
      ? inv.autoData?.buyer.fullName || ''
      : inv.retailData?.customer.fullName || '';
    const phone = isAuto
      ? inv.autoData?.buyer.phone || ''
      : inv.retailData?.customer.phone || '';
    const vehicle = isAuto
      ? `${inv.autoData?.vehicle.make} ${inv.autoData?.vehicle.model} ${inv.autoData?.vehicle.registrationNo} ${inv.autoData?.vehicle.chassisNo}`
      : 'Retail';

    const matchesSearch =
      buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    const balance = isAuto
      ? inv.autoData?.pricing?.balanceAmount || 0
      : inv.retailData?.balanceAmount || 0;

    if (!matchesSearch) return false;

    if (filterStatus === 'PENDING') return balance > 0;
    if (filterStatus === 'PAID') return balance === 0;
    return true;
  });

  // Calculate totals for filtered
  let totalReceivable = 0;
  invoices.forEach((inv) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    totalReceivable += bal;
  });

  const handleOpenPaymentDialog = (inv: SavedInvoice) => {
    const bal =
      inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0;
    setActivePaymentInvoice(inv);
    setPaymentAmount(bal);
    setPaymentMode('UPI / QR');
    setPaymentNote('Khata balance settlement');
  };

  const handleConfirmPayment = () => {
    if (!activePaymentInvoice || paymentAmount <= 0) return;
    onRecordPayment(activePaymentInvoice.id, paymentAmount, paymentMode, paymentNote);
    setActivePaymentInvoice(null);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autobill-khata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupData(content);
        if (success) {
          onRefreshInvoices();
          alert('Khata ledger data imported successfully!');
        } else {
          alert('Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Smart Khata &amp; Customer Ledger
                </h2>
                <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  Live Ledger
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track receivables, vehicle delivery records, and send instant WhatsApp reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDriveModal && (
              <button
                type="button"
                onClick={onOpenDriveModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-300 hover:text-white bg-blue-900/60 hover:bg-blue-900 rounded-lg border border-blue-700/60 transition-colors cursor-pointer"
                title="Backup or restore Khata from Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Drive Cloud Sync</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportBackup}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Download JSON backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Restore from JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Khata Summary Stats & Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Buyer name, phone, vehicle model or RC..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Balance Due
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PAID')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filterStatus === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fully Settled
              </button>
            </div>
          </div>

          {/* Quick Outstanding Banner */}
          <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Total Outstanding Receivable Across All Records:
              </span>
            </div>
            <span className="font-mono font-extrabold text-amber-700 text-sm">
              {formatINR(totalReceivable)}
            </span>
          </div>
        </div>

        {/* Invoices List / Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No matching Khata records found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or create a new invoice.</p>
            </div>
          ) : (
            filtered.map((inv) => {
              const isAuto = inv.mode === 'auto_dealer';
              const buyerName = isAuto
                ? inv.autoData?.buyer.fullName || 'Customer'
                : inv.retailData?.customer.fullName || 'Customer';
              const phone = isAuto
                ? inv.autoData?.buyer.phone || ''
                : inv.retailData?.customer.phone || '';
              const vehicleDesc = isAuto
                ? `${inv.autoData?.vehicle.make} ${inv.autoData?.vehicle.model} (${inv.autoData?.vehicle.registrationNo || 'New'})`
                : 'General Items';
              const total = isAuto
                ? inv.autoData?.pricing?.totalSaleValue || 0
                : inv.retailData?.grandTotal || 0;
              const advance = isAuto
                ? inv.autoData?.pricing?.advanceReceived || 0
                : inv.retailData?.advanceReceived || 0;
              const balance = isAuto
                ? inv.autoData?.pricing?.balanceAmount || 0
                : inv.retailData?.balanceAmount || 0;
              const dueDate = isAuto
                ? inv.autoData?.pricing?.balanceDueDate
                : inv.retailData?.balanceDueDate;

              return (
                <div
                  key={inv.id}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Invoice Identity & Customer */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {inv.invoiceNo}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {inv.invoiceDate}
                      </span>
                      {isAuto ? (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Car className="w-3 h-3 text-amber-500" /> Auto Sale
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Store className="w-3 h-3 text-sky-500" /> Retail
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{buyerName}</h4>
                      {phone && (
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {phone}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {vehicleDesc}
                    </p>
                  </div>

                  {/* Middle: Financial Status */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                        Total
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formatINR(total)}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block font-sans">
                        Collected
                      </span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatINR(advance)}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                        Balance Due
                      </span>
                      <span
                        className={`font-black text-sm ${
                          balance > 0 ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatINR(balance)}
                      </span>
                      {balance > 0 && dueDate && (
                        <div className="text-[10px] font-sans text-amber-800 mt-0.5">
                          Due: {dueDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                    {/* Record Payment Button */}
                    {balance > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentDialog(inv)}
                        className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Record Payment"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Receive ₹</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder Button */}
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(inv)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Send WhatsApp Reminder / Handover"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* View / Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="View & Edit Invoice"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete invoice ${inv.invoiceNo}?`)) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cloud Migration & Drive Sync Ready Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Drive: <strong>"AutoBill &amp; Smart Khata Invoices"</strong> sync enabled &bull; Local offline cache active.</span>
          </div>
          <span className="font-mono text-slate-600">
            {invoices.length} total entries stored locally
          </span>
        </div>
      </div>

      {/* Record Payment Sub-Dialog */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-300 max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Receive Balance Payment
              </h3>
              <button
                type="button"
                onClick={() => setActivePaymentInvoice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Recording payment for invoice <strong>{activePaymentInvoice.invoiceNo}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Amount Received (₹):
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Payment Mode:
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="UPI / QR">UPI / QR (GPay, PhonePe, Paytm)</option>
                  <option value="Cash">Cash at Dealership</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Note / Reference:
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Cleared via UPI transaction ID"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivePaymentInvoice(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                Confirm &amp; Update Khata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
