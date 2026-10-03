import {
  BusinessProfile,
  SavedInvoice,
  PaymentRecord,
  SubscriptionState,
  AppLanguage,
  CustomerRecord,
  ProductRecord,
} from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEY_INVOICES = 'bahikhata_invoices_v2';
const STORAGE_KEY_PROFILE = 'bahikhata_business_profile_v2';
const STORAGE_KEY_BUSINESSES = 'bahikhata_businesses_v3';
const STORAGE_KEY_ACTIVE_BIZ_ID = 'bahikhata_active_biz_id_v3';
const STORAGE_KEY_SUBSCRIPTION = 'bahikhata_subscription_v2';
const STORAGE_KEY_LANGUAGE = 'bahikhata_lang_v2';
const STORAGE_KEY_CUSTOMERS = 'bahikhata_customers_v2';
const STORAGE_KEY_PRODUCTS = 'bahikhata_products_v2';

const IDB_NAME = 'BahiKhata_DB';
const IDB_VERSION = 1;
const IDB_STORE = 'keyval_store';

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  id: 'biz_default',
  name: 'BahiKhata Business',
  businessName: 'BahiKhata Business',
  tagline: 'Smart Multi-Industry Billing, Digital Khata & Business Management',
  industryCategory: 'Scrap & Recycling',
  industryType: 'Scrap & Recycling',
  subcategories: ['Iron Scrap', 'Steel Scrap', 'Aluminium Scrap', 'Copper Scrap'],
  businessModels: ['Wholesale', 'Trader'],
  businessType: 'sales_and_service',
  salesCategories: ['Iron Scrap', 'Steel Scrap', 'Non-Ferrous Metals'],
  serviceCategories: ['Processing & Sorting', 'Transportation'],
  address: '',
  district: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  country: 'India',
  phone: '',
  altPhone: '',
  email: '',
  gstRegistrationStatus: 'Unregistered',
  gstRegistered: false,
  gstin: '',
  gstNumber: '',
  panNumber: '',
  gstLegalName: '',
  gstState: '',
  dealerCode: '',
  logoUrl: '',
  documents: [],
  billingType: 'Non-GST',
  gstCalculationMode: 'Exclusive',
  defaultGstRate: 18,
  paymentMethods: ['Cash', 'UPI', 'Bank Transfer'],
  upiId: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  accountHolder: '',
  registrationCompleted: false,
  onboardingCompleted: false,
  enabledFeatures: [
    'smart_billing',
    'digital_khata',
    'inventory_stock',
    'scrap_weight_billing',
    'scrap_grading',
    'scrap_supplier_mgmt',
  ],
  activeModules: [
    'Billing',
    'Digital Khata',
    'Inventory',
    'Scrap Weighbridge',
    'Reports',
  ],
  terms: [
    'Subject to local jurisdiction only.',
    'Delivery will be given only against receipt of 100% realized payment.',
    'Weight recorded on weighbridge is final and binding.',
    'All statutory taxes and fees are as per government norms.',
  ],
};

export const INITIAL_DEMO_INVOICES: SavedInvoice[] = [];

export const INITIAL_DEMO_CUSTOMERS: CustomerRecord[] = [];

export const INITIAL_DEMO_PRODUCTS: ProductRecord[] = [];

// --- IndexedDB Low-level Helpers ---
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, val: T): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(val, key);
  } catch (err) {
    console.warn('IDB write failed:', err);
  }
}

// In-Memory Synchronous Caches
let memoryInvoices: SavedInvoice[] | null = null;
let memoryProfile: BusinessProfile | null = null;
let memorySubscription: SubscriptionState | null = null;
let memoryLanguage: AppLanguage | null = null;
let memoryCustomers: CustomerRecord[] | null = null;
let memoryProducts: ProductRecord[] | null = null;


export function getLanguagePreference(): AppLanguage {
  if (memoryLanguage) return memoryLanguage;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (stored === 'hi' || stored === 'en') {
      memoryLanguage = stored;
      return stored;
    }
  } catch {}
  return 'en';
}

