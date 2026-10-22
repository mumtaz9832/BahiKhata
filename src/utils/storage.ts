import {
  BusinessProfile,
  SavedInvoice,
  PaymentRecord,
  SubscriptionState,
  AppLanguage,
  CustomerRecord,
  ProductRecord,
  BackupMetadata,
  BizcoreBackupPayload,
  BackupInspectionResult,
  RestoreResult,
  StorageStatistics,
  ExpenseRecord,
  PurchaseRecord,
  CreditDebitNote,
  SubscriptionTransaction,
} from '../types';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SyncStateInfo, CloudSyncStatus } from '../types';

const STORAGE_KEY_INVOICES = 'bahikhata_invoices_v2';
const STORAGE_KEY_PROFILE = 'bahikhata_business_profile_v2';
const STORAGE_KEY_BUSINESSES = 'bahikhata_businesses_v3';
const STORAGE_KEY_ACTIVE_BIZ_ID = 'bahikhata_active_biz_id_v3';
const STORAGE_KEY_SUBSCRIPTION = 'bahikhata_subscription_v2';
const STORAGE_KEY_LANGUAGE = 'bahikhata_lang_v2';
const STORAGE_KEY_CUSTOMERS = 'bahikhata_customers_v2';
const STORAGE_KEY_PRODUCTS = 'bahikhata_products_v2';
const STORAGE_KEY_LAST_BACKUP = 'bizcore_last_backup_meta_v1';
const STORAGE_KEY_SAFETY_SNAPSHOT = 'bizcore_safety_rollback_snapshot_v1';
const STORAGE_KEY_PENDING_QUEUE = 'bizcore_pending_sync_queue_v1';
const STORAGE_KEY_EXPENSES = 'bizcore_expenses_v1';
const STORAGE_KEY_PURCHASES = 'bizcore_purchases_v1';
const STORAGE_KEY_CREDIT_DEBIT_NOTES = 'bizcore_credit_debit_notes_v1';
const STORAGE_KEY_SUBSCRIPTION_TXS = 'bizcore_subscription_txs_v1';

export interface PendingSyncMutation {
  id: string;
  entity: 'invoice' | 'customer' | 'product' | 'profile';
  action: 'set' | 'delete';
  entityId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

const IDB_NAME = 'BahiKhata_DB';
const IDB_VERSION = 1;
const IDB_STORE = 'keyval_store';

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  id: 'biz_default',
  name: 'BIZCORE Business',
  businessName: 'BIZCORE Business',
  tagline: 'BIZCORE — Complete Business Management Software',
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
let memoryExpenses: ExpenseRecord[] | null = null;
let memoryPurchases: PurchaseRecord[] | null = null;
let memoryCreditDebitNotes: CreditDebitNote[] | null = null;
let memorySubscriptionTxs: SubscriptionTransaction[] | null = null;


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
        parsed.name === 'Vyapar & Zoho Books Dealership' ||
        parsed.name === 'BahiKhata Business'
      ) {
        const cleaned: BusinessProfile = {
          ...DEFAULT_BUSINESS_PROFILE,
          name:
            parsed.name === 'Apex Motors & EV Hub' ||
            parsed.name === 'Vyapar & Zoho Books Dealership' ||
            parsed.name === 'BahiKhata Business'
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
        Boolean(parsed.name && parsed.name !== 'BahiKhata Business' && parsed.name !== 'BIZCORE Business') ||
        localStorage.getItem('bizcore_onboarded') === 'true' ||
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

// --- Persistent Offline Sync Queue & Cloud Sync Manager ---
let activeSyncState: SyncStateInfo = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
  pendingCount: 0,
};

const syncListeners: ((state: SyncStateInfo) => void)[] = [];

export function getSyncState(): SyncStateInfo {
  const queue = getPendingSyncQueue();
  return {
    ...activeSyncState,
    pendingCount: queue.length,
    status:
      typeof navigator !== 'undefined' && !navigator.onLine
        ? 'offline'
        : queue.length > 0 && activeSyncState.status === 'synced'
        ? 'pending'
        : activeSyncState.status,
  };
}

export function onSyncStateChange(callback: (state: SyncStateInfo) => void): () => void {
  syncListeners.push(callback);
  callback(getSyncState());
  return () => {
    const idx = syncListeners.indexOf(callback);
    if (idx >= 0) syncListeners.splice(idx, 1);
  };
}

function notifySyncListeners(updates?: Partial<SyncStateInfo>) {
  if (updates) {
    activeSyncState = { ...activeSyncState, ...updates };
  }
  const state = getSyncState();
  syncListeners.forEach((cb) => {
    try {
      cb(state);
    } catch {}
  });
}

export function getPendingSyncQueue(): PendingSyncMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_QUEUE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function enqueuePendingMutation(
  mutation: Omit<PendingSyncMutation, 'id' | 'timestamp' | 'retryCount'>
): void {
  try {
    const queue = getPendingSyncQueue();
    const existingIdx = queue.findIndex(
      (m) => m.entity === mutation.entity && m.entityId === mutation.entityId
    );
    const newRecord: PendingSyncMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    if (existingIdx >= 0) {
      queue[existingIdx] = newRecord;
    } else {
      queue.push(newRecord);
    }
    localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(queue));
    idbSet(STORAGE_KEY_PENDING_QUEUE, queue);
    notifySyncListeners({ status: 'pending' });
  } catch (err) {
    console.error('Failed to enqueue pending mutation:', err);
  }
}

export function dequeuePendingMutation(id: string): void {
  try {
    const queue = getPendingSyncQueue().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(queue));
    idbSet(STORAGE_KEY_PENDING_QUEUE, queue);
    notifySyncListeners();
  } catch {}
}

export function clearPendingSyncQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PENDING_QUEUE);
    idbSet(STORAGE_KEY_PENDING_QUEUE, []);
    notifySyncListeners({ status: 'synced' });
  } catch {}
}

