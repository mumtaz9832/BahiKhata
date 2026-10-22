export type AppMode = 'auto_dealer' | 'general_retail';

export type VehicleType = 'two_wheeler' | 'four_wheeler' | 'electric_vehicle' | 'commercial';

export type PaymentMode = 'Cash' | 'UPI / QR' | 'Cheque' | 'Bank Transfer (NEFT/IMPS)' | 'Finance / Loan';

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED' | 'RETURNED';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

export interface SyncStateInfo {
  status: CloudSyncStatus;
  pendingCount: number;
  lastSyncedAt?: string;
  errorMessage?: string;
}

export type AppLanguage = 'en' | 'hi';

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_half_yearly' | 'pro_yearly';

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
  id?: string; // Unique business identifier
  userId?: string;
  fullName?: string; // Owner name
  email: string;
  phone: string;
  altPhone?: string;

  // Trading & Multi-Industry details
  name: string; // Business/Shop name
  businessName?: string; // Explicit alias for registration form
  tagline: string;
  category?: 'Sales' | 'Service'; // Required Category: Sales or Service
  subcategory?: string; // Subcategory belonging to Category
  industryCategory?: string; // e.g., 'Scrap & Recycling', 'Construction & Building', etc.
  industryType?: string; // backward compat
  subcategories?: string[]; // Dynamic subcategories selected
  businessModels?: string[]; // e.g. ['Wholesale', 'Recycler', 'Trader']
  customSubcategories?: string[];
  businessType?: BusinessType; // backward compat
  salesCategories?: string[];
  serviceCategories?: string[];

  // Location
  address: string;
  district?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;

  // Tax & Legal
  gstRegistrationStatus?: 'Registered' | 'Unregistered' | 'Composition';
  gstRegistered?: boolean;
  gstin?: string;
  gstNumber?: string;
  panNumber?: string;
  gstLegalName?: string;
  gstState?: string;
  dealerCode?: string;

  // Branding & Media
  logoUrl?: string;

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
  terms: string[];

  // Registration & Verification fields
  mobileNumber?: string;
  businessAddress?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;

  // Onboarding & Feature states
  registrationCompleted?: boolean;
  onboardingCompleted?: boolean;
  enabledFeatures?: string[];
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
  taxType?: 'intra_state' | 'inter_state';
  cgst?: number;
  sgst?: number;
  igst?: number;
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
  businessId?: string; // Multi-business data isolation
  invoiceNo: string;
  invoiceDate: string;
  deliveryDate: string;
  deliveryTime: string;
  mode: AppMode;
  autoData?: AutoDealerData;
  retailData?: RetailData;
  businessProfile: BusinessProfile;
  status: InvoiceStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  isInterState?: boolean;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type AppView = 'home' | 'generate_bill' | 'sales' | 'parties' | 'items' | 'reports';

export interface CustomerRecord {
  id: string;
  businessId?: string; // Multi-business data isolation
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
  partyType?: 'customer' | 'supplier';
  supplierPayable?: number;
  createdAt: string;
}

export interface ProductRecord {
  id: string;
  businessId?: string; // Multi-business data isolation
  type?: 'product' | 'service'; // Product or Service distinction
  name: string;
  category: 'two_wheeler' | 'four_wheeler' | 'electric_vehicle' | 'commercial' | 'spare_parts' | 'goods' | 'service' | string;
  industryCategory?: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  make?: string;
  model?: string;
  variant?: string;
  hsn: string;
  rate: number; // Selling Price
  purchasePrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  gstPercent: number;
  unit: string;
  stockQty?: number;
  minStockAlert?: number;
  supplier?: string;
  warranty?: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  description?: string;

  // Specific to Service items
  serviceCode?: string;
  labourCharge?: number;
  partsRequired?: string;
  serviceDuration?: string;
  assignedTechnician?: string;
  serviceWarranty?: string;

  stockAdjustments?: { id: string; date: string; type: 'stock_in' | 'stock_out' | 'damage' | 'audit'; qty: number; reason: string }[];