export function saveLanguagePreference(lang: AppLanguage): void {
  memoryLanguage = lang;
  try {
    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    idbSet(STORAGE_KEY_LANGUAGE, lang);
  } catch {}
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getSubscriptionState(): SubscriptionState {
  const currentMonth = getCurrentMonthKey();
  const defaultSub: SubscriptionState = {
    tier: 'free',
    invoiceCountThisMonth: 0,
    monthKey: currentMonth,
    hasWatermark: true,
    canUploadCustomLogo: false,
    unlimitedInvoices: false,
  };

  if (memorySubscription) {
    if (memorySubscription.monthKey !== currentMonth) {
      memorySubscription.invoiceCountThisMonth = 0;
      memorySubscription.monthKey = currentMonth;
      saveSubscriptionState(memorySubscription);
    }
    return memorySubscription;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (raw) {
      const parsed = JSON.parse(raw) as SubscriptionState;
      if (parsed.monthKey !== currentMonth) {
        parsed.invoiceCountThisMonth = 0;
        parsed.monthKey = currentMonth;
      }
      memorySubscription = parsed;
      return parsed;
    }
  } catch {}

  memorySubscription = defaultSub;
  return defaultSub;
}

export function saveSubscriptionState(sub: SubscriptionState): void {
  memorySubscription = sub;
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(sub));
    idbSet(STORAGE_KEY_SUBSCRIPTION, sub);
  } catch (err) {
    console.error('Error saving subscription:', err);
  }
}

export function incrementMonthlyInvoiceCount(): { allowed: boolean; remaining: number } {
  const sub = getSubscriptionState();
  if (sub.tier !== 'free') {
    sub.invoiceCountThisMonth += 1;
    saveSubscriptionState(sub);
    return { allowed: true, remaining: Infinity };
  }

  const FREE_MONTHLY_LIMIT = 5;
  if (sub.invoiceCountThisMonth >= FREE_MONTHLY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  sub.invoiceCountThisMonth += 1;
  saveSubscriptionState(sub);
  return {
    allowed: true,
    remaining: Math.max(0, FREE_MONTHLY_LIMIT - sub.invoiceCountThisMonth),
  };
}

export function getBusinessProfile(): BusinessProfile {
  if (memoryProfile) return memoryProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If user had previous hardcoded demo or wrong branding details, strip false data
      if (
        parsed.gstin === '27AABCU9603R1ZM' ||
        parsed.phone === '+91 98765 43210' ||
        parsed.name === 'Apex Motors & EV Hub' ||
        parsed.name === 'Vyapar & Zoho Books Dealership'
      ) {
        const cleaned: BusinessProfile = {
          ...DEFAULT_BUSINESS_PROFILE,
          name:
            parsed.name === 'Apex Motors & EV Hub' ||
            parsed.name === 'Vyapar & Zoho Books Dealership'
              ? DEFAULT_BUSINESS_PROFILE.name
              : parsed.name,
        };
        memoryProfile = cleaned;
        saveBusinessProfile(cleaned);
        return cleaned;
      }

      // Safe migration for existing users:
      // If user already had custom details or has been onboarded, preserve them and mark registrationCompleted: true
      const hasExistingBusiness =
        Boolean(parsed.phone && parsed.phone !== '+91 98765 43210') ||
        Boolean(parsed.name && parsed.name !== 'BahiKhata Business') ||
        localStorage.getItem('bahikhata_onboarded') === 'true';

      const merged: BusinessProfile = {
        ...DEFAULT_BUSINESS_PROFILE,
        ...parsed,
        id: parsed.id || 'biz_default',
        industryCategory: parsed.industryCategory || parsed.industryType || 'Scrap & Recycling',
        subcategories: parsed.subcategories || ['Iron Scrap', 'Steel Scrap', 'Aluminium Scrap'],
        businessModels: parsed.businessModels || ['Wholesale', 'Trader'],
        businessName: parsed.businessName || parsed.name || DEFAULT_BUSINESS_PROFILE.name,
        registrationCompleted:
          parsed.registrationCompleted !== undefined
            ? parsed.registrationCompleted
            : hasExistingBusiness,
        onboardingCompleted:
          parsed.onboardingCompleted !== undefined
            ? parsed.onboardingCompleted
            : hasExistingBusiness,
      };

      memoryProfile = merged;
      return memoryProfile;
    }
  } catch {}

  memoryProfile = DEFAULT_BUSINESS_PROFILE;
  return DEFAULT_BUSINESS_PROFILE;
}

export function getAllBusinesses(): BusinessProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b) => ({
          ...DEFAULT_BUSINESS_PROFILE,
          ...b,
          id: b.id || `biz_${Math.random().toString(36).slice(2, 9)}`,
        }));
      }
    }
  } catch {}

  const single = getBusinessProfile();
  const initial = [{ ...single, id: single.id || 'biz_default' }];
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(initial));
    idbSet(STORAGE_KEY_BUSINESSES, initial);
  } catch {}
  return initial;
}

