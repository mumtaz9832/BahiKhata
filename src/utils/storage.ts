import { BusinessProfile, SavedInvoice, AutoDealerData, RetailData, PaymentRecord } from '../types';

const STORAGE_KEY_INVOICES = 'autobill_invoices_v1';
const STORAGE_KEY_PROFILE = 'autobill_business_profile_v1';
const STORAGE_KEY_SETTINGS = 'autobill_settings_v1';

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: 'Apex Motors & EV Hub',
  tagline: 'Authorized Multi-Brand 2W, 4W & Electric Vehicle Dealership',
  address: 'Plot 42, Auto Nagar, Bypass Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411038',
  phone: '+91 98765 43210',
  altPhone: '+91 87654 32109',
  email: 'sales@apexmotorsev.com',
  gstin: '27AABCU9603R1ZM',
  dealerCode: 'APX-PUN-094',
  upiId: 'apexmotors@upi',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200034891234',
  ifscCode: 'HDFC0001234',
  accountHolder: 'Apex Motors & EV Hub Pvt Ltd',
  terms: [
    'Subject to Pune jurisdiction only.',
    'Delivery will be given only against receipt of 100% realized payment.',
    'RTO registration & road tax is subject to respective state government statutory norms.',
    'Vehicle manufacturer warranty rules apply. No dealer warranty on electrical parts unless explicitly stated.',
    'Traffic challans and third-party liabilities post-handover are strictly the buyer’s responsibility.',
  ],
};

export const INITIAL_DEMO_INVOICES: SavedInvoice[] = [
  {
    id: 'inv_demo_001',
    invoiceNo: 'APX-2026-0042',
    invoiceDate: '2026-09-28',
    deliveryDate: '2026-09-28',
    deliveryTime: '04:30 PM',
    mode: 'auto_dealer',
    status: 'PARTIAL',
    businessProfile: DEFAULT_BUSINESS_PROFILE,
    autoData: {
      buyer: {
        fullName: 'Rahul Sharma',
        phone: '+91 98220 12345',
        altPhone: '+91 94220 54321',
        idType: 'Aadhaar Card',
        idNumber: '4829-9182-3741',
        address: 'Flat 402, Green Acres Society, Baner',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
      },
      vehicle: {
        vehicleType: 'electric_vehicle',
        make: 'Ola Electric',
        model: 'Ola S1 Pro Gen 2',
        variant: '4 kWh Matte Black',
        registrationNo: 'MH12 VK 8821',
        chassisNo: 'MD9XX4KWH26B88192',
        engineMotorNo: 'EM-OLA-2026-9932',
        manufacturingYear: 2026,
        color: 'Matte Stellar Black',
        odometerKm: 12,
        fuelType: 'Electric',
        batteryCapacityKwh: '4.0 kWh (IP67)',
        chargerSerialNo: 'CHG-750W-992014',
        batteryWarrantyYears: '8 Years / 80,000 KM',
        motorPowerKw: '11 kW Peak (8.5 kW Nominal)',
        hypothecationBank: 'IDFC First Bank Two-Wheeler Loan',
      },
      pricing: {
        basePrice: 139999,
        rtoCharges: 3500,
        insuranceCharges: 6200,
        accessoriesCharges: 2500,
        discount: 4000,
        totalSaleValue: 148199,
        advanceReceived: 100000,
        balanceAmount: 48199,
        paymentMode: 'UPI / QR',
        transactionRef: 'UPI/628919283741',
        balanceDueDate: '2026-10-05',
        notes: 'Includes helmet, floor mat, and 750W home fast charger.',
      },
    },
    paymentHistory: [
      {
        id: 'pay_1',
        date: '2026-09-28',
        amount: 100000,
        mode: 'UPI / QR',
        reference: 'UPI/628919283741',
        note: 'Advance Token received via Google Pay',
      },
    ],
    createdAt: '2026-09-28T11:00:00Z',
    updatedAt: '2026-09-28T11:00:00Z',
  },
  {
    id: 'inv_demo_002',
    invoiceNo: 'APX-2026-0041',
    invoiceDate: '2026-09-27',
    deliveryDate: '2026-09-27',
    deliveryTime: '02:15 PM',
    mode: 'auto_dealer',
    status: 'PAID',
    businessProfile: DEFAULT_BUSINESS_PROFILE,
    autoData: {
      buyer: {
        fullName: 'Vikram Joshi',
        phone: '+91 97654 11223',
        idType: 'Aadhaar Card',
        idNumber: '3214-7890-4561',
        address: 'B-12, Sai Krupa Colony, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      vehicle: {
        vehicleType: 'two_wheeler',
        make: 'Hero MotoCorp',
        model: 'Splendor Plus XTEC',
        variant: 'i3S Drum Cast',
        registrationNo: 'MH12 UZ 4590',
        chassisNo: 'MBLHA10ENR890123',
        engineMotorNo: 'HA10EN890123',
        manufacturingYear: 2026,
        color: 'Black with Silver Graphics',
        odometerKm: 6,
        fuelType: 'Petrol',
      },
      pricing: {
        basePrice: 79900,
        rtoCharges: 7200,
        insuranceCharges: 5400,
        accessoriesCharges: 1800,
        discount: 2000,
        totalSaleValue: 92300,
        advanceReceived: 92300,
        balanceAmount: 0,
        paymentMode: 'Bank Transfer (NEFT/IMPS)',
        transactionRef: 'NEFT-HDFC-991283',
        balanceDueDate: '2026-09-27',
        notes: 'Full payment realized before delivery. RC smartcard receipt given.',
      },
    },
    paymentHistory: [
      {
        id: 'pay_2',
        date: '2026-09-27',
        amount: 92300,
        mode: 'Bank Transfer (NEFT/IMPS)',
        reference: 'NEFT-HDFC-991283',
        note: 'Full settlement',
      },
    ],
    createdAt: '2026-09-27T08:30:00Z',
    updatedAt: '2026-09-27T08:30:00Z',
  },
];

