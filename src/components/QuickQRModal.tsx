import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Smartphone, ExternalLink, Printer } from 'lucide-react';
import { formatINR, numberToWords } from '../utils/numberToWords';

interface QuickQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNo: string;
}

export const QuickQRModal: React.FC<QuickQRModalProps> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
  amount,
  invoiceNo,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customUpi, setCustomUpi] = useState<string>(upiId || '');
  const [isEditingUpi, setIsEditingUpi] = useState<boolean>(false);

  useEffect(() => {
    if (upiId) {
      setCustomUpi(upiId);
    }
  }, [upiId]);

  const effectiveUpi = (customUpi.trim() || upiId?.trim() || 'merchant@upi');
  const effectivePayee = payeeName?.trim() || 'BahiKhata Merchant';

  useEffect(() => {
    if (!isOpen) return;

    let upiUri = `upi://pay?pa=${encodeURIComponent(effectiveUpi)}&pn=${encodeURIComponent(
      effectivePayee
    )}&tn=${encodeURIComponent(`Invoice ${invoiceNo || 'Payment'}`)}&cu=INR`;

    if (amount > 0) {
      upiUri += `&am=${amount.toFixed(2)}`;
    }

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1,
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate high-res QR:', err));
  }, [isOpen, effectiveUpi, effectivePayee, amount, invoiceNo]);

  if (!isOpen) return null;

  const copyUpiId = () => {
    navigator.clipboard.writeText(effectiveUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment QR - ${invoiceNo}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h2 { margin-bottom: 5px; color: #0f172a; }
            p { margin: 4px 0; color: #475569; }
            .amt { font-size: 24px; font-weight: bold; color: #059669; margin: 15px 0; }
            img { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
          </style>
        </head>
        <body>
          <h2>${effectivePayee}</h2>
          <p>Scan & Pay via any UPI App (GPay, PhonePe, Paytm)</p>
          <div class="amt">${formatINR(amount)}</div>
          <img src="${dataUrl}" width="260" height="260" />
          <p style="margin-top: 15px; font-family: monospace;">UPI ID: ${effectiveUpi}</p>
          <p style="font-size: 12px; color: #64748b;">Invoice Ref: ${invoiceNo}</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Instant UPI Payment QR</h3>
              <p className="text-[11px] text-slate-300">Customer counter scan-to-pay</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Payee Details */}
          <div className="mb-2">
            <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
              Payee Merchant
            </span>
            <h4 className="font-bold text-slate-900 text-base">{effectivePayee}</h4>
          </div>

          {/* Amount Chip */}
          <div className="mb-4 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center w-full">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
              Payable Balance
            </span>
            <span className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
              {formatINR(amount)}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 italic">
              {numberToWords(amount)}
            </span>
          </div>

          {/* QR Canvas */}
          <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-sm relative group">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Dynamic UPI QR Code"
                width={220}
                height={220}
                className="rounded-lg block mx-auto"
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* Supported Apps */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Works with Google Pay, PhonePe, Paytm, BHIM &amp; Banking UPI</span>
          </div>

          {/* UPI ID copy and inline editor */}
          <div className="mt-3 w-full space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-mono text-slate-700 font-semibold truncate text-[11px]">
                {effectiveUpi}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingUpi(!isEditingUpi)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                >
                  {isEditingUpi ? 'Done' : 'Change'}
                </button>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditingUpi && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                <input
                  type="text"
                  value={customUpi}
                  onChange={(e) => setCustomUpi(e.target.value)}
                  placeholder="Enter UPI ID (e.g. yourname@okaxis)"
                  className="flex-1 px-2.5 py-1 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingUpi(false)}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button
              type="button"
              onClick={handlePrintQR}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Counter QR</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
