import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  ShoppingBag,
  Wrench,
  Search,
} from 'lucide-react';
import { BizcoreLogo } from './BizcoreLogo';
import { BusinessProfile } from '../types';
import {
  requestMobileOtp,
  submitMobileOtp,
  requestEmailOtp,
  submitEmailOtp,
} from '../services/otpClient';
import {
  BUSINESS_MAIN_CATEGORIES,
  BusinessMainCategory,
  SALES_SUBCATEGORIES,
  SERVICE_SUBCATEGORIES,
  isValidCategory,
  isValidSubcategory,
  validateName,
  validateMobileNumber,
  validateEmail,
  validateAddress,
  validateBusinessName,
  validateGSTIN,
} from '../config/categories';

export interface RegistrationData {
  userId?: string;
  name: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  businessAddress: string;
  businessName: string;
  gstin?: string;
  gstNumber?: string;
  category: BusinessMainCategory;
  subcategory: string;
  mobileVerified: boolean;
  emailVerified: boolean;
  mobileVerificationToken?: string;
  emailVerificationToken?: string;
}

interface SingleRegistrationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialUser?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  initialProfile?: Partial<BusinessProfile>;
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; error?: string } | void> | void;
  onSwitchToLogin?: () => void;
  isGoogleAuthenticated?: boolean;
  canCancel?: boolean;
}

