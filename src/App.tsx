/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  AppMode,
  SavedInvoice,
  AutoDealerData,
  RetailData,
  BusinessProfile,
  PaymentMode,
  AppLanguage,
  SubscriptionState,
  AppView,
  CustomerRecord,
  ProductRecord,
} from './types';
import {
  getBusinessProfile,
  saveBusinessProfile,
  getSavedInvoices,
  saveInvoice,
  deleteInvoice,
  recordInvoicePayment,
  generateNextInvoiceNo,
  DEFAULT_BUSINESS_PROFILE,
  initializeHybridStorage,
  getSubscriptionState,
  saveSubscriptionState,
  incrementMonthlyInvoiceCount,
  getLanguagePreference,
  saveLanguagePreference,
  getSavedCustomers,
  saveCustomer,
  deleteCustomer,
  getSavedProducts,
  saveProduct,
  deleteProduct,
  purgeAllFalseData,
  syncProfileToFirestore,
  loadProfileFromFirestore,
} from './utils/storage';
import { exportElementToPDF, triggerPrintDialog, generatePDFBlob } from './utils/pdfExport';
import { initAuth, googleSignIn, logout, getAccessToken } from './utils/googleAuth';
import { uploadBlobToDrive } from './utils/googleDrive';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AutoDealerForm } from './components/AutoDealerForm';
import { RetailForm } from './components/RetailForm';
import { InvoiceDocument } from './components/InvoiceDocument';
import { DeliveryChallanDocument } from './components/DeliveryChallanDocument';
import { WhatsAppModal } from './components/WhatsAppModal';
import { KhataLedger } from './components/KhataLedger';
import { SettingsModal } from './components/SettingsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SlideOverDrawer } from './components/SlideOverDrawer';
import { QuickQRModal } from './components/QuickQRModal';
import { HomePage } from './components/HomePage';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddProductModal } from './components/AddProductModal';
import { VyaparSidebar } from './components/VyaparSidebar';
import { AuthModal } from './components/AuthModal';
import { SingleRegistrationModal, RegistrationData } from './components/SingleRegistrationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SalesView } from './components/SalesView';
import { PartiesView } from './components/PartiesView';
import { ItemsView } from './components/ItemsView';
import { ReportsView } from './components/ReportsView';
import {
  FileText,
  FileCheck2,
  Printer,
  Download,
  MessageCircle,
  Save,
  Check,
  Eye,
  Edit3,
  Loader2,
  Cloud,
  ExternalLink,
  QrCode,
  ArrowLeft,
  UserPlus,
  PackagePlus,
  Mail,
} from 'lucide-react';


const INITIAL_AUTO_DATA: AutoDealerData = {
  buyer: {
    fullName: '',
    phone: '',
    altPhone: '',
    idType: 'Aadhaar Card',
    idNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  },
  vehicle: {
    vehicleType: 'two_wheeler',
    make: '',
    model: '',
    variant: '',
    registrationNo: 'NEW',
    chassisNo: '',
    engineMotorNo: '',
    manufacturingYear: new Date().getFullYear(),
    color: '',
    odometerKm: 0,
    fuelType: 'Petrol',
  },
  pricing: {
    basePrice: 0,
    rtoCharges: 0,
    insuranceCharges: 0,
    accessoriesCharges: 0,
    discount: 0,
    totalSaleValue: 0,
    netPayableAmount: 0,
    advanceReceived: 0,
    balanceAmount: 0,
    paymentMode: 'UPI / QR',
    transactionRef: '',
    balanceDueDate: new Date().toISOString().slice(0, 10),
    notes: '',
  },
};

