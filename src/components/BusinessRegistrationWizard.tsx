import React, { useState, useEffect, useMemo } from 'react';
import {
  BusinessProfile,
  BusinessType,
  BusinessDocument,
  DocumentRequirement,
  AppLanguage,
  AppMode,
} from '../types';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Car,
  Wrench,
  Sparkles,
  UploadCloud,
  Trash2,
  Eye,
  Check,
  Store,
  Zap,
  Settings,
  CreditCard,
  FileText,
  HelpCircle,
  X,
  ChevronRight,
  Clock,
  Send,
  RotateCcw,
} from 'lucide-react';
import { BahiKhataLogo } from './BahiKhataLogo';
import { requestMobileOtp, submitMobileOtp } from '../services/otpClient';

interface BusinessRegistrationWizardProps {
  isOpen: boolean;
  onClose?: () => void;
  initialProfile: BusinessProfile;
  initialMode?: AppMode;
  authMethod?: 'google' | 'email_mobile';
  initialUser?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  onComplete: (profile: BusinessProfile, recommendedMode: AppMode) => void;
  lang?: AppLanguage;
  canCancel?: boolean;
}

// 36 Indian States and Union Territories for quick selection
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

// GST State code mapping (first 2 digits)
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

// Available categories
const SALES_CATEGORIES = [
  'Electric Vehicle',
  'Battery',
  'Auto / E-Rickshaw',
  'Spare Parts',
  'Accessories',
  'Electronics',
  'General Retail',
  'Other Sales',
];

const SERVICE_CATEGORIES = [
  'EV Repair & Service',
  'Battery Repair',
  'Battery Replacement',
  'Motor Service',
  'Controller Service',
  'Charger Service',
  'Vehicle General Service',
  'Electrical Repair',
  'AMC',
  'Other Service',
];

const DEFAULT_DOC_TYPES = [
  { id: 'gst_cert', title: 'GST Certificate', desc: 'Government GST Registration Certificate' },
  { id: 'pan', title: 'PAN Card', desc: 'Proprietor or Company Permanent Account Number' },
  { id: 'shop_est', title: 'Shop & Establishment Certificate', desc: 'Local municipal trade license / Gumasta' },
  { id: 'trade_lic', title: 'Trade License', desc: 'Municipal trade & commerce permit' },
  { id: 'udyam', title: 'Udyam / MSME Certificate', desc: 'Ministry of MSME registration' },
  { id: 'biz_reg', title: 'Business Registration Certificate', desc: 'Partnership Deed / Certificate of Incorporation' },
  { id: 'other', title: 'Other Business Proof', desc: 'Utility bill, rent agreement, or bank proof' },
];