export function getActiveBusinessId(): string {
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_BIZ_ID);
    if (active) return active;
  } catch {}
  const all = getAllBusinesses();
  const firstId = all[0]?.id || 'biz_default';
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_BIZ_ID, firstId);
  } catch {}
  return firstId;
}

export function setActiveBusinessId(id: string): BusinessProfile {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_BIZ_ID, id);
  } catch {}
  const all = getAllBusinesses();
  const target = all.find((b) => b.id === id) || all[0] || DEFAULT_BUSINESS_PROFILE;
  saveBusinessProfile(target);
  return target;
}

export function saveBusiness(business: BusinessProfile): BusinessProfile[] {
  const all = getAllBusinesses();
  const bizId = business.id || `biz_${Date.now()}`;
  const prepared: BusinessProfile = {
    ...business,
    id: bizId,
    updatedAt: new Date().toISOString(),
  };

  const index = all.findIndex((b) => b.id === bizId);
  let updated: BusinessProfile[];
  if (index >= 0) {
    updated = [...all];
    updated[index] = prepared;
  } else {
    updated = [...all, prepared];
  }

  try {
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_BUSINESSES, updated);
  } catch (err) {
    console.error('Error saving businesses list:', err);
  }

  // If this is the active business, update the active profile cache
  const activeId = getActiveBusinessId();
  if (activeId === bizId || all.length === 0) {
    saveBusinessProfile(prepared);
  }

  return updated;
}

export function deleteBusiness(id: string): BusinessProfile[] {
  const all = getAllBusinesses();
  if (all.length <= 1) {
    return all; // Do not delete the last business
  }
  const updated = all.filter((b) => b.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_BUSINESSES, updated);
  } catch {}

  const activeId = getActiveBusinessId();
  if (activeId === id) {
    setActiveBusinessId(updated[0].id || 'biz_default');
  }

  return updated;
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  const bizId = profile.id || getActiveBusinessId();
  const prepared = { ...profile, id: bizId };
  memoryProfile = prepared;
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(prepared));
    idbSet(STORAGE_KEY_PROFILE, prepared);

    // Keep businesses list in sync
    const all = getAllBusinesses();
    const idx = all.findIndex((b) => b.id === bizId);
    let updated: BusinessProfile[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = prepared;
    } else {
      updated = [...all, prepared];
    }
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_BUSINESSES, updated);
  } catch (err) {
    console.error('Error saving business profile:', err);
  }
}

export async function syncProfileToFirestore(
  profile: BusinessProfile,
  userId?: string
): Promise<void> {
  const targetUid = userId || profile.userId;
  if (!targetUid) return;

  try {
    const profileRef = doc(db, 'users', targetUid, 'profile', 'business');
    // Sanitize document metadata: do not store large base64 data URLs in Firestore
    const sanitizedDocuments = (profile.documents || []).map((docItem) => ({
      id: docItem.id,
      type: docItem.type,
      title: docItem.title,
      requirement: docItem.requirement,
      fileName: docItem.fileName || '',
      fileSize: docItem.fileSize || 0,
      fileType: docItem.fileType || '',
      storagePath: docItem.storagePath || '',
      uploadedAt: docItem.uploadedAt || '',
      verificationStatus: docItem.verificationStatus || 'NOT_UPLOADED',
    }));

    await setDoc(
      profileRef,
      {
        ...profile,
        documents: sanitizedDocuments,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore profile sync failed (offline or quota):', err);
  }
}

export async function loadProfileFromFirestore(
  userId: string
): Promise<BusinessProfile | null> {
  if (!userId) return null;
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'business');
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<BusinessProfile>;
      const merged: BusinessProfile = {
        ...getBusinessProfile(),
        ...data,
        userId,
      };
      saveBusinessProfile(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch profile from Firestore:', err);
  }
  return null;
}

export function getSavedInvoices(businessId?: string): SavedInvoice[] {
  let all: SavedInvoice[] = [];
  if (memoryInvoices) {
    all = memoryInvoices;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (inv) =>
              !inv.id.startsWith('inv_demo_') &&
              inv.invoiceNo !== 'APX-2026-0042' &&
              inv.invoiceNo !== 'APX-2026-0041' &&
              inv.autoData?.buyer.fullName !== 'Rahul Sharma' &&
              inv.autoData?.buyer.fullName !== 'Vikram Joshi'
          );
          memoryInvoices = cleaned;
          all = cleaned;
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(cleaned));
            idbSet(STORAGE_KEY_INVOICES, cleaned);
          }
        }
      }
    } catch {}
  }

  if (!businessId) return all;
  return all.filter(
    (inv) => inv.businessId === businessId || (!inv.businessId && businessId === 'biz_default')
  );
}

