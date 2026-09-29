import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

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
  transactionNote = 'Payment for Vehicle Invoice',
  size = 110,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!upiId) return;

    // Standard NPCI UPI URI Scheme
    let upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      payeeName
    )}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

    if (amount && amount > 0) {
      upiUri += `&am=${amount.toFixed(2)}`;
    }

    QRCode.toDataURL(upiUri, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [upiId, payeeName, amount, transactionNote, size]);

  if (!upiId) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-200 text-center ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="UPI Payment QR Code"
          width={size}
          height={size}
          className="mx-auto block"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-slate-100 flex items-center justify-center text-xs text-slate-400"
        >
          Generating QR...
        </div>
      )}
      <div className="mt-1 text-[10px] font-semibold text-slate-700 tracking-tight">
        Scan &amp; Pay via UPI
      </div>
      <div className="text-[9px] font-mono text-slate-500 truncate max-w-[130px]">
        {upiId}
      </div>
    </div>
  );
};