export const SingleRegistrationModal: React.FC<SingleRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialUser,
  initialProfile,
  onRegister,
  onSwitchToLogin,
  isGoogleAuthenticated = false,
  canCancel = false,
}) => {
  // Resolve initial state cleanly
  const isEditingSavedProfile = Boolean(
    initialProfile?.registrationCompleted &&
    initialProfile?.name &&
    initialProfile.name !== 'BIZCORE Business' &&
    initialProfile.name !== 'BahiKhata Business'
  );

  // 1. Name
  const [name, setName] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.fullName || '';
    return initialUser?.displayName || '';
  });

  // 2. Mobile Number
  const [mobileNumber, setMobileNumber] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.mobileNumber || initialProfile?.phone || '';
    return initialUser?.phoneNumber ? initialUser.phoneNumber.replace(/\D/g, '').slice(-10) : '';
  });

  // 3. Email ID
  const [email, setEmail] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.email || '';
    return initialUser?.email || '';
  });

  // 4. Address
  const [address, setAddress] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.businessAddress || initialProfile?.address || '';
    return '';
  });

  // 5. Business Name
  const [businessName, setBusinessName] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.businessName || initialProfile?.name || '';
    return '';
  });

  // 6. GSTIN (Optional)
  const [gstin, setGstin] = useState<string>(() => {
    if (isEditingSavedProfile) return initialProfile?.gstin || initialProfile?.gstNumber || '';
    return '';
  });

  // 7. Category (Sales | Service)
  const [category, setCategory] = useState<BusinessMainCategory>(() => {
    if (initialProfile?.category === 'Sales' || initialProfile?.category === 'Service') {
      return initialProfile.category;
    }
    if (initialProfile?.businessType === 'service') return 'Service';
    return 'Sales';
  });

  // 8. Subcategory (strictly belonging to selected Category)
  const [subcategory, setSubcategory] = useState<string>(() => {
    if (initialProfile?.subcategory) {
      const cat = initialProfile.category || 'Sales';
      if (isValidSubcategory(cat, initialProfile.subcategory)) {
        return initialProfile.subcategory;
      }
    }
    return '';
  });

  // Subcategory search filter query inside modal dropdown
  const [subcategorySearch, setSubcategorySearch] = useState<string>('');

  // Mobile OTP States
  const [mobileOtpSent, setMobileOtpSent] = useState<boolean>(false);
  const [mobileOtpInput, setMobileOtpInput] = useState<string>('');
  const [mobileVerified, setMobileVerified] = useState<boolean>(false);
  const [mobileVerificationToken, setMobileVerificationToken] = useState<string | undefined>();
  const [mobileTimer, setMobileTimer] = useState<number>(0);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [isMobileSending, setIsMobileSending] = useState<boolean>(false);
  const [isMobileVerifying, setIsMobileVerifying] = useState<boolean>(false);
  const [activeMobileDemoCode, setActiveMobileDemoCode] = useState<string>('');

  // Email verification (if authenticated via Google, automatically verified)
  const [emailVerified, setEmailVerified] = useState<boolean>(Boolean(isGoogleAuthenticated && (initialUser?.email || email)));
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | undefined>();

  // Validation Error messages
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync Google user details when available
  useEffect(() => {
    if (initialUser) {
      if (initialUser.displayName && !name) {
        setName(initialUser.displayName);
      }
      if (initialUser.email) {
        if (!email) setEmail(initialUser.email);
        if (isGoogleAuthenticated) setEmailVerified(true);
      }
      if (initialUser.phoneNumber && !mobileNumber) {
        setMobileNumber(initialUser.phoneNumber.replace(/\D/g, '').slice(-10));
      }
    }
  }, [initialUser, isGoogleAuthenticated]);

  // Mobile Timer countdown
  useEffect(() => {
    if (mobileTimer <= 0) return;
    const interval = setInterval(() => setMobileTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [mobileTimer]);

  // When main category changes: clear the previous subcategory and reset search
  const handleCategoryChange = (newCategory: BusinessMainCategory) => {
    if (newCategory !== category) {
      setCategory(newCategory);
      setSubcategory(''); // Requirement: Clear the previous subcategory when the main category changes
      setSubcategorySearch('');
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        delete next.subcategory;
        return next;
      });
    }
  };

  // Subcategories available for active Category
  const availableSubcategories = useMemo(() => {
    return category === 'Sales' ? SALES_SUBCATEGORIES : SERVICE_SUBCATEGORIES;
  }, [category]);

  const filteredSubcategories = useMemo(() => {
    const q = subcategorySearch.trim().toLowerCase();
    if (!q) return availableSubcategories;
    return availableSubcategories.filter((s) => s.toLowerCase().includes(q));
  }, [availableSubcategories, subcategorySearch]);

  // Mobile OTP Handler
  const handleSendMobileOtp = async () => {
    const mobileCheck = validateMobileNumber(mobileNumber);
    if (!mobileCheck.valid) {
      setMobileError(mobileCheck.error || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setMobileError(null);
    setIsMobileSending(true);

    try {
      const res = await requestMobileOtp(mobileCheck.normalized);
      setIsMobileSending(false);
      if (res.success) {
        setMobileOtpSent(true);
        setMobileTimer(res.resendCooldown || 30);
        if (res.demoCode) {
          setActiveMobileDemoCode(res.demoCode);
          setMobileOtpInput(res.demoCode);
        }
      } else {
        setMobileError(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setIsMobileSending(false);
      setMobileError(err?.message || 'Network error sending OTP.');
    }
  };

  const handleVerifyMobileOtp = async () => {
    const mobileCheck = validateMobileNumber(mobileNumber);
    const code = mobileOtpInput.trim();
    if (!code || code.length < 6) {
      setMobileError('Please enter the 6-digit verification code.');
      return;
    }

    setMobileError(null);
    setIsMobileVerifying(true);

    try {
      const res = await submitMobileOtp(mobileCheck.normalized, code);
      setIsMobileVerifying(false);
      if (res.success) {
        setMobileVerified(true);
        setMobileVerificationToken(res.verificationToken);
        setMobileError(null);
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.mobileNumber;
          return next;
        });
      } else {
        setMobileError(res.error || 'Invalid OTP code. Please enter the correct code.');
      }
    } catch (err: any) {
      setIsMobileVerifying(false);
      setMobileError(err?.message || 'Verification failed. Please try again.');
    }
  };

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const errors: Record<string, string> = {};

    // 1. Name
    const nameCheck = validateName(name);
    if (!nameCheck.valid) errors.name = nameCheck.error!;

    // 2. Mobile Number
    const mobileCheck = validateMobileNumber(mobileNumber);
    if (!mobileCheck.valid) errors.mobileNumber = mobileCheck.error!;
    else if (!mobileVerified) {
      errors.mobileNumber = 'Please verify your mobile number with OTP before continuing.';
    }

    // 3. Email ID
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) errors.email = emailCheck.error!;

    // 4. Address
    const addressCheck = validateAddress(address);
    if (!addressCheck.valid) errors.address = addressCheck.error!;

    // 5. Business Name
    const bizNameCheck = validateBusinessName(businessName);
    if (!bizNameCheck.valid) errors.businessName = bizNameCheck.error!;

    // 6. GSTIN (Optional)
    const gstinCheck = validateGSTIN(gstin);
    if (!gstinCheck.valid) errors.gstin = gstinCheck.error!;

    // 7. Category
    if (!isValidCategory(category)) {
      errors.category = 'Please select a valid Category (Sales or Service).';
    }

    // 8. Subcategory
    if (!subcategory || !subcategory.trim()) {
      errors.subcategory = 'Please select a Subcategory.';
    } else if (!isValidSubcategory(category, subcategory)) {
      errors.subcategory = `"${subcategory}" is not a valid subcategory for ${category}.`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Server-Side Registration Validation
      const serverRes = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: initialUser?.uid,
          name: nameCheck.trimmed,
          fullName: nameCheck.trimmed,
          mobileNumber: mobileCheck.normalized,
          email: emailCheck.normalized,
          address: addressCheck.trimmed,
          businessAddress: addressCheck.trimmed,
          businessName: bizNameCheck.trimmed,
          gstin: gstinCheck.normalized || undefined,
          gstNumber: gstinCheck.normalized || undefined,
          category,
          subcategory: subcategory.trim(),
          mobileVerificationToken,
          emailVerificationToken,
          isGoogleAuthenticated,
        }),
      });

      const serverData = await serverRes.json();
      if (!serverRes.ok || !serverData.success) {
        setIsSubmitting(false);
        setGeneralError(serverData.error || 'Registration failed server validation.');
        if (serverData.errors) {
          setFieldErrors(serverData.errors);
        }
        return;
      }

      // Hand off to application state handler
      await onRegister({
        userId: initialUser?.uid || serverData.user?.id,
        name: nameCheck.trimmed,
        fullName: nameCheck.trimmed,
        mobileNumber: mobileCheck.normalized,
        email: emailCheck.normalized,
        address: addressCheck.trimmed,
        businessAddress: addressCheck.trimmed,
        businessName: bizNameCheck.trimmed,
        gstin: gstinCheck.normalized || undefined,
        gstNumber: gstinCheck.normalized || undefined,
        category,
        subcategory: subcategory.trim(),
        mobileVerified: true,
        emailVerified: true,
        mobileVerificationToken,
        emailVerificationToken,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setGeneralError(err?.message || 'Registration failed. Please check connection and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={canCancel && onClose ? onClose : undefined}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-xl transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all border border-slate-200/90 my-4 sm:my-8 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 bg-white relative shrink-0">
            {canCancel && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer z-10"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-xs">
                <BizcoreLogo variant="icon" size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Register Your Business</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Official
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Complete official business onboarding in 8 quick fields
                </p>
              </div>
            </div>

            {isGoogleAuthenticated && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Account Authenticated ({initialUser?.email})</span>
              </div>
            )}
          </div>

          {/* Form Body - Exact 8 required fields */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 text-xs">
            {generalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Registration Error: </span>
                  {generalError}
                </div>
              </div>
            )}

            {/* FIELD 1: Name * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                1. Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  placeholder="Enter full name of owner / proprietor"
                  maxLength={100}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                    fieldErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* FIELD 2: Mobile Number * (with OTP verification) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    disabled={mobileVerified}
                    value={mobileNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobileNumber(clean);
                      if (mobileVerified) setMobileVerified(false);
                      if (mobileOtpSent) setMobileOtpSent(false);
                      if (fieldErrors.mobileNumber) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.mobileNumber;
                          return next;
                        });
                      }
                    }}
                    placeholder="10-digit Indian Mobile (e.g. 9876543210)"
                    maxLength={10}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                      mobileVerified
                        ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950 font-bold'
                        : fieldErrors.mobileNumber
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                {!mobileVerified ? (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={isMobileSending || mobileTimer > 0 || mobileNumber.length < 10}
                    className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isMobileSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : mobileTimer > 0 ? (
                      `Resend in ${mobileTimer}s`
                    ) : mobileOtpSent ? (
                      'Resend OTP'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                ) : (
                  <div className="px-3 py-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5 shrink-0 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {/* Mobile OTP Box */}
              {mobileOtpSent && !mobileVerified && (
                <div className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-150">
                  <div className="text-[11px] text-amber-950 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Enter 6-digit OTP sent to +91 {mobileNumber}:</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mobileOtpInput}
                      onChange={(e) => setMobileOtpInput(e.target.value)}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      disabled={isMobileVerifying}
                      className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      disabled={isMobileVerifying || !mobileOtpInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isMobileVerifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>
                  </div>

                  {activeMobileDemoCode && process.env.NODE_ENV !== 'production' && (
                    <div className="text-[10px] text-amber-800 flex items-center justify-between">
                      <span>Dev Mode Test OTP: <strong className="font-mono">{activeMobileDemoCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setMobileOtpInput(activeMobileDemoCode)}
                        className="underline font-bold text-amber-950 cursor-pointer"
                      >
                        Auto Fill
                      </button>
                    </div>
                  )}

                  {mobileError && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{mobileError}</span>
                    </p>
                  )}
                </div>
              )}

              {fieldErrors.mobileNumber && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.mobileNumber}</span>
                </p>
              )}
            </div>

            {/* FIELD 3: Email ID * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                3. Email ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. business@example.com"
                  maxLength={120}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                    fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* FIELD 4: Address * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                4. Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.address;
                        return next;
                      });
                    }
                  }}
                  placeholder="Enter complete registered shop / business address"
                  maxLength={300}
                  className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 resize-none ${
                    fieldErrors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.address && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.address}</span>
                </p>
              )}
            </div>

            {/* FIELD 5: Business Name * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                5. Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (fieldErrors.businessName) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.businessName;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Apex Traders, Gupta Electronics"
                  maxLength={120}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                    fieldErrors.businessName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.businessName && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.businessName}</span>
                </p>
              )}
            </div>

            {/* FIELD 6: GSTIN (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  6. GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">15 Characters</span>
              </div>
              <div className="relative">
                <FileCheck2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase();
                    setGstin(clean);
                    if (fieldErrors.gstin) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.gstin;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  maxLength={15}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                    fieldErrors.gstin ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.gstin && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.gstin}</span>
                </p>
              )}
            </div>

            {/* FIELD 7: Category (Sales | Service) * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                7. Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Sales Button */}
                <button
                  type="button"
                  onClick={() => handleCategoryChange('Sales')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-2xs ${
                    category === 'Sales'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 ring-2 ring-amber-300/60 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Sales</span>
                </button>

                {/* Service Button */}
                <button
                  type="button"
                  onClick={() => handleCategoryChange('Service')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-2xs ${
                    category === 'Service'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 ring-2 ring-amber-300/60 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Service</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Selecting {category} shows only {category} subcategories. Changing category clears subcategory.
              </p>
              {fieldErrors.category && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.category}</span>
                </p>
              )}
            </div>

            {/* FIELD 8: Subcategory * (Filtered by Category) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  8. Subcategory ({category}) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500">
                  {availableSubcategories.length} {category} options
                </span>
              </div>

              {/* Subcategory Select Box with Live Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <select
                    required
                    value={subcategory}
                    onChange={(e) => {
                      setSubcategory(e.target.value);
                      if (fieldErrors.subcategory) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.subcategory;
                          return next;
                        });
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white ${
                      fieldErrors.subcategory ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  >
                    <option value="">-- Select a {category} Subcategory --</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Search filter for convenience */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={subcategorySearch}
                    onChange={(e) => setSubcategorySearch(e.target.value)}
                    placeholder={`Filter ${category} subcategories (e.g. ${category === 'Sales' ? 'Kirana, Mobile, Hardware' : 'Repair, Detailing, Electrician'})...`}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-400 bg-slate-50"
                  />
                </div>

                {/* Quick Selection Tags from search */}
                {subcategorySearch.trim() && (
                  <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    {filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setSubcategory(sub);
                            setSubcategorySearch('');
                            if (fieldErrors.subcategory) {
                              setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next.subcategory;
                                return next;
                              });
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                            subcategory === sub
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <span>{sub}</span>
                          {subcategory === sub && <Check className="w-3.5 h-3.5 text-slate-950" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 py-1 px-2">
                        No {category} subcategories match &quot;{subcategorySearch}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>

              {subcategory && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-950 border border-amber-300 rounded-full font-black text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Selected: {subcategory} ({category})</span>
                </div>
              )}

              {fieldErrors.subcategory && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.subcategory}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-900 active:bg-slate-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verifying &amp; Registering Business...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Business Registration</span>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {onSwitchToLogin && (
              <div className="text-center pt-1 text-slate-500 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  Log in with Mobile OTP
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
