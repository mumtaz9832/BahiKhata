import React, { useState, useEffect } from 'react';
import { SavedInvoice } from '../types';
import {
  generateWhatsAppMessage,
  WhatsAppTemplateType,
  sanitizePhoneNumber,
} from '../utils/whatsapp';
import {
  MessageCircle,
  Copy,
  ExternalLink,
  Check,
  X,
  Send,
  Sparkles,
  Phone,
} from 'lucide-react';

interface WhatsAppModalProps {
  invoice: SavedInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const [activeTemplate, setActiveTemplate] = useState<WhatsAppTemplateType>('balance_due');
  const [phone, setPhone] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (invoice) {
      const generated = generateWhatsAppMessage(invoice, activeTemplate);
      setMessageText(generated.text);
      const buyerPhone =
        invoice.mode === 'auto_dealer'
          ? invoice.autoData?.buyer.phone || ''
          : invoice.retailData?.customer.phone || '';
      setPhone(buyerPhone);
    }
  }, [invoice, activeTemplate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const clean = sanitizePhoneNumber(phone);
    const encoded = encodeURIComponent(messageText);
    const url = clean
      ? `https://wa.me/${clean}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const isAuto = invoice.mode === 'auto_dealer';
  const balance = isAuto
    ? invoice.autoData?.pricing.balanceAmount || 0
    : invoice.retailData?.balanceAmount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">WhatsApp Smart Messenger</h3>
              <p className="text-[11px] text-emerald-100">
                Send pre-filled payment reminders and vehicle handover notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Template Tabs */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">
              Choose Message Intent:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTemplate('balance_due')}
                className={`py-2 px-2 rounded-lg text-center font-semibold border transition-all cursor-pointer ${
                  activeTemplate === 'balance_due'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">💰 Balance Due</div>
                <div className="text-[9px] text-slate-500 font-normal">
                  Pending ₹{balance.toLocaleString('en-IN')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTemplate('delivery_congrats')}
                className={`py-2 px-2 rounded-lg text-center font-semibold border transition-all cursor-pointer ${
                  activeTemplate === 'delivery_congrats'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">🎉 Handover</div>
                <div className="text-[9px] text-slate-500 font-normal">Congratulations</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTemplate('payment_receipt')}
                className={`py-2 px-2 rounded-lg text-center font-semibold border transition-all cursor-pointer ${
                  activeTemplate === 'payment_receipt'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">🧾 Receipt</div>
                <div className="text-[9px] text-slate-500 font-normal">Payment Ack</div>
              </button>
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Customer WhatsApp Number:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Formatted automatically with country code (+91 for India).
            </p>
          </div>

          {/* Editable Message Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-600 font-semibold">Pre-filled Message Preview:</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard!' : 'Copy text'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 font-sans text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
