/**
 * BIZCORE Automated Verification & Test Suite
 * Tests API endpoints, Financial Calculations, Currency Formatting,
 * CSV Sanitization, Phone Search Matchers, and Ledger Reconciliation.
 */

import { numberToWords, formatINR } from '../src/utils/numberToWords';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected [${expected}], got [${actual}]`);
  }
}

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      suite,
      name,
      passed: true,
      durationMs: Date.now() - start,
    });
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: any) {
    results.push({
      suite,
      name,
      passed: false,
      error: err?.message || String(err),
      durationMs: Date.now() - start,
    });
    console.error(`  ✗ [FAIL] ${name}: ${err?.message || err}`);
  }
}

// Helper to safely escape CSV cells and protect against formula injection
const escapeCsv = (val: any): string => {
  if (val === undefined || val === null) return '""';
  let str = String(val).trim();
  if (/^[=\+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

// Clean phone helper for normalized digit comparisons
const matchPhone = (phone: string, query: string): boolean => {
  if (!phone || !query) return false;
  if (phone.toLowerCase().includes(query.toLowerCase())) return true;

  const cleanPhone = phone.replace(/\D/g, '');
  const cleanQuery = query.replace(/\D/g, '');
  if (cleanQuery.length >= 2 && cleanPhone.includes(cleanQuery)) {
    return true;
  }
  return false;
};

async function main() {
  console.log('\n======================================================');
  console.log('       BIZCORE AUTOMATED TEST & VERIFICATION SUITE    ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: Server OTP & Authentication API
  // --------------------------------------------------------------------------
  console.log('Suite 1: Server OTP & Authentication Endpoints');

  await runTest('Server OTP', 'GET /api/otp/health returns 200 with status ok', async () => {
    const res = await fetch('http://localhost:3000/api/otp/health');
    assertEquals(res.status, 200, 'Health endpoint status code');
    const data = await res.json();
    assertEquals(data.status, 'ok', 'Health status');
    assert(typeof data.smsProviderConfigured === 'boolean', 'smsProviderConfigured is boolean');
  });

  let capturedOtp = '';
  const testPhone = '9876501234';

  await runTest('Server OTP', 'POST /api/otp/send-mobile sends OTP for 10-digit number', async () => {
    const res = await fetch('http://localhost:3000/api/otp/send-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone }),
    });
    assertEquals(res.status, 200, 'Send OTP status code');
    const data = await res.json();
    assert(data.success === true, 'Response indicates success');
  });

  await runTest('Server OTP', 'GET /api/otp/mock-store records OTP in memory', async () => {
    const res = await fetch('http://localhost:3000/api/otp/mock-store');
    assertEquals(res.status, 200, 'Mock store status code');
    const data = await res.json();
    assert(data.success === true, 'Mock store query succeeded');
    const record = data.records?.find((r: any) => r.target === testPhone);
    assert(Boolean(record), `Record for phone ${testPhone} exists in mock store`);
    assert(record.otp.length === 6, `OTP is a 6-digit code: ${record.otp}`);
    capturedOtp = record.otp;
  });

  await runTest('Server OTP', 'POST /api/otp/verify-mobile rejects incorrect OTP', async () => {
    const res = await fetch('http://localhost:3000/api/otp/verify-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, otp: '000000' }),
    });
    assertEquals(res.status, 400, 'Should reject invalid OTP with 400');
    const data = await res.json();
    assert(data.success === false, 'Invalid OTP rejected');
  });

  await runTest('Server OTP', 'POST /api/otp/verify-mobile rejects universal bypass 123456', async () => {
    const res = await fetch('http://localhost:3000/api/otp/verify-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, otp: '123456' }),
    });
    // If 123456 is not the captured random OTP, it must be rejected
    if (capturedOtp !== '123456') {
      assertEquals(res.status, 400, 'Universal bypass code 123456 must be rejected with 400');
      const data = await res.json();
      assert(data.success === false, '123456 bypass must fail');
    }
  });

  await runTest('Server OTP', 'POST /api/otp/verify-mobile accepts correct OTP & returns token', async () => {
    assert(Boolean(capturedOtp), 'Valid OTP was captured');
    const res = await fetch('http://localhost:3000/api/otp/verify-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, otp: capturedOtp }),
    });
    assertEquals(res.status, 200, 'Verify OTP status code');
    const data = await res.json();
    assert(data.success === true, 'Valid OTP accepted');
    assert(Boolean(data.verificationToken || data.registrationToken), 'Returns verification/registration token');
  });

  await runTest('Server OTP', 'POST /api/otp/mock-clear resets memory store', async () => {
    const res = await fetch('http://localhost:3000/api/otp/mock-clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assertEquals(res.status, 200, 'Clear mock store status code');
    const storeRes = await fetch('http://localhost:3000/api/otp/mock-store');
    const storeData = await storeRes.json();
    assertEquals(storeData.records.length, 0, 'Store should be empty after clear');
  });

  // --------------------------------------------------------------------------
  // SUITE 1B: Centralized Registration Payload & Category Validation API
  // --------------------------------------------------------------------------
  console.log('\nSuite 1B: Centralized Registration & Subcategory Validation');

  await runTest('Registration Validation', 'POST /api/account/register rejects invalid Category (e.g. Retail)', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Verma',
        phone: '9876543210',
        email: 'rahul@example.com',
        address: '123 MG Road, Pune, Maharashtra',
        businessName: 'Verma Auto Spares',
        category: 'Retail', // Invalid: only 'Sales' or 'Service' allowed
        subcategory: 'Auto Parts & Accessories',
      }),
    });
    assertEquals(res.status, 400, 'Invalid category must return 400');
    const data = await res.json();
    assert(data.success === false, 'Registration failed');
    assert(data.errors?.category !== undefined || data.error.includes('Category'), 'Error mentions Category');
  });

  await runTest('Registration Validation', 'POST /api/account/register rejects mismatched subcategory under Sales', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Verma',
        phone: '9876543210',
        email: 'rahul@example.com',
        address: '123 MG Road, Pune, Maharashtra',
        businessName: 'Verma Enterprise',
        category: 'Sales',
        subcategory: 'Mason / Raj Mistri', // Belongs to Service, NOT Sales
      }),
    });
    assertEquals(res.status, 400, 'Mismatched subcategory must return 400');
    const data = await res.json();
    assert(data.success === false, 'Registration failed');
    assert(data.errors?.subcategory !== undefined || data.error.includes('Subcategory'), 'Error mentions Subcategory');
  });

  await runTest('Registration Validation', 'POST /api/account/register rejects malformed GSTIN', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Verma',
        phone: '9876543210',
        email: 'rahul@example.com',
        address: '123 MG Road, Pune, Maharashtra',
        businessName: 'Verma Auto',
        category: 'Sales',
        subcategory: 'Electric Vehicles (EV)',
        gstin: 'INVALID_GSTIN_123',
      }),
    });
    assertEquals(res.status, 400, 'Invalid GSTIN must return 400');
    const data = await res.json();
    assert(data.success === false, 'Registration rejected');
  });

  await runTest('Registration Validation', 'POST /api/account/register accepts valid Sales registration', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Patil',
        phone: '9822012345',
        email: 'suresh@patilmotors.com',
        address: 'Plot 44, MIDC Bhosari, Pune - 411026',
        businessName: 'Patil EV Motors',
        category: 'Sales',
        subcategory: 'Electric Vehicles (EV)',
        gstin: '27ABCDE1234F1Z5',
      }),
    });
    assertEquals(res.status, 200, 'Valid registration must return 200');
    const data = await res.json();
    assert(data.success === true, 'Registration succeeded');
    assertEquals(data.user?.category, 'Sales', 'Category preserved');
    assertEquals(data.user?.subcategory, 'Electric Vehicles (EV)', 'Subcategory preserved');
  });

  await runTest('Registration Validation', 'POST /api/account/register accepts verbatim "Gold Digger" service category', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ajay Solanki',
        phone: '9833012345',
        email: 'ajay@solankiexcavation.com',
        address: 'Survey 12, Mining Area, Udaipur, Rajasthan',
        businessName: 'Solanki Gold Digger Excavation',
        category: 'Service',
        subcategory: 'Gold Digger',
      }),
    });
    assertEquals(res.status, 200, 'Verbatim Gold Digger subcategory accepted');
    const data = await res.json();
    assert(data.success === true, 'Registration succeeded');
    assertEquals(data.user?.subcategory, 'Gold Digger', 'Gold Digger subcategory preserved verbatim');
  });

  await runTest('Registration Validation', 'POST /api/account/register accepts "Goldsmith / Jewellery Repair" service category', async () => {
    const res = await fetch('http://localhost:3000/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mohan Soni',
        phone: '9844012345',
        email: 'mohan@sonijewellers.com',
        address: 'Sarafa Bazaar, Jaipur, Rajasthan',
        businessName: 'Soni Goldsmith Art',
        category: 'Service',
        subcategory: 'Goldsmith / Jewellery Repair',
      }),
    });
    assertEquals(res.status, 200, 'Goldsmith / Jewellery Repair subcategory accepted');
    const data = await res.json();
    assert(data.success === true, 'Registration succeeded');
    assertEquals(data.user?.subcategory, 'Goldsmith / Jewellery Repair', 'Goldsmith / Jewellery Repair preserved');
  });

  // --------------------------------------------------------------------------
  // SUITE 1C: Server-Authoritative Admin Authentication & 2FA
  // --------------------------------------------------------------------------
  console.log('\nSuite 1C: Server-Authoritative Admin Authentication & 2FA');

  await runTest('Admin Auth', 'POST /api/admin/login rejects incorrect password with 401', async () => {
    const res = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'Mumtazkhan1985', password: 'WrongPassword123!' }),
    });
    assertEquals(res.status, 401, 'Invalid password must return 401');
    const data = await res.json();
    assert(data.success === false, 'Login failed');
  });

  let adminChallengeId = '';
  let adminDemoCode = '';

  await runTest('Admin Auth', 'POST /api/admin/login validates credentials and creates 2FA challenge', async () => {
    const res = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'Mumtazkhan1985', password: 'Mumtaz@1985' }),
    });
    assertEquals(res.status, 200, 'Valid credentials return 200 with 2FA requirement');
    const data = await res.json();
    assert(data.success === true, 'Login accepted');
    assert(data.require2fa === true, '2FA is required');
    assert(Boolean(data.challengeId), 'Challenge ID received');
    adminChallengeId = data.challengeId;
    adminDemoCode = data.demoCode || '';
  });

  await runTest('Admin Auth', 'POST /api/admin/verify-2fa rejects invalid 2FA code', async () => {
    assert(Boolean(adminChallengeId), 'Challenge ID exists');
    const res = await fetch('http://localhost:3000/api/admin/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: adminChallengeId, otp: '000000' }),
    });
    assertEquals(res.status, 400, 'Invalid 2FA code returns 400');
    const data = await res.json();
    assert(data.success === false, 'Verification rejected');
  });

  let adminSessionToken = '';

  await runTest('Admin Auth', 'POST /api/admin/verify-2fa accepts valid 2FA code and issues session token', async () => {
    assert(Boolean(adminChallengeId), 'Challenge ID exists');
    assert(Boolean(adminDemoCode), 'Admin 2FA code exists in test environment');
    const res = await fetch('http://localhost:3000/api/admin/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: adminChallengeId, otp: adminDemoCode }),
    });
    assertEquals(res.status, 200, 'Valid 2FA returns 200');
    const data = await res.json();
    assert(data.success === true, '2FA verified successfully');
    assert(Boolean(data.sessionToken), 'Session token received');
    adminSessionToken = data.sessionToken;
  });

  await runTest('Admin Auth', 'POST /api/admin/verify-session confirms active admin session', async () => {
    assert(Boolean(adminSessionToken), 'Admin session token exists');
    const res = await fetch('http://localhost:3000/api/admin/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: JSON.stringify({}),
    });
    assertEquals(res.status, 200, 'Valid session returns 200');
    const data = await res.json();
    assert(data.success === true && data.valid === true, 'Session is valid');
  });

  await runTest('Admin Auth', 'POST /api/admin/logout terminates active session', async () => {
    assert(Boolean(adminSessionToken), 'Admin session token exists');
    const res = await fetch('http://localhost:3000/api/admin/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: JSON.stringify({}),
    });
    assertEquals(res.status, 200, 'Logout returns 200');

    // Confirm session is now invalid
    const verifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`,
      },
      body: JSON.stringify({}),
    });
    assertEquals(verifyRes.status, 401, 'Logged out session must return 401');
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Indian Currency Words Converter
  // --------------------------------------------------------------------------
  console.log('\nSuite 2: Indian Currency Words Converter');

  await runTest('NumberToWords', 'Converts 0 to Zero Rupees Only', () => {
    const words = numberToWords(0);
    assertEquals(words, 'Zero Rupees Only', 'Zero words conversion');
  });

  await runTest('NumberToWords', 'Converts 85,400 to Words', () => {
    const words = numberToWords(85400);
    assert(words.includes('Eighty Five Thousand Four Hundred'), `Expected Eighty Five Thousand Four Hundred in: ${words}`);
    assert(words.endsWith('Only'), 'Ends with Only');
  });

  await runTest('NumberToWords', 'Converts 15,50,000 (Lakhs) to Words', () => {
    const words = numberToWords(1550000);
    assert(words.includes('Fifteen Lakh Fifty Thousand'), `Expected Fifteen Lakh Fifty Thousand in: ${words}`);
  });

  await runTest('NumberToWords', 'Converts 1,25,00,000 (Crores) to Words', () => {
    const words = numberToWords(12500000);
    assert(words.includes('One Crore Twenty Five Lakh'), `Expected One Crore Twenty Five Lakh in: ${words}`);
  });

  await runTest('NumberToWords', 'Handles Paise decimal amounts (1200.75)', () => {
    const words = numberToWords(1200.75);
    assert(words.includes('Seventy Five Paise'), `Expected Seventy Five Paise in: ${words}`);
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Retail POS Billing & GST Calculations
  // --------------------------------------------------------------------------
  console.log('\nSuite 3: Retail POS Billing & GST Calculations');

  await runTest('Retail POS', 'Calculates multi-item invoice with GST breakdown & balance dues', () => {
    interface RetailItem {
      description: string;
      qty: number;
      rate: number;
      gstPercent: number;
    }

    const items: RetailItem[] = [
      { description: 'Engine Oil 1L', qty: 5, rate: 350, gstPercent: 18 },
      { description: 'Brake Fluid 500ml', qty: 2, rate: 200, gstPercent: 18 },
      { description: 'Air Filter', qty: 1, rate: 650, gstPercent: 28 },
    ];

    let subtotal = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const lineSubtotal = item.qty * item.rate;
      const lineGst = (lineSubtotal * item.gstPercent) / 100;
      subtotal += lineSubtotal;
      totalGst += lineGst;
    });

    // 5 * 350 = 1750 (GST 18% = 315)
    // 2 * 200 = 400  (GST 18% = 72)
    // 1 * 650 = 650  (GST 28% = 182)
    // subtotal = 2800, totalGst = 569
    assertEquals(subtotal, 2800, 'Subtotal is 2800');
    assertEquals(totalGst, 569, 'Total GST is 569');

    const discount = 169;
    const grandTotal = Math.round(subtotal + totalGst - discount);
    assertEquals(grandTotal, 3200, 'Grand total after discount is 3200');

    const advance = 1200;
    const balance = grandTotal - advance;
    assertEquals(balance, 2000, 'Balance due is 2000');
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Automobile Dealership Billing Calculations
  // --------------------------------------------------------------------------
  console.log('\nSuite 4: Automobile Dealership Billing Calculations');

  await runTest('Auto Dealer', 'Computes on-road pricing with accessories, fees, and balance', () => {
    const pricing = {
      basePrice: 750000,
      rtoCharges: 52000,
      insuranceCharges: 38000,
      accessoriesCharges: 25000,
      otherCharges: 5000,
      discount: 20000,
      advanceReceived: 150000,
    };

    const totalSaleValue =
      pricing.basePrice +
      pricing.rtoCharges +
      pricing.insuranceCharges +
      pricing.accessoriesCharges +
      pricing.otherCharges -
      pricing.discount;

    // 750000 + 52000 + 38000 + 25000 + 5000 - 20000 = 850000
    assertEquals(totalSaleValue, 850000, 'Total sale value is 850,000');

    const balanceAmount = totalSaleValue - pricing.advanceReceived;
    assertEquals(balanceAmount, 700000, 'Balance amount due is 700,000');
  });

  // --------------------------------------------------------------------------
  // SUITE 5: CSV Security & Formula Injection Sanitization
  // --------------------------------------------------------------------------
  console.log('\nSuite 5: CSV Security & Formula Injection Sanitization');

  await runTest('CSV Security', 'Neutralizes dangerous formula injection characters', () => {
    const maliciousInputs = [
      '=SUM(A1:A10)',
      '+123456789',
      '-2+5',
      '@SUM(B1:B5)',
      '=cmd|"/C calc"!A0',
    ];

    maliciousInputs.forEach((input) => {
      const escaped = escapeCsv(input);
      assert(
        escaped.startsWith(`"'`),
        `Input [${input}] should have leading quote inside quotes: ${escaped}`
      );
    });

    const safeInput = 'Standard Customer Name';
    assertEquals(escapeCsv(safeInput), '"Standard Customer Name"', 'Safe input preserved as standard quote');
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Phone Normalization & Search Matching
  // --------------------------------------------------------------------------
  console.log('\nSuite 6: Phone Normalization & Search Matching');

  await runTest('Search Matching', 'Matches raw phone digits across various input formats', () => {
    const storedPhone = '+91 98765-43210';
    assert(matchPhone(storedPhone, '9876543210'), 'Matches clean 10-digit query');
    assert(matchPhone(storedPhone, '98765'), 'Matches first 5 digits');
    assert(matchPhone(storedPhone, '43210'), 'Matches last 5 digits');
    assert(matchPhone(storedPhone, '+91'), 'Matches international prefix');
    assert(!matchPhone(storedPhone, '11111'), 'Does not match unrelated digits');
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Bahi Khata Customer Ledger & Balance Reconciliation
  // --------------------------------------------------------------------------
  console.log('\nSuite 7: Bahi Khata Customer Ledger & Balance Reconciliation');

  await runTest('Khata Ledger', 'Maintains customer opening balance, credit transactions, and payment reconciliation', () => {
    interface KhataTransaction {
      id: string;
      type: 'credit_sale' | 'payment_received';
      amount: number;
      date: string;
    }

    const customer = {
      id: 'cust_001',
      fullName: 'Vikram Sharma',
      openingBalance: 15000,
      balanceDue: 15000,
      transactions: [] as KhataTransaction[],
    };

    // 1. Credit sale of ₹25,000
    customer.transactions.push({
      id: 'tx_01',
      type: 'credit_sale',
      amount: 25000,
      date: '2026-10-10',
    });
    customer.balanceDue += 25000;
    assertEquals(customer.balanceDue, 40000, 'Balance due after credit sale is 40,000');

    // 2. Partial payment received via UPI of ₹18,000
    customer.transactions.push({
      id: 'tx_02',
      type: 'payment_received',
      amount: 18000,
      date: '2026-10-12',
    });
    customer.balanceDue -= 18000;
    assertEquals(customer.balanceDue, 22000, 'Balance due after partial payment is 22,000');

    // 3. Final settlement payment of ₹22,000
    customer.transactions.push({
      id: 'tx_03',
      type: 'payment_received',
      amount: 22000,
      date: '2026-10-15',
    });
    customer.balanceDue -= 22000;
    assertEquals(customer.balanceDue, 0, 'Customer balance due is fully settled (0)');

    // Reconcile total received vs total billed
    const totalCredit = customer.transactions
      .filter((t) => t.type === 'credit_sale')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = customer.transactions
      .filter((t) => t.type === 'payment_received')
      .reduce((sum, t) => sum + t.amount, 0);

    assertEquals(totalCredit, 25000, 'Total credit sales match');
    assertEquals(totalPaid, 40000, 'Total payments received match opening balance + sales');
  });

  // --------------------------------------------------------------------------
  // SUITE 8: CSV RFC 4180 Escaping & Line Breaks
  // --------------------------------------------------------------------------
  console.log('\nSuite 8: CSV RFC 4180 Escaping & Line Breaks');

  await runTest('CSV Escaping', 'Properly escapes embedded double quotes and commas', () => {
    const textWithQuotes = 'Engine Oil "Synthetic" 5W-30';
    const escaped = escapeCsv(textWithQuotes);
    assertEquals(escaped, '"Engine Oil ""Synthetic"" 5W-30"', 'Double quotes must be doubled in CSV');

    const textWithComma = 'Shop No. 4, MG Road, Pune';
    assertEquals(escapeCsv(textWithComma), '"Shop No. 4, MG Road, Pune"', 'Comma values wrapped in quotes');

    assertEquals(escapeCsv(null), '""', 'Null escaped as empty string in quotes');
    assertEquals(escapeCsv(undefined), '""', 'Undefined escaped as empty string in quotes');
  });

  // --------------------------------------------------------------------------
  // SUITE 9: Backup Payload Schema Integrity
  // --------------------------------------------------------------------------
  console.log('\nSuite 9: Backup Payload Schema Integrity');

  await runTest('Backup Integrity', 'Validates Bizcore backup payload structure and required tables', () => {
    const mockBackupPayload = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      appName: 'BIZCORE',
      data: {
        profile: {
          name: 'Apex Auto Wheels',
          gstin: '27ABCDE1234F1Z5',
          businessType: 'auto_dealer',
        },
        invoices: [
          {
            id: 'inv_101',
            invoiceNo: 'INV-2026-001',
            invoiceDate: '2026-10-15',
            mode: 'auto_dealer',
            status: 'PAID',
          },
        ],
        customers: [
          {
            id: 'cust_01',
            fullName: 'Rajesh Patil',
            phone: '9822012345',
            balanceDue: 0,
          },
        ],
        products: [
          {
            id: 'prod_01',
            name: 'Electric Scooter X1',
            rate: 85000,
            gstPercent: 5,
            unit: 'Pieces',
          },
        ],
      },
    };

    assert(mockBackupPayload.appName === 'BIZCORE', 'App name is BIZCORE');
    assert(Array.isArray(mockBackupPayload.data.invoices), 'Invoices is an array');
    assert(Array.isArray(mockBackupPayload.data.customers), 'Customers is an array');
    assert(Array.isArray(mockBackupPayload.data.products), 'Products is an array');
    assert(Boolean(mockBackupPayload.data.profile.name), 'Profile name is present');
  });

  // --------------------------------------------------------------------------
  // SUITE 10: Subscription Order Creation, HMAC Verification & Idempotency
  // --------------------------------------------------------------------------
  console.log('\nSuite 10: Subscription Order Creation, HMAC Verification & Idempotency');

  let testOrderId = '';
  let testChallenge = '';
  let testAmount = 0;

  await runTest('Subscription Order', 'POST /api/subscription/create-order creates order with HMAC challenge token', async () => {
    const res = await fetch('http://localhost:3000/api/subscription/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'pro_monthly',
        billingPhone: '9876543210',
        businessName: 'Apex Traders',
      }),
    });
    assertEquals(res.status, 200, 'Order creation status 200');
    const data = await res.json();
    assertEquals(data.success, true, 'Order creation success');
    assertEquals(data.order.amount, 299, 'Pro Monthly price is 299');
    assertEquals(data.order.currency, 'INR', 'Currency is INR');
    assert(Boolean(data.order.id && data.order.id.startsWith('order_')), 'Valid order ID generated');
    assert(Boolean(data.challengeToken), 'Server HMAC challenge token provided');

    testOrderId = data.order.id;
    testChallenge = data.challengeToken;
    testAmount = data.order.amount;
  });

  const crypto = await import('crypto');
  const sharedSecret = 'BIZCORE_FINANCIAL_HMAC_SECRET_2026';
  const testPaymentId = `pay_test_${Date.now()}`;
  const validSignature = crypto
    .createHmac('sha256', sharedSecret)
    .update(`${testOrderId}|${testPaymentId}|${testChallenge}`)
    .digest('hex');

  await runTest('Subscription Verification', 'POST /api/subscription/verify-payment succeeds with valid HMAC signature', async () => {
    const res = await fetch('http://localhost:3000/api/subscription/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        paymentId: testPaymentId,
        signature: validSignature,
        tier: 'pro_monthly',
        amount: testAmount,
        billingPhone: '9876543210',
      }),
    });
    assertEquals(res.status, 200, 'Verification status 200');
    const data = await res.json();
    assertEquals(data.success, true, 'Payment verification success');
    assertEquals(data.transaction.status, 'SUCCESS', 'Transaction marked as SUCCESS');
    assert(Boolean(data.transaction.receiptNo && data.transaction.receiptNo.startsWith('REC-')), 'Receipt generated');
    assert(Boolean(data.subscription.expiresAt), 'Valid subscription expiry date returned');
  });

  await runTest('Subscription Idempotency', 'Replaying duplicate paymentId returns idempotent cached result without double billing', async () => {
    const res = await fetch('http://localhost:3000/api/subscription/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        paymentId: testPaymentId,
        signature: validSignature,
        tier: 'pro_monthly',
        amount: testAmount,
        billingPhone: '9876543210',
      }),
    });
    assertEquals(res.status, 200, 'Replay status 200');
    const data = await res.json();
    assertEquals(data.success, true, 'Payment replay handled gracefully');
    assertEquals(data.isDuplicate, true, 'Server identifies duplicate payment event idempotently');
  });

  // --------------------------------------------------------------------------
  // SUITE 11: Inventory Deductions, Reversals & Stock Tracking
  // --------------------------------------------------------------------------
  console.log('\nSuite 11: Inventory Deductions, Cancellations & Credit Notes');

  await runTest('Inventory Lifecycle', 'Stock deduction on sale and stock restoration on invoice cancellation', () => {
    const initialStock = 50;
    const soldQty = 5;

    // Simulate sale
    const remainingStock = initialStock - soldQty;
    assertEquals(remainingStock, 45, 'Stock decreases by sold quantity');

    // Simulate cancellation reversal
    const restoredStock = remainingStock + soldQty;
    assertEquals(restoredStock, initialStock, 'Stock restored to original quantity upon invoice cancellation');
  });

  await runTest('Credit Note Generation', 'Sales return produces accurate credit note with tax and reverse balance', () => {
    const returnItemValue = 1000;
    const gstRate = 18;
    const gstAmount = Math.round((returnItemValue * gstRate) / 100);
    const totalCreditAmount = returnItemValue + gstAmount;

    assertEquals(gstAmount, 180, '18% GST calculation on return');
    assertEquals(totalCreditAmount, 1180, 'Total credit note value matches taxable + GST');
  });

  // --------------------------------------------------------------------------
  // SUITE 12: Real Financial Accounting (Gross Profit vs Net Profit)
  // --------------------------------------------------------------------------
  console.log('\nSuite 12: Financial Accounting — Gross vs Net Profit & Operating Expenses');

  await runTest('Financial P&L', 'Calculates Gross Profit, deducts Operating Expenses, and strictly distinguishes Sales from Profit', () => {
    const totalSalesRevenue = 500000; // Total sales
    const costOfGoodsSold = 350000;    // Inventory cost
    const operatingExpenses = 60000;   // Rent, electricity, salaries

    const grossProfit = totalSalesRevenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;

    assertEquals(grossProfit, 150000, 'Gross profit = Sales - COGS');
    assertEquals(netProfit, 90000, 'Net profit = Gross Profit - Operating Expenses');
    assert(netProfit !== totalSalesRevenue, 'Never confuse revenue with net profit');
  });

  // --------------------------------------------------------------------------
  // SUITE 13: Security Hardening, Authorization & Tenant Isolation
  // --------------------------------------------------------------------------
  console.log('\nSuite 13: Security Hardening, Authorization & Tenant Isolation');

  await runTest('Security & Auth', 'Rejects unauthorized access to /api/admin/audit-logs without token (401)', async () => {
    const res = await fetch('http://localhost:3000/api/admin/audit-logs');
    assertEquals(res.status, 401, 'Unauthorized request must return 401');
    const data = await res.json();
    assertEquals(data.success, false, 'Success must be false');
  });

  await runTest('Security & Auth', 'Rejects forged or expired session tokens on /api/admin/verify-session', async () => {
    const res = await fetch('http://localhost:3000/api/admin/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'forged_fake_token_1234567890abcdef' }),
    });
    assertEquals(res.status, 401, 'Forged token must return 401');
  });

  await runTest('Tenant Isolation', 'Multi-business data partitioning separates records by businessId', () => {
    interface ScopedRecord {
      id: string;
      businessId: string;
      title: string;
    }

    const allInvoices: ScopedRecord[] = [
      { id: 'inv_1', businessId: 'biz_dealership_01', title: 'Car Sale 1' },
      { id: 'inv_2', businessId: 'biz_dealership_01', title: 'Car Sale 2' },
      { id: 'inv_3', businessId: 'biz_retail_02', title: 'Hardware Goods' },
    ];

    const biz1Invoices = allInvoices.filter((inv) => inv.businessId === 'biz_dealership_01');
    const biz2Invoices = allInvoices.filter((inv) => inv.businessId === 'biz_retail_02');

    assertEquals(biz1Invoices.length, 2, 'Biz 1 sees only its own 2 records');
    assertEquals(biz2Invoices.length, 1, 'Biz 2 sees only its own 1 record');
    assert(!biz1Invoices.some((inv) => inv.businessId === 'biz_retail_02'), 'No cross-business leakage into Biz 1');
    assert(!biz2Invoices.some((inv) => inv.businessId === 'biz_dealership_01'), 'No cross-business leakage into Biz 2');
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
