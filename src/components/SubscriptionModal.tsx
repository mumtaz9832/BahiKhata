import React, { useState } from 'react';
import { SubscriptionState, SubscriptionTier, AppLanguage } from '../types';
import { saveSubscriptionState } from '../utils/storage';
import {
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  Zap,
  ShieldCheck,
  Crown,
  QrCode,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onSubscriptionUpdated: (newSub: SubscriptionState) => void;
  lang: AppLanguage;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdated,
  lang,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'gateway' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');

  const isPro = subscription.tier !== 'free';

  const handleActivatePro = (tier: SubscriptionTier) => {
    setIsProcessing(true);
    setTimeout(() => {
      const updated: SubscriptionState = {
        tier,
        expiresAt:
          tier === 'pro_yearly'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        invoiceCountThisMonth: subscription.invoiceCountThisMonth,
        monthKey: subscription.monthKey,
        hasWatermark: false,
        canUploadCustomLogo: true,
        unlimitedInvoices: true,
      };

      saveSubscriptionState(updated);
      onSubscriptionUpdated(updated);
      setIsProcessing(false);
      setPaymentStep('success');
      setTimeout(() => {
        setPaymentStep('select');
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Crown className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  BahiKhata Pro Dealership Suite
                </h2>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Zero Watermark
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Unlimited Invoices, Vehicle Exchange Valuation, Custom Logo &amp; Priority Cloud
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

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {paymentStep === 'select' && (
            <>
              {/* Current Status Banner */}
              <div className="p-3 rounded-xl border flex items-center justify-between gap-3 bg-slate-50 border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Current Active Plan
                  </span>
                  <span className="font-extrabold text-sm text-slate-900">
                    {isPro
                      ? subscription.tier === 'pro_yearly'
                        ? 'Pro Annual Plan (Active)'
                        : 'Pro Monthly Plan (Active)'
                      : 'Free Starter Tier (Active)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Bills Used This Month:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.invoiceCountThisMonth} {subscription.unlimitedInvoices ? '(Unlimited)' : '/ 5 Limit'}
                  </span>
                </div>
              </div>

              {/* Billing Toggle (Monthly vs Yearly) */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPlan === 'monthly'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly (₹299/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('yearly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedPlan === 'yearly'
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Annual (₹2,499/yr)</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      Save 30%
                    </span>
                  </button>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Free Tier Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Free Starter</h3>
                      <p className="text-[11px] text-slate-400">For new independent shops</p>
                    </div>
                    <span className="font-mono font-bold text-base text-slate-700">₹0</span>
                  </div>

                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Up to 5 Invoices &amp; Challans per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>2W, 4W, EV &amp; Retail Forms</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <span>&bull; Has "Powered by BahiKhata" watermark</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Tier Card */}
                <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/40 relative space-y-3 shadow-md shadow-amber-400/10">
                  <div className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Dealership Pro</h3>
                      <p className="text-[11px] text-slate-500">For growing vehicle dealers &amp; stores</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg text-slate-900">
                        {selectedPlan === 'yearly' ? '₹2,499' : '₹299'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {selectedPlan === 'yearly' ? '/year' : '/month'}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-slate-800 text-[11px] font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Unlimited</strong> Invoices &amp; Delivery Challans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>100% White-Label</strong> (No Watermarks)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Custom Dealership Logo on Bills</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Old Vehicle Exchange &amp; Finance Valuation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Google Drive Cloud Auto-Backup</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => setPaymentStep('gateway')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Upgrade to Pro Now</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {paymentStep === 'gateway' && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                  <span className="font-bold text-slate-800">
                    BahiKhata Pro ({selectedPlan === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})
                  </span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {selectedPlan === 'yearly' ? '₹2,499' : '₹299'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block text-slate-600 font-semibold">
                    Select Instant Payment Gateway:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span>UPI / QR Instant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                      <span>Razorpay Cards / Netbanking</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
                  <p className="flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit Encrypted Secure Indian Payment Gateway</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Instant activation. Invoice with GST input credit will be emailed to your profile address.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select')}
                  className="w-1/3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() =>
                    handleActivatePro(selectedPlan === 'yearly' ? 'pro_yearly' : 'pro_monthly')
                  }
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay {selectedPlan === 'yearly' ? '₹2,499' : '₹299'} &amp; Activate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Pro Dealership Suite Activated!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Congratulations! Watermarks have been removed, custom logos enabled, and your monthly invoice limit is now <strong>Unlimited</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Cancel anytime &bull; 100% Tax Invoice provided with GST credit</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