export function saveInvoice(invoice: SavedInvoice): SavedInvoice[] {
  try {
    const activeBizId = invoice.businessId || getActiveBusinessId();
    const prepared: SavedInvoice = {
      ...invoice,
      businessId: activeBizId,
      updatedAt: new Date().toISOString(),
    };

    const all = getSavedInvoices();
    const index = all.findIndex((item) => item.id === prepared.id);
    let updated: SavedInvoice[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryInvoices = updated;
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_INVOICES, updated);
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
    memoryInvoices = updated;
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_INVOICES, updated);
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
      const payable = target.autoData.pricing.netPayableAmount || target.autoData.pricing.totalSaleValue;
      newBalance = Math.max(0, payable - newAdvance);
      target.autoData.pricing.advanceReceived = newAdvance;
      target.autoData.pricing.balanceAmount = newBalance;
    } else if (target.retailData) {
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
  const count = all.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

export function getSavedCustomers(businessId?: string): CustomerRecord[] {
  let all: CustomerRecord[] = [];
  if (memoryCustomers) {
    all = memoryCustomers;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (c) =>
              !c.id.startsWith('cust_00') &&
              c.fullName !== 'Rahul Sharma' &&
              c.fullName !== 'Vikram Joshi'
          );
          memoryCustomers = cleaned;
          all = cleaned;
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(cleaned));
            idbSet(STORAGE_KEY_CUSTOMERS, cleaned);
          }
        }
      }
    } catch {}
  }

  if (!businessId) return all;
  return all.filter(
    (c) => c.businessId === businessId || (!c.businessId && businessId === 'biz_default')
  );
}

export function saveCustomer(customer: CustomerRecord): CustomerRecord[] {
  try {
    const activeBizId = customer.businessId || getActiveBusinessId();
    const prepared: CustomerRecord = {
      ...customer,
      businessId: activeBizId,
    };

    const all = getSavedCustomers();
    const index = all.findIndex((c) => c.id === prepared.id);
    let updated: CustomerRecord[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryCustomers = updated;
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(updated));
    idbSet(STORAGE_KEY_CUSTOMERS, updated);
    return updated;
  } catch (err) {
    console.error('Error saving customer:', err);
    return getSavedCustomers();
  }
}

export function deleteCustomer(id: string): CustomerRecord[] {
  try {
    const all = getSavedCustomers();
    const updated = all.filter((c) => c.id !== id);
    memoryCustomers = updated;
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(updated));
    idbSet(STORAGE_KEY_CUSTOMERS, updated);
    return updated;
  } catch (err) {
    console.error('Error deleting customer:', err);
    return getSavedCustomers();
  }
}

export function getSavedProducts(businessId?: string): ProductRecord[] {
  let all: ProductRecord[] = [];
  if (memoryProducts) {
    all = memoryProducts;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (p) =>
              !p.id.startsWith('prod_00') &&
              !p.name.includes('Ola S1 Pro Gen 2') &&
              !p.name.includes('Splendor Plus')
          );
          memoryProducts = cleaned;
          all = cleaned;
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(cleaned));
            idbSet(STORAGE_KEY_PRODUCTS, cleaned);
          }
        }
      }
    } catch {}
  }

  if (!businessId) return all;
  return all.filter(
    (p) => p.businessId === businessId || (!p.businessId && businessId === 'biz_default')
  );
}

export function saveProduct(product: ProductRecord): ProductRecord[] {
  try {
    const activeBizId = product.businessId || getActiveBusinessId();
    const prepared: ProductRecord = {
      ...product,
      businessId: activeBizId,
    };

    const all = getSavedProducts();
    const index = all.findIndex((p) => p.id === prepared.id);
    let updated: ProductRecord[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryProducts = updated;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    idbSet(STORAGE_KEY_PRODUCTS, updated);
    return updated;
  } catch (err) {
    console.error('Error saving product:', err);
    return getSavedProducts();
  }
}

export function deleteProduct(id: string): ProductRecord[] {
  try {
    const all = getSavedProducts();
    const updated = all.filter((p) => p.id !== id);
    memoryProducts = updated;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    idbSet(STORAGE_KEY_PRODUCTS, updated);
    return updated;
  } catch (err) {
    console.error('Error deleting product:', err);
    return getSavedProducts();
  }
}

/**
 * Completely purges all false/demo records and resets storage to a pristine blank slate.
 */
export function purgeAllFalseData(): void {
  memoryInvoices = [];
  memoryCustomers = [];
  memoryProducts = [];
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify([]));
    idbSet(STORAGE_KEY_INVOICES, []);
    idbSet(STORAGE_KEY_CUSTOMERS, []);
    idbSet(STORAGE_KEY_PRODUCTS, []);
  } catch (err) {
    console.error('Error purging false data:', err);
  }
}