const INITIAL_RETAIL_DATA: RetailData = {
  customer: {
    fullName: '',
    phone: '',
    address: '',
    gstin: '',
  },
  items: [],
  subtotal: 0,
  discount: 0,
  totalGst: 0,
  grandTotal: 0,
  advanceReceived: 0,
  balanceAmount: 0,
  paymentMode: 'UPI / QR',
  transactionRef: '',
  balanceDueDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('auto_dealer');
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [currentId, setCurrentId] = useState<string>('draft_' + Date.now());

  // Meta fields
  const [invoiceNo, setInvoiceNo] = useState<string>(() => generateNextInvoiceNo());
  const [invoiceDate, setInvoiceDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryTime, setDeliveryTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  // Navigation View: 'home' | 'sales' | 'parties' | 'items' | 'reports' | 'generate_bill'
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer & Product directories
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getSavedCustomers());
  const [products, setProducts] = useState<ProductRecord[]>(() => getSavedProducts());
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  // Form states
  const [autoData, setAutoData] = useState<AutoDealerData>(INITIAL_AUTO_DATA);
  const [retailData, setRetailData] = useState<RetailData>(INITIAL_RETAIL_DATA);

  // Document preview tab
  const [previewTab, setPreviewTab] = useState<'invoice' | 'challan'>('invoice');

  // Mobile split view tab ('form' | 'preview')
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Modals & Drawers
  const [isKhataOpen, setIsKhataOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState<SavedInvoice | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isQuickQROpen, setIsQuickQROpen] = useState<boolean>(false);

  // Multilingual & Subscription States
  const [lang, setLang] = useState<AppLanguage>(() => getLanguagePreference());
  const [subscription, setSubscription] = useState<SubscriptionState>(() => getSubscriptionState());

  const handleToggleLang = () => {
    const nextLang: AppLanguage = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    saveLanguagePreference(nextLang);
  };

  // Google Auth & Drive States
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [registrationAuthMethod, setRegistrationAuthMethod] = useState<'google' | 'email_mobile'>('google');
  const [temporaryAccountUser, setTemporaryAccountUser] = useState<{
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    return localStorage.getItem('bahikhata_guest_mode') !== 'true';
  });
  const [isSingleRegistrationOpen, setIsSingleRegistrationOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveUploadSuccessLink, setDriveUploadSuccessLink] = useState<{ name: string; url: string } | null>(null);

  // UI state
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [isEmailPreparing, setIsEmailPreparing] = useState<boolean>(false);
  const [emailShareNotice, setEmailShareNotice] = useState<{ filename: string; hasWebShare: boolean } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load initial data & Auth state & Hybrid Storage reconciliation
  useEffect(() => {
    const loadedProfile = getBusinessProfile();
    setProfile(loadedProfile);
    const loadedInvoices = getSavedInvoices();
    setInvoices(loadedInvoices);
    setSubscription(getSubscriptionState());

    // Hydrate from IndexedDB in background to prevent browser storage wipes
    initializeHybridStorage().then(() => {
      const reconciledProfile = getBusinessProfile();
      setProfile(reconciledProfile);
      setInvoices(getSavedInvoices());
      setSubscription(getSubscriptionState());
      setCustomers(getSavedCustomers());
      setProducts(getSavedProducts());

      // If user is guest/local and registration has never been completed, prompt single registration
      if (
        localStorage.getItem('bahikhata_guest_mode') === 'true' &&
        !reconciledProfile.registrationCompleted &&
        reconciledProfile.name === 'BahiKhata Business' &&
        !reconciledProfile.phone
      ) {
        setRegistrationAuthMethod('email_mobile');
        setIsSingleRegistrationOpen(true);
      }
    });

    // Initialize Google auth listener
    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setIsAuthLoading(false);
        if (authUser) {
          setIsAuthModalOpen(false);
          // Check if remote profile exists in Firestore
          const remoteProfile = await loadProfileFromFirestore(authUser.uid);
          const activeProf = remoteProfile || getBusinessProfile();
          setProfile(activeProf);

          // If Google authentication is valid but business registration is incomplete,
          // launch the Single Registration Form with pre-filled name and email
          if (!activeProf.registrationCompleted) {
            setRegistrationAuthMethod('google');
            setIsSingleRegistrationOpen(true);
          }
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Assemble active invoice object
  const activeInvoice: SavedInvoice = useMemo(() => {
    const isAuto = mode === 'auto_dealer';
    const balance = isAuto
      ? autoData?.pricing?.balanceAmount || 0
      : retailData?.balanceAmount || 0;

    return {
      id: currentId,
      invoiceNo,
      invoiceDate,
      deliveryDate,
      deliveryTime,
      mode,
      autoData: isAuto ? autoData : undefined,
      retailData: !isAuto ? retailData : undefined,
      businessProfile: profile,
      status: balance === 0 ? 'PAID' : 'PARTIAL',
      paymentHistory: [
        {
          id: 'pay_init',
          date: invoiceDate,
          amount: isAuto ? (autoData?.pricing?.advanceReceived || 0) : (retailData?.advanceReceived || 0),
          mode: isAuto ? (autoData?.pricing?.paymentMode || 'Cash') : (retailData?.paymentMode || 'Cash'),
          reference: isAuto ? autoData?.pricing?.transactionRef : retailData?.transactionRef,
          note: 'Token / Advance payment',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    currentId,
    invoiceNo,
    invoiceDate,
    deliveryDate,
    deliveryTime,
    mode,
    autoData,
    retailData,
    profile,
  ]);

  // Count pending debtors
  const pendingCount = useMemo(() => {
    return invoices.filter((inv) => {
      const bal =
        inv.mode === 'auto_dealer'
          ? inv.autoData?.pricing?.balanceAmount || 0
          : inv.retailData?.balanceAmount || 0;
      return bal > 0;
    }).length;
  }, [invoices]);

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        localStorage.removeItem('bahikhata_guest_mode');
        setIsAuthModalOpen(false);

        // Fetch remote or local profile
        const remoteProfile = await loadProfileFromFirestore(res.user.uid);
        const currProfile = remoteProfile || getBusinessProfile();
        setProfile(currProfile);

        // Google authentication alone is not considered completed registration
        // Open single business registration form if registrationCompleted is false
        if (!currProfile.registrationCompleted) {
          setRegistrationAuthMethod('google');
          setIsSingleRegistrationOpen(true);
        }
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailMobileRegister = (accData: { fullName: string; email: string; phone: string }) => {
    setTemporaryAccountUser({
      displayName: accData.fullName,
      email: accData.email,
      phoneNumber: accData.phone,
    });
    setRegistrationAuthMethod('email_mobile');
    setIsAuthModalOpen(false);
    setIsSingleRegistrationOpen(true);
  };

  // Complete Single Business Registration
  const handleCompleteSingleRegistration = async (data: RegistrationData) => {
    const effectiveUserId = user?.uid || data.userId || `bahi_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const updatedProf: BusinessProfile = {
      ...profile,
      userId: effectiveUserId,
      fullName: data.fullName,
      name: data.businessName,
      businessName: data.businessName,
      mobileNumber: data.mobileNumber,
      phone: data.mobileNumber,
      email: data.email,
      businessAddress: data.businessAddress,
      address: data.businessAddress,
      gstNumber: data.gstNumber || undefined,
      gstin: data.gstNumber || undefined,
      gstRegistered: Boolean(data.gstNumber),
      mobileVerified: true,
      emailVerified: true,
      registrationCompleted: true,
      onboardingCompleted: true,
      createdAt: profile.createdAt || nowIso,
      updatedAt: nowIso,
    };

    setProfile(updatedProf);
    saveBusinessProfile(updatedProf);
    localStorage.removeItem('bahikhata_guest_mode');
    localStorage.setItem('bahikhata_onboarded', 'true');

    if (effectiveUserId) {
      try {
        await syncProfileToFirestore(updatedProf, effectiveUserId);
      } catch (err) {
        console.warn('Firestore profile sync error:', err);
      }
    }

    setIsSingleRegistrationOpen(false);
    setIsAuthModalOpen(false);
    setIsOnboardingOpen(false);
    setCurrentView('home');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Upload current invoice or challan to Google Drive
  const handleSaveToDrive = async () => {
    let token = accessToken;
    if (!token || !user) {
      setIsAuthLoading(true);
      try {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          setAccessToken(res.accessToken);
          token = res.accessToken;
        } else {
          return;
        }
      } catch (err) {
        console.error('Drive sign-in error:', err);
        return;
      } finally {
        setIsAuthLoading(false);
      }
    }

    if (!token) return;

    setIsUploadingToDrive(true);
    setDriveUploadSuccessLink(null);

    const elementId =
      previewTab === 'invoice'
        ? 'printable-invoice-document'
        : 'printable-challan-document';

    const filename = `${invoiceNo}_${
      previewTab === 'invoice' ? 'Tax-Invoice' : 'Delivery-Challan'
    }.pdf`;

    try {
      const blob = await generatePDFBlob(elementId);
      if (!blob) throw new Error('Failed to generate PDF document');

      const uploaded = await uploadBlobToDrive(blob, filename, token);
      if (uploaded.webViewLink) {
        setDriveUploadSuccessLink({
          name: uploaded.name,
          url: uploaded.webViewLink,
        });
        setTimeout(() => setDriveUploadSuccessLink(null), 8000);
      }
    } catch (err: any) {
      console.error('Error saving to Drive:', err);
      alert(`Could not upload to Google Drive: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Actions
  const handleSaveToKhata = () => {
    // Check monthly cap if on Free Tier
    const countCheck = incrementMonthlyInvoiceCount();
    if (!countCheck.allowed) {
      setIsSubscriptionOpen(true);
      return;
    }
    const updated = saveInvoice(activeInvoice);
    setInvoices(updated);
    setSubscription(getSubscriptionState());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleNewInvoice = () => {
    const nextNo = generateNextInvoiceNo();
    setInvoiceNo(nextNo);
    setCurrentId('inv_' + Date.now());
    const today = new Date().toISOString().slice(0, 10);
    setInvoiceDate(today);
    setDeliveryDate(today);
    setDeliveryTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    );

    if (mode === 'auto_dealer') {
      setAutoData({
        buyer: {
          fullName: '',
          phone: '',
          idType: 'Aadhaar Card',
          idNumber: '',
          address: '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
        },
        vehicle: {
          vehicleType: 'two_wheeler',
          make: '',
          model: '',
          variant: '',
          registrationNo: 'NEW',
          chassisNo: '',
          engineMotorNo: '',
          manufacturingYear: new Date().getFullYear(),
          color: '',
          odometerKm: 0,
          fuelType: 'Petrol',
        },
        pricing: {
          basePrice: 0,
          rtoCharges: 0,
          insuranceCharges: 0,
          accessoriesCharges: 0,
          discount: 0,
          totalSaleValue: 0,
          netPayableAmount: 0,
          advanceReceived: 0,
          balanceAmount: 0,
          paymentMode: 'UPI / QR',
          balanceDueDate: today,
        },
      });
    } else {
      setRetailData({
        customer: {
          fullName: '',
          phone: '',
          address: '',
        },
        items: [],
        subtotal: 0,
        discount: 0,
        totalGst: 0,
        grandTotal: 0,
        advanceReceived: 0,
        balanceAmount: 0,
        paymentMode: 'UPI / QR',
        balanceDueDate: today,
      });
    }
    setCurrentView('generate_bill');
  };

  const handleSelectInvoiceFromKhata = (inv: SavedInvoice) => {
    setCurrentId(inv.id);
    setInvoiceNo(inv.invoiceNo);
    setInvoiceDate(inv.invoiceDate);
    setDeliveryDate(inv.deliveryDate || inv.invoiceDate);
    setDeliveryTime(inv.deliveryTime || '04:00 PM');
    setMode(inv.mode);

    if (inv.mode === 'auto_dealer' && inv.autoData) {
      setAutoData(inv.autoData);
    } else if (inv.mode === 'general_retail' && inv.retailData) {
      setRetailData(inv.retailData);
    }
    setCurrentView('generate_bill');
  };

  const handleSaveCustomer = (customer: CustomerRecord) => {
    const updated = saveCustomer(customer);
    setCustomers(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = deleteCustomer(id);
    setCustomers(updated);
  };

  const handleSaveProduct = (product: ProductRecord) => {
    const updated = saveProduct(product);
    setProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = deleteProduct(id);
    setProducts(updated);
  };

  const handleSelectCustomerForBill = (customer: CustomerRecord) => {
    if (mode === 'auto_dealer') {
      setAutoData((prev) => ({
        ...prev,
        buyer: {
          fullName: customer.fullName,
          phone: customer.phone,
          altPhone: customer.altPhone || '',
          idType: customer.idType || 'Aadhaar Card',
          idNumber: customer.idNumber || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          pincode: customer.pincode || '',
        },
      }));
    } else {
      setRetailData((prev) => ({
        ...prev,
        customer: {
          fullName: customer.fullName,
          phone: customer.phone,
          address: [customer.address, customer.city, customer.state, customer.pincode]
            .filter(Boolean)
            .join(', '),
          gstin: customer.gstin || '',
        },
      }));
    }
    setCurrentView('generate_bill');
  };

  const handleSelectProductForBill = (product: ProductRecord) => {
    if (mode === 'auto_dealer') {
      setAutoData((prev) => {
        const cat = ['two_wheeler', 'four_wheeler', 'electric_vehicle', 'commercial'].includes(
          product.category
        )
          ? product.category
          : 'two_wheeler';

        const base = product.rate || 0;
        const total =
          base +
          prev.pricing.rtoCharges +
          prev.pricing.insuranceCharges +
          prev.pricing.accessoriesCharges -
          prev.pricing.discount;
        const net = total - (prev.pricing.exchangeValuation || 0);
        const bal = Math.max(0, net - prev.pricing.advanceReceived);

        return {
          ...prev,
          vehicle: {
            ...prev.vehicle,
            vehicleType: cat as any,
            make: product.make || product.name,
            model: product.model || product.name,
            variant: product.variant || '',
          },
          pricing: {
            ...prev.pricing,
            basePrice: base,
            totalSaleValue: total,
            netPayableAmount: net,
            balanceAmount: bal,
          },
        };
      });
    } else {
      const newItem = {
        id: 'item_' + Date.now(),
        description: product.name,
        hsn: product.hsn,
        qty: 1,
        unit: product.unit,
        rate: product.rate,
        gstPercent: product.gstPercent,
        amount: product.rate,
      };
      setRetailData((prev) => {
        const items = [...prev.items, newItem];
        const subtotal = items.reduce((s, i) => s + i.amount, 0);
        const totalGst = items.reduce((s, i) => s + (i.amount * i.gstPercent) / 100, 0);
        const grandTotal = Math.round(subtotal + totalGst - prev.discount);
        const balanceAmount = Math.max(0, grandTotal - prev.advanceReceived);
        return {
          ...prev,
          items,
          subtotal,
          totalGst,
          grandTotal,
          balanceAmount,
        };
      });
    }
    setCurrentView('generate_bill');
  };


  const handleDeleteInvoice = (id: string) => {
    const updated = deleteInvoice(id);
    setInvoices(updated);
  };

  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    payMode: PaymentMode,
    note: string
  ) => {
    const result = recordInvoicePayment(invoiceId, {
      date: new Date().toISOString().slice(0, 10),
      amount,
      mode: payMode,
      note,
    });
    setInvoices(result.all);

    if (activeInvoice.id === invoiceId && result.updatedInvoice) {
      if (result.updatedInvoice.autoData) {
        setAutoData(result.updatedInvoice.autoData);
      }
      if (result.updatedInvoice.retailData) {
        setRetailData(result.updatedInvoice.retailData);
      }
    }
  };

  const handleDownloadPDF = async () => {
    const elementId =
      previewTab === 'invoice'
        ? 'printable-invoice-document'
        : 'printable-challan-document';

    const filename = `${invoiceNo}_${
      previewTab === 'invoice' ? 'Tax-Invoice' : 'Delivery-Challan'
    }.pdf`;

    await exportElementToPDF(elementId, filename, setIsPdfGenerating);
  };

  // Share via Email handler: triggers email draft with generated PDF invoice attached in default mail client
  const handleShareViaEmail = async () => {
    setIsEmailPreparing(true);
    setEmailShareNotice(null);

    const elementId =
      previewTab === 'invoice'
        ? 'printable-invoice-document'
        : 'printable-challan-document';

    const docTitle = previewTab === 'invoice' ? 'Tax Invoice' : 'Delivery Challan';
    const filename = `${invoiceNo}_${
      previewTab === 'invoice' ? 'Tax-Invoice' : 'Delivery-Challan'
    }.pdf`;

    const isAuto = mode === 'auto_dealer';
    const customerName = isAuto
      ? autoData.buyer.fullName || 'Valued Customer'
      : retailData.customer.fullName || 'Valued Customer';

    const customerPhone = isAuto ? autoData.buyer.phone : retailData.customer.phone;

    // Look for customer email in matched records or active fields
    const matchedCustomer = customers.find(
      (c) =>
        (c.phone && customerPhone && c.phone.trim() === customerPhone.trim()) ||
        (c.fullName && customerName && c.fullName.trim().toLowerCase() === customerName.trim().toLowerCase())
    );
    const recipientEmail = matchedCustomer?.email || '';

    const businessName = profile.businessName || profile.name || 'BahiKhata Business';
    const grandTotal = isAuto
      ? autoData.pricing.totalSaleValue || 0
      : retailData.grandTotal || 0;
    const balanceAmount = isAuto
      ? autoData.pricing.balanceAmount || 0
      : retailData.balanceAmount || 0;

    const subject = `${docTitle} #${invoiceNo} from ${businessName}`;
    const emailBody = [
      `Dear ${customerName},`,
      ``,
      `Please find attached your ${docTitle} #${invoiceNo} issued on ${invoiceDate}.`,
      ``,
      `=============================`,
      `INVOICE SUMMARY:`,
      `• Invoice No: ${invoiceNo}`,
      `• Date: ${invoiceDate}`,
      `• Total Amount: ₹${grandTotal.toLocaleString('en-IN')}`,
      `• Advance Received: ₹${(isAuto ? autoData.pricing.advanceReceived || 0 : retailData.advanceReceived || 0).toLocaleString('en-IN')}`,
      `• Balance Due: ₹${balanceAmount.toLocaleString('en-IN')}`,
      `=============================`,
      ``,
      balanceAmount > 0 && profile.upiId
        ? `You can make an instant online payment via UPI: ${profile.upiId}\n`
        : ``,
      `Thank you for choosing ${businessName}!`,
      ``,
      `Best regards,`,
      `${businessName}`,
      profile.phone ? `Phone: ${profile.phone}` : ``,
      profile.email ? `Email: ${profile.email}` : ``,
      profile.address ? `Address: ${profile.address}` : ``,
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    try {
      const blob = await generatePDFBlob(elementId);
      if (!blob) {
        throw new Error('Failed to generate PDF invoice blob');
      }

      const file = new File([blob], filename, { type: 'application/pdf' });

      // 1. Try Web Share API Level 2 (attaches the PDF file directly to default mail client like Gmail / Mail / Outlook)
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: subject,
            text: emailBody,
            files: [file],
          });
          setEmailShareNotice({ filename, hasWebShare: true });
          setTimeout(() => setEmailShareNotice(null), 7000);
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return; // User cancelled the share dialog
          }
          console.warn('Web Share API error, falling back to mailto & download:', shareErr);
        }
      }

      // 2. Fallback for desktop & standard mail clients:
      // Download the generated PDF invoice file so user has the attachment ready
      const downloadUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

      // Trigger user's default mail client draft with pre-filled recipient, subject, and body
      const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;

      setEmailShareNotice({ filename, hasWebShare: false });
      setTimeout(() => setEmailShareNotice(null), 8000);
    } catch (err) {
      console.error('Error sharing invoice via email:', err);
    } finally {
      setIsEmailPreparing(false);
    }
  };

  const handleSaveProfile = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    saveBusinessProfile(newProfile);
    if (user?.uid) {
      syncProfileToFirestore(newProfile, user.uid);
    }
  };

  const openWhatsAppWithCurrent = () => {
    setWhatsAppInvoice(activeInvoice);
    setIsWhatsAppOpen(true);
  };

  const handleClearAllData = () => {
    const isHindi = lang === 'hi';
    const confirmMsg = isHindi
      ? 'क्या आप सचमुच सभी इनवॉइस, ग्राहक और सामान का फर्जी डेटा हटाकर डैशबोर्ड को पूरी तरह साफ करना चाहते हैं?'
      : 'Are you sure you want to delete all false/demo records and reset the dashboard to a clean slate?';
    if (window.confirm(confirmMsg)) {
      purgeAllFalseData();
      setInvoices([]);
      setCustomers([]);
      setProducts([]);
      const cleanProf = getBusinessProfile();
      setProfile(cleanProf);
      handleNewInvoice();
      setCurrentView('home');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex antialiased">
      {/* 1. Left Navigation Sidebar */}
      <VyaparSidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'general_retail' && previewTab === 'challan') {
            setPreviewTab('invoice');
          }
        }}
        profile={profile}
        subscription={subscription}
        pendingBalanceCount={pendingCount}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenQuickQR={() => setIsQuickQROpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenKhata={() => setIsKhataOpen(true)}
        onNewInvoice={() => {
          handleNewInvoice();
          setCurrentView('generate_bill');
        }}
        onClearAllData={handleClearAllData}
        lang={lang}
        onToggleLang={handleToggleLang}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleGoogleSignOut}
        syncStatus={user ? 'synced' : 'offline'}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
            if (newMode === 'general_retail' && previewTab === 'challan') {
              setPreviewTab('invoice');
            }
          }}
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenKhata={() => setIsKhataOpen(true)}
          onNewInvoice={() => {
            handleNewInvoice();
            setCurrentView('generate_bill');
          }}
          onAddCustomer={() => setIsCustomerModalOpen(true)}
          onAddProduct={() => setIsProductModalOpen(true)}
          onOpenQuickQR={() => setIsQuickQROpen(true)}
          onToggleSidebarMobile={() => setIsSidebarOpenMobile((prev) => !prev)}
          pendingBalanceCount={pendingCount}
          subscription={subscription}
          lang={lang}
          onToggleLang={handleToggleLang}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleGoogleSignOut}
          syncStatus={user ? 'synced' : 'offline'}
        />

        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 print:p-0 print:m-0 print:max-w-none print:w-full">
          {currentView === 'home' && (
            <HomePage
              profile={profile}
              invoices={invoices}
              subscription={subscription}
              mode={mode}
              lang={lang}
              customers={customers}
              products={products}
              user={user}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              syncStatus={user ? 'synced' : 'offline'}
              onGenerateBill={() => {
                handleNewInvoice();
                setCurrentView('generate_bill');
              }}
              onAddCustomer={() => setIsCustomerModalOpen(true)}
              onAddProduct={() => setIsProductModalOpen(true)}
              onOpenQuickQR={() => setIsQuickQROpen(true)}
              onOpenKhata={() => setIsKhataOpen(true)}
              onNavigateToSales={() => setCurrentView('sales')}
              onNavigateToParties={() => setCurrentView('parties')}
              onNavigateToItems={() => setCurrentView('items')}
              onSelectInvoiceToView={(inv) => {
                handleSelectInvoiceFromKhata(inv);
                setCurrentView('generate_bill');
              }}
              onPrintInvoice={(inv) => {
                handleSelectInvoiceFromKhata(inv);
                setTimeout(() => triggerPrintDialog(), 200);
              }}
              onWhatsAppInvoice={(inv) => {
                setWhatsAppInvoice(inv);
                setIsWhatsAppOpen(true);
              }}
              onRecordPayment={handleRecordPayment}
              onClearAllData={handleClearAllData}
              onSwitchMode={(newMode) => {
                setMode(newMode);
                if (newMode === 'general_retail' && previewTab === 'challan') {
                  setPreviewTab('invoice');
                }
              }}
            />
          )}

          {currentView === 'sales' && (
            <SalesView
              invoices={invoices}
              lang={lang}
              onSelectInvoiceToView={(inv) => {
                handleSelectInvoiceFromKhata(inv);
                setCurrentView('generate_bill');
              }}
              onPrintInvoice={(inv) => {
                handleSelectInvoiceFromKhata(inv);
                setTimeout(() => triggerPrintDialog(), 200);
              }}
              onWhatsAppInvoice={(inv) => {
                setWhatsAppInvoice(inv);
                setIsWhatsAppOpen(true);
              }}
              onDeleteInvoice={handleDeleteInvoice}
              onRecordPayment={handleRecordPayment}
              onNewInvoice={() => {
                handleNewInvoice();
                setCurrentView('generate_bill');
              }}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'parties' && (
            <PartiesView
              customers={customers}
              invoices={invoices}
              lang={lang}
              onAddCustomer={() => setIsCustomerModalOpen(true)}
              onDeleteCustomer={handleDeleteCustomer}
              onSelectCustomerForBill={handleSelectCustomerForBill}
              onRecordPayment={handleRecordPayment}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'items' && (
            <ItemsView
              products={products}
              lang={lang}
              onAddProduct={() => setIsProductModalOpen(true)}
              onDeleteProduct={handleDeleteProduct}
              onSelectProductForBill={handleSelectProductForBill}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              invoices={invoices}
              profile={profile}
              lang={lang}
            />
          )}

          {currentView === 'generate_bill' && (
        /* Main Container for Billing Workspace */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 print:p-0 print:m-0 print:max-w-none print:w-full">
          {/* Quick Header Bar for Invoice Workspace */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Home</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Select or add customer"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Select / Add Customer</span>
                <span className="sm:hidden">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Select product from catalog"
              >
                <PackagePlus className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden sm:inline">Add Product Catalog</span>
                <span className="sm:hidden">Product</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">
                Invoice No:{' '}
                <span className="font-mono text-slate-900 font-black">{invoiceNo}</span>
              </span>
            </div>
          </div>

          {/* KPI Stats Bar */}
          <StatsBar
            invoices={invoices}
            subscription={subscription}
            onFilterPendingClick={() => setIsKhataOpen(true)}
          />


        {/* Mobile View Toggle Bar */}
        <div className="lg:hidden flex items-center justify-center mb-4 bg-white p-1 rounded-xl border border-slate-200 shadow-xs no-print">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'form'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>1. Edit Details &amp; Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. Live Preview &amp; Print</span>
          </button>
        </div>

        {/* Split Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">
          {/* LEFT COLUMN: Input Form (6 cols on lg) */}
          <div
            className={`no-print lg:col-span-6 space-y-6 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {mode === 'auto_dealer' ? (
              <AutoDealerForm
                data={autoData}
                onChange={setAutoData}
                invoiceNo={invoiceNo}
                onInvoiceNoChange={setInvoiceNo}
                invoiceDate={invoiceDate}
                onInvoiceDateChange={setInvoiceDate}
                deliveryDate={deliveryDate}
                onDeliveryDateChange={setDeliveryDate}
                deliveryTime={deliveryTime}
                onDeliveryTimeChange={setDeliveryTime}
                lang={lang}
              />
            ) : (
              <RetailForm
                data={retailData}
                onChange={setRetailData}
                invoiceNo={invoiceNo}
                onInvoiceNoChange={setInvoiceNo}
                invoiceDate={invoiceDate}
                onInvoiceDateChange={setInvoiceDate}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Document Preview & Output Actions (6 cols on lg) */}
          <div
            className={`lg:col-span-6 space-y-4 ${
              mobileTab === 'form' ? 'hidden lg:block' : 'block'
            } print:block print:w-full print:max-w-none print:m-0 print:p-0`}
          >
            {/* Action Bar Sticky on Desktop */}
            <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-sm no-print space-y-3">
              {/* Document Type Switcher */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('invoice')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'invoice'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Tax / Sale Bill</span>
                  </button>

                  {mode === 'auto_dealer' && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('challan')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        previewTab === 'challan'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Delivery Challan &amp; Agreement</span>
                    </button>
                  )}
                </div>

                {/* Save to Khata Button */}
                <button
                  type="button"
                  onClick={handleSaveToKhata}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Save invoice into Khata ledger"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-slate-950" />
                      <span>Save Khata</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Output Actions: 6 items grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* 1. Print / Save PDF via Browser */}
                <button
                  type="button"
                  onClick={triggerPrintDialog}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Trigger native physical print dialog"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Bill</span>
                </button>

                {/* 2. PDF Download */}
                <button
                  type="button"
                  disabled={isPdfGenerating}
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Export high-res A4 PDF"
                >
                  {isPdfGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>PDF File</span>
                    </>
                  )}
                </button>

                {/* 3. Share via Email */}
                <button
                  type="button"
                  disabled={isEmailPreparing}
                  onClick={handleShareViaEmail}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Trigger email draft with generated PDF invoice attached in default mail client"
                >
                  {isEmailPreparing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Share via Email</span>
                    </>
                  )}
                </button>

                {/* 4. WhatsApp Reminder */}
                <button
                  type="button"
                  onClick={openWhatsAppWithCurrent}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Send invoice & payment reminder on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 5. Dynamic UPI QR */}
                <button
                  type="button"
                  onClick={() => setIsQuickQROpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Show customer counter scan-to-pay QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>UPI QR</span>
                </button>

                {/* 6. Save to Google Drive */}
                <button
                  type="button"
                  disabled={isUploadingToDrive}
                  onClick={handleSaveToDrive}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Upload PDF copy to Google Drive"
                >
                  {isUploadingToDrive ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-blue-200" />
                      <span>Drive</span>
                    </>
                  )}
                </button>
              </div>

              {/* Email Share Notice Banner */}
              {emailShareNotice && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs text-indigo-950 animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {emailShareNotice.hasWebShare ? (
                        <>Email client opened with <strong>{emailShareNotice.filename}</strong> attached!</>
                      ) : (
                        <>Email draft opened in default mail app! PDF invoice (<strong>{emailShareNotice.filename}</strong>) downloaded for attachment.</>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailShareNotice(null)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold ml-2 text-xs cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Drive Upload Success Banner */}
              {driveUploadSuccessLink && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                  <div className="flex items-center gap-1.5 truncate">
                    <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                      Saved <strong>{driveUploadSuccessLink.name}</strong> to Google Drive!
                    </span>
                  </div>
                  <a
                    href={driveUploadSuccessLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-blue-700 hover:underline shrink-0 ml-2"
                  >
                    <span>View on Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Document Render Canvas */}
            <div className="overflow-x-auto pb-8">
              {previewTab === 'invoice' ? (
                <InvoiceDocument
                  invoice={activeInvoice}
                  id="printable-invoice-document"
                  hasWatermark={subscription.hasWatermark}
                  onPrint={triggerPrintDialog}
                  onDownloadPDF={handleDownloadPDF}
                  onShareViaEmail={handleShareViaEmail}
                  onOpenWhatsApp={openWhatsAppWithCurrent}
                  onOpenQR={() => setIsQuickQROpen(true)}
                  isPdfGenerating={isPdfGenerating}
                  isEmailPreparing={isEmailPreparing}
                />
              ) : (
                <DeliveryChallanDocument
                  invoice={activeInvoice}
                  id="printable-challan-document"
                  hasWatermark={subscription.hasWatermark}
                  onPrint={triggerPrintDialog}
                  onDownloadPDF={handleDownloadPDF}
                  onShareViaEmail={handleShareViaEmail}
                  onOpenWhatsApp={openWhatsAppWithCurrent}
                  onOpenQR={() => setIsQuickQROpen(true)}
                  isPdfGenerating={isPdfGenerating}
                  isEmailPreparing={isEmailPreparing}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      )}
        </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">BahiKhata</span> &bull; Smart Billing &amp; Ledger Platform with A4 Printing &amp; Cloud Drive Sync.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsSubscriptionOpen(true)}
              className="hover:text-amber-700 underline flex items-center gap-1 cursor-pointer font-semibold text-amber-800"
            >
              <span>{subscription.tier !== 'free' ? '★ Pro Active' : 'Upgrade to Pro'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              className="hover:text-blue-600 underline flex items-center gap-1 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span>Google Drive Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setIsKhataOpen(true)}
              className="hover:text-slate-700 underline cursor-pointer"
            >
              Digital Khata
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="hover:text-slate-700 underline cursor-pointer font-medium text-slate-600"
            >
              More Settings &rarr;
            </button>
          </div>
        </div>
      </footer>
      </div>

      {/* MODALS & DRAWERS */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        subscription={subscription}
        lang={lang}
        onLanguageChange={(newLang) => {
          setLang(newLang);
          saveLanguagePreference(newLang);
        }}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'general_retail' && previewTab === 'challan') {
            setPreviewTab('invoice');
          }
        }}
        onNavigateHome={() => setCurrentView('home')}
        onGenerateBill={() => {
          handleNewInvoice();
          setCurrentView('generate_bill');
        }}
        onOpenCustomerHub={() => setIsCustomerModalOpen(true)}
        onOpenProductHub={() => setIsProductModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenKhata={() => setIsKhataOpen(true)}
        onOpenQuickQR={() => setIsQuickQROpen(true)}
        pendingBalanceCount={pendingCount}
        user={user}
        isAuthLoading={isAuthLoading}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
      />

      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onSelectCustomerForBill={handleSelectCustomerForBill}
      />

      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={products}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onSelectProductForBill={handleSelectProductForBill}
      />


      <QuickQRModal
        isOpen={isQuickQROpen}
        onClose={() => setIsQuickQROpen(false)}
        upiId={profile.upiId}
        payeeName={profile.name}
        amount={
          mode === 'auto_dealer'
            ? (autoData?.pricing?.balanceAmount || 0)
            : (retailData?.balanceAmount || 0)
        }
        invoiceNo={invoiceNo}
      />

      <WhatsAppModal
        invoice={whatsAppInvoice}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        lang={lang}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        subscription={subscription}
        onSubscriptionUpdated={(newSub) => setSubscription(newSub)}
        lang={lang}
      />

      <KhataLedger
        isOpen={isKhataOpen}
        onClose={() => setIsKhataOpen(false)}
        invoices={invoices}
        onSelectInvoice={handleSelectInvoiceFromKhata}
        onDeleteInvoice={handleDeleteInvoice}
        onRecordPayment={handleRecordPayment}
        onOpenWhatsApp={(inv) => {
          setWhatsAppInvoice(inv);
          setIsWhatsAppOpen(true);
        }}
        onRefreshInvoices={() => {
          setInvoices(getSavedInvoices());
          setProfile(getBusinessProfile());
        }}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        onClearAllData={handleClearAllData}
        onOpenRegistrationWizard={() => {
          setIsSingleRegistrationOpen(true);
        }}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignInRequired={handleGoogleSignIn}
        onKhataRestored={() => {
          setInvoices(getSavedInvoices());
          setProfile(getBusinessProfile());
        }}
        onUploadCurrentInvoice={handleSaveToDrive}
        isUploadingCurrent={isUploadingToDrive}
      />

      {/* Primary Authentication Modal (Login & Access) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        isLoading={isAuthLoading}
        onGoogleSignIn={handleGoogleSignIn}
        onOpenRegister={() => {
          setIsAuthModalOpen(false);
          setIsSingleRegistrationOpen(true);
        }}
        onContinueAsGuest={() => {
          localStorage.setItem('bahikhata_guest_mode', 'true');
          setIsAuthModalOpen(false);
        }}
        lang={lang}
      />

      {/* Single Business Registration & Onboarding Modal */}
      <SingleRegistrationModal
        isOpen={isSingleRegistrationOpen}
        onClose={() => setIsSingleRegistrationOpen(false)}
        initialUser={
          user
            ? {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
              }
            : temporaryAccountUser
        }
        initialProfile={profile}
        isGoogleAuthenticated={Boolean(user && user.email)}
        canCancel={profile.registrationCompleted === true}
        onRegister={handleCompleteSingleRegistration}
        onSwitchToLogin={() => {
          setIsSingleRegistrationOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Multi-Step Business Registration & Onboarding System */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          localStorage.setItem('bahikhata_onboarded', 'true');
          setIsOnboardingOpen(false);
        }}
        profile={profile}
        mode={mode}
        initialUser={
          user
            ? {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
              }
            : temporaryAccountUser
        }
        authMethod={registrationAuthMethod}
        canCancel={profile.registrationCompleted === true}
        onSaveProfile={(updatedProf, newMode) => {
          handleSaveProfile(updatedProf);
          setMode(newMode);
          localStorage.setItem('bahikhata_onboarded', 'true');
        }}
        lang={lang}
      />

      {/* Fixed Mobile Bottom Navigation Bar with Floating "+" Action Button */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onNewBill={() => {
          handleNewInvoice();
          setCurrentView('generate_bill');
        }}
        onAddCustomer={() => setIsCustomerModalOpen(true)}
        onAddProduct={() => setIsProductModalOpen(true)}
        onRecordPayment={() => setIsKhataOpen(true)}
        onOpenMore={() => setIsDrawerOpen(true)}
        pendingKhataCount={pendingCount}
        lang={lang}
      />
    </div>
  );
}
