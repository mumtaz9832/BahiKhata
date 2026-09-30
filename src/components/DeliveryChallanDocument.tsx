import React from 'react';
import { SavedInvoice } from '../types';
import { formatINR } from '../utils/numberToWords';
import {
  ShieldAlert,
  CheckSquare,
  Zap,
  Clock,
  Key,
  Printer,
  Download,
  MessageCircle,
  QrCode,
  Loader2,
} from 'lucide-react';

interface DeliveryChallanDocumentProps {
  invoice: SavedInvoice;
  id?: string;
  hasWatermark?: boolean;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenQR?: () => void;
  isPdfGenerating?: boolean;
}

export const DeliveryChallanDocument: React.FC<DeliveryChallanDocumentProps> = ({
  invoice,
  id = 'printable-challan-document',
  hasWatermark = false,
  onPrint,
  onDownloadPDF,
  onOpenWhatsApp,
  onOpenQR,
  isPdfGenerating = false,
}) => {
  const profile = invoice.businessProfile;
  const isAuto = invoice.mode === 'auto_dealer' && invoice.autoData;
  const auto = invoice.autoData;
  const isEV = isAuto && auto?.vehicle.vehicleType === 'electric_vehicle';

  if (!isAuto || !auto) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        <p>Delivery Challan is only available for Auto Dealer Mode (Vehicle Sales).</p>
      </div>
    );
  }

  const v = auto.vehicle;
  const b = auto.buyer;
  const p = auto.pricing;

  return (
    <div
      id={id}
      className="printable-document bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 text-xs leading-relaxed max-w-[850px] mx-auto transition-all"
      style={{ minHeight: '1100px' }}
    >
      {/* Quick Action Toolbar (Visible on screen, Hidden in Print) */}
      {(onPrint || onDownloadPDF || onOpenWhatsApp || onOpenQR) && (
        <div className="no-print mb-6 p-3 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wide">
              Vehicle Delivery Challan &amp; Agreement
            </span>
            <span className="text-slate-400 text-[11px] font-mono">#DC-{invoice.invoiceNo}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                title="Print this challan directly"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span>Print Challan</span>
              </button>
            )}

            {onDownloadPDF && (
              <button
                type="button"
                onClick={onDownloadPDF}
                disabled={isPdfGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Download A4 PDF format"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}

            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                title="Send handover note on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}

            {onOpenQR && profile.upiId && (
              <button
                type="button"
                onClick={onOpenQR}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                title="Open counter QR for customer"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Show UPI QR</span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* 1. Official Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {profile.name}
            </h1>
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              FORM 21 / CHALLAN
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {profile.tagline}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            {profile.address}, {profile.city}, {profile.state} - {profile.pincode} | Tel: {profile.phone}
          </p>
          {profile.gstin && (
            <p className="text-[11px] font-mono font-semibold text-slate-800">
              GSTIN: {profile.gstin} | Dealership Reg: {profile.dealerCode || 'APX-01'}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block bg-amber-500 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded tracking-wider mb-2">
            VEHICLE DELIVERY CHALLAN &amp; HANDOVER AGREEMENT
          </div>
          <div className="space-y-1 text-[11px]">
            <p>
              <span className="text-slate-500">Challan / Ref No: </span>
              <span className="font-mono font-bold text-slate-900">
                DC-{invoice.invoiceNo}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Handover Date: </span>
              <span className="font-semibold text-slate-900">{invoice.deliveryDate}</span>
            </p>
            <p>
              <span className="text-slate-500">Handover Exact Time: </span>
              <span className="font-bold font-mono text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                {invoice.deliveryTime || '04:30 PM'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Buyer & Vehicle Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Buyer Identity */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
            Buyer / Custodian Particulars
          </span>
          <p className="text-sm font-bold text-slate-900">{b.fullName}</p>
          <p className="text-slate-700 text-xs mt-0.5">
            {b.address}, {b.city}, {b.state} - {b.pincode}
          </p>
          <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between font-mono text-xs">
            <span>Phone: <strong>{b.phone}</strong></span>
            <span>{b.idType}: <strong>{b.idNumber || 'Verified'}</strong></span>
          </div>
        </div>

        {/* Vehicle Identity */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
            Vehicle Delivered
          </span>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900">
              {v.make} {v.model}
            </span>
            <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
              {v.registrationNo || 'UNREGISTERED'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mt-2 pt-1 border-t border-slate-200 font-mono">
            <div>Chassis: <strong>{v.chassisNo}</strong></div>
            <div>{isEV ? 'Motor:' : 'Engine:'} <strong>{v.engineMotorNo}</strong></div>
            <div>Color: <strong>{v.color}</strong></div>
            <div>Odometer: <strong>{v.odometerKm} KM</strong></div>
          </div>
        </div>
      </div>

      {/* 3. Conditional EV Hardware Section */}
      {isEV && (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950 mb-1">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Electric Vehicle (EV) Hardware &amp; Battery Safety Certificate</span>
          </div>
          <p className="text-[11px] text-emerald-900 mb-2">
            The high-voltage lithium traction battery and portable fast charger have been tested and handed over in full operating condition.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-emerald-950">
            <div>
              <span className="text-[10px] text-emerald-700 block">Battery Pack:</span>
              <strong>{v.batteryCapacityKwh || 'Original Battery Pack'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block">Charger Serial No:</span>
              <strong>{v.chargerSerialNo || 'Standard Charger Handed'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block">Warranty Period:</span>
              <strong>{v.batteryWarrantyYears || 'Manufacturer Norms'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. Handover Checklist Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
        <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Items, Accessories &amp; Documents Handed Over To Buyer</span>
          </span>
          <span className="text-[10px] text-slate-500">All Items Physically Inspected</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-white text-xs">
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Registration Certificate (RC / Smartcard / Temp)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Comprehensive Insurance Policy</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pollution Under Control (PUC) Certificate</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Two (2) Sets of Original Keys / Remote Fobs</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Standard Tool Kit &amp; First Aid Box</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isEV ? 'Home Fast Charger & Cable Kit' : 'Owner’s Manual & Warranty Guide'}</span>
          </div>
        </div>
      </div>

      {/* 5. Auto-Generated Legal Clauses & Indemnity Agreement */}
      <div className="border-2 border-slate-300 rounded-lg p-4 bg-slate-50/80 mb-5 avoid-break page-break-avoid">
        <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-900 uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Statutory Handover Undertaking &amp; Legal Indemnity Declaration</span>
        </div>

        <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed text-justify">
          <p>
            <strong>1. Transfer of Possession &amp; Custody:</strong> The seller hereby certifies that physical possession of vehicle <strong>{v.make} {v.model}</strong> (Chassis No: <code>{v.chassisNo}</code>, Engine/Motor No: <code>{v.engineMotorNo}</code>) has been formally delivered to <strong>{b.fullName}</strong> on <strong>{invoice.deliveryDate}</strong> at exactly <strong>{invoice.deliveryTime}</strong> with odometer showing <strong>{v.odometerKm} KM</strong>.
          </p>

          <p>
            <strong>2. Immediate Transfer of Road &amp; Accident Liabilities:</strong> From the precise handover date and time stated above (<strong>{invoice.deliveryDate}, {invoice.deliveryTime}</strong>), all civil, criminal, traffic, police, and third-party liabilities arising from the operation of this vehicle—including but not limited to motor vehicle accidents, hit-and-run claims under the Motor Vehicles Act 1988, e-challans, traffic camera fines, toll dues, or unlawful carriage of goods/persons—shall belong <strong>strictly, entirely, and solely to the Buyer ({b.fullName})</strong>.
          </p>

          <p>
            <strong>3. Seller Indemnity:</strong> The buyer explicitly indemnifies and holds harmless the seller (<strong>{profile.name}</strong>, its directors, partners, and staff) against any loss, legal dispute, police summons, court litigation, or monetary penalties arising post-handover.
          </p>

          <p>
            <strong>4. Clear Title &amp; No Encumbrance:</strong> The seller confirms that this vehicle is legally sold, is free from pending police seizures or criminal warrants, and holds clear title subject to hypothecation notes mentioned in the invoice (<strong>{v.hypothecationBank || 'None'}</strong>).
          </p>

          <p>
            <strong>5. Settlement of Consideration:</strong> Total sale consideration is <strong>{formatINR(p?.totalSaleValue || 0)}</strong>. Amount received to date is <strong>{formatINR(p?.advanceReceived || 0)}</strong>. Outstanding balance of <strong>{formatINR(p?.balanceAmount || 0)}</strong> shall be paid by the buyer on or before <strong>{p?.balanceDueDate || invoice.deliveryDate || 'Handover'}</strong>.
          </p>
        </div>
      </div>

      {/* 6. Signature & Acceptance Block */}
      <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center avoid-break page-break-avoid">
        {/* Buyer Signature */}
        <div className="space-y-1">
          <div className="h-14 flex items-end justify-center">
            <span className="text-[11px] text-slate-400 italic">Signature of Buyer / Custodian</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900 text-xs">{b.fullName}</p>
            <p className="text-[10px] text-slate-500">I accept delivery and agree to all terms above</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {invoice.deliveryDate} | Time: {invoice.deliveryTime}</p>
          </div>
        </div>

        {/* Dealer Signatory */}
        <div className="space-y-1">
          <div className="h-14 flex items-end justify-center">
            <span className="text-[11px] text-slate-400 italic">Seal &amp; Signature</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900 text-xs">For {profile.name}</p>
            <p className="text-[10px] text-slate-500">Authorized Dealer Representative</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Place: {profile.city}, {profile.state}</p>
          </div>
        </div>
      </div>

      {/* Watermark for Free Tier */}
      {hasWatermark && (
        <div className="mt-4 pt-2 border-t border-slate-200 text-center avoid-break page-break-avoid">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-semibold">
            <span>⚡ Powered by BahiKhata</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-amber-700">Free Tier</span>
          </div>
        </div>
      )}

      <div className="text-center text-[9px] text-slate-400 mt-4 pt-2 border-t border-slate-100">
        Generated legally under Motor Vehicles Rules &bull; AutoBill &amp; Smart Khata Platform.
      </div>
    </div>
  );
};