export function getBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return DEFAULT_BUSINESS_PROFILE;
    return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving business profile:', err);
  }
}

export function getSavedInvoices(): SavedInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) {
      // Seed with initial demo invoices
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_DEMO_INVOICES));
      return INITIAL_DEMO_INVOICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_INVOICES;
  } catch {
    return INITIAL_DEMO_INVOICES;
  }
}

export function saveInvoice(invoice: SavedInvoice): SavedInvoice[] {
  try {
    const all = getSavedInvoices();
    const index = all.findIndex((item) => item.id === invoice.id);
    let updated: SavedInvoice[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = { ...invoice, updatedAt: new Date().toISOString() };
    } else {
      updated = [invoice, ...all];
    }
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving invoice:', err);
    return getSavedInvoices();
  }
}

export function deleteInvoice(id: string): SavedInvoice[] {
  try {
    const all = getSavedInvoices();
    const updated = all.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return getSavedInvoices();
  }
}

export function recordInvoicePayment(
  invoiceId: string,
  payment: Omit<PaymentRecord, 'id'>
): { updatedInvoice?: SavedInvoice; all: SavedInvoice[] } {
  try {
    const all = getSavedInvoices();
    const target = all.find((inv) => inv.id === invoiceId);
    if (!target) return { all };

    const newPaymentRecord: PaymentRecord = {
      ...payment,
      id: 'pay_' + Date.now(),
    };

    let newAdvance = 0;
    let newBalance = 0;

    if (target.mode === 'auto_dealer' && target.autoData) {
      newAdvance = (target.autoData.pricing.advanceReceived || 0) + payment.amount;
      newBalance = Math.max(0, target.autoData.pricing.totalSaleValue - newAdvance);
      target.autoData.pricing.advanceReceived = newAdvance;
      target.autoData.pricing.balanceAmount = newBalance;
    } else if (target.mode === 'general_retail' && target.retailData) {
      newAdvance = (target.retailData.advanceReceived || 0) + payment.amount;
      newBalance = Math.max(0, target.retailData.grandTotal - newAdvance);
      target.retailData.advanceReceived = newAdvance;
      target.retailData.balanceAmount = newBalance;
    }

    target.status = newBalance <= 0 ? 'PAID' : 'PARTIAL';
    target.paymentHistory = [...(target.paymentHistory || []), newPaymentRecord];
    target.updatedAt = new Date().toISOString();

    const updatedList = saveInvoice(target);
    return { updatedInvoice: target, all: updatedList };
  } catch (err) {
    console.error('Error recording payment:', err);
    return { all: getSavedInvoices() };
  }
}

export function generateNextInvoiceNo(): string {
  const all = getSavedInvoices();
  const year = new Date().getFullYear();
  const count = all.length + 43; // realistic offset
  return `APX-${year}-${String(count).padStart(4, '0')}`;
}

export function exportBackupData(): string {
  const profile = getBusinessProfile();
  const invoices = getSavedInvoices();
  return JSON.stringify({ profile, invoices, exportedAt: new Date().toISOString() }, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.profile) saveBusinessProfile(parsed.profile);
    if (Array.isArray(parsed.invoices)) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(parsed.invoices));
    }
    return true;
  } catch {
    return false;
  }
}