// Background push to Firestore for Invoices
export async function syncInvoiceToFirestore(invoice: SavedInvoice, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid || invoice.businessProfile?.userId;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'invoice',
      action: 'set',
      entityId: invoice.id,
      data: invoice,
    });
    return false;
  }
  try {
    const invRef = doc(db, 'users', uid, 'invoices', invoice.id);
    await setDoc(invRef, invoice, { merge: true });
    notifySyncListeners({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    return true;
  } catch (err: any) {
    console.warn('Firestore invoice push failed, queueing mutation:', err);
    enqueuePendingMutation({
      entity: 'invoice',
      action: 'set',
      entityId: invoice.id,
      data: invoice,
      error: err?.message,
    });
    return false;
  }
}

export async function deleteInvoiceFromFirestore(invoiceId: string, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'invoice',
      action: 'delete',
      entityId: invoiceId,
    });
    return false;
  }
  try {
    const invRef = doc(db, 'users', uid, 'invoices', invoiceId);
    await deleteDoc(invRef);
    return true;
  } catch (err: any) {
    enqueuePendingMutation({
      entity: 'invoice',
      action: 'delete',
      entityId: invoiceId,
      error: err?.message,
    });
    return false;
  }
}

// Background push to Firestore for Customers
export async function syncCustomerToFirestore(customer: CustomerRecord, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'customer',
      action: 'set',
      entityId: customer.id,
      data: customer,
    });
    return false;
  }
  try {
    const custRef = doc(db, 'users', uid, 'customers', customer.id);
    await setDoc(custRef, customer, { merge: true });
    return true;
  } catch (err: any) {
    enqueuePendingMutation({
      entity: 'customer',
      action: 'set',
      entityId: customer.id,
      data: customer,
      error: err?.message,
    });
    return false;
  }
}

export async function deleteCustomerFromFirestore(customerId: string, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'customer',
      action: 'delete',
      entityId: customerId,
    });
    return false;
  }
  try {
    const custRef = doc(db, 'users', uid, 'customers', customerId);
    await deleteDoc(custRef);
    return true;
  } catch (err: any) {
    enqueuePendingMutation({
      entity: 'customer',
      action: 'delete',
      entityId: customerId,
      error: err?.message,
    });
    return false;
  }
}

// Background push to Firestore for Products
export async function syncProductToFirestore(product: ProductRecord, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'product',
      action: 'set',
      entityId: product.id,
      data: product,
    });
    return false;
  }
  try {
    const prodRef = doc(db, 'users', uid, 'products', product.id);
    await setDoc(prodRef, product, { merge: true });
    return true;
  } catch (err: any) {
    enqueuePendingMutation({
      entity: 'product',
      action: 'set',
      entityId: product.id,
      data: product,
      error: err?.message,
    });
    return false;
  }
}

export async function deleteProductFromFirestore(productId: string, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingMutation({
      entity: 'product',
      action: 'delete',
      entityId: productId,
    });
    return false;
  }
  try {
    const prodRef = doc(db, 'users', uid, 'products', productId);
    await deleteDoc(prodRef);
    return true;
  } catch (err: any) {
    enqueuePendingMutation({
      entity: 'product',
      action: 'delete',
      entityId: productId,
      error: err?.message,
    });
    return false;
  }
}

// Replays pending mutations queue in background
export async function replayPendingSyncQueue(userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifySyncListeners({ status: 'offline' });
    return;
  }

  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    notifySyncListeners({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    return;
  }

  notifySyncListeners({ status: 'syncing' });

  for (const item of [...queue]) {
    try {
      if (item.entity === 'invoice') {
        const ref = doc(db, 'users', uid, 'invoices', item.entityId);
        if (item.action === 'set' && item.data) {
          await setDoc(ref, item.data, { merge: true });
        } else if (item.action === 'delete') {
          await deleteDoc(ref);
        }
      } else if (item.entity === 'customer') {
        const ref = doc(db, 'users', uid, 'customers', item.entityId);
        if (item.action === 'set' && item.data) {
          await setDoc(ref, item.data, { merge: true });
        } else if (item.action === 'delete') {
          await deleteDoc(ref);
        }
      } else if (item.entity === 'product') {
        const ref = doc(db, 'users', uid, 'products', item.entityId);
        if (item.action === 'set' && item.data) {
          await setDoc(ref, item.data, { merge: true });
        } else if (item.action === 'delete') {
          await deleteDoc(ref);
        }
      } else if (item.entity === 'profile' && item.data) {
        await syncProfileToFirestore(item.data, uid);
      }
      dequeuePendingMutation(item.id);
    } catch (err: any) {
      console.warn(`Retry failed for mutation ${item.id}:`, err);
      item.retryCount = (item.retryCount || 0) + 1;
      item.error = err?.message;
      if (item.retryCount >= 5) {
        dequeuePendingMutation(item.id);
      }
    }
  }

  const remaining = getPendingSyncQueue();
  if (remaining.length === 0) {
    notifySyncListeners({ status: 'synced', lastSyncedAt: new Date().toISOString() });
  } else {
    notifySyncListeners({ status: 'pending' });
  }
}