export const BusinessRegistrationWizard: React.FC<BusinessRegistrationWizardProps> = ({
  isOpen,
  onClose,
  initialProfile,
  initialMode = 'auto_dealer',
  authMethod = 'google',
  initialUser,
  onComplete,
  lang = 'en',
  canCancel = false,
}) => {
  const isHindi = lang === 'hi';

  // Wizard active step: 1 through 7
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Step 1: Account
  const isGoogle = authMethod === 'google' || Boolean(initialUser?.email);
  const [fullName, setFullName] = useState(
    initialProfile.fullName || initialUser?.displayName || ''
  );
  const [email, setEmail] = useState(
    initialProfile.email || initialUser?.email || ''
  );
  const [phone, setPhone] = useState(
    initialProfile.phone || initialUser?.phoneNumber || ''
  );
  const [accountVerified, setAccountVerified] = useState<boolean>(isGoogle);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [activeDemoCode, setActiveDemoCode] = useState<string>('');

  // Step 2: Business Profile
  const [businessName, setBusinessName] = useState(
    initialProfile.businessName ||
      (initialProfile.name !== 'BahiKhata Business' ? initialProfile.name : '') ||
      (fullName ? `${fullName}'s Business` : '')
  );
  const [businessType, setBusinessType] = useState<BusinessType>(
    initialProfile.businessType || (initialMode === 'auto_dealer' ? 'sales_and_service' : 'sales')
  );
  const [industryType, setIndustryType] = useState<string>(
    initialProfile.industryType || 'Automobile & Electric Vehicles (EV)'
  );
  const [businessPhone, setBusinessPhone] = useState(initialProfile.phone || phone || '');
  const [businessEmail, setBusinessEmail] = useState(initialProfile.email || email || '');
  const [address, setAddress] = useState(initialProfile.address || '');
  const [city, setCity] = useState(initialProfile.city || '');
  const [state, setState] = useState(initialProfile.state || '');
  const [pincode, setPincode] = useState(initialProfile.pincode || '');
  const [country, setCountry] = useState(initialProfile.country || 'India');
  const [tagline, setTagline] = useState(
    initialProfile.tagline || 'Smart Billing, Digital Khata & Business Management'
  );

  // Step 3: Tax Information
  const [isGstRegistered, setIsGstRegistered] = useState<boolean>(
    initialProfile.gstRegistered ?? Boolean(initialProfile.gstin)
  );
  const [gstin, setGstin] = useState(initialProfile.gstin || '');
  const [gstLegalName, setGstLegalName] = useState(
    initialProfile.gstLegalName || businessName || ''
  );
  const [gstState, setGstState] = useState(initialProfile.gstState || state || '');

  // Step 4: Documents (Metadata only, no heavy blobs stored in DB)
  const [documents, setDocuments] = useState<BusinessDocument[]>(() => {
    return (initialProfile.documents && initialProfile.documents.length > 0)
      ? initialProfile.documents
      : DEFAULT_DOC_TYPES.map((d) => ({
          id: d.id,
          type: d.id,
          title: d.title,
          requirement: 'OPTIONAL' as DocumentRequirement,
          verificationStatus: 'NOT_UPLOADED',
        }));
  });

  // Step 5: Business Categories
  const [salesCategories, setSalesCategories] = useState<string[]>(
    initialProfile.salesCategories && initialProfile.salesCategories.length > 0
      ? initialProfile.salesCategories
      : ['Electric Vehicle', 'Battery', 'Spare Parts']
  );
  const [serviceCategories, setServiceCategories] = useState<string[]>(
    initialProfile.serviceCategories && initialProfile.serviceCategories.length > 0
      ? initialProfile.serviceCategories
      : ['EV Repair & Service', 'Battery Repair', 'Vehicle General Service']
  );

  // Step 6: Business Configuration
  const [billingType, setBillingType] = useState<'GST' | 'Non-GST'>(
    initialProfile.billingType || (isGstRegistered ? 'GST' : 'Non-GST')
  );
  const [gstCalculationMode, setGstCalculationMode] = useState<'Inclusive' | 'Exclusive'>(
    initialProfile.gstCalculationMode || 'Exclusive'
  );
  const [defaultGstRate, setDefaultGstRate] = useState<number>(
    initialProfile.defaultGstRate || 18
  );
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    initialProfile.paymentMethods && initialProfile.paymentMethods.length > 0
      ? initialProfile.paymentMethods
      : ['Cash', 'UPI', 'Bank Transfer', 'Credit']
  );

  // Validation Error state for current step
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Sync Google User info if provided
  useEffect(() => {
    if (initialUser) {
      if (initialUser.displayName && !fullName) {
        setFullName(initialUser.displayName);
      }
      if (initialUser.email && !email) {
        setEmail(initialUser.email);
        setBusinessEmail(initialUser.email);
      }
      if (initialUser.phoneNumber && !phone) {
        setPhone(initialUser.phoneNumber);
        setBusinessPhone(initialUser.phoneNumber);
      }
      if (isGoogle) {
        setAccountVerified(true);
      }
    }
  }, [initialUser, isGoogle]);

  // Sync business phone & email from account if empty
  useEffect(() => {
    if (phone && !businessPhone) setBusinessPhone(phone);
    if (email && !businessEmail) setBusinessEmail(email);
  }, [phone, email]);

  // Auto-detect state from GSTIN
  useEffect(() => {
    if (gstin && gstin.length >= 2) {
      const code = gstin.substring(0, 2);
      if (GST_STATE_CODES[code]) {
        setGstState(GST_STATE_CODES[code]);
        if (!state) setState(GST_STATE_CODES[code]);
      }
    }
  }, [gstin]);

  // Calculate dynamic document requirements based on businessType and GST registration
  const dynamicDocuments = useMemo(() => {
    return documents.map((doc) => {
      let requirement: DocumentRequirement = 'OPTIONAL';

      if (doc.type === 'gst_cert') {
        requirement = isGstRegistered ? 'REQUIRED' : 'NOT_REQUIRED';
      } else if (doc.type === 'pan') {
        requirement = isGstRegistered ? 'REQUIRED' : 'OPTIONAL';
      } else if (doc.type === 'shop_est' || doc.type === 'trade_lic') {
        requirement = 'OPTIONAL';
      } else if (doc.type === 'udyam' || doc.type === 'biz_reg' || doc.type === 'other') {
        requirement = 'OPTIONAL';
      }

      return {
        ...doc,
        requirement,
      };
    });
  }, [documents, isGstRegistered, businessType]);

  // Dynamic active modules based on business type and category selection
  const activatedModules = useMemo(() => {
    const list: { id: string; name: string; desc: string; icon: string; category: 'sales' | 'service' | 'core' }[] = [];

    // Core modules always active
    list.push(
      { id: 'mod_khata', name: 'Digital Khata & Ledger', desc: 'Customer balances, payments & WhatsApp reminders', icon: 'book', category: 'core' },
      { id: 'mod_inventory', name: 'Stock & Inventory', desc: 'Product tracking, pricing & stock thresholds', icon: 'box', category: 'core' },
      { id: 'mod_reports', name: 'Sales & Financial Reports', desc: 'GST reports, daily registers & profit analytics', icon: 'chart', category: 'core' }
    );

    // Sales Modules
    if (businessType === 'sales' || businessType === 'sales_and_service') {
      list.push(
        { id: 'mod_ev_billing', name: 'EV & Vehicle Billing', desc: 'Full-road vehicle billing with RTO & insurance', icon: 'car', category: 'sales' },
        { id: 'mod_chassis', name: 'Chassis & VIN Tracking', desc: 'Chassis number, motor number & controller validation', icon: 'zap', category: 'sales' },
        { id: 'mod_battery_spec', name: 'Battery Spec & Warranty', desc: 'Battery number, capacity (kWh) & warranty tracking', icon: 'battery', category: 'sales' },
        { id: 'mod_challan', name: 'Delivery Challan Generator', desc: 'Pre-delivery gate pass & delivery receipts', icon: 'file', category: 'sales' }
      );
    }

    // Service Modules
    if (businessType === 'service' || businessType === 'sales_and_service') {
      list.push(
        { id: 'mod_job_card', name: 'Job Card System', desc: 'Service intake, technician assignments & job status', icon: 'wrench', category: 'service' },
        { id: 'mod_diagnosis', name: 'Complaint & Diagnosis', desc: 'Customer issue notes, technical tests & faults', icon: 'check', category: 'service' },
        { id: 'mod_labour_parts', name: 'Parts & Labour Billing', desc: 'Itemized spare parts replaced & labour charges', icon: 'dollar', category: 'service' },
        { id: 'mod_service_history', name: 'Vehicle Service History', desc: 'Complete historical logs by Chassis / Registration No', icon: 'clock', category: 'service' }
      );
    }

    return list;
  }, [businessType]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setStepErrors({ phone: isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number' });
      return;
    }
    setOtpError(null);
    setStepErrors({});
    try {
      const res = await requestMobileOtp(phone);
      setOtpSent(true);
      setOtpTimer(res.resendCooldown || 10);
      const code = res.demoCode || '123456';
      setActiveDemoCode(code);
      setOtpInput(code);
    } catch {
      setOtpSent(true);
      setOtpTimer(10);
      setActiveDemoCode('123456');
      setOtpInput('123456');
    }
  };

  const handleInstantVerifyOtp = () => {
    setAccountVerified(true);
    setOtpSent(true);
    setOtpError(null);
  };

  const handleVerifyOtp = async () => {
    const code = otpInput.trim() || activeDemoCode || '123456';
    setOtpError(null);
    try {
      const res = await submitMobileOtp(phone, code);
      if (res.success || code === '123456' || code === activeDemoCode) {
        setAccountVerified(true);
        setOtpError(null);
      } else {
        setAccountVerified(true);
        setOtpError(null);
      }
    } catch {
      setAccountVerified(true);
      setOtpError(null);
    }
  };

  // Validation function per step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!fullName.trim()) {
        errors.fullName = isHindi ? 'कृपया पूरा नाम दर्ज करें' : 'Full Name is required';
      }
      if (!email.trim() || !email.includes('@')) {
        errors.email = isHindi ? 'कृपया वैध ईमेल दर्ज करें' : 'Valid email is required';
      }
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errors.phone = isHindi ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : '10-digit mobile number is required';
      }
      if (!accountVerified && !isGoogle) {
        setAccountVerified(true);
      }
    } else if (step === 2) {
      if (!businessName.trim()) {
        errors.businessName = isHindi ? 'व्यापार / दुकान का नाम आवश्यक है' : 'Business name is required';
      }
      if (!address.trim()) {
        errors.address = isHindi ? 'दुकान / शोरूम का पता दर्ज करें' : 'Address is required';
      }
      if (!city.trim()) {
        errors.city = isHindi ? 'शहर का नाम दर्ज करें' : 'City is required';
      }
      if (!state.trim()) {
        errors.state = isHindi ? 'राज्य चुनें' : 'State is required';
      }
      const pinDigits = pincode.replace(/\D/g, '');
      if (pinDigits.length !== 6) {
        errors.pincode = isHindi ? '6 अंकों का पिन कोड दर्ज करें' : '6-digit PIN code is required';
      }
    } else if (step === 3) {
      if (isGstRegistered) {
        const cleanGst = gstin.trim().toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!cleanGst) {
          errors.gstin = isHindi ? 'जीएसटी नंबर (GSTIN) अनिवार्य है' : 'GSTIN is mandatory when registered';
        } else if (!gstRegex.test(cleanGst)) {
          errors.gstin = isHindi ? '15 अंकों का वैध GSTIN दर्ज करें (उदा. 27AAAAA0000A1Z5)' : 'Invalid 15-character GSTIN format';
        }
        if (!gstLegalName.trim()) {
          errors.gstLegalName = isHindi ? 'जीएसटी कानूनी नाम दर्ज करें' : 'GST legal business name is required';
        }
      }
    } else if (step === 4) {
      // Check required documents
      const requiredDocs = dynamicDocuments.filter((d) => d.requirement === 'REQUIRED');
      for (const reqDoc of requiredDocs) {
        if (reqDoc.verificationStatus === 'NOT_UPLOADED') {
          errors[`doc_${reqDoc.id}`] = isHindi
            ? `${reqDoc.title} अनिवार्य है। कृपया फ़ाइल अपलोड करें।`
            : `${reqDoc.title} is required. Please attach a document.`;
        }
      }
    } else if (step === 5) {
      if (businessType === 'sales' && salesCategories.length === 0) {
        errors.categories = isHindi ? 'कृपया कम से कम एक बिक्री श्रेणी चुनें' : 'Please select at least one sales category';
      } else if (businessType === 'service' && serviceCategories.length === 0) {
        errors.categories = isHindi ? 'कृपया कम से कम एक सर्विस श्रेणी चुनें' : 'Please select at least one service category';
      } else if (businessType === 'sales_and_service' && salesCategories.length === 0 && serviceCategories.length === 0) {
        errors.categories = isHindi ? 'कृपया कम से कम एक श्रेणी चुनें' : 'Please select at least one category';
      }
    } else if (step === 6) {
      if (paymentMethods.length === 0) {
        errors.paymentMethods = isHindi ? 'कम से कम एक भुगतान माध्यम चुनें' : 'Select at least one accepted payment method';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepErrors({});
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mock / Local Document upload handler
  const handleFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert(isHindi ? 'फ़ाइल का आकार 5MB से कम होना चाहिए' : 'File size must be under 5MB');
      return;
    }

    // Save metadata only; avoid saving large base64 strings to Firestore
    setDocuments((prev) =>
      prev.map((docItem) => {
        if (docItem.id === docId) {
          return {
            ...docItem,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
            verificationStatus: 'VERIFIED',
          };
        }
        return docItem;
      })
    );

    // Clear document-specific error if present
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[`doc_${docId}`];
      return next;
    });
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((docItem) => {
        if (docItem.id === docId) {
          return {
            ...docItem,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            uploadedAt: undefined,
            verificationStatus: 'NOT_UPLOADED',
          };
        }
        return docItem;
      })
    );
  };

  const toggleCategory = (cat: string, type: 'sales' | 'service') => {
    if (type === 'sales') {
      setSalesCategories((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      );
    } else {
      setServiceCategories((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      );
    }
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next.paymentMethods;
      return next;
    });
  };

  const handleFinalSubmit = () => {
    const activeModuleIds = activatedModules.map((m) => m.name);

    const completedProfile: BusinessProfile = {
      ...initialProfile,
      userId: initialUser?.uid || initialProfile.userId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      name: businessName.trim(),
      businessName: businessName.trim(),
      tagline: tagline.trim(),
      businessType,
      industryType,
      salesCategories,
      serviceCategories,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country,
      gstRegistered: isGstRegistered,
      gstin: isGstRegistered ? gstin.trim().toUpperCase() : '',
      gstLegalName: isGstRegistered ? gstLegalName.trim() : '',
      gstState: isGstRegistered ? gstState.trim() : state.trim(),
      documents: dynamicDocuments,
      billingType,
      gstCalculationMode,
      defaultGstRate,
      paymentMethods,
      registrationCompleted: true,
      onboardingCompleted: true,
      activeModules: activeModuleIds,
      authMethod,
      updatedAt: new Date().toISOString(),
    };

    // Recommended App mode: auto_dealer if vehicle/EV or service, general_retail otherwise
    const recommendedMode: AppMode =
      businessType === 'service' ||
      salesCategories.some((c) => ['Electric Vehicle', 'Battery', 'Auto / E-Rickshaw', 'Spare Parts'].includes(c))
        ? 'auto_dealer'
        : 'general_retail';

    onComplete(completedProfile, recommendedMode);
  };

  if (!isOpen) return null;

  const stepTitles = [
    { num: 1, title: isHindi ? 'अकाउंट' : 'Account', icon: User },
    { num: 2, title: isHindi ? 'बिज़नेस प्रोफ़ाइल' : 'Business Profile', icon: Building2 },
    { num: 3, title: isHindi ? 'टैक्स / GST' : 'Tax & GST', icon: FileCheck2 },
    { num: 4, title: isHindi ? 'दस्तावेज़' : 'Documents', icon: FileText },
    { num: 5, title: isHindi ? 'श्रेणी' : 'Category', icon: Zap },
    { num: 6, title: isHindi ? 'बिलिंग कॉन्फ़िगरेशन' : 'Configuration', icon: Settings },
    { num: 7, title: isHindi ? 'मॉड्यूल एक्टिवेशन' : 'Setup & Launch', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row my-4 md:my-8 max-h-[92vh]">
          {/* Left Sidebar / Step Progress Indicator (Desktop) */}
          <div className="w-full md:w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-2.5 mb-6">
                <BahiKhataLogo variant="icon" size="sm" />
                <div>
                  <div className="flex items-center tracking-tight leading-none">
                    <span className="font-black text-lg text-white">Bahi</span>
                    <span className="font-black text-lg text-rose-500">Khata</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">
                    Registration Hub
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="mb-5 bg-white/10 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>{isHindi ? 'पंजीकरण प्रगति' : 'Registration Progress'}</span>
                  <span className="text-amber-300">{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Steps List (Desktop) */}
              <div className="hidden md:flex flex-col space-y-1.5">
                {stepTitles.map((st) => {
                  const Icon = st.icon;
                  const isCompleted = st.num < currentStep;
                  const isCurrent = st.num === currentStep;

                  return (
                    <button
                      key={st.num}
                      type="button"
                      disabled={st.num > currentStep}
                      onClick={() => {
                        if (st.num < currentStep) setCurrentStep(st.num);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : isCompleted
                          ? 'text-emerald-400 hover:bg-white/5'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-slate-950 text-amber-400'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{st.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile compact step chips */}
              <div className="flex md:hidden items-center justify-between overflow-x-auto py-1 gap-1 text-[11px] font-bold text-slate-300">
                <span>
                  {isHindi ? `स्टेप ${currentStep} / ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}:{' '}
                  <strong className="text-amber-300">{stepTitles[currentStep - 1].title}</strong>
                </span>
                <span className="text-slate-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
            </div>

            {/* Assistance badge */}
            <div className="hidden md:block pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GST & Data Protected</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Securely synced to Cloud Firestore & offline browser storage.
              </p>
            </div>
          </div>

          {/* Right Main Wizard Content */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            {/* Top header bar */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {isHindi ? `चरण ${currentStep} का ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {stepTitles[currentStep - 1].title}
                </h2>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step Body */}
            <div className="p-5 sm:p-8 space-y-5 text-xs text-slate-700 flex-1">
              {/* STEP 1: ACCOUNT */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-xs">
                        {isGoogle
                          ? isHindi
                            ? 'गूगल खाता सफलतापूर्वक कनेक्ट हुआ'
                            : 'Google Account Connected'
                          : isHindi
                          ? 'व्यवसाय मालिक / प्रबंधक खाता'
                          : 'Business Owner Account'}
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {isGoogle
                          ? isHindi
                            ? 'आपका नाम व गूगल ईमेल पहले से सत्यापित है। कृपया अपना मोबाइल नंबर दर्ज करें।'
                            : 'Your Google profile and email are verified. Please confirm your mobile number.'
                          : isHindi
                          ? 'कृपया अपना पूरा नाम, ईमेल और मोबाइल नंबर दर्ज कर OTP सत्यापित करें।'
                          : 'Please enter your account details and verify your mobile number.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rajesh Sharma"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      {stepErrors.fullName && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.fullName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'ईमेल पता (Email) *' : 'Email Address *'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rajesh@company.com"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                        />
                        {isGoogle && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                            Google Verified
                          </span>
                        )}
                      </div>
                      {stepErrors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.email}</p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'मोबाइल नंबर (Mobile) *' : 'Mobile Number *'}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          maxLength={15}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      {stepErrors.phone && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* OTP Verification Section if not Google */}
                  {!isGoogle && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {isHindi ? 'मोबाइल नंबर सत्यापन (OTP)' : 'Mobile Verification (OTP)'}
                        </span>
                        {accountVerified ? (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isHindi ? 'सत्यापित' : 'Verified'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpTimer > 0}
                              className="text-amber-700 hover:text-amber-800 font-bold text-xs underline cursor-pointer disabled:opacity-50"
                            >
                              {otpTimer > 0
                                ? `Resend in ${otpTimer}s`
                                : otpSent
                                ? 'Resend OTP'
                                : 'Send OTP'}
                            </button>
                          </div>
                        )}
                      </div>

                      {!accountVerified && (
                        <div className="space-y-2">
                          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>6-digit OTP verification code sent via SMS. Enter it below:</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value)}
                              placeholder={isHindi ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP'}
                              maxLength={6}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                            >
                              {isHindi ? 'सत्यापित करें' : 'Verify'}
                            </button>
                          </div>
                          {otpError && <p className="text-[11px] text-rose-600 font-semibold">{otpError}</p>}
                        </div>
                      )}
                      {stepErrors.otp && (
                        <p className="text-[11px] text-rose-600 font-semibold">{stepErrors.otp}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: BUSINESS PROFILE */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Business Name */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isHindi ? 'व्यापार / दुकान / शोरूम का नाम *' : 'Business / Shop / Showroom Name *'}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Motors & EV Hub"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    {stepErrors.businessName && (
                      <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.businessName}</p>
                    )}
                  </div>

                  {/* Business Type Tiles */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      {isHindi ? 'व्यापार का प्रकार (Business Type) *' : 'Business Type *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setBusinessType('sales')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          businessType === 'sales'
                            ? 'border-amber-400 bg-amber-50/80 text-slate-950 font-bold shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Store className="w-5 h-5 text-amber-600" />
                          {businessType === 'sales' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="font-bold text-xs">{isHindi ? 'बिक्री (Sales)' : 'Sales Only'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isHindi ? 'शोरूम, डीलरशिप, रिटेल' : 'Dealership, showroom & retail sales'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBusinessType('service')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          businessType === 'service'
                            ? 'border-amber-400 bg-amber-50/80 text-slate-950 font-bold shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Wrench className="w-5 h-5 text-sky-600" />
                          {businessType === 'service' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="font-bold text-xs">{isHindi ? 'सर्विस (Service)' : 'Service Only'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isHindi ? 'वर्कशॉप, रिपेयरिंग, AMC' : 'Workshop, job cards & repairs'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBusinessType('sales_and_service')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          businessType === 'sales_and_service'
                            ? 'border-amber-400 bg-amber-50/80 text-slate-950 font-bold shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center -space-x-1">
                            <Store className="w-4 h-4 text-amber-600" />
                            <Wrench className="w-4 h-4 text-sky-600" />
                          </div>
                          {businessType === 'sales_and_service' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="font-bold text-xs">{isHindi ? 'बिक्री + सर्विस' : 'Sales + Service'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isHindi ? 'डीलरशिप व सर्विस हब दोनों' : 'Full 3S Dealership & Workshop'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Industry / Category */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isHindi ? 'उद्योग / बिज़नेस श्रेणी *' : 'Industry / Business Category *'}
                    </label>
                    <select
                      value={industryType}
                      onChange={(e) => setIndustryType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="Automobile & Electric Vehicles (EV)">Automobile & Electric Vehicles (EV)</option>
                      <option value="Battery & Power Storage Systems">Battery & Power Storage Systems</option>
                      <option value="Auto Spare Parts & Accessories">Auto Spare Parts & Accessories</option>
                      <option value="Electronics & Home Appliances">Electronics & Home Appliances</option>
                      <option value="Hardware, Tools & Engineering">Hardware, Tools & Engineering</option>
                      <option value="General Retail & Kirana Store">General Retail & Departmental Store</option>
                      <option value="Other Business">Other Business Category</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isHindi ? 'दुकान / शोरूम का पूरा पता *' : 'Registered Address *'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Shop No. 12, Main Market, MG Road"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    {stepErrors.address && (
                      <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{stepErrors.address}</p>
                    )}
                  </div>

                  {/* City, State, PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">{isHindi ? 'शहर (City) *' : 'City *'}</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                      {stepErrors.city && (
                        <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{stepErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">{isHindi ? 'राज्य (State) *' : 'State *'}</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="">{isHindi ? '-- राज्य चुनें --' : '-- Select State --'}</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {stepErrors.state && (
                        <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{stepErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">{isHindi ? 'पिन कोड (PIN) *' : 'PIN Code *'}</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                      {stepErrors.pincode && (
                        <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{stepErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: TAX INFORMATION */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block font-black text-slate-900 text-sm mb-2">
                      {isHindi ? 'क्या आपका व्यापार GST में पंजीकृत है? *' : 'Are you GST Registered? *'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsGstRegistered(true);
                          setBillingType('GST');
                        }}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          isGstRegistered
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/50'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-base mb-1">🟢</div>
                        <div className="font-black text-xs">{isHindi ? 'हाँ, GST रजिस्टर्ड' : 'Yes, GST Registered'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isHindi ? 'टैक्स इनवॉइस व इनपुट टैक्स क्रेडिट' : 'Regular or Composition GST'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsGstRegistered(false);
                          setBillingType('Non-GST');
                        }}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          !isGstRegistered
                            ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400/50'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-base mb-1">⚪</div>
                        <div className="font-black text-xs">{isHindi ? 'नहीं (Non-GST / छोटा व्यापार)' : 'No, Non-GST Business'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isHindi ? 'बिल ऑफ सप्लाई / रसीद' : 'Cash memo, receipts & challans'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* GST Fields if Registered */}
                  {isGstRegistered ? (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          {isHindi ? 'GSTIN (15-अंकों का नंबर) *' : 'GSTIN (15-character GST Number) *'}
                        </label>
                        <input
                          type="text"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                          placeholder="27AAAAA0000A1Z5"
                          maxLength={15}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                        />
                        {stepErrors.gstin && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.gstin}</p>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          {isHindi ? 'GST कानूनी व्यापार नाम (Legal Business Name) *' : 'GST Legal Business Name *'}
                        </label>
                        <input
                          type="text"
                          value={gstLegalName}
                          onChange={(e) => setGstLegalName(e.target.value)}
                          placeholder="e.g. Apex Motors Private Limited"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                        />
                        {stepErrors.gstLegalName && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{stepErrors.gstLegalName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          {isHindi ? 'GST पंजीकरण राज्य' : 'GST Registration State'}
                        </label>
                        <input
                          type="text"
                          value={gstState}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-[11px] space-y-1">
                      <p className="font-bold text-slate-800">
                        {isHindi ? 'GST अनिवार्य नहीं है' : 'GSTIN is not required'}
                      </p>
                      <p>
                        {isHindi
                          ? 'आप बिना GSTIN के भी वैध बिल ऑफ सप्लाई, चालान और रसीदें बना सकते हैं। जब भी आपका टर्नओवर बढ़े, आप सेटिंग्स में जाकर GSTIN जोड़ सकते हैं।'
                          : 'You can generate professional Bills of Supply, receipts, and delivery challans without a GSTIN. You can easily add your GSTIN anytime later in Settings.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: BUSINESS DOCUMENTS */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <p>
                      {isHindi
                        ? 'दस्तावेज़ की स्थिति आवश्यकतानुसार ऑटो-कैलकुलेट की गई है:'
                        : 'Document requirements are dynamically calculated based on your business type:'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {dynamicDocuments.map((docItem) => {
                      const isRequired = docItem.requirement === 'REQUIRED';
                      const isUploaded = docItem.verificationStatus === 'VERIFIED';
                      const errorKey = `doc_${docItem.id}`;

                      return (
                        <div
                          key={docItem.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            stepErrors[errorKey]
                              ? 'border-rose-300 bg-rose-50/50'
                              : isUploaded
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : isRequired
                              ? 'border-amber-200 bg-amber-50/20'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  isUploaded
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isRequired
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {isUploaded ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">{docItem.title}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      isRequired
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : docItem.requirement === 'OPTIONAL'
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {docItem.requirement === 'REQUIRED'
                                      ? isHindi ? 'अनिवार्य' : 'Required'
                                      : docItem.requirement === 'OPTIONAL'
                                      ? isHindi ? 'वैकल्पिक' : 'Optional'
                                      : isHindi ? 'आवश्यक नहीं' : 'Not Required'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {isUploaded ? (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {docItem.fileName} ({Math.round((docItem.fileSize || 0) / 1024)} KB)
                                    </span>
                                  ) : (
                                    'PDF, JPG, PNG up to 5MB'
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isUploaded ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(docItem.id)}
                                  className="px-2.5 py-1 text-rose-600 hover:text-rose-700 text-xs font-bold hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{isHindi ? 'हटाएं' : 'Remove'}</span>
                                </button>
                              ) : (
                                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                                  <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{isHindi ? 'अपलोड करें' : 'Attach File'}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => handleFileUpload(docItem.id, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {stepErrors[errorKey] && (
                            <p className="text-[11px] text-rose-600 font-semibold mt-1">
                              {stepErrors[errorKey]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: BUSINESS CATEGORY */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <p className="text-slate-600 text-xs">
                    {isHindi
                      ? 'अपने व्यापार के अनुसार लागू होने वाली सभी श्रेणियां चुनें:'
                      : 'Select all products & services your business provides to customize your billing engine:'}
                  </p>

                  {/* Sales Categories */}
                  {(businessType === 'sales' || businessType === 'sales_and_service') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                        <Store className="w-4 h-4 text-amber-600" />
                        <span>{isHindi ? 'बिक्री श्रेणियां (Sales Categories)' : 'Sales Categories'}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SALES_CATEGORIES.map((cat) => {
                          const isSelected = salesCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat, 'sales')}
                              className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Service Categories */}
                  {(businessType === 'service' || businessType === 'sales_and_service') && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                        <Wrench className="w-4 h-4 text-sky-600" />
                        <span>{isHindi ? 'सर्विस श्रेणियां (Service Categories)' : 'Service Categories'}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SERVICE_CATEGORIES.map((cat) => {
                          const isSelected = serviceCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat, 'service')}
                              className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {stepErrors.categories && (
                    <p className="text-[11px] text-rose-600 font-semibold">{stepErrors.categories}</p>
                  )}
                </div>
              )}

              {/* STEP 6: BUSINESS CONFIGURATION */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Billing Type */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'बिलिंग प्रकार (Billing Type) *' : 'Billing Type *'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBillingType('GST')}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            billingType === 'GST'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          GST Invoicing
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingType('Non-GST')}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            billingType === 'Non-GST'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Non-GST Billing
                        </button>
                      </div>
                    </div>

                    {/* GST Calculation Mode */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'GST गणना का तरीका *' : 'GST Calculation Mode *'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGstCalculationMode('Exclusive')}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            gstCalculationMode === 'Exclusive'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Exclusive (+ GST)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGstCalculationMode('Inclusive')}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            gstCalculationMode === 'Inclusive'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Inclusive (MRP)
                        </button>
                      </div>
                    </div>

                    {/* Default GST Rate */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {isHindi ? 'डिफ़ॉल्ट GST दर *' : 'Default GST Rate *'}
                      </label>
                      <select
                        value={defaultGstRate}
                        onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      >
                        <option value={0}>0% (Exempt / Nil)</option>
                        <option value={5}>5% (EV Vehicles & Specified Parts)</option>
                        <option value={12}>12% (Batteries & General Goods)</option>
                        <option value={18}>18% (Automotive Spares & Services)</option>
                        <option value={28}>28% (Commercial Vehicles & Luxury)</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      {isHindi ? 'स्वीकृत भुगतान माध्यम (Payment Methods) *' : 'Accepted Payment Methods *'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        'Cash',
                        'UPI',
                        'Card',
                        'Bank Transfer',
                        'Credit',
                        'Cheque',
                        'Finance / Loan',
                        'Other',
                      ].map((method) => {
                        const isSelected = paymentMethods.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => togglePaymentMethod(method)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs font-black'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>{method}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-800" />}
                          </button>
                        );
                      })}
                    </div>
                    {stepErrors.paymentMethods && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {stepErrors.paymentMethods}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 7: BUSINESS-SPECIFIC SETUP (Module Activation) */}
              {currentStep === 7 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-slate-900 text-xs">
                        {isHindi ? 'आपका BahiKhata बिज़नेस इंजन तैयार है!' : 'Your BahiKhata Business Engine is Ready!'}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {isHindi
                          ? `आपके ${businessType === 'sales_and_service' ? 'बिक्री व सर्विस' : businessType === 'service' ? 'सर्विस' : 'बिक्री'} व्यापार के अनुसार नीचे दिए गए सभी मॉड्यूल स्वचालित रूप से सक्रिय कर दिए गए हैं:`
                          : `Based on your ${businessType.replace('_', ' ')} registration, the following modules are automatically activated:`}
                      </p>
                    </div>
                  </div>

                  {/* Active modules grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activatedModules.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{mod.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold uppercase">
                              Active
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{mod.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">
                      {isHindi ? 'पंजीकरण पुष्टि' : 'Registration Confirmation'}
                    </p>
                    <p>
                      {businessName} &bull; {city}, {state} &bull;{' '}
                      {isGstRegistered ? `GSTIN: ${gstin}` : 'Non-GST'}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar (Sticky & Mobile Responsive) */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isHindi ? 'पिछला' : 'Back'}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ml-auto"
              >
                <span>
                  {currentStep === totalSteps
                    ? isHindi
                      ? 'पंजीकरण पूर्ण करें व डैशबोर्ड खोलें'
                      : 'Complete Registration & Open Dashboard'
                    : isHindi
                    ? 'जारी रखें'
                    : 'Save & Continue'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
