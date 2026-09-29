import React from 'react';
import { SavedInvoice } from '../types';
import { numberToWords, formatINR } from '../utils/numberToWords';
import { QRCodeDisplay } from './QRCodeDisplay';
import { Zap, ShieldCheck, CheckCircle } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: SavedInvoice;
  id?: string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  id = 'printable-invoice-document',
}) => {
  const profile = invoice.businessProfile;
  const isAuto = invoice.mode === 'auto_dealer' && invoice.autoData;
  const auto = invoice.autoData;
  const retail = invoice.retailData;

  const totalAmount = isAuto
    ? auto?.pricing.totalSaleValue || 0
    : retail?.grandTotal || 0;

  const advanceAmount = isAuto
    ? auto?.pricing.advanceReceived || 0
    : retail?.advanceReceived || 0;

  const balanceAmount = isAuto
    ? auto?.pricing.balanceAmount || 0
    : retail?.balanceAmount || 0;

  const paymentMode = isAuto
    ? auto?.pricing.paymentMode || 'Cash'
    : retail?.paymentMode || 'Cash';

  const transactionRef = isAuto ? auto?.pricing.transactionRef : retail?.transactionRef;

  const isEV = isAuto && auto?.vehicle.vehicleType === 'electric_vehicle';

  return (
    <div
      id={id}
      className="printable-document bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 text-xs leading-relaxed max-w-[850px] mx-auto transition-all"
      style={{ minHeight: '1100px' }}
    >
      {/* 1. Header & Dealership Branding */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {profile.name}
            </h1>
            {isEV && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                <Zap className="w-3 h-3 text-emerald-600" /> EV Certified
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-md">
            {profile.tagline}
          </p>
          <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
            <p>
              {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
            </p>
            <p className="font-medium text-slate-800">
              Tel: <span className="font-semibold">{profile.phone}</span>
              {profile.altPhone ? ` | ${profile.altPhone}` : ''} | Email: {profile.email}
            </p>
            <div className="flex flex-wrap gap-x-4 pt-1 font-mono text-[11px] font-bold text-slate-900">
              {profile.gstin && <span>GSTIN: {profile.gstin}</span>}
              {profile.dealerCode && <span>Dealer Code: {profile.dealerCode}</span>}
            </div>
          </div>
        </div>

        {/* Invoice Title & Number Stamp */}
        <div className="text-right shrink-0">
          <div className="inline-block bg-slate-900 text-white font-extrabold text-xs uppercase px-3 py-1 rounded tracking-wider mb-2">
            {isAuto ? 'VEHICLE SALE INVOICE' : 'TAX INVOICE'}
          </div>
          <div className="space-y-1 text-[11px]">
            <p>
              <span className="text-slate-500 font-medium">Invoice No: </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {invoice.invoiceNo}
              </span>
            </p>
            <p>
              <span className="text-slate-500 font-medium">Invoice Date: </span>
              <span className="font-semibold text-slate-900">{invoice.invoiceDate}</span>
            </p>
            {isAuto && (
              <p>
                <span className="text-slate-500 font-medium">Delivery: </span>
                <span className="font-semibold text-slate-900">
                  {invoice.deliveryDate} ({invoice.deliveryTime})
                </span>
              </p>
            )}
            <p>
              <span className="text-slate-500 font-medium">Payment Status: </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  balanceAmount === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {balanceAmount === 0 ? 'PAID IN FULL' : 'PARTIAL / BALANCE PENDING'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Buyer Details (Bill To) */}
      <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 mb-5">
        <div className="flex justify-between items-center mb-1.5 border-b border-slate-200 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {isAuto ? 'Purchaser / Registered Owner Details (Bill To)' : 'Billed To (Customer)'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Place of Supply: {profile.state}
          </span>
        </div>

        {isAuto && auto ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <p className="text-sm font-bold text-slate-900">{auto.buyer.fullName}</p>
              <p className="text-slate-700 mt-0.5">
                {auto.buyer.address}, {auto.buyer.city}, {auto.buyer.state} - {auto.buyer.pincode}
              </p>
            </div>
            <div className="sm:text-right space-y-0.5">
              <p>
                <span className="text-slate-500">Contact: </span>
                <span className="font-semibold font-mono text-slate-900">{auto.buyer.phone}</span>
              </p>
              {auto.buyer.idNumber && (
                <p>
                  <span className="text-slate-500">{auto.buyer.idType}: </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {auto.buyer.idNumber}
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : retail ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <p className="text-sm font-bold text-slate-900">{retail.customer.fullName}</p>
              <p className="text-slate-700 mt-0.5">{retail.customer.address || 'Local Cash Customer'}</p>
            </div>
            <div className="sm:text-right space-y-0.5">
              <p>
                <span className="text-slate-500">Mobile: </span>
                <span className="font-semibold font-mono text-slate-900">{retail.customer.phone}</span>
              </p>
              {retail.customer.gstin && (
                <p>
                  <span className="text-slate-500">Customer GSTIN: </span>
                  <span className="font-mono font-semibold text-slate-900">{retail.customer.gstin}</span>
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. Core Specification Table: Auto Dealer vs General Retail */}
      {isAuto && auto ? (
        <div className="mb-5">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider flex justify-between items-center">
            <span>Vehicle Technical &amp; Registration Particulars</span>
            <span className="text-[10px] text-amber-300 font-mono">
              Category: {auto.vehicle.vehicleType.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-2.5 font-semibold text-slate-600 w-1/4 border-r border-slate-200">
                  Make &amp; Model
                </td>
                <td className="p-2.5 font-bold text-slate-900 w-1/4 border-r border-slate-200 text-sm">
                  {auto.vehicle.make} {auto.vehicle.model}
                </td>
                <td className="p-2.5 font-semibold text-slate-600 w-1/4 border-r border-slate-200">
                  Variant / Trim
                </td>
                <td className="p-2.5 text-slate-900 font-medium w-1/4">
                  {auto.vehicle.variant || 'Standard'}
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  Registration No. (RC)
                </td>
                <td className="p-2.5 font-mono font-black text-slate-900 border-r border-slate-200 text-sm">
                  {auto.vehicle.registrationNo || 'NEW / TEMPORARY'}
                </td>
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  Manufacturing Year / Color
                </td>
                <td className="p-2.5 text-slate-900 font-medium">
                  {auto.vehicle.manufacturingYear} &bull; {auto.vehicle.color}
                </td>
              </tr>

              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  Chassis No. (VIN)
                </td>
                <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">
                  {auto.vehicle.chassisNo}
                </td>
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  {isEV ? 'Electric Motor No.' : 'Engine No.'}
                </td>
                <td className="p-2.5 font-mono font-bold text-slate-900">
                  {auto.vehicle.engineMotorNo}
                </td>
              </tr>

              <tr className="border-b border-slate-200">
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  Odometer / Fuel Type
                </td>
                <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">
                  <span className="font-mono font-bold">{auto.vehicle.odometerKm} KM</span> &bull; {auto.vehicle.fuelType}
                </td>
                <td className="p-2.5 font-semibold text-slate-600 border-r border-slate-200">
                  Hypothecation (HPA)
                </td>
                <td className="p-2.5 text-slate-900 font-medium">
                  {auto.vehicle.hypothecationBank || 'None (Self Financed)'}
                </td>
              </tr>

              {/* Conditional EV Specifications */}
              {isEV && (
                <tr className="bg-emerald-50/60 border-t-2 border-emerald-500">
                  <td className="p-2.5 font-bold text-emerald-950 border-r border-emerald-200">
                    EV Battery &amp; Motor Specs
                  </td>
                  <td className="p-2.5 text-emerald-900 border-r border-emerald-200 font-medium" colSpan={3}>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-emerald-700 block">Battery Capacity:</span>
                        <span className="font-bold">{auto.vehicle.batteryCapacityKwh || 'Lithium-Ion'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block">Charger Serial No:</span>
                        <span className="font-mono font-bold">{auto.vehicle.chargerSerialNo || 'Standard'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block">Battery Warranty:</span>
                        <span className="font-bold text-emerald-800">{auto.vehicle.batteryWarrantyYears || 'Standard Manufacturer'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : retail ? (
        <div className="mb-5">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white text-left font-bold">
                <th className="p-2 border border-slate-800 w-10 text-center">#</th>
                <th className="p-2 border border-slate-800">Item Description</th>
                <th className="p-2 border border-slate-800 text-center w-20">HSN</th>
                <th className="p-2 border border-slate-800 text-center w-16">Qty</th>
                <th className="p-2 border border-slate-800 text-right w-24">Rate (₹)</th>
                <th className="p-2 border border-slate-800 text-center w-16">GST</th>
                <th className="p-2 border border-slate-800 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {retail.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-2 border border-slate-200 text-center font-mono">{index + 1}</td>
                  <td className="p-2 border border-slate-200 font-semibold">{item.description}</td>
                  <td className="p-2 border border-slate-200 text-center font-mono text-[11px]">{item.hsn}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold font-mono">{item.qty} {item.unit}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{item.rate.toLocaleString('en-IN')}</td>
                  <td className="p-2 border border-slate-200 text-center font-mono">{item.gstPercent}%</td>
                  <td className="p-2 border border-slate-200 text-right font-bold font-mono">
                    {Math.round(item.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 4. Financial Breakdown & Balance Settlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 items-start">
        {/* Left: Amount in Words & Notes */}
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Invoice Amount in Words:
            </span>
            <p className="text-xs font-bold text-slate-800 italic">
              {numberToWords(totalAmount)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payment Details &amp; Settlement:</span>
            </div>
            <p>
              <span className="text-slate-500">Settled via:</span>{' '}
              <span className="font-semibold text-slate-900">{paymentMode}</span>
              {transactionRef && (
                <span className="font-mono text-[10px] ml-1 text-slate-600">
                  (Ref: {transactionRef})
                </span>
              )}
            </p>
            {balanceAmount > 0 ? (
              <p className="mt-1 text-amber-800 font-semibold bg-amber-50 p-1.5 rounded border border-amber-200">
                &bull; Balance ₹{balanceAmount.toLocaleString('en-IN')} is due on or before{' '}
                <span className="underline font-mono">
                  {isAuto ? auto?.pricing.balanceDueDate : retail?.balanceDueDate || 'Handover'}
                </span>
                .
              </p>
            ) : (
              <p className="mt-1 text-emerald-800 font-semibold bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Full sale value realized. No outstanding balance due.
              </p>
            )}

            {isAuto && auto?.pricing.notes && (
              <p className="mt-2 text-slate-600">
                <span className="font-medium text-slate-700">Remarks:</span> {auto.pricing.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right: Detailed Price Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {isAuto && auto ? (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-600">Vehicle Base / Ex-Showroom</td>
                    <td className="p-2 text-right font-mono font-medium">
                      ₹{auto.pricing.basePrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-600">RTO Tax &amp; Smartcard Reg</td>
                    <td className="p-2 text-right font-mono font-medium">
                      ₹{auto.pricing.rtoCharges.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-600">Comprehensive Insurance</td>
                    <td className="p-2 text-right font-mono font-medium">
                      ₹{auto.pricing.insuranceCharges.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {auto.pricing.accessoriesCharges > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="p-2 text-slate-600">Accessories / Special Kits</td>
                      <td className="p-2 text-right font-mono font-medium">
                        ₹{auto.pricing.accessoriesCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  {auto.pricing.discount > 0 && (
                    <tr className="border-b border-slate-100 text-rose-600">
                      <td className="p-2">Discount / Dealer Subsidy (-)</td>
                      <td className="p-2 text-right font-mono font-semibold">
                        -₹{auto.pricing.discount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </>
              ) : retail ? (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-600">Subtotal (Net)</td>
                    <td className="p-2 text-right font-mono font-medium">
                      ₹{Math.round(retail.subtotal).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-600">Total GST</td>
                    <td className="p-2 text-right font-mono font-medium">
                      ₹{Math.round(retail.totalGst).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {retail.discount > 0 && (
                    <tr className="border-b border-slate-100 text-rose-600">
                      <td className="p-2">Discount (-)</td>
                      <td className="p-2 text-right font-mono font-semibold">
                        -₹{retail.discount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </>
              ) : null}

              {/* Total Row */}
              <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900">
                <td className="p-2.5 text-xs uppercase">Total Deal Value</td>
                <td className="p-2.5 text-right font-mono text-sm text-slate-900">
                  ₹{Math.round(totalAmount).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Token / Advance Row */}
              <tr className="border-b border-slate-200 text-emerald-800 bg-emerald-50/50">
                <td className="p-2 font-medium">Token / Advance Received</td>
                <td className="p-2 text-right font-mono font-bold">
                  ₹{Math.round(advanceAmount).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Remaining Balance Row */}
              <tr className={`font-black ${balanceAmount > 0 ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-950'}`}>
                <td className="p-2.5 text-xs uppercase">Remaining Balance Due</td>
                <td className="p-2.5 text-right font-mono text-sm">
                  ₹{Math.round(balanceAmount).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. UPI QR Code, Bank Account Details & Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-300 pt-4 mb-6 items-center">
        {/* Bank Details */}
        <div className="text-[11px] text-slate-600 space-y-0.5 sm:col-span-2">
          <div className="font-bold uppercase text-[10px] text-slate-800 tracking-wider mb-1">
            Bank Transfer Details (NEFT / RTGS / IMPS)
          </div>
          <p>
            <span className="text-slate-500">Account Holder:</span>{' '}
            <span className="font-semibold text-slate-900">{profile.accountHolder}</span>
          </p>
          <p>
            <span className="text-slate-500">Bank &amp; Branch:</span>{' '}
            <span className="font-semibold text-slate-900">{profile.bankName}</span>
          </p>
          <p>
            <span className="text-slate-500">Account No:</span>{' '}
            <span className="font-mono font-bold text-slate-900">{profile.accountNumber}</span>
          </p>
          <p>
            <span className="text-slate-500">IFSC Code:</span>{' '}
            <span className="font-mono font-bold text-slate-900">{profile.ifscCode}</span>
          </p>
          <div className="mt-2 text-[10px] text-slate-500">
            Terms: Vehicle delivered in sound condition. Subject to {profile.city} jurisdiction.
          </div>
        </div>

        {/* UPI QR Code */}
        <div className="flex justify-end">
          <QRCodeDisplay
            upiId={profile.upiId}
            payeeName={profile.name}
            amount={balanceAmount > 0 ? balanceAmount : undefined}
            transactionNote={`Inv ${invoice.invoiceNo}`}
            size={95}
          />
        </div>
      </div>

      {/* 6. Signature Blocks */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center">
        <div>
          <div className="h-12 flex items-end justify-center">
            <span className="text-[11px] text-slate-400 italic">Signature on handover</span>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800 text-xs">Customer / Purchaser Signature</p>
            <p className="text-[10px] text-slate-500">Acknowledged receipt of vehicle &amp; keys</p>
          </div>
        </div>

        <div>
          <div className="h-12 flex items-end justify-center">
            <span className="text-[11px] text-slate-400 italic">Official Seal &amp; Signature</span>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-900 text-xs">For {profile.name}</p>
            <p className="text-[10px] text-slate-500">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-400 mt-6 pt-2 border-t border-slate-100">
        This is a computer-generated tax &amp; sale invoice generated via AutoBill &amp; Smart Khata.
      </div>
    </div>
  );
};
