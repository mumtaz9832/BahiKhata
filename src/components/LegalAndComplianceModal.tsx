import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  CreditCard,
  RotateCcw,
  Headphones,
  Download,
  Trash2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { exportBackupData, purgeAllFalseData } from '../utils/storage';

export type LegalTab = 'privacy' | 'terms' | 'subscription' | 'refund' | 'data' | 'support';

interface LegalAndComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  lang?: AppLanguage;
  onDataPurged?: () => void;
}

export const LegalAndComplianceModal: React.FC<LegalAndComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  lang = 'en',
  onDataPurged,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const isHindi = lang === 'hi';

  const handleExportData = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIZCORE_User_Data_Export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAccountData = () => {
    if (
      window.confirm(
        isHindi
          ? 'चेतावनी: क्या आप अपने खाते का सारा डेटा स्थायी रूप से हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।'
          : 'WARNING: Are you sure you want to permanently delete and erase all local business data and billing records? This action cannot be undone.'
      )
    ) {
      purgeAllFalseData();
      localStorage.clear();
      if (onDataPurged) onDataPurged();
      alert('All local account records have been permanently erased.');
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isHindi ? 'गोपनीयता, कानूनी शर्तें व सहायता' : 'Privacy, Legal Terms & Policies'}
              </h2>
              <p className="text-xs text-slate-300">
                BIZCORE Business Compliance, Data Protection &amp; Support Standards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 px-4 pt-2 bg-slate-50 gap-2 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription Terms</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'refund'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Data &amp; Privacy Rights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'support'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Support &amp; Contact</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">1. Privacy Policy &amp; Data Collection Notice</h3>
              <p>
                BIZCORE operates on a privacy-conscious architecture. Personal information collected during registration
                (Name, Mobile Number, Email ID, Business Name, Business Address, GSTIN, Category, Subcategory) is collected
                strictly for account authorization, tax compliance, invoicing generation, and customer communication.
              </p>
              <h4 className="font-bold text-slate-800">Local and Cloud Data Storage</h4>
              <p>
                Your invoice data, inventory items, and customer ledger entries are saved securely in your browser's local
                IndexedDB storage and optionally synchronized to dedicated user-isolated cloud Firestore databases. We do
                not sell, monetize, or disclose your client ledgers or business transactions to third parties.
              </p>
              <h4 className="font-bold text-slate-800">Third-Party Services</h4>
              <p>
                When you choose to backup to Google Drive or send WhatsApp reminders, authentication and transmission occur
                directly via authorized protocols. BIZCORE does not retain your Google Drive refresh tokens or WhatsApp message
                contents on unauthorized external servers.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">2. Terms of Service</h3>
              <p>
                By using BIZCORE, you agree to comply with Indian financial and commercial regulations, including GST rules
                applicable to your category and turnover. You are solely responsible for ensuring the accuracy of tax rates,
                HSN/SAC codes, vehicle identification numbers (VIN/chassis), and seller identity on issued invoices.
              </p>
              <h4 className="font-bold text-slate-800">Acceptable Use</h4>
              <p>
                BIZCORE may not be used for fraudulent billing, fake tax credit claims, unauthorized financial transactions, or
                unlawful activities. You agree to maintain authorized administrative credentials and not disclose 2FA tokens.
              </p>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">3. Subscription Terms &amp; Renewal</h3>
              <p>
                BIZCORE offers transparent subscription tiers:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Free Starter Tier:</strong> ₹0, includes up to 5 bills per calendar month with standard watermark.</li>
                <li><strong>Pro Monthly:</strong> ₹299 for 30 calendar days of unlimited invoicing, custom branding, and zero watermark.</li>
                <li><strong>Pro Half-Yearly:</strong> ₹1,499 for 180 calendar days.</li>
                <li><strong>Pro Yearly (Annual):</strong> ₹2,499 for 365 calendar days with priority cloud backup.</li>
              </ul>
              <h4 className="font-bold text-slate-800">Billing &amp; Expiration</h4>
              <p>
                Subscriptions do not automatically charge hidden fees. Upon expiration, your account gracefully transitions
                to the Free Starter limit without any loss of your existing invoices, customer ledgers, or product inventory.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">4. Refund and Cancellation Policy</h3>
              <p>
                We strive for total merchant satisfaction. If you encounter technical difficulties with the Pro Business Suite
                or wish to request a refund, please contact support within <strong>7 days</strong> of purchase.
              </p>
              <h4 className="font-bold text-slate-800">Refund Processing</h4>
              <p>
                Verified refund requests are processed back to the original Indian payment method (UPI, Netbanking, or Card)
                within 5–7 business days. Upon refund completion, Pro tier features will be reverted to the Free Starter tier.
              </p>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">5. Data Portability, Deletion &amp; Retention</h3>
                <p className="mt-1">
                  You own 100% of your business data. You can download an encrypted, unadulterated JSON backup of all your
                  invoices, customers, inventory products, and ledger transactions at any time.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Export Full Business Data</span>
                </h4>
                <p className="text-slate-600">
                  Export all your historical invoices, parties, inventory, and accounting balances in standardized JSON format.
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Download Complete Data Backup (.json)
                </button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <h4 className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Permanent Account Deletion &amp; Data Erasure</span>
                </h4>
                <p className="text-red-700">
                  Permanently delete all local business records, customer transactions, and invoices from this device.
                  This operation cannot be reversed.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccountData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Permanently Erase All Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">6. Merchant Support &amp; Grievance Redressal</h3>
              <p>
                For technical assistance, billing inquiries, invoice customization, or GST filing data export guidance:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Representative:</span>
                  <span className="font-bold text-slate-900">Mumtaz Khan</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Support Email:</span>
                  <a href="mailto:mumtazkhan9832@gmail.com" className="text-indigo-600 underline font-bold">
                    mumtazkhan9832@gmail.com
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Authorized Helpline:</span>
                  <span className="font-bold text-slate-900">+91 96473 98509</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Application:</span>
                  <span className="font-bold text-slate-800">BIZCORE Business Suite</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Compliant with Indian IT Act 2000 &amp; Digital Personal Data Protection standards.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
