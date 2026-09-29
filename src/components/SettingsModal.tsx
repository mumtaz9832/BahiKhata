import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { X, Building2, CreditCard, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSave: (updated: BusinessProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Dealership &amp; Business Profile
              </h2>
              <p className="text-xs text-slate-400">
                These details automatically brand all your Invoices, Delivery Challans, and Payment QR codes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Dealership Identity */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5">
              1. Dealership Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Dealership / Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Tagline / Business Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  placeholder="27AABCU9603R1ZM"
                  value={formData.gstin || ''}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Dealer / Trade Code
                </label>
                <input
                  type="text"
                  placeholder="APX-PUN-094"
                  value={formData.dealerCode || ''}
                  onChange={(e) => handleChange('dealerCode', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Official Phone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Showroom / Shop Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">State &amp; Pincode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Banking */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>2. UPI QR Code &amp; Bank Settlement Accounts</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  UPI VPA / ID (Generates Dynamic Payment QR on Bills) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="dealership@upi"
                  value={formData.upiId}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Customers can scan the printed invoice with PhonePe, Google Pay, or Paytm.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => handleChange('accountHolder', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Dealership Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
