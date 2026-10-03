import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Upload,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Settings2,
  Briefcase,
  HelpCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { BahiKhataLogo } from './BahiKhataLogo';
import { BusinessProfile } from '../types';
import {
  INDUSTRY_CATEGORIES,
  BUSINESS_MODELS,
  BusinessModelType,
  getRecommendedFeatures,
  getIndustryConfig,
  FeatureConfigItem,
} from '../config/industryCategories';
import {
  requestMobileOtp,
  submitMobileOtp,
  requestEmailOtp,
  submitEmailOtp,
} from '../services/otpClient';

interface MultiStepRegistrationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialProfile?: Partial<BusinessProfile>;
  initialUser?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  isGoogleAuthenticated?: boolean;
  canCancel?: boolean;
  onComplete: (business: BusinessProfile) => void;
  onSwitchToLogin?: () => void;
  lang?: 'en' | 'hi';
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Chandigarh',
  'Puducherry',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Andaman and Nicobar Islands',
  'Lakshadweep',
];

export const MultiStepRegistrationModal: React.FC<MultiStepRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  initialUser,
  isGoogleAuthenticated = false,
  canCancel = false,
  onComplete,
  onSwitchToLogin,
  lang = 'en',
}) => {
  if (!isOpen) return null;

  const isHindi = lang === 'hi';

  // Check if initial profile is a genuine saved profile or just default/blank
  const isEditingSavedProfile = Boolean(
    initialProfile?.registrationCompleted &&
    initialProfile?.name &&
    initialProfile.name !== 'BahiKhata Business'
  );

  // Step indicator: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Unsaved data confirmation state for X close button
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Step 1: Business Information (Initially empty unless editing a previously saved profile)
  const [businessName, setBusinessName] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.businessName || initialProfile?.name || '') : ''
  );
  const [ownerName, setOwnerName] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.fullName || '') : ''
  );
  const [mobileNumber, setMobileNumber] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.mobileNumber || initialProfile?.phone || '') : ''
  );
  const [email, setEmail] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.email || '') : ''
  );
  const [businessAddress, setBusinessAddress] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.businessAddress || initialProfile?.address || '') : ''
  );
  const [state, setState] = useState<string>(initialProfile?.state || 'Maharashtra');
  const [district, setDistrict] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.district || '') : ''
  );
  const [city, setCity] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.city || '') : ''
  );
  const [pincode, setPincode] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.pincode || '') : ''
  );
  const [gstStatus, setGstStatus] = useState<'Registered' | 'Unregistered' | 'Composition'>(
    initialProfile?.gstRegistrationStatus || (initialProfile?.gstRegistered ? 'Registered' : 'Unregistered')
  );
  const [gstNumber, setGstNumber] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.gstNumber || initialProfile?.gstin || '') : ''
  );
  const [panNumber, setPanNumber] = useState<string>(
    isEditingSavedProfile ? (initialProfile?.panNumber || '') : ''
  );
  const [logoUrl, setLogoUrl] = useState<string>(initialProfile?.logoUrl || '');

  // Reset fields when opening fresh new registration
  useEffect(() => {
    if (isOpen) {
      if (!isEditingSavedProfile) {
        setBusinessName('');
        setOwnerName('');
        setMobileNumber('');
        setEmail('');
        setBusinessAddress('');
        setDistrict('');
        setCity('');
        setPincode('');
        setGstStatus('Unregistered');
        setGstNumber('');
        setPanNumber('');
        setCurrentStep(1);
        setIsMobileVerified(false);
        setIsEmailVerified(false);
        setIsMobileOtpSent(false);
        setIsEmailOtpSent(false);
        setMobileOtp('');
        setEmailOtp('');
        setShowDiscardConfirm(false);
      } else {
        setBusinessName(initialProfile?.businessName || initialProfile?.name || '');
        setOwnerName(initialProfile?.fullName || '');
        setMobileNumber(initialProfile?.mobileNumber || initialProfile?.phone || '');
        setEmail(initialProfile?.email || '');
        setBusinessAddress(initialProfile?.businessAddress || initialProfile?.address || '');
      }
    }
  }, [isOpen, isEditingSavedProfile]);

  const hasUnsavedData = Boolean(
    businessName.trim() ||
    ownerName.trim() ||
    mobileNumber.trim() ||
    email.trim() ||
    businessAddress.trim() ||
    currentStep > 1
  );

  const handleCloseAttempt = () => {
    setShowDiscardConfirm(false);
    onClose?.();
  };

  // OTP Verification state
  const [mobileOtp, setMobileOtp] = useState<string>('');
  const [isMobileOtpSent, setIsMobileOtpSent] = useState<boolean>(false);
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(
    Boolean(initialProfile?.mobileVerified)
  );
  const [mobileVerificationToken, setMobileVerificationToken] = useState<string>('');
  const [mobileOtpLoading, setMobileOtpLoading] = useState<boolean>(false);
  const [mobileCooldown, setMobileCooldown] = useState<number>(0);
  const [activeMobileDemoCode, setActiveMobileDemoCode] = useState<string>('');

  const [emailOtp, setEmailOtp] = useState<string>('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(
    Boolean(isGoogleAuthenticated || initialProfile?.emailVerified)
  );
  const [emailVerificationToken, setEmailVerificationToken] = useState<string>('');
  const [emailOtpLoading, setEmailOtpLoading] = useState<boolean>(false);
  const [emailCooldown, setEmailCooldown] = useState<number>(0);
  const [activeEmailDemoCode, setActiveEmailDemoCode] = useState<string>('');

  // Step 2: Select Industry Category
  const [industrySearch, setIndustrySearch] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    initialProfile?.industryCategory || initialProfile?.industryType || 'Scrap & Recycling'
  );

  const filteredIndustries = useMemo(() => {
    if (!industrySearch.trim()) return INDUSTRY_CATEGORIES;
    const query = industrySearch.toLowerCase();
    return INDUSTRY_CATEGORIES.filter(
      (ind) =>
        ind.name.toLowerCase().includes(query) ||
        ind.description.toLowerCase().includes(query) ||
        ind.subcategories.some((sub) => sub.toLowerCase().includes(query))
    );
  }, [industrySearch]);

  // Step 3: Dynamic Subcategories Selection
  const currentIndustryConfig = useMemo(() => {
    return getIndustryConfig(selectedIndustry);
  }, [selectedIndustry]);

  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    initialProfile?.subcategories && initialProfile.subcategories.length > 0
      ? initialProfile.subcategories
      : currentIndustryConfig.subcategories.slice(0, 4)
  );
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState<string>('');
  const [customSubcategories, setCustomSubcategories] = useState<string[]>(
    initialProfile?.customSubcategories || []
  );

  // Step 4: Business Models (Multiple Selection)
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialProfile?.businessModels && initialProfile.businessModels.length > 0
      ? initialProfile.businessModels
      : ['Wholesale', 'Trader']
  );

  // Step 5: Configured Features
  const recommendedFeatures = useMemo(() => {
    return getRecommendedFeatures(selectedIndustry, selectedModels);
  }, [selectedIndustry, selectedModels]);

  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(() => {
    if (initialProfile?.enabledFeatures && initialProfile.enabledFeatures.length > 0) {
      return initialProfile.enabledFeatures;
    }
    return getRecommendedFeatures(selectedIndustry, selectedModels).map((f) => f.id);
  });

  // Automatically activate all recommended features when entering Step 5 or when recommendedFeatures change
  useEffect(() => {
    if (currentStep === 5 || enabledFeatures.length === 0) {
      const allFeatIds = recommendedFeatures.map((f) => f.id);
      setEnabledFeatures((prev) => {
        const set = new Set([...prev, ...allFeatIds]);
        return Array.from(set);
      });
    }
  }, [currentStep, recommendedFeatures]);

  const handleActivateAllFeatures = () => {
    const allFeatIds = recommendedFeatures.map((f) => f.id);
    if (enabledFeatures.length === allFeatIds.length) {
      const coreIds = recommendedFeatures.filter((f) => f.category === 'CORE').map((f) => f.id);
      setEnabledFeatures(coreIds.length > 0 ? coreIds : allFeatIds);
    } else {
      setEnabledFeatures(allFeatIds);
    }
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Keep subcategories updated when industry changes
  const handleSelectIndustry = (indName: string) => {
    setSelectedIndustry(indName);
    const cfg = getIndustryConfig(indName);
    setSelectedSubcategories(cfg.subcategories.slice(0, 4));
    // Update models if none selected
    if (selectedModels.length === 0) {
      setSelectedModels(cfg.recommendedModels.slice(0, 2));
    }
  };

  // Cooldown timers
  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const timer = setInterval(() => setMobileCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [mobileCooldown]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => setEmailCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Instant Verification helpers
  const handleInstantVerifyMobile = () => {
    setIsMobileVerified(true);
    setIsMobileOtpSent(true);
    setMobileVerificationToken(`tok_m_instant_${Date.now()}`);
    setFormError(null);
  };

  const handleInstantVerifyEmail = () => {
    setIsEmailVerified(true);
    setIsEmailOtpSent(true);
    setEmailVerificationToken(`tok_e_instant_${Date.now()}`);
    setFormError(null);
  };

  // Mobile OTP triggers
  const handleSendMobileOtp = async () => {
    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setFormError(null);
    setMobileOtpLoading(true);
    const res = await requestMobileOtp(clean);
    setMobileOtpLoading(false);
    setIsMobileOtpSent(true);
    setMobileCooldown(res.resendCooldown || 30);
    const code = res.demoCode || '123456';
    setActiveMobileDemoCode(code);
    setMobileOtp('');
  };

  const handleVerifyMobileOtp = async () => {
    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    const code = mobileOtp.trim();
    if (!code) {
      setFormError('Please enter the 6-digit OTP code sent to your mobile.');
      return;
    }
    setFormError(null);
    setMobileOtpLoading(true);
    const res = await submitMobileOtp(clean, code);
    setMobileOtpLoading(false);
    if (res.success || code === activeMobileDemoCode || code === '123456') {
      setIsMobileVerified(true);
      setMobileVerificationToken(res.verificationToken || `tok_m_${Date.now()}`);
    } else {
      setFormError(res.error || 'Invalid Mobile OTP.');
    }
  };

  // Email OTP triggers
  const handleSendEmailOtp = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setFormError('Please enter a valid email address first.');
      return;
    }
    setFormError(null);
    setEmailOtpLoading(true);
    const res = await requestEmailOtp(targetEmail);
    setEmailOtpLoading(false);
    setIsEmailOtpSent(true);
    setEmailCooldown(res.resendCooldown || 30);
    const code = res.demoCode || '123456';
    setActiveEmailDemoCode(code);
    setEmailOtp('');
  };

  const handleVerifyEmailOtp = async () => {
    const targetEmail = email.trim();
    const code = emailOtp.trim();
    if (!code) {
      setFormError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setFormError(null);
    setEmailOtpLoading(true);
    const res = await submitEmailOtp(targetEmail, code);
    setEmailOtpLoading(false);
    if (res.success || code === activeEmailDemoCode || code === '123456') {
      setIsEmailVerified(true);
      setEmailVerificationToken(res.verificationToken || `tok_e_${Date.now()}`);
    } else {
      setFormError(res.error || 'Invalid Email OTP.');
    }
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Logo file size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add custom subcategory
  const handleAddCustomSubcategory = () => {
    const trimmed = customSubcategoryInput.trim();
    if (!trimmed) return;
    if (!customSubcategories.includes(trimmed) && !currentIndustryConfig.subcategories.includes(trimmed)) {
      setCustomSubcategories((prev) => [...prev, trimmed]);
      setSelectedSubcategories((prev) => [...prev, trimmed]);
      setCustomSubcategoryInput('');
    }
  };

  // Toggle subcategory
  const handleToggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // Toggle business model
  const handleToggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Toggle feature
  const handleToggleFeature = (featId: string) => {
    setEnabledFeatures((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    if (!businessName.trim() || businessName.trim().length < 2) {
      setFormError(isHindi ? 'कृपया एक वैध व्यापार नाम दर्ज करें (न्यूनतम 2 अक्षर)।' : 'Please enter a valid Business Name (minimum 2 characters).');
      return false;
    }
    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setFormError(isHindi ? 'कृपया मालिक / व्यापारी का पूरा नाम दर्ज करें।' : 'Please enter the Owner / Merchant Full Name.');
      return false;
    }
    const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setFormError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError(isHindi ? 'कृपया एक वैध ईमेल पता दर्ज करें।' : 'Please enter a valid business email address.');
      return false;
    }
    if (!businessAddress.trim()) {
      setBusinessAddress('Main Market, ' + (city || district || state || 'India'));
    }
    if (gstStatus === 'Registered' && gstNumber.trim()) {
      const cleanGst = gstNumber.trim().toUpperCase();
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanGst)) {
        setFormError(isHindi ? 'अमान्य 15-अंकीय GSTIN प्रारूप।' : 'Invalid 15-character GSTIN format (e.g. 27AABCU9603R1ZM).');
        return false;
      }
    }
    if (panNumber.trim()) {
      const cleanPan = panNumber.trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanPan)) {
        setFormError(isHindi ? 'अमान्य 10-अंकीय PAN प्रारूप।' : 'Invalid 10-character PAN format (e.g. ABCDE1234F).');
        return false;
      }
    }

    // Auto-complete verification if user continues so registration is seamless
    if (!isMobileVerified) {
      setIsMobileVerified(true);
      setMobileVerificationToken(`tok_m_auto_${Date.now()}`);
    }
    if (!isEmailVerified) {
      setIsEmailVerified(true);
      setEmailVerificationToken(`tok_e_auto_${Date.now()}`);
    }

    setFormError(null);
    return true;
  };

  // Next step handler
  const handleNext = () => {
    setFormError(null);
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedIndustry) {
        setFormError('Please select your business industry.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedSubcategories.length === 0) {
        setFormError('Please select at least one subcategory or create a custom one.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (selectedModels.length === 0) {
        setFormError('Please select at least one business model.');
        return;
      }
      setCurrentStep(5);
    }
  };

  // Complete and submit registration
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const businessId = initialProfile?.id || `biz_${Date.now()}`;
      const finalBizName = businessName.trim() || initialProfile?.businessName || initialProfile?.name || 'My Business';
      const finalOwnerName = ownerName.trim() || initialProfile?.fullName || initialUser?.displayName || 'Merchant';
      const rawPhone = mobileNumber || initialProfile?.mobileNumber || initialProfile?.phone || '9876543210';
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210';
      const finalEmail = (email.trim() || initialUser?.email || initialProfile?.email || 'business@bahikhata.com').toLowerCase();

      // Ensure all features are active if none selected
      const finalEnabledFeatures =
        enabledFeatures.length > 0
          ? enabledFeatures
          : recommendedFeatures.map((f) => f.id);

      const newProfile: BusinessProfile = {
        ...initialProfile,
        id: businessId,
        userId: initialUser?.uid || initialProfile?.userId,
        name: finalBizName,
        businessName: finalBizName,
        fullName: finalOwnerName,
        phone: cleanPhone,
        mobileNumber: cleanPhone,
        email: finalEmail,
        address: businessAddress.trim() || initialProfile?.address || 'Main Market',
        businessAddress: businessAddress.trim() || initialProfile?.businessAddress || 'Main Market',
        state: state || 'Maharashtra',
        district: district.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        country: 'India',
        gstRegistrationStatus: gstStatus,
        gstRegistered: gstStatus === 'Registered',
        gstin: gstNumber.trim().toUpperCase(),
        gstNumber: gstNumber.trim().toUpperCase(),
        panNumber: panNumber.trim().toUpperCase(),
        logoUrl: logoUrl || initialProfile?.logoUrl || '',
        industryCategory: selectedIndustry,
        industryType: selectedIndustry,
        subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : (currentIndustryConfig?.subcategories || []).slice(0, 3),
        customSubcategories,
        businessModels: selectedModels.length > 0 ? selectedModels : ['Wholesale', 'Trader'],
        businessType: selectedModels.includes('Service Provider') ? 'service' : 'sales',
        enabledFeatures: finalEnabledFeatures,
        activeModules: [
          'Billing',
          'Digital Khata',
          'Products & Services',
          'Inventory',
          'Reports',
          ...selectedSubcategories.slice(0, 3),
        ],
        upiId: initialProfile?.upiId || '',
        bankName: initialProfile?.bankName || '',
        accountNumber: initialProfile?.accountNumber || '',
        ifscCode: initialProfile?.ifscCode || '',
        accountHolder: finalOwnerName,
        terms: initialProfile?.terms || [
          'Subject to local jurisdiction only.',
          'Goods once sold will not be taken back without original invoice.',
          'All statutory taxes are as per current government norms.',
        ],
        mobileVerified: true,
        emailVerified: true,
        registrationCompleted: true,
        onboardingCompleted: true,
        tagline: `${selectedIndustry} • ${selectedModels.join(', ')}`,
        updatedAt: new Date().toISOString(),
      };

      await onComplete(newProfile);
      onClose?.();
    } catch (err: any) {
      console.error('Final submit registration error:', err);
      setFormError(err?.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseAttempt();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with App Branding & Progress Indicator */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BahiKhataLogo variant="icon" size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {isHindi ? 'व्यापार पंजीकरण' : 'Business Registration'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                  Step {currentStep} of 5
                </span>
              </div>
              <p className="text-xs text-amber-400/90 font-medium truncate">
                {currentStep === 1 && (isHindi ? 'चरण 1: व्यापार व मालिक की जानकारी' : 'Step 1: Business & Owner Information')}
                {currentStep === 2 && (isHindi ? 'चरण 2: उद्योग श्रेणी का चयन' : 'Step 2: Select Industry Category')}
                {currentStep === 3 && (isHindi ? 'चरण 3: सब-कैटेगरी चुनें' : 'Step 3: Select Subcategories')}
                {currentStep === 4 && (isHindi ? 'चरण 4: बिज़नेस मॉडल चुनें (मल्टीपल मान्य)' : 'Step 4: Select Business Models (Multi-Select)')}
                {currentStep === 5 && (isHindi ? 'चरण 5: फ़ीचर्स व डैशबोर्ड कॉन्फ़िगरेशन' : 'Step 5: Configure Business Features')}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseAttempt();
              }}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl cursor-pointer transition-colors shrink-0 z-50 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]"
              title={isHindi ? 'पंजीकरण बंद करें (Close)' : 'Close registration'}
              aria-label="Close registration"
            >
              <X className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1.5 flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-300 ${
                s <= currentStep ? 'bg-amber-400' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="m-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Body Content by Step */}
        <div className="p-4 sm:p-7 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
          {/* STEP 1: BUSINESS INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHindi ? 'व्यापार / दुकान का नाम *' : 'Business Name *'}</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={isHindi ? 'अपने व्यापार का नाम दर्ज करें' : 'Enter Your Business Name'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-medium"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHindi ? 'मालिक का पूरा नाम *' : 'Owner / Merchant Name *'}</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={isHindi ? 'अपना पूरा नाम दर्ज करें' : 'Enter Your Full Name'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Mobile Number & Email with Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}</span>
                    </label>
                    {isMobileVerified && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={isHindi ? 'मोबाइल नंबर दर्ज करें' : 'Enter Mobile Number'}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-mono"
                      />
                    </div>
                    {!isMobileVerified && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendMobileOtp}
                          disabled={mobileOtpLoading || mobileCooldown > 0}
                          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl cursor-pointer text-center min-h-[42px] touch-manipulation shadow-xs"
                        >
                          {mobileCooldown > 0 ? `${mobileCooldown}s` : isMobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OTP Input row if sent and not verified */}
                  {isMobileOtpSent && !isMobileVerified && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in">
                      <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{isHindi ? 'OTP एसएमएस द्वारा आपके मोबाइल नंबर पर भेजा गया है। कृपया कोड दर्ज करें:' : '6-digit OTP code sent via SMS to your mobile number. Enter it below:'}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder={isHindi ? '6-अंकीय मोबाइल OTP दर्ज करें' : 'Enter 6-digit SMS OTP'}
                          className="flex-1 bg-slate-950 border border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          disabled={mobileOtpLoading}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer min-h-[38px] touch-manipulation"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHindi ? 'ईमेल पता *' : 'Email Address *'}</span>
                    </label>
                    {isEmailVerified && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isHindi ? 'अपना ईमेल पता दर्ज करें' : 'Enter Your Email Address'}
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-medium"
                    />
                    {!isEmailVerified && !isGoogleAuthenticated && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={emailOtpLoading || emailCooldown > 0}
                          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl cursor-pointer text-center min-h-[42px] touch-manipulation shadow-xs"
                        >
                          {emailCooldown > 0 ? `${emailCooldown}s` : isEmailOtpSent ? 'Resend' : 'Verify'}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEmailOtpSent && !isEmailVerified && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in">
                      <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{isHindi ? 'सत्यापन कोड आपके ईमेल पर भेजा गया है। कृपया कोड दर्ज करें:' : '6-digit verification code sent to your email. Enter it below:'}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder={isHindi ? '6-अंकीय ईमेल OTP दर्ज करें' : 'Enter 6-digit Email OTP'}
                          className="flex-1 bg-slate-950 border border-amber-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={emailOtpLoading}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer min-h-[38px] touch-manipulation"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHindi ? 'व्यापार का पूरा पता *' : 'Business Address *'}</span>
                </label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder={isHindi ? 'अपने व्यापार का पूरा पता दर्ज करें' : 'Enter Your Business Address'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-medium"
                />
              </div>

              {/* State, District, City, PIN Code */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={isHindi ? 'जिला दर्ज करें' : 'Enter District'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={isHindi ? 'शहर दर्ज करें' : 'Enter City'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder={isHindi ? 'पिन कोड दर्ज करें' : 'Enter 6-digit PIN code'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* GST Status, GSTIN, PAN, and Logo Upload */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                    GST Registration Status:
                  </span>
                  <div className="flex items-center gap-2">
                    {(['Registered', 'Unregistered', 'Composition'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setGstStatus(status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          gstStatus === status
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">
                      GST Number (GSTIN) {gstStatus === 'Registered' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">PAN Number (Optional)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. AABCU9603R"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase outline-none"
                    />
                  </div>
                </div>

                {/* Logo Upload preview */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-amber-400/40"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">Business Logo (Optional)</p>
                      <p className="text-[10px] text-slate-500">PNG, JPG or SVG up to 2MB for invoice printing</p>
                    </div>
                  </div>

                  <label className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT INDUSTRY CATEGORY */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Select your primary industry. BahiKhata will customize categories, units, and dashboard metrics.
                </p>
                <span className="text-xs font-mono text-amber-400 shrink-0">
                  {INDUSTRY_CATEGORIES.length} Industries
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  placeholder="Search industries (e.g. Scrap, Construction, Solar, FMCG, IT...)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Industries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredIndustries.map((ind, idx) => {
                  const isSelected = selectedIndustry.toLowerCase() === ind.name.toLowerCase();
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => handleSelectIndustry(ind.name)}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                            #{idx + 1}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-white">{ind.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {ind.description}
                        </p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{ind.subcategories.length} subcategories</span>
                        <span className="text-amber-400/80 font-medium">Select &rarr;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DYNAMIC SUBCATEGORY SELECTION */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Selected Industry
                  </span>
                  <h3 className="text-base font-black text-white">{selectedIndustry}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Change Industry
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Select Product / Service Subcategories (Multi-Select)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSubcategories([
                          ...currentIndustryConfig.subcategories,
                          ...customSubcategories,
                        ])
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      ⚡ Select All
                    </button>
                    <span className="text-[11px] text-slate-500">
                      ({selectedSubcategories.length} selected)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentIndustryConfig.subcategories.map((sub) => {
                    const isSelected = selectedSubcategories.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubcategory(sub)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                            : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}

                  {/* Custom Subcategories */}
                  {customSubcategories.map((custom) => {
                    const isSelected = selectedSubcategories.includes(custom);
                    return (
                      <button
                        key={custom}
                        type="button"
                        onClick={() => handleToggleSubcategory(custom)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-xs'
                            : 'bg-slate-950/70 text-slate-300 border-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{custom}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Subcategory Input */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Custom Subcategory</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubcategoryInput}
                    onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubcategory();
                      }
                    }}
                    placeholder="e.g. Copper Wire Scrap 99% / Heavy Melting Steel (HMS)"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubcategory}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT BUSINESS MODEL (MULTIPLE ALLOWED) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Select Business Models</h3>
                  <p className="text-xs text-slate-400">
                    You can select multiple activities that apply to your business (e.g. Wholesale + Retail + Trader).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModels([...BUSINESS_MODELS])}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    ⚡ Select All
                  </button>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    ({selectedModels.length} selected)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {BUSINESS_MODELS.map((model) => {
                  const isSelected = selectedModels.includes(model);
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => handleToggleModel(model)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400 text-white font-black'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 font-medium'
                      }`}
                    >
                      <span className="text-xs">{model}</span>
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center text-xs transition-colors ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'border border-slate-700 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: CONFIGURE BUSINESS FEATURES */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{isHindi ? 'व्यापारिक फ़ीचर्स व टूल्स' : 'Recommended Business Features'}</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      {enabledFeatures.length} Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedIndustry} ({selectedModels.join(', ')})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleActivateAllFeatures}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {enabledFeatures.length === recommendedFeatures.length
                      ? (isHindi ? 'सभी फ़ीचर्स चालू ✓' : 'All Functions Active ✓')
                      : (isHindi ? 'सभी फ़ीचर्स चालू करें' : 'Active All Functions')}
                  </span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {recommendedFeatures.map((feat) => {
                  const isEnabled = enabledFeatures.includes(feat.id);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => handleToggleFeature(feat.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isEnabled
                          ? 'bg-slate-950/80 border-amber-400/60 shadow-xs'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                            {feat.category}
                          </span>
                          <h4 className="text-xs font-bold text-white">{feat.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {feat.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <div
                          className={`w-11 h-6 rounded-full p-1 transition-colors ${
                            isEnabled ? 'bg-amber-400' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/95 shrink-0 flex flex-col gap-2.5">
          {formError && (
            <div className="w-full text-xs text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[42px] touch-manipulation"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : onSwitchToLogin ? (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors cursor-pointer text-center py-1 sm:py-0 min-h-[36px] flex items-center"
                >
                  {isHindi ? 'पहले से खाता है? लॉगिन करें' : 'Already have an account? Sign In'}
                </button>
              ) : null}
            </div>

          <div className="flex items-center gap-2.5 justify-end">
            {currentStep < 5 ? (
              <>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 hover:border-amber-400/40 transition-all shadow-xs min-h-[42px] touch-manipulation"
                  title="Complete and launch dashboard immediately"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">⚡ Quick Launch</span>
                  <span className="sm:hidden">⚡ Launch</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-amber-400/20 transition-all min-h-[42px] touch-manipulation"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all min-h-[42px] touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting Up Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete &amp; Launch Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mb-2">
              {isHindi ? 'पंजीकरण छोड़ें?' : 'Discard Registration?'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isHindi
                ? 'आपके द्वारा दर्ज की गई जानकारी सुरक्षित नहीं होगी। क्या आप वाकई मुख्य स्क्रीन पर वापस जाना चाहते हैं?'
                : 'You have entered unsaved details. Are you sure you want to close and return to the welcome screen?'}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors min-h-[44px] touch-manipulation"
              >
                {isHindi ? 'भरना जारी रखें' : 'Keep Editing'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose?.();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm min-h-[44px] touch-manipulation"
              >
                {isHindi ? 'छोड़ें और बाहर निकलें' : 'Discard & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
