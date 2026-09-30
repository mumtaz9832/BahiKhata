export type AppMode = 'auto_dealer' | 'general_retail';

export type VehicleType = 'two_wheeler' | 'four_wheeler' | 'electric_vehicle' | 'commercial';

export type PaymentMode = 'Cash' | 'UPI / QR' | 'Cheque' | 'Bank Transfer (NEFT/IMPS)' | 'Finance / Loan';

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type AppLanguage = 'en' | 'hi';

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_yearly';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string;
  invoiceCountThisMonth: number;
  monthKey: string; // e.g. "2026-09"
  hasWatermark: boolean;
  canUploadCustomLogo: boolean;
  unlimitedInvoices: boolean;
}

export type BusinessType = 'sales' | 'service' | 'sales_and_service';

export type DocumentRequirement = 'REQUIRED' | 'OPTIONAL' | 'NOT_REQUIRED';

export interface BusinessDocument {
  id: string;
  type: string;
  title: string;
  requirement: DocumentRequirement;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  uploadedAt?: string;
  verificationStatus: 'NOT_UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface BusinessProfile {
  // Core & Identification
  userId?: string;
  fullName?: string;
  email: string;
  phone: string;
  altPhone?: string;

  // Trading details
  name: string; // Business/Shop name
  businessName?: string; // Explicit alias for registration form
  tagline: string;
  businessType?: BusinessType;
  industryType?: string;
  salesCategories?: string[];
  serviceCategories?: string[];

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;

  // Tax & Legal
  gstRegistered?: boolean;
  gstin?: string;
  gstLegalName?: string;
  gstState?: string;
  dealerCode?: string;

  // Documents
  documents?: BusinessDocument[];

  // Invoicing & Finance
  billingType?: 'GST' | 'Non-GST';
  gstCalculationMode?: 'Inclusive' | 'Exclusive';
  defaultGstRate?: number;
  paymentMethods?: string[];

  // Payment Accounts
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  logoUrl?: string;
  terms: string[];

  // Registration & Verification fields
  mobileNumber?: string;
  businessAddress?: string;
  gstNumber?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;

  // Onboarding & Module states
  registrationCompleted?: boolean;
  onboardingCompleted?: boolean;
  activeModules?: string[];
  authMethod?: 'google' | 'email_mobile';
  createdAt?: string;
  updatedAt?: string;
}

export interface BuyerDetails {
  fullName: string;
  phone: string;
  altPhone?: string;
  idNumber: string; // Aadhaar / PAN / Driving License
  idType: 'Aadhaar Card' | 'PAN Card' | 'Driving License' | 'Voter ID';
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface VehicleDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  variant?: string;
  registrationNo: string; // e.g., MH12 AB 1234 or "NEW / UNREGISTERED"
  chassisNo: string; // VIN (17 characters validation)
  engineMotorNo: string;
  manufacturingYear: number;
  color: string;
  odometerKm: number;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'Hybrid';
  // Conditional EV fields
  batteryCapacityKwh?: string;
  chargerSerialNo?: string;
  batteryWarrantyYears?: string;
  motorPowerKw?: string;
  hypothecationBank?: string; // Financed through
}

export interface ExchangeVehicle {
  isExchange: boolean;
  makeModel?: string;
  registrationNo?: string;
  chassisNo?: string;
  manufacturingYear?: number;
  exchangeValuation: number;
}

export interface FinancingDetails {
  status: 'Cash' | 'Financed';
  financierName?: string;
  loanAccountNo?: string;
  downPayment?: number;
  loanAmount?: number;
}

export interface PricingAndPayment {
  basePrice: number;
  rtoCharges: number;
  insuranceCharges: number;
  accessoriesCharges: number;
  discount: number;
  exchangeValuation?: number; // Deducted from total
  totalSaleValue: number; // Gross on-road value
  netPayableAmount: number; // After discount & exchange
  advanceReceived: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  balanceDueDate: string;
  notes?: string;
}

export interface AutoDealerData {
  buyer: BuyerDetails;
  vehicle: VehicleDetails;
  pricing: PricingAndPayment;
  exchange?: ExchangeVehicle;
  financing?: FinancingDetails;
}

export interface RetailItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  gstPercent: number;
  amount: number;
}

export interface RetailData {
  customer: {
    fullName: string;
    phone: string;
    address: string;
    gstin?: string;
  };
  items: RetailItem[];
  subtotal: number;
  discount: number;
  totalGst: number;
  grandTotal: number;
  advanceReceived: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  balanceDueDate: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  note?: string;
}

export interface SavedInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  deliveryDate: string;
  deliveryTime: string;
  mode: AppMode;
  autoData?: AutoDealerData;
  retailData?: RetailData;
  businessProfile: BusinessProfile;
  status: InvoiceStatus;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type AppView = 'home' | 'generate_bill' | 'sales' | 'parties' | 'items' | 'reports';

export interface CustomerRecord {
  id: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  idType?: 'Aadhaar Card' | 'PAN Card' | 'Driving License' | 'Voter ID';
  idNumber?: string;
  gstin?: string;
  openingBalance?: number;
  balanceDue?: number;
  notes?: string;
  createdAt: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: 'two_wheeler' | 'four_wheeler' | 'electric_vehicle' | 'commercial' | 'spare_parts' | 'goods' | 'service';
  make?: string;
  model?: string;
  variant?: string;
  hsn: string;
  rate: number;
  purchasePrice?: number;
  gstPercent: number;
  unit: string;
  stockQty?: number;
  minStockAlert?: number;
  description?: string;
  createdAt: string;
}