// Bi-directional pull & merge all collections from Firestore on login
export async function syncAllFromFirestore(userId: string): Promise<{
  invoices: number;
  customers: number;
  products: number;
}> {
  if (!userId) return { invoices: 0, customers: 0, products: 0 };
  notifySyncListeners({ status: 'syncing' });

  try {
    // 1. Pull Profile
    await loadProfileFromFirestore(userId);

    // 2. Pull Invoices
    const invSnap = await getDocs(collection(db, 'users', userId, 'invoices'));
    const remoteInvoices: SavedInvoice[] = [];
    invSnap.forEach((docSnap) => {
      remoteInvoices.push(docSnap.data() as SavedInvoice);
    });

    const localInvoices = getSavedInvoices();
    const invMap = new Map(localInvoices.map((inv) => [inv.id, inv]));
    remoteInvoices.forEach((rInv) => {
      const local = invMap.get(rInv.id);
      if (!local || (rInv.updatedAt || '') >= (local.updatedAt || '')) {
        invMap.set(rInv.id, rInv);
      }
    });
    const mergedInvoices = Array.from(invMap.values());
    memoryInvoices = mergedInvoices;
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(mergedInvoices));
    idbSet(STORAGE_KEY_INVOICES, mergedInvoices);

    // 3. Pull Customers
    const custSnap = await getDocs(collection(db, 'users', userId, 'customers'));
    const remoteCustomers: CustomerRecord[] = [];
    custSnap.forEach((docSnap) => {
      remoteCustomers.push(docSnap.data() as CustomerRecord);
    });

    const localCustomers = getSavedCustomers();
    const custMap = new Map(localCustomers.map((c) => [c.id, c]));
    remoteCustomers.forEach((rCust) => {
      custMap.set(rCust.id, rCust);
    });
    const mergedCustomers = Array.from(custMap.values());
    memoryCustomers = mergedCustomers;
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(mergedCustomers));
    idbSet(STORAGE_KEY_CUSTOMERS, mergedCustomers);

    // 4. Pull Products
    const prodSnap = await getDocs(collection(db, 'users', userId, 'products'));
    const remoteProducts: ProductRecord[] = [];
    prodSnap.forEach((docSnap) => {
      remoteProducts.push(docSnap.data() as ProductRecord);
    });

    const localProducts = getSavedProducts();
    const prodMap = new Map(localProducts.map((p) => [p.id, p]));
    remoteProducts.forEach((rProd) => {
      prodMap.set(rProd.id, rProd);
    });
    const mergedProducts = Array.from(prodMap.values());
    memoryProducts = mergedProducts;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(mergedProducts));
    idbSet(STORAGE_KEY_PRODUCTS, mergedProducts);

    // Replay any pending local mutations
    await replayPendingSyncQueue(userId);

    notifySyncListeners({ status: 'synced', lastSyncedAt: new Date().toISOString() });

    try {
      window.dispatchEvent(
        new CustomEvent('bizcore:data-restored', {
          detail: {
            restoredStats: {
              invoicesRestored: mergedInvoices.length,
              customersRestored: mergedCustomers.length,
              productsRestored: mergedProducts.length,
            },
          },
        })
      );
    } catch {}

    return {
      invoices: mergedInvoices.length,
      customers: mergedCustomers.length,
      products: mergedProducts.length,
    };
  } catch (err: any) {
    console.error('Firestore full sync error:', err);
    notifySyncListeners({ status: 'error', errorMessage: err?.message });
    return { invoices: 0, customers: 0, products: 0 };
  }
}

// Global Online/Offline Event Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifySyncListeners({ status: 'syncing' });
    replayPendingSyncQueue();
  });
  window.addEventListener('offline', () => {
    notifySyncListeners({ status: 'offline' });
  });
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

    // If new invoice, automatically deduct inventory and update customer dues
    if (index < 0 && prepared.status !== 'CANCELLED' && prepared.status !== 'RETURNED') {
      // 1. Deduct retail items from product stock
      if (prepared.retailData?.items) {
        prepared.retailData.items.forEach((item) => {
          if (!item.qty || item.qty <= 0) return;
          const prods = getSavedProducts(activeBizId);
          const matchedProd = prods.find(
            (p) =>
              (item.id && p.id === item.id) ||
              (p.name && item.description && p.name.trim().toLowerCase() === item.description.trim().toLowerCase())
          );
          if (matchedProd) {
            adjustProductStock(matchedProd.id, {
              type: 'stock_out',
              qty: item.qty,
              reason: `Sale Invoice: ${prepared.invoiceNo}`,
            });
          }
        });
      }

      // 2. Adjust customer balance due if partial/credit payment
      const custPhone =
        prepared.mode === 'auto_dealer'
          ? prepared.autoData?.buyer.phone
          : prepared.retailData?.customer.phone;
      const custName =
        prepared.mode === 'auto_dealer'
          ? prepared.autoData?.buyer.fullName
          : prepared.retailData?.customer.fullName;
      const balAmount =
        prepared.mode === 'auto_dealer'
          ? prepared.autoData?.pricing.balanceAmount || 0
          : prepared.retailData?.balanceAmount || 0;

      if ((custPhone || custName) && balAmount > 0) {
        const custs = getSavedCustomers(activeBizId);
        const matchedCust = custs.find(
          (c) =>
            (custPhone && c.phone === custPhone) ||
            (custName && c.fullName.toLowerCase() === custName.toLowerCase())
        );
        if (matchedCust) {
          matchedCust.balanceDue = (matchedCust.balanceDue || 0) + balAmount;
          saveCustomer(matchedCust);
        }
      }
    }

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

    // Background push to Firestore
    syncInvoiceToFirestore(prepared);

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

    // Background delete in Firestore
    deleteInvoiceFromFirestore(id);

    return updated;
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return getSavedInvoices();
  }
}

export function cancelInvoice(
  invoiceId: string,
  reason: string = 'Invoice cancelled by user'
): { updatedInvoice?: SavedInvoice; all: SavedInvoice[] } {
  try {
    const all = getSavedInvoices();
    const target = all.find((inv) => inv.id === invoiceId);
    if (!target) return { all };

    if (target.status !== 'CANCELLED') {
      // 1. Reverse inventory deductions (add items back to stock)
      if (target.retailData?.items) {
        target.retailData.items.forEach((item) => {
          if (!item.qty || item.qty <= 0) return;
          const prods = getSavedProducts(target.businessId);
          const matchedProd = prods.find(
            (p) =>
              (item.id && p.id === item.id) ||
              (p.name && item.description && p.name.trim().toLowerCase() === item.description.trim().toLowerCase())
          );
          if (matchedProd) {
            adjustProductStock(matchedProd.id, {
              type: 'stock_in',
              qty: item.qty,
              reason: `Invoice Cancelled (${target.invoiceNo}): ${reason}`,
            });
          }
        });
      }

      // 2. Reverse customer balance due if it was unpaid
      const bal =
        target.mode === 'auto_dealer'
          ? target.autoData?.pricing.balanceAmount || 0
          : target.retailData?.balanceAmount || 0;
      if (bal > 0) {
        const custPhone =
          target.mode === 'auto_dealer'
            ? target.autoData?.buyer.phone
            : target.retailData?.customer.phone;
        const custs = getSavedCustomers(target.businessId);
        const matchedCust = custs.find((c) => c.phone === custPhone);
        if (matchedCust) {
          matchedCust.balanceDue = Math.max(0, (matchedCust.balanceDue || 0) - bal);
          saveCustomer(matchedCust);
        }
      }
    }

    target.status = 'CANCELLED';
    target.cancellationReason = reason;
    target.cancelledAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    const updated = saveInvoice(target);
    return { updatedInvoice: target, all: updated };
  } catch (err) {
    console.error('Error cancelling invoice:', err);
    return { all: getSavedInvoices() };
  }
}

