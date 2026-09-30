import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { formatINR } from '../utils/numberToWords';

interface QRCodeDisplayProps {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  upiId,
  payeeName,
  amount,
  transactionNote = 'Vehicle Invoice Settlement',
  size = 110,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const hasPayableBalance = amount !== undefined && amount > 0;

  useEffect(() => {
    if (!upiId) return;

    // Standard NPCI UPI URI Scheme
    let upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      payeeName
    )}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

    if (hasPayableBalance) {
      // Precise format with 2 decimals as required by NPCI banking specs
      upiUri += `&am=${amount.toFixed(2)}`;
    }

    QRCode.toDataURL(upiUri, {
      width: size * 2, // High resolution for sharp camera scanning on mobile
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [upiId, payeeName, amount, transactionNote, size, hasPayableBalance]);

  if (!upiId) return null;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs ${className}`}
    >
      {hasPayableBalance ? (
        <>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Dynamic UPI Payment QR Code"
              width={size}
              height={size}
              className="mx-auto block rounded"
            />
          ) : (
            <div
              style={{ width: size, height: size }}
              className="bg-slate-100 flex items-center justify-center text-xs text-slate-400"
            >
              Generating QR...
            </div>
          )}

          <div className="mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black font-mono tracking-tight">
            Pay {formatINR(amount)}
          </div>

          <div className="mt-1 text-[9px] font-semibold text-slate-600">
            Scan via GPay / PhonePe / Paytm / BHIM
          </div>
        </>
      ) : (
        <div className="p-3 text-center flex flex-col items-center justify-center" style={{ minWidth: size }}>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-emerald-800">100% PAID</span>
          <span className="text-[9px] text-slate-500">Nil Balance Outstanding</span>
        </div>
      )}

      {/* UPI ID footer */}
      <button
        type="button"
        onClick={copyUpiId}
        className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
        title="Click to copy UPI ID"
      >
        <span>{upiId}</span>
        {copied ? (
          <Check className="w-2.5 h-2.5 text-emerald-600" />
        ) : (
          <Copy className="w-2.5 h-2.5 text-slate-400" />
        )}
      </button>
    </div>
  );
};
