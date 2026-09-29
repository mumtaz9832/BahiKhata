/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AppMode,
  SavedInvoice,
  AutoDealerData,
  RetailData,
  BusinessProfile,
  PaymentMode,
} from './types';
import {
  getBusinessProfile,
  saveBusinessProfile,
  getSavedInvoices,
  saveInvoice,
  deleteInvoice,
  recordInvoicePayment,
  generateNextInvoiceNo,
  DEFAULT_BUSINESS_PROFILE,
} from './utils/storage';
import { exportElementToPDF, triggerPrintDialog } from './utils/pdfExport';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AutoDealerForm } from './components/AutoDealerForm';
import { RetailForm } from './components/RetailForm';
import { InvoiceDocument } from './components/InvoiceDocument';
import { DeliveryChallanDocument } from './components/DeliveryChallanDocument';
import { WhatsAppModal } from './components/WhatsAppModal';
import { KhataLedger } from './components/KhataLedger';
import { SettingsModal } from './components/SettingsModal';
import {
  FileText,
  FileCheck2,
  Printer,
  Download,
  MessageCircle,
  Save,
  Check,
  Eye,
  Edit3,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';

const INITIAL_AUTO_DATA: AutoDealerData = {
  buyer: {
    fullName: 'Rahul Sharma',
    phone: '+91 98220 12345',
    altPhone: '+91 94220 54321',
    idType: 'Aadhaar Card',
    idNumber: '4829-9182-3741',
    address: 'Flat 402, Green Acres Society, Baner',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
  },
  vehicle: {
    vehicleType: 'electric_vehicle',
    make: 'Ola Electric',
    model: 'S1 Pro Gen 2',
    variant: '4 kWh Matte Black',
    registrationNo: 'MH12 VK 8821',
    chassisNo: 'MD9XX4KWH26B88192',
    engineMotorNo: 'EM-OLA-2026-9932',
    manufacturingYear: 2026,
    color: 'Matte Stellar Black',
    odometerKm: 12,
    fuelType: 'Electric',
    batteryCapacityKwh: '4.0 kWh (IP67)',
    chargerSerialNo: 'CHG-750W-992014',
    batteryWarrantyYears: '8 Years / 80,000 KM',
    motorPowerKw: '11 kW Peak',
    hypothecationBank: 'IDFC First Bank Two-Wheeler Loan',
  },
  pricing: {
    basePrice: 139999,
    rtoCharges: 3500,
    insuranceCharges: 6200,
    accessoriesCharges: 2500,
    discount: 4000,
    totalSaleValue: 148199,
    advanceReceived: 100000,
    balanceAmount: 48199,
    paymentMode: 'UPI / QR',
    transactionRef: 'UPI/628919283741',
    balanceDueDate: '2026-10-05',
    notes: 'Includes helmet, floor mat, and 750W home fast charger.',
  },
};

const INITIAL_RETAIL_DATA: RetailData = {
  customer: {
    fullName: 'Vikram Patel',
    phone: '+91 98900 67890',
    address: 'Shop 12, Auto Market, Pune',
    gstin: '27AABCP9876Q1Z2',
  },
  items: [
    {
      id: 'item_1',
      description: 'Fully Synthetic 4T Engine Oil 15W-50 (1L)',
      hsn: '2710',
      qty: 4,
      unit: 'Btls',
      rate: 850,
      gstPercent: 18,
      amount: 4012,
    },
    {
      id: 'item_2',
      description: 'Disc Brake Pad Set (Front & Rear)',
      hsn: '8708',
      qty: 2,
      unit: 'Sets',
      rate: 1200,
      gstPercent: 18,
      amount: 2832,
    },
  ],
  subtotal: 5800,
  discount: 300,
  totalGst: 1044,
  grandTotal: 6544,
  advanceReceived: 5000,
  balanceAmount: 1544,
  paymentMode: 'UPI / QR',
  transactionRef: 'UPI/8892104921',
  balanceDueDate: '2026-10-02',
  notes: 'Original OEM spares.',
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('auto_dealer');
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [currentId, setCurrentId] = useState<string>('draft_' + Date.now());

  // Meta fields
  const [invoiceNo, setInvoiceNo] = useState<string>('APX-2026-0043');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryTime, setDeliveryTime] = useState<string>('04:30 PM');

  // Form states
  const [autoData, setAutoData] = useState<AutoDealerData>(INITIAL_AUTO_DATA);
  const [retailData, setRetailData] = useState<RetailData>(INITIAL_RETAIL_DATA);

  // Document preview tab
  const [previewTab, setPreviewTab] = useState<'invoice' | 'challan'>('invoice');

  // Mobile split view tab ('form' | 'preview')
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Modals
  const [isKhataOpen, setIsKhataOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState<SavedInvoice | null>(null);

  // UI state
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadedProfile = getBusinessProfile();
    setProfile(loadedProfile);
    const loadedInvoices = getSavedInvoices();
    setInvoices(loadedInvoices);
  }, []);

  // Assemble active invoice object
  const activeInvoice: SavedInvoice = useMemo(() => {
    const isAuto = mode === 'auto_dealer';
    const balance = isAuto
      ? autoData.pricing.balanceAmount
      : retailData.balanceAmount;

    return {
      id: currentId,
      invoiceNo,
      invoiceDate,
      deliveryDate,
      deliveryTime,
      mode,
      autoData: isAuto ? autoData : undefined,
      retailData: !isAuto ? retailData : undefined,
      businessProfile: profile,
      status: balance === 0 ? 'PAID' : 'PARTIAL',
      paymentHistory: [
        {
          id: 'pay_init',
          date: invoiceDate,
          amount: isAuto ? autoData.pricing.advanceReceived : retailData.advanceReceived,
          mode: isAuto ? autoData.pricing.paymentMode : retailData.paymentMode,
          reference: isAuto ? autoData.pricing.transactionRef : retailData.transactionRef,
          note: 'Token / Advance payment',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    currentId,
    invoiceNo,
    invoiceDate,
    deliveryDate,
    deliveryTime,
    mode,
    autoData,
    retailData,
    profile,
  ]);

  // Count pending debtors
  const pendingCount = useMemo(() => {
    return invoices.filter((inv) => {
      const bal =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing.balanceAmount || 0
          : inv.retailData?.balanceAmount || 0;
      return bal > 0;
    }).length;
  }, [invoices]);

  // Actions
  const handleSaveToKhata = () => {
    const updated = saveInvoice(activeInvoice);
    setInvoices(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleNewInvoice = () => {
    const nextNo = generateNextInvoiceNo();
    setInvoiceNo(nextNo);
    setCurrentId('inv_' + Date.now());
    const today = new Date().toISOString().slice(0, 10);
    setInvoiceDate(today);
    setDeliveryDate(today);
    setDeliveryTime('04:00 PM');

    if (mode === 'auto_dealer') {
      setAutoData({
        buyer: {
          fullName: '',
          phone: '',
          idType: 'Aadhaar Card',
          idNumber: '',
          address: '',
          city: profile.city || 'Pune',
          state: profile.state || 'Maharashtra',
          pincode: profile.pincode || '',
        },
        vehicle: {
          vehicleType: 'two_wheeler',
          make: 'Hero MotoCorp',
          model: 'Splendor Plus',
          registrationNo: 'NEW',
          chassisNo: '',
          engineMotorNo: '',
          manufacturingYear: 2026,
          color: 'Black',
          odometerKm: 5,
          fuelType: 'Petrol',
        },
        pricing: {
          basePrice: 79000,
          rtoCharges: 7000,
          insuranceCharges: 5200,
          accessoriesCharges: 1500,
          discount: 1000,
          totalSaleValue: 91700,
          advanceReceived: 25000,
          balanceAmount: 66700,
          paymentMode: 'UPI / QR',
          balanceDueDate: today,
        },
      });
    } else {
      setRetailData({
        customer: {
          fullName: '',
          phone: '',
          address: '',
        },
        items: [
          {
            id: 'item_' + Date.now(),
            description: '',
            hsn: '',
            qty: 1,
            unit: 'Pcs',
            rate: 0,
            gstPercent: 18,
            amount: 0,
          },
        ],
        subtotal: 0,
        discount: 0,
        totalGst: 0,
        grandTotal: 0,
        advanceReceived: 0,
        balanceAmount: 0,
        paymentMode: 'UPI / QR',
        balanceDueDate: today,
      });
    }
  };

  const handleSelectInvoiceFromKhata = (inv: SavedInvoice) => {
    setCurrentId(inv.id);
    setInvoiceNo(inv.invoiceNo);
    setInvoiceDate(inv.invoiceDate);
    setDeliveryDate(inv.deliveryDate || inv.invoiceDate);
    setDeliveryTime(inv.deliveryTime || '04:00 PM');
    setMode(inv.mode);

    if (inv.mode === 'auto_dealer' && inv.autoData) {
      setAutoData(inv.autoData);
    } else if (inv.mode === 'general_retail' && inv.retailData) {
      setRetailData(inv.retailData);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const updated = deleteInvoice(id);
    setInvoices(updated);
  };

  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    payMode: PaymentMode,
    note: string
  ) => {
    const result = recordInvoicePayment(invoiceId, {
      date: new Date().toISOString().slice(0, 10),
      amount,
      mode: payMode,
      note,
    });
    setInvoices(result.all);

    // If active invoice was the one updated, refresh current state
    if (activeInvoice.id === invoiceId && result.updatedInvoice) {
      if (result.updatedInvoice.autoData) {
        setAutoData(result.updatedInvoice.autoData);
      }
      if (result.updatedInvoice.retailData) {
        setRetailData(result.updatedInvoice.retailData);
      }
    }
  };

  const handleDownloadPDF = async () => {
    const elementId =
      previewTab === 'invoice'
        ? 'printable-invoice-document'
        : 'printable-challan-document';

    const filename = `${invoiceNo}_${
      previewTab === 'invoice' ? 'Tax-Invoice' : 'Delivery-Challan'
    }.pdf`;

    await exportElementToPDF(elementId, filename, setIsPdfGenerating);
  };

  const handleSaveProfile = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    saveBusinessProfile(newProfile);
  };

  const openWhatsAppWithCurrent = () => {
    setWhatsAppInvoice(activeInvoice);
    setIsWhatsAppOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      {/* 1. Header Navigation */}
      <Header
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'general_retail' && previewTab === 'challan') {
            setPreviewTab('invoice');
          }
        }}
        onOpenKhata={() => setIsKhataOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewInvoice={handleNewInvoice}
        pendingBalanceCount={pendingCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* KPI Stats Bar */}
        <StatsBar
          invoices={invoices}
          onFilterPendingClick={() => setIsKhataOpen(true)}
        />

        {/* Mobile View Toggle Bar */}
        <div className="lg:hidden flex items-center justify-center mb-4 bg-white p-1 rounded-xl border border-slate-200 shadow-xs no-print">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'form'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>1. Edit Details &amp; Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. Live Preview &amp; Print</span>
          </button>
        </div>

        {/* Split Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Input Form (48% width / 6 cols on lg) */}
          <div
            className={`lg:col-span-6 space-y-6 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {mode === 'auto_dealer' ? (
              <AutoDealerForm
                data={autoData}
                onChange={setAutoData}
                invoiceNo={invoiceNo}
                onInvoiceNoChange={setInvoiceNo}
                invoiceDate={invoiceDate}
                onInvoiceDateChange={setInvoiceDate}
                deliveryDate={deliveryDate}
                onDeliveryDateChange={setDeliveryDate}
                deliveryTime={deliveryTime}
                onDeliveryTimeChange={setDeliveryTime}
              />
            ) : (
              <RetailForm
                data={retailData}
                onChange={setRetailData}
                invoiceNo={invoiceNo}
                onInvoiceNoChange={setInvoiceNo}
                invoiceDate={invoiceDate}
                onInvoiceDateChange={setInvoiceDate}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Document Preview & Output Actions (52% width / 6 cols on lg) */}
          <div
            className={`lg:col-span-6 space-y-4 ${
              mobileTab === 'form' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Action Bar Sticky on Desktop */}
            <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-sm no-print space-y-3">
              {/* Document Type Switcher */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('invoice')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'invoice'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Tax / Sale Bill</span>
                  </button>

                  {mode === 'auto_dealer' && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('challan')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        previewTab === 'challan'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Delivery Challan &amp; Agreement</span>
                    </button>
                  )}
                </div>

                {/* Save to Khata Button */}
                <button
                  type="button"
                  onClick={handleSaveToKhata}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Save invoice into Khata ledger"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-slate-950" />
                      <span>Save Khata</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Output Actions */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* 1. PDF Download */}
                <button
                  type="button"
                  disabled={isPdfGenerating}
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPdfGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>PDF Download</span>
                    </>
                  )}
                </button>

                {/* 2. Print / Save PDF via Browser */}
                <button
                  type="button"
                  onClick={triggerPrintDialog}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print (A4)</span>
                </button>

                {/* 3. WhatsApp Reminder */}
                <button
                  type="button"
                  onClick={openWhatsAppWithCurrent}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="overflow-x-auto pb-8">
              {previewTab === 'invoice' ? (
                <InvoiceDocument
                  invoice={activeInvoice}
                  id="printable-invoice-document"
                />
              ) : (
                <DeliveryChallanDocument
                  invoice={activeInvoice}
                  id="printable-challan-document"
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">AutoBill &amp; Smart Khata</span> &bull; Built for Two-Wheeler, Four-Wheeler, EV Dealers &amp; Retailers.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsKhataOpen(true)}
              className="hover:text-slate-700 underline cursor-pointer"
            >
              Open Digital Khata
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-700 underline cursor-pointer"
            >
              Dealership Profile
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <WhatsAppModal
        invoice={whatsAppInvoice}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      <KhataLedger
        isOpen={isKhataOpen}
        onClose={() => setIsKhataOpen(false)}
        invoices={invoices}
        onSelectInvoice={handleSelectInvoiceFromKhata}
        onDeleteInvoice={handleDeleteInvoice}
        onRecordPayment={handleRecordPayment}
        onOpenWhatsApp={(inv) => {
          setWhatsAppInvoice(inv);
          setIsWhatsAppOpen(true);
        }}
        onRefreshInvoices={() => {
          setInvoices(getSavedInvoices());
          setProfile(getBusinessProfile());
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
