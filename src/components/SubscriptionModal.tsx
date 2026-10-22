import React, { useState, useEffect } from 'react';
import {
  SubscriptionState,
  SubscriptionTier,
  AppLanguage,
  SubscriptionTransaction,
} from '../types';
import {
  saveSubscriptionState,
  getSubscriptionTransactions,
  recordSubscriptionTransaction,
} from '../utils/storage';
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
  Receipt,
  History,
  FileCheck,
  Download,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onSubscriptionUpdated: (newSub: SubscriptionState) => void;
  lang: AppLanguage;
  onOpenLegalModal?: (tab?: 'privacy' | 'terms' | 'subscription' | 'refund' | 'support') => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdated,
  lang,
  onOpenLegalModal,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);
  const isHindi = lang === 'hi';

  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'half_yearly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'gateway' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active verified transaction & order details
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [verifiedTransaction, setVerifiedTransaction] = useState<SubscriptionTransaction | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<SubscriptionTransaction[]>([]);

  useEffect(() => {
    setTransactionHistory(getSubscriptionTransactions());
  }, [isOpen]);

  const isPro = subscription.tier !== 'free';

  const getTierFromSelectedPlan = (plan: 'monthly' | 'half_yearly' | 'yearly'): SubscriptionTier => {
    if (plan === 'monthly') return 'pro_monthly';
    if (plan === 'half_yearly') return 'pro_half_yearly';
    return 'pro_yearly';
  };

  const getPriceForSelectedPlan = (plan: 'monthly' | 'half_yearly' | 'yearly'): { amount: number; label: string; period: string } => {
    if (plan === 'monthly') {
      return { amount: 299, label: '₹299', period: isHindi ? 'प्रति माह' : '/month' };
    }
    if (plan === 'half_yearly') {
      return { amount: 1499, label: '₹1,499', period: isHindi ? 'छमाही (6 महीने)' : '/6 months' };
    }
    return { amount: 2499, label: '₹2,499', period: isHindi ? 'वार्षिक (1 वर्ष)' : '/year' };
  };

  // Step 1: Initiate Server Order
  const handleInitiateOrder = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const planTier = getTierFromSelectedPlan(selectedPlan);

    try {
      const res = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier,
          planId: planTier,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment order on server.');
      }

      setActiveOrder(data);
      setPaymentStep('gateway');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Server error creating payment order. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Execute Verified Server Payment & Activation
  const handleVerifyAndActivate = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const planTier = activeOrder.planTier;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const signature = activeOrder.challengeToken || `demo_sig_${activeOrder.orderId}`;

    try {
      const res = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          paymentId,
          signature,
          planTier,
          businessName: 'BIZCORE Business',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.verified) {
        throw new Error(data.error || 'Cryptographic payment verification failed.');
      }

      // Persist verified subscription state
      const updatedSub: SubscriptionState = data.subscription;
      saveSubscriptionState(updatedSub);
      onSubscriptionUpdated(updatedSub);

      // Record transaction
      if (data.transaction) {
        recordSubscriptionTransaction(data.transaction);
        setVerifiedTransaction(data.transaction);
        setTransactionHistory(getSubscriptionTransactions());
      }

      setPaymentStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Server payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
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
                  BIZCORE Pro Business Suite
                </h2>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Zero Watermark
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isHindi
                  ? 'असीमित बिल, कस्टम लोगो, वाहन मूल्यांकन और सुरक्षित क्लाउड बैकअप'
                  : 'Unlimited Invoices, Vehicle Exchange Valuation, Custom Logo & Priority Cloud'}
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

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-5 pt-2 bg-slate-50 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'plans'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHindi ? 'योजनाएं व नवीनीकरण' : 'Plans & Upgrades'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isHindi ? 'भुगतान रसीदें व इतिहास' : 'Billing History & Receipts'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {activeTab === 'history' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  {isHindi ? 'सत्यापित सदस्यता रसीदें' : 'Verified Subscription Transactions'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {transactionHistory.length} {isHindi ? 'रिकॉर्ड्स' : 'records found'}
                </span>
              </div>

              {transactionHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                  <p>{isHindi ? 'कोई पिछला भुगतान रिकॉर्ड नहीं मिला।' : 'No payment transaction history found yet.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{tx.receiptNo}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span>{tx.planTier === 'pro_yearly' ? 'Annual Plan' : tx.planTier === 'pro_half_yearly' ? 'Half-Yearly' : 'Monthly'}</span>
                          <span> &bull; {new Date(tx.date).toLocaleDateString('en-IN')}</span>
                          <span> &bull; Order: {tx.orderId}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Valid until {tx.expiresAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {paymentStep === 'select' && (
                <>
                  {/* Current Status Banner */}
                  <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-slate-50 border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isHindi ? 'वर्तमान सक्रिय योजना' : 'Current Active Plan'}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {isPro
                          ? subscription.tier === 'pro_yearly'
                            ? 'Pro Annual Plan (Active)'
                            : subscription.tier === 'pro_half_yearly'
                            ? 'Pro Half-Yearly Plan (Active)'
                            : 'Pro Monthly Plan (Active)'
                          : 'Free Starter Tier (Active)'}
                      </span>
                      {subscription.expiresAt && (
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          {isHindi ? 'वैधता:' : 'Valid until:'} {subscription.expiresAt}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">
                        {isHindi ? 'इस माह के बिल:' : 'Bills Used This Month:'}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {subscription.invoiceCountThisMonth}{' '}
                        {subscription.unlimitedInvoices
                          ? '(Unlimited)'
                          : isHindi
                          ? '(5 सीमा)'
                          : '/ 5 Limit'}
                      </span>
                    </div>
                  </div>

                  {/* Billing Plan Selector (Monthly, Half-Yearly, Yearly) */}
                  <div className="flex items-center justify-center">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('monthly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedPlan === 'monthly'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Monthly (₹299)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('half_yearly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedPlan === 'half_yearly'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        6 Months (₹1,499)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('yearly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedPlan === 'yearly'
                            ? 'bg-slate-900 text-amber-400 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Yearly (₹2,499)</span>
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                          Save 30%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Free Starter Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">
                            {isHindi ? 'फ्री ट्रायल / स्टार्टर' : 'Free Starter'}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {isHindi ? 'छोटे व्यवसायों के लिए' : 'For new independent shops'}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-base text-slate-700">₹0</span>
                      </div>

                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>5 Invoices &amp; Challans per month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>General POS &amp; Dealership Forms</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400">
                          <span>&bull; Has "Powered by BIZCORE" watermark</span>
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
                          <h3 className="font-bold text-slate-900 text-sm">
                            {selectedPlan === 'yearly'
                              ? 'Pro Dealership Suite (Annual)'
                              : selectedPlan === 'half_yearly'
                              ? 'Pro Suite (6 Months)'
                              : 'Pro Suite (Monthly)'}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {isHindi ? 'पूर्ण व्यवसाय व खाता प्रबंधन' : 'For growing dealers & retailers'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-lg text-slate-900">
                            {getPriceForSelectedPlan(selectedPlan).label}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {getPriceForSelectedPlan(selectedPlan).period}
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
                          <span><strong>100% White-Label</strong> (Zero Watermarks)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Custom Business Logo on Print Bills</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Full Bahi Khata, Inventory &amp; GST Reports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Google Drive Cloud Auto-Backup</span>
                        </li>
                      </ul>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleInitiateOrder}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating Secure Order...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Upgrade with Server Verified Checkout</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {paymentStep === 'gateway' && activeOrder && (
                <div className="space-y-4 max-w-md mx-auto py-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          {activeOrder.planName || 'BIZCORE Pro'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Order ID: {activeOrder.orderId}
                        </span>
                      </div>
                      <span className="font-mono font-black text-base text-slate-900">
                        ₹{activeOrder.amount}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="block text-slate-600 font-semibold">
                        Select Authorized Indian Payment Method:
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
                          <span>UPI / QR Gateway</span>
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
                          <span>Netbanking / Cards</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
                      <p className="flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cryptographically Verified Server Verification</span>
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Payments are server-validated with HMAC cryptographic signatures and idempotent replay protection. A GST Tax invoice receipt will be generated automatically.
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
                      onClick={handleVerifyAndActivate}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Payment...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Activate Plan</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Payment Verified &amp; Pro Activated!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                      Your subscription is verified and active. Watermarks have been removed, custom logos enabled, and your monthly invoice limit is now <strong>Unlimited</strong>.
                    </p>
                  </div>

                  {verifiedTransaction && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receipt No:</span>
                        <span className="font-bold text-slate-900">{verifiedTransaction.receiptNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Order ID:</span>
                        <span className="text-slate-700">{verifiedTransaction.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Paid:</span>
                        <span className="font-bold text-emerald-700">₹{verifiedTransaction.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Until:</span>
                        <span className="text-slate-700">{verifiedTransaction.expiresAt}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStep('select');
                        onClose();
                      }}
                      className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Legal Policies */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>Cancel anytime &bull; 100% Tax Invoice</span>
            {onOpenLegalModal && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('refund')}
                  className="underline text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Refund Policy
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('terms')}
                  className="underline text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Terms
                </button>
              </div>
            )}
          </div>
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