export function returnInvoice(
  invoiceId: string,
  reason: string = 'Sales return goods accepted'
): { updatedInvoice?: SavedInvoice; all: SavedInvoice[] } {
  try {
    const all = getSavedInvoices();
    const target = all.find((inv) => inv.id === invoiceId);
    if (!target) return { all };

    if (target.status !== 'RETURNED') {
      // 1. Restore returned stock
      if (target.retailData?.items) {
        target.retailData.items.forEach((item) => {
          if (!item.qty || item.qty <= 0) return;
          const prods = getSavedProducts(target.businessId);
          const matchedProd = prods.find(
            (p) =>
              (item.id && p.id === item.id) ||
              (p.name && item.description && p.name.trim().toLowerCase() === item.description.trim().toLowerCase())
          );
          if (matchedProd) {
            adjustProductStock(matchedProd.id, {
              type: 'stock_in',
              qty: item.qty,
              reason: `Sales Return (${target.invoiceNo}): ${reason}`,
            });
          }
        });
      }

      // 2. Issue Credit Note
      const returnAmount =
        target.mode === 'auto_dealer'
          ? target.autoData?.pricing.totalSaleValue || 0
          : target.retailData?.grandTotal || 0;
      const gstAmount =
        target.mode === 'auto_dealer' ? 0 : target.retailData?.totalGst || 0;
      const custName =
        target.mode === 'auto_dealer'
          ? target.autoData?.buyer.fullName || 'Customer'
          : target.retailData?.customer.fullName || 'Customer';
      const custPhone =
        target.mode === 'auto_dealer'
          ? target.autoData?.buyer.phone
          : target.retailData?.customer.phone;

      saveCreditDebitNote({
        id: `cn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        businessId: target.businessId,
        noteType: 'credit_note',
        noteNo: `CN-${target.invoiceNo.replace(/^INV-/, '')}`,
        invoiceId: target.id,
        invoiceNo: target.invoiceNo,
        partyName: custName,
        partyType: 'customer',
        date: new Date().toISOString().slice(0, 10),
        reason,
        amount: returnAmount - gstAmount,
        gstAmount,
        totalAmount: returnAmount,
        status: 'ISSUED',
        createdAt: new Date().toISOString(),
      });

      // 3. Reverse customer balance due
      const bal =
        target.mode === 'auto_dealer'
          ? target.autoData?.pricing.balanceAmount || 0
          : target.retailData?.balanceAmount || 0;
      if (bal > 0 && custPhone) {
        const custs = getSavedCustomers(target.businessId);
        const matchedCust = custs.find((c) => c.phone === custPhone);
        if (matchedCust) {
          matchedCust.balanceDue = Math.max(0, (matchedCust.balanceDue || 0) - bal);
          saveCustomer(matchedCust);
        }
      }
    }

    target.status = 'RETURNED';
    target.cancellationReason = reason;
    target.cancelledAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    const updated = saveInvoice(target);
    return { updatedInvoice: target, all: updated };
  } catch (err) {
    console.error('Error returning invoice:', err);
    return { all: getSavedInvoices() };
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
  // Safe sequential number allocation preventing collision with existing formatted invoices
  const existingNumbers = new Set(
    all.map((inv) => inv.invoiceNo?.trim().toUpperCase()).filter(Boolean)
  );

  let nextSeq = all.length + 1;
  let candidate = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
  while (existingNumbers.has(candidate)) {
    nextSeq++;
    candidate = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
  }
  return candidate;
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

    // Background push to Firestore
    syncCustomerToFirestore(prepared);

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

    // Background delete in Firestore
    deleteCustomerFromFirestore(id);

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

    // Background push to Firestore
    syncProductToFirestore(prepared);

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

    // Background delete in Firestore
    deleteProductFromFirestore(id);

    return updated;
  } catch (err) {
    console.error('Error deleting product:', err);
    return getSavedProducts();
  }
}

export function adjustProductStock(
  productId: string,
  adjustment: {
    type: 'stock_in' | 'stock_out' | 'damage' | 'audit';
    qty: number;
    reason: string;
  }
): { updatedProduct?: ProductRecord; all: ProductRecord[] } {
  try {
    const all = getSavedProducts();
    const target = all.find((p) => p.id === productId);
    if (!target) return { all };

    const currentQty = target.stockQty || 0;
    let newQty = currentQty;
    if (adjustment.type === 'stock_in') {
      newQty = currentQty + adjustment.qty;
    } else if (adjustment.type === 'stock_out' || adjustment.type === 'damage') {
      newQty = Math.max(0, currentQty - adjustment.qty);
    } else if (adjustment.type === 'audit') {
      newQty = Math.max(0, adjustment.qty);
    }

    target.stockQty = newQty;
    const historyEntry = {
      id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      type: adjustment.type,
      qty: adjustment.qty,
      reason: adjustment.reason,
    };
    target.stockAdjustments = [...(target.stockAdjustments || []), historyEntry];

    const updatedList = saveProduct(target);
    return { updatedProduct: target, all: updatedList };
  } catch (err) {
    console.error('Error adjusting stock:', err);
    return { all: getSavedProducts() };
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

// --- BIZCORE Manual JSON Backup & Restore Suite ---

export function getStorageStatistics(): StorageStatistics {
  const profile = getBusinessProfile();
  const invoices = getSavedInvoices();
  const customers = getSavedCustomers();
  const products = getSavedProducts();
  const businesses = getAllBusinesses();

  const totalSalesValue = invoices.reduce((sum, inv) => {
    return (
      sum +
      (inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.totalSaleValue || 0
        : inv.retailData?.grandTotal || 0)
    );
  }, 0);

  const totalBalanceDue = invoices.reduce((sum, inv) => {
    return (
      sum +
      (inv.mode === 'auto_dealer'
        ? inv.autoData?.pricing?.balanceAmount || 0
        : inv.retailData?.balanceAmount || 0)
    );
  }, 0);

  const stockValuation = products.reduce(
    (sum, p) => sum + (p.rate || 0) * (p.stockQty || 0),
    0
  );

  let lastBackupDate: string | undefined = undefined;
  try {
    const rawMeta = localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
    if (rawMeta) {
      const parsed = JSON.parse(rawMeta);
      lastBackupDate = parsed.exportedAt;
    }
  } catch {}

  const payloadString = JSON.stringify({ profile, invoices, customers, products, businesses });
  const estimatedSizeKb = Math.max(1, Math.round(new Blob([payloadString]).size / 1024));

  return {
    invoiceCount: invoices.length,
    customerCount: customers.length,
    productCount: products.length,
    businessCount: businesses.length,
    activeBusinessName: profile.name || profile.businessName || 'BIZCORE Business',
    totalSalesValue,
    totalBalanceDue,
    stockValuation,
    estimatedSizeKb,
    lastBackupDate,
  };
}

export function generateBackupPayload(notes?: string): BizcoreBackupPayload {
  const profile = getBusinessProfile();
  const invoices = getSavedInvoices();
  const customers = getSavedCustomers();
  const products = getSavedProducts();
  const subscription = getSubscriptionState();
  const businesses = getAllBusinesses();
  const activeBusinessId = getActiveBusinessId();
  const language = getLanguagePreference();

  const stats = getStorageStatistics();

  const metadata: BackupMetadata = {
    invoiceCount: stats.invoiceCount,
    customerCount: stats.customerCount,
    productCount: stats.productCount,
    businessCount: stats.businessCount,
    activeBusinessName: stats.activeBusinessName,
    totalSalesValue: stats.totalSalesValue,
    totalBalanceDue: stats.totalBalanceDue,
    stockValuation: stats.stockValuation,
  };

  const exportedAt = new Date().toISOString();

  try {
    localStorage.setItem(
      STORAGE_KEY_LAST_BACKUP,
      JSON.stringify({ exportedAt, invoiceCount: metadata.invoiceCount })
    );
  } catch {}

  return {
    format: 'BIZCORE_BACKUP',
    version: '2.1',
    app: 'BIZCORE — Complete Business Management Software',
    exportedAt,
    notes: notes?.trim() || undefined,
    metadata,
    data: {
      profile,
      businesses,
      activeBusinessId,
      invoices,
      customers,
      products,
      subscription,
      language,
    },
  };
}

export function exportBackupData(notes?: string): string {
  const payload = generateBackupPayload(notes);
  return JSON.stringify(payload, null, 2);
}

export function downloadBackupFile(jsonString?: string, customFilename?: string): string {
  const content = jsonString || exportBackupData();
  const profile = getBusinessProfile();
  const dateStr = new Date().toISOString().slice(0, 10);
  const bizSlug = (profile.name || profile.businessName || 'bizcore')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 24);
  const filename = customFilename || `bizcore-backup-${bizSlug}-${dateStr}.json`;

  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

export function inspectBackupData(jsonString: string): BackupInspectionResult {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    return {
      isValid: false,
      error: 'The provided backup file or text is empty.',
      summary: {
        businessName: '',
        invoiceCount: 0,
        customerCount: 0,
        productCount: 0,
        businessCount: 0,
        totalSalesValue: 0,
        totalBalanceDue: 0,
        stockValuation: 0,
      },
      parsedData: {},
    };
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Format A: Modern BIZCORE_BACKUP schema
    if (parsed && parsed.format === 'BIZCORE_BACKUP' && parsed.data) {
      const data = parsed.data;
      const invs = Array.isArray(data.invoices) ? data.invoices : [];
      const custs = Array.isArray(data.customers) ? data.customers : [];
      const prods = Array.isArray(data.products) ? data.products : [];
      const bizs = Array.isArray(data.businesses) ? data.businesses : [];
      const prof = data.profile || DEFAULT_BUSINESS_PROFILE;

      const salesVal = invs.reduce((sum: number, inv: any) => {
        return (
          sum +
          (inv.mode === 'auto_dealer'
            ? inv.autoData?.pricing?.totalSaleValue || 0
            : inv.retailData?.grandTotal || 0)
        );
      }, 0);

      const balDue = invs.reduce((sum: number, inv: any) => {
        return (
          sum +
          (inv.mode === 'auto_dealer'
            ? inv.autoData?.pricing?.balanceAmount || 0
            : inv.retailData?.balanceAmount || 0)
        );
      }, 0);

      const stockVal = prods.reduce(
        (sum: number, p: any) => sum + (p.rate || 0) * (p.stockQty || 0),
        0
      );

      return {
        isValid: true,
        isLegacy: false,
        exportedAt: parsed.exportedAt,
        notes: parsed.notes,
        summary: {
          businessName: prof.name || prof.businessName || 'Business',
          industryCategory: prof.industryCategory || prof.industryType,
          invoiceCount: invs.length,
          customerCount: custs.length,
          productCount: prods.length,
          businessCount: bizs.length || 1,
          totalSalesValue: salesVal,
          totalBalanceDue: balDue,
          stockValuation: stockVal,
        },
        parsedData: {
          profile: prof,
          businesses: bizs.length > 0 ? bizs : [prof],
          activeBusinessId: data.activeBusinessId || prof.id,
          invoices: invs,
          customers: custs,
          products: prods,
          subscription: data.subscription,
          language: data.language,
        },
      };
    }

    // Format B: Legacy or direct flat object { profile, invoices, customers, products, subscription }
    if (parsed && typeof parsed === 'object') {
      const invs = Array.isArray(parsed.invoices) ? parsed.invoices : [];
      const custs = Array.isArray(parsed.customers) ? parsed.customers : [];
      const prods = Array.isArray(parsed.products) ? parsed.products : [];
      const prof = parsed.profile;
      const bizs = Array.isArray(parsed.businesses)
        ? parsed.businesses
        : prof
        ? [prof]
        : [];

      // Check if it has any recognizable payload
      if (!prof && invs.length === 0 && custs.length === 0 && prods.length === 0) {
        return {
          isValid: false,
          error:
            'This JSON does not contain recognized BIZCORE business data (invoices, customers, or items).',
          summary: {
            businessName: '',
            invoiceCount: 0,
            customerCount: 0,
            productCount: 0,
            businessCount: 0,
            totalSalesValue: 0,
            totalBalanceDue: 0,
            stockValuation: 0,
          },
          parsedData: {},
        };
      }

      const salesVal = invs.reduce((sum: number, inv: any) => {
        return (
          sum +
          (inv.mode === 'auto_dealer'
            ? inv.autoData?.pricing?.totalSaleValue || 0
            : inv.retailData?.grandTotal || 0)
        );
      }, 0);

      const balDue = invs.reduce((sum: number, inv: any) => {
        return (
          sum +
          (inv.mode === 'auto_dealer'
            ? inv.autoData?.pricing?.balanceAmount || 0
            : inv.retailData?.balanceAmount || 0)
        );
      }, 0);

      const stockVal = prods.reduce(
        (sum: number, p: any) => sum + (p.rate || 0) * (p.stockQty || 0),
        0
      );

      return {
        isValid: true,
        isLegacy: true,
        exportedAt: parsed.exportedAt || undefined,
        summary: {
          businessName: prof?.name || prof?.businessName || 'Legacy Backup',
          industryCategory: prof?.industryCategory || prof?.industryType,
          invoiceCount: invs.length,
          customerCount: custs.length,
          productCount: prods.length,
          businessCount: bizs.length || (prof ? 1 : 0),
          totalSalesValue: salesVal,
          totalBalanceDue: balDue,
          stockValuation: stockVal,
        },
        parsedData: {
          profile: prof,
          businesses: bizs,
          activeBusinessId: parsed.activeBusinessId || prof?.id,
          invoices: invs,
          customers: custs,
          products: prods,
          subscription: parsed.subscription,
          language: parsed.language,
        },
      };
    }

    return {
      isValid: false,
      error: 'Invalid JSON structure: Expected a valid BIZCORE backup object.',
      summary: {
        businessName: '',
        invoiceCount: 0,
        customerCount: 0,
        productCount: 0,
        businessCount: 0,
        totalSalesValue: 0,
        totalBalanceDue: 0,
        stockValuation: 0,
      },
      parsedData: {},
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Malformed JSON file: ${err?.message || 'Unable to parse JSON syntax'}`,
      summary: {
        businessName: '',
        invoiceCount: 0,
        customerCount: 0,
        productCount: 0,
        businessCount: 0,
        totalSalesValue: 0,
        totalBalanceDue: 0,
        stockValuation: 0,
      },
      parsedData: {},
    };
  }
}

export function restoreBackupData(
  jsonString: string,
  options: { mode?: 'replace' | 'merge'; createSafetySnapshot?: boolean } = {}
): RestoreResult {
  const mode = options.mode || 'replace';
  const createSafetySnapshot = options.createSafetySnapshot !== false;

  const inspection = inspectBackupData(jsonString);
  if (!inspection.isValid || !inspection.parsedData) {
    return {
      success: false,
      error: inspection.error || 'Failed to parse and validate backup data.',
      mode,
      restoredStats: {
        invoicesRestored: 0,
        customersRestored: 0,
        productsRestored: 0,
        businessesRestored: 0,
      },
    };
  }

  // 1. Create a safety rollback snapshot of the current local state before applying changes
  if (createSafetySnapshot) {
    try {
      const currentBackup = exportBackupData('Auto safety snapshot created prior to restore');
      const snapshotMeta = {
        timestamp: new Date().toISOString(),
        summary: getStorageStatistics(),
        rawJson: currentBackup,
      };
      localStorage.setItem(STORAGE_KEY_SAFETY_SNAPSHOT, JSON.stringify(snapshotMeta));
    } catch (err) {
      console.warn('Unable to write safety rollback snapshot:', err);
    }
  }

  const { parsedData } = inspection;

  try {
    if (mode === 'replace') {
      // Clean Full Overwrite
      if (parsedData.profile) {
        saveBusinessProfile(parsedData.profile);
      }
      if (Array.isArray(parsedData.businesses) && parsedData.businesses.length > 0) {
        localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(parsedData.businesses));
        idbSet(STORAGE_KEY_BUSINESSES, parsedData.businesses);
      }
      if (parsedData.activeBusinessId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_BIZ_ID, parsedData.activeBusinessId);
      }

      if (Array.isArray(parsedData.invoices)) {
        memoryInvoices = parsedData.invoices;
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(parsedData.invoices));
        idbSet(STORAGE_KEY_INVOICES, parsedData.invoices);
      }

      if (Array.isArray(parsedData.customers)) {
        memoryCustomers = parsedData.customers;
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(parsedData.customers));
        idbSet(STORAGE_KEY_CUSTOMERS, parsedData.customers);
      }

      if (Array.isArray(parsedData.products)) {
        memoryProducts = parsedData.products;
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(parsedData.products));
        idbSet(STORAGE_KEY_PRODUCTS, parsedData.products);
      }

      if (parsedData.subscription) {
        saveSubscriptionState(parsedData.subscription);
      }

      if (parsedData.language) {
        saveLanguagePreference(parsedData.language);
      }
    } else {
      // Merge & Append Mode
      if (parsedData.profile) {
        const currentProf = getBusinessProfile();
        const mergedProf: BusinessProfile = {
          ...parsedData.profile,
          ...currentProf,
          name:
            currentProf.name !== 'BIZCORE Business'
              ? currentProf.name
              : parsedData.profile.name || currentProf.name,
        };
        saveBusinessProfile(mergedProf);
      }

      // Merge Invoices by ID
      const existingInvoices = getSavedInvoices();
      const existingInvMap = new Map(existingInvoices.map((inv) => [inv.id, inv]));
      (parsedData.invoices || []).forEach((inv) => {
        if (!existingInvMap.has(inv.id)) {
          existingInvMap.set(inv.id, inv);
        }
      });
      const mergedInvoices = Array.from(existingInvMap.values());
      memoryInvoices = mergedInvoices;
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(mergedInvoices));
      idbSet(STORAGE_KEY_INVOICES, mergedInvoices);

      // Merge Customers by ID or clean phone
      const existingCustomers = getSavedCustomers();
      const existingCustMap = new Map(existingCustomers.map((c) => [c.id, c]));
      const phoneMap = new Map(
        existingCustomers
          .filter((c) => c.phone)
          .map((c) => [c.phone.replace(/\D/g, '').slice(-10), c])
      );
      (parsedData.customers || []).forEach((c) => {
        const cleanP = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
        if (existingCustMap.has(c.id)) {
          const prev = existingCustMap.get(c.id)!;
          existingCustMap.set(c.id, {
            ...c,
            ...prev,
            balanceDue: (prev.balanceDue || 0) || (c.balanceDue || 0),
          });
        } else if (cleanP && phoneMap.has(cleanP)) {
          const prev = phoneMap.get(cleanP)!;
          existingCustMap.set(prev.id, { ...c, ...prev });
        } else {
          existingCustMap.set(c.id, c);
        }
      });
      const mergedCustomers = Array.from(existingCustMap.values());
      memoryCustomers = mergedCustomers;
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(mergedCustomers));
      idbSet(STORAGE_KEY_CUSTOMERS, mergedCustomers);

      // Merge Products by ID or SKU/name
      const existingProducts = getSavedProducts();
      const existingProdMap = new Map(existingProducts.map((p) => [p.id, p]));
      const skuMap = new Map(
        existingProducts
          .filter((p) => p.sku)
          .map((p) => [p.sku!.toLowerCase(), p])
      );
      (parsedData.products || []).forEach((p) => {
        const cleanSku = p.sku?.toLowerCase();
        if (existingProdMap.has(p.id)) {
          const prev = existingProdMap.get(p.id)!;
          existingProdMap.set(p.id, {
            ...p,
            ...prev,
            stockQty: prev.stockQty !== undefined ? prev.stockQty : p.stockQty,
          });
        } else if (cleanSku && skuMap.has(cleanSku)) {
          const prev = skuMap.get(cleanSku)!;
          existingProdMap.set(prev.id, { ...p, ...prev });
        } else {
          existingProdMap.set(p.id, p);
        }
      });
      const mergedProducts = Array.from(existingProdMap.values());
      memoryProducts = mergedProducts;
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(mergedProducts));
      idbSet(STORAGE_KEY_PRODUCTS, mergedProducts);

      // Merge businesses list
      const existingBizs = getAllBusinesses();
      const bizMap = new Map(existingBizs.map((b) => [b.id, b]));
      (parsedData.businesses || []).forEach((b) => {
        if (!bizMap.has(b.id)) {
          bizMap.set(b.id, b);
        }
      });
      const mergedBizs = Array.from(bizMap.values());
      localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(mergedBizs));
      idbSet(STORAGE_KEY_BUSINESSES, mergedBizs);
    }

    // Ensure session markers are active
    localStorage.setItem('bizcore_authenticated', 'true');
    localStorage.setItem('bahikhata_authenticated', 'true');
    localStorage.removeItem('bizcore_guest_mode');
    localStorage.removeItem('bahikhata_guest_mode');

    // Dispatch custom event so any active views or components can instantly refresh
    try {
      window.dispatchEvent(
        new CustomEvent('bizcore:data-restored', {
          detail: {
            mode,
            restoredStats: {
              invoicesRestored: parsedData.invoices?.length || 0,
              customersRestored: parsedData.customers?.length || 0,
              productsRestored: parsedData.products?.length || 0,
              businessesRestored: parsedData.businesses?.length || 1,
            },
          },
        })
      );
    } catch {}

    return {
      success: true,
      mode,
      restoredStats: {
        invoicesRestored: parsedData.invoices?.length || 0,
        customersRestored: parsedData.customers?.length || 0,
        productsRestored: parsedData.products?.length || 0,
        businessesRestored: parsedData.businesses?.length || 1,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Storage write failure: ${err?.message || 'Unknown error'}`,
      mode,
      restoredStats: {
        invoicesRestored: 0,
        customersRestored: 0,
        productsRestored: 0,
        businessesRestored: 0,
      },
    };
  }
}

export function getSafetyRollbackSnapshot(): {
  timestamp: string;
  summary: any;
  rawJson: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAFETY_SNAPSHOT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function rollbackToSafetySnapshot(): RestoreResult {
  const snapshot = getSafetyRollbackSnapshot();
  if (!snapshot || !snapshot.rawJson) {
    return {
      success: false,
      error: 'No safety rollback snapshot available.',
      mode: 'replace',
      restoredStats: {
        invoicesRestored: 0,
        customersRestored: 0,
        productsRestored: 0,
        businessesRestored: 0,
      },
    };
  }
  const res = restoreBackupData(snapshot.rawJson, {
    mode: 'replace',
    createSafetySnapshot: false,
  });
  if (res.success) {
    try {
      localStorage.removeItem(STORAGE_KEY_SAFETY_SNAPSHOT);
    } catch {}
  }
  return res;
}

export function clearSafetyRollbackSnapshot(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SAFETY_SNAPSHOT);
  } catch {}
}

export function importBackupData(jsonString: string): boolean {
  return restoreBackupData(jsonString, { mode: 'replace' }).success;
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

// --------------------------------------------------------------------------
// EXPENSE MANAGEMENT
// --------------------------------------------------------------------------

export function getSavedExpenses(businessId?: string): ExpenseRecord[] {
  let all: ExpenseRecord[] = [];
  if (memoryExpenses) {
    all = memoryExpenses;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
      all = raw ? JSON.parse(raw) : [];
      memoryExpenses = all;
    } catch {
      all = [];
    }
  }
  const targetBizId = businessId || getActiveBusinessId();
  return all.filter((exp) => !exp.businessId || exp.businessId === targetBizId);
}

export function saveExpense(expense: ExpenseRecord): ExpenseRecord[] {
  try {
    const activeBizId = expense.businessId || getActiveBusinessId();
    const prepared: ExpenseRecord = {
      ...expense,
      businessId: activeBizId,
    };
    const all = getSavedExpenses();
    const index = all.findIndex((e) => e.id === prepared.id);
    let updated: ExpenseRecord[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryExpenses = updated;
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_EXPENSES, updated);
    return updated;
  } catch (err) {
    console.error('Error saving expense:', err);
    return getSavedExpenses();
  }
}

export function deleteExpense(id: string): ExpenseRecord[] {
  try {
    const all = getSavedExpenses();
    const updated = all.filter((e) => e.id !== id);
    memoryExpenses = updated;
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_EXPENSES, updated);
    return updated;
  } catch (err) {
    console.error('Error deleting expense:', err);
    return getSavedExpenses();
  }
}

// --------------------------------------------------------------------------
// PURCHASE REGISTER & INVENTORY ADDITIONS
// --------------------------------------------------------------------------

export function getSavedPurchases(businessId?: string): PurchaseRecord[] {
  let all: PurchaseRecord[] = [];
  if (memoryPurchases) {
    all = memoryPurchases;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PURCHASES);
      all = raw ? JSON.parse(raw) : [];
      memoryPurchases = all;
    } catch {
      all = [];
    }
  }
  const targetBizId = businessId || getActiveBusinessId();
  return all.filter((p) => !p.businessId || p.businessId === targetBizId);
}

export function savePurchase(purchase: PurchaseRecord): PurchaseRecord[] {
  try {
    const activeBizId = purchase.businessId || getActiveBusinessId();
    const prepared: PurchaseRecord = {
      ...purchase,
      businessId: activeBizId,
      updatedAt: new Date().toISOString(),
    };
    const all = getSavedPurchases();
    const index = all.findIndex((p) => p.id === prepared.id);

    // If new purchase, automatically add stock to products
    if (index < 0 && prepared.items) {
      prepared.items.forEach((item) => {
        if (!item.qty || item.qty <= 0) return;
        const prods = getSavedProducts(activeBizId);
        const matchedProd = prods.find(
          (p) =>
            (item.productId && p.id === item.productId) ||
            (p.name &&
              item.description &&
              p.name.trim().toLowerCase() === item.description.trim().toLowerCase())
        );
        if (matchedProd) {
          adjustProductStock(matchedProd.id, {
            type: 'stock_in',
            qty: item.qty,
            reason: `Purchase Bill: ${prepared.purchaseNo}`,
          });
        }
      });

      // If supplier payable balance due, update supplier record
      if (prepared.supplierPhone || prepared.supplierName) {
        const custs = getSavedCustomers(activeBizId);
        const matchedSupplier = custs.find(
          (c) =>
            (prepared.supplierPhone && c.phone === prepared.supplierPhone) ||
            (prepared.supplierName &&
              c.fullName.toLowerCase() === prepared.supplierName.toLowerCase())
        );
        if (matchedSupplier && prepared.balanceDue > 0) {
          matchedSupplier.supplierPayable =
            (matchedSupplier.supplierPayable || 0) + prepared.balanceDue;
          saveCustomer(matchedSupplier);
        }
      }
    }

    let updated: PurchaseRecord[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryPurchases = updated;
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_PURCHASES, updated);
    return updated;
  } catch (err) {
    console.error('Error saving purchase:', err);
    return getSavedPurchases();
  }
}

export function deletePurchase(id: string): PurchaseRecord[] {
  try {
    const all = getSavedPurchases();
    const updated = all.filter((p) => p.id !== id);
    memoryPurchases = updated;
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_PURCHASES, updated);
    return updated;
  } catch (err) {
    console.error('Error deleting purchase:', err);
    return getSavedPurchases();
  }
}

// --------------------------------------------------------------------------
// CREDIT NOTES & DEBIT NOTES (Sales & Purchase Returns)
// --------------------------------------------------------------------------

export function getSavedCreditDebitNotes(businessId?: string): CreditDebitNote[] {
  let all: CreditDebitNote[] = [];
  if (memoryCreditDebitNotes) {
    all = memoryCreditDebitNotes;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CREDIT_DEBIT_NOTES);
      all = raw ? JSON.parse(raw) : [];
      memoryCreditDebitNotes = all;
    } catch {
      all = [];
    }
  }
  const targetBizId = businessId || getActiveBusinessId();
  return all.filter((n) => !n.businessId || n.businessId === targetBizId);
}

export function saveCreditDebitNote(note: CreditDebitNote): CreditDebitNote[] {
  try {
    const activeBizId = note.businessId || getActiveBusinessId();
    const prepared: CreditDebitNote = {
      ...note,
      businessId: activeBizId,
    };
    const all = getSavedCreditDebitNotes();
    const index = all.findIndex((n) => n.id === prepared.id);
    let updated: CreditDebitNote[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...all];
    }
    memoryCreditDebitNotes = updated;
    localStorage.setItem(STORAGE_KEY_CREDIT_DEBIT_NOTES, JSON.stringify(updated));
    idbSet(STORAGE_KEY_CREDIT_DEBIT_NOTES, updated);
    return updated;
  } catch (err) {
    console.error('Error saving credit/debit note:', err);
    return getSavedCreditDebitNotes();
  }
}

// --------------------------------------------------------------------------
// SUBSCRIPTION TRANSACTION RECORDS
// --------------------------------------------------------------------------

export function getSubscriptionTransactions(): SubscriptionTransaction[] {
  let all: SubscriptionTransaction[] = [];
  if (memorySubscriptionTxs) {
    all = memorySubscriptionTxs;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION_TXS);
      all = raw ? JSON.parse(raw) : [];
      memorySubscriptionTxs = all;
    } catch {
      all = [];
    }
  }
  return all;
}

export function recordSubscriptionTransaction(
  tx: SubscriptionTransaction
): SubscriptionTransaction[] {
  try {
    const all = getSubscriptionTransactions();
    const updated = [tx, ...all.filter((t) => t.id !== tx.id)];
    memorySubscriptionTxs = updated;
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION_TXS, JSON.stringify(updated));
    idbSet(STORAGE_KEY_SUBSCRIPTION_TXS, updated);
    return updated;
  } catch {
    return getSubscriptionTransactions();
  }
}

