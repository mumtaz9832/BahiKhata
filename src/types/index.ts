export type AppMode = 'auto_dealer' | 'general_retail';

export type VehicleType = 'two_wheeler' | 'four_wheeler' | 'electric_vehicle' | 'commercial';

export type PaymentMode = 'Cash' | 'UPI / QR' | 'Cheque' | 'Bank Transfer (NEFT/IMPS)' | 'Finance / Loan';

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface BusinessProfile {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  altPhone?: string;
  email: string;
  gstin?: string;
  dealerCode?: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  terms: string[];
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
  chassisNo: string; // VIN
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

export interface PricingAndPayment {
  basePrice: number;
  rtoCharges: number;
  insuranceCharges: number;
  accessoriesCharges: number;
  discount: number;
  totalSaleValue: number;
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