  createdAt: string;
}

export interface StorageStatistics {
  invoiceCount: number;
  customerCount: number;
  productCount: number;
  businessCount: number;
  activeBusinessName: string;
  totalSalesValue: number;
  totalBalanceDue: number;
  stockValuation: number;
  estimatedSizeKb: number;
  lastBackupDate?: string;
}

export interface BackupMetadata {
  invoiceCount: number;
  customerCount: number;
  productCount: number;
  businessCount: number;
  activeBusinessName: string;
  totalSalesValue: number;
  totalBalanceDue: number;
  stockValuation: number;
}

export interface BizcoreBackupPayload {
  format: 'BIZCORE_BACKUP';
  version: string;
  app: string;
  exportedAt: string;
  notes?: string;
  metadata: BackupMetadata;
  data: {
    profile: BusinessProfile;
    businesses?: BusinessProfile[];
    activeBusinessId?: string;
    invoices: SavedInvoice[];
    customers: CustomerRecord[];
    products: ProductRecord[];
    subscription?: SubscriptionState;
    language?: AppLanguage;
  };
}

export interface BackupInspectionResult {
  isValid: boolean;
  error?: string;
  isLegacy?: boolean;
  exportedAt?: string;
  notes?: string;
  summary: {
    businessName: string;
    industryCategory?: string;
    invoiceCount: number;
    customerCount: number;
    productCount: number;
    businessCount: number;
    totalSalesValue: number;
    totalBalanceDue: number;
    stockValuation: number;
  };
  parsedData: {
    profile?: BusinessProfile;
    businesses?: BusinessProfile[];
    activeBusinessId?: string;
    invoices?: SavedInvoice[];
    customers?: CustomerRecord[];
    products?: ProductRecord[];
    subscription?: SubscriptionState;
    language?: AppLanguage;
  };
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  mode: 'replace' | 'merge';
  restoredStats: {
    invoicesRestored: number;
    customersRestored: number;
    productsRestored: number;
    businessesRestored: number;
  };
}

// --------------------------------------------------------------------------
// EXPENSES & PURCHASES
// --------------------------------------------------------------------------

export interface ExpenseRecord {
  id: string;
  businessId?: string;
  date: string;
  category: 'Rent' | 'Electricity & Water' | 'Staff Salary' | 'Transport & Logistics' | 'Marketing & Ads' | 'Office & Maintenance' | 'Taxes & Govt Fees' | 'Other Expense';
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  receiptNumber?: string;
  paidTo?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId?: string;
  description: string;
  hsn?: string;
  qty: number;
  unit: string;
  rate: number;
  gstPercent: number;
  amount: number;
}

export interface PurchaseRecord {
  id: string;
  businessId?: string;
  purchaseNo: string;
  billNo?: string;
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierGstin?: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: PaymentMode;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// --------------------------------------------------------------------------
// CREDIT NOTES & DEBIT NOTES (Sales & Purchase Returns)
// --------------------------------------------------------------------------

export interface CreditDebitNote {
  id: string;
  businessId?: string;
  noteType: 'credit_note' | 'debit_note';
  noteNo: string;
  invoiceId?: string;
  invoiceNo?: string;
  partyId?: string;
  partyName: string;
  partyType: 'customer' | 'supplier';
  date: string;
  reason: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'ISSUED' | 'APPLIED' | 'CANCELLED';
  createdAt: string;
}

// --------------------------------------------------------------------------
// SUBSCRIPTIONS & VERIFIED TRANSACTIONS
// --------------------------------------------------------------------------

export interface SubscriptionPaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  planTier: SubscriptionTier;
  planName: string;
  challengeToken: string;
  provider: 'razorpay' | 'cashfree' | 'upi_gateway';
  keyId: string;
  createdAt: string;
}

export interface SubscriptionTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  receiptNo: string;
  planTier: SubscriptionTier;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  businessName: string;
  expiresAt: string;
}