export function exportBackupData(): string {
  const profile = getBusinessProfile();
  const invoices = getSavedInvoices();
  const subscription = getSubscriptionState();
  const customers = getSavedCustomers();
  const products = getSavedProducts();
  return JSON.stringify(
    { profile, invoices, subscription, customers, products, exportedAt: new Date().toISOString() },
    null,
    2
  );
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.profile) saveBusinessProfile(parsed.profile);
    if (Array.isArray(parsed.invoices)) {
      memoryInvoices = parsed.invoices;
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(parsed.invoices));
      idbSet(STORAGE_KEY_INVOICES, parsed.invoices);
    }
    if (Array.isArray(parsed.customers)) {
      memoryCustomers = parsed.customers;
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(parsed.customers));
      idbSet(STORAGE_KEY_CUSTOMERS, parsed.customers);
    }
    if (Array.isArray(parsed.products)) {
      memoryProducts = parsed.products;
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(parsed.products));
      idbSet(STORAGE_KEY_PRODUCTS, parsed.products);
    }
    if (parsed.subscription) {
      saveSubscriptionState(parsed.subscription);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Initializes hybrid storage on startup by checking IndexedDB for backup
 * in case localStorage was cleared.
 */
export async function initializeHybridStorage(): Promise<void> {
  try {
    const idbInvoices = await idbGet<SavedInvoice[]>(STORAGE_KEY_INVOICES);
    if (idbInvoices && Array.isArray(idbInvoices)) {
      const cleanInvoices = idbInvoices.filter(
        (inv) =>
          !inv.id.startsWith('inv_demo_') &&
          inv.invoiceNo !== 'APX-2026-0042' &&
          inv.invoiceNo !== 'APX-2026-0041' &&
          inv.autoData?.buyer.fullName !== 'Rahul Sharma' &&
          inv.autoData?.buyer.fullName !== 'Vikram Joshi'
      );
      idbSet(STORAGE_KEY_INVOICES, cleanInvoices);
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(cleanInvoices));
      memoryInvoices = cleanInvoices;
    }

    const idbCustomers = await idbGet<CustomerRecord[]>(STORAGE_KEY_CUSTOMERS);
    if (idbCustomers && Array.isArray(idbCustomers)) {
      const cleanCustomers = idbCustomers.filter(
        (c) =>
          !c.id.startsWith('cust_00') &&
          c.fullName !== 'Rahul Sharma' &&
          c.fullName !== 'Vikram Joshi'
      );
      idbSet(STORAGE_KEY_CUSTOMERS, cleanCustomers);
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(cleanCustomers));
      memoryCustomers = cleanCustomers;
    }

    const idbProducts = await idbGet<ProductRecord[]>(STORAGE_KEY_PRODUCTS);
    if (idbProducts && Array.isArray(idbProducts)) {
      const cleanProducts = idbProducts.filter(
        (p) =>
          !p.id.startsWith('prod_00') &&
          !p.name.includes('Ola S1 Pro Gen 2') &&
          !p.name.includes('Splendor Plus')
      );
      idbSet(STORAGE_KEY_PRODUCTS, cleanProducts);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(cleanProducts));
      memoryProducts = cleanProducts;
    }

    const idbProfile = await idbGet<BusinessProfile>(STORAGE_KEY_PROFILE);
    if (idbProfile) {
      if (idbProfile.gstin === '27AABCU9603R1ZM' || idbProfile.phone === '+91 98765 43210' || idbProfile.name === 'Apex Motors & EV Hub') {
        const cleaned = {
          ...DEFAULT_BUSINESS_PROFILE,
          name: idbProfile.name === 'Apex Motors & EV Hub' ? DEFAULT_BUSINESS_PROFILE.name : idbProfile.name,
        };
        idbSet(STORAGE_KEY_PROFILE, cleaned);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(cleaned));
        memoryProfile = cleaned;
      } else if (!localStorage.getItem(STORAGE_KEY_PROFILE)) {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(idbProfile));
        memoryProfile = idbProfile;
      }
    }
  } catch (err) {
    console.warn('Hybrid storage reconciliation error:', err);
  }
}

