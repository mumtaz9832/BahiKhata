# BIZCORE — Complete Architecture & Implementation Plan

## Executive Overview
**BIZCORE** is a professional, high-performance Business Management, Point of Sale (POS), GST Billing, and Khata Ledger platform tailored for micro, small, and medium enterprises. The platform features a specialized **Dual-Mode Engine** seamlessly toggling between **Auto Dealerships** (handling vehicle specs, chassis/engine motor numbers, RTO/insurance/accessories, and Delivery Challans) and **General Retail & Services** (handling multi-item inventories, barcode scanning, HSN/SAC codes, and GST rates).

Based on project requirements and clarified architectural decisions:
1. **Database & Sync Architecture**: Full-stack cloud sync powered by **Firebase Firestore** with robust **offline fallback** (IndexedDB / localStorage with dirty-state queueing and optimistic UI updates).
2. **Business Workflow Engine**: Dual-mode **Auto Dealer** and **Retail POS** with an instant header/sidebar mode switcher, dynamic calculation matrices, and auto-numbered tax invoices & challans.
3. **Authentication & Security**: Multi-factor **OTP Authentication** (supporting Mobile SMS & Email with a zero-friction mock memory provider for test validation), Google Identity OAuth client integration, and cryptographic token verification backed by PIN-protected **Root Admin Controls**.
4. **Data Management & Search**: Real-time **Global Search Bar** in the header filtering invoices across customer names, contact numbers, and invoice identifiers; combined with an end-to-end **Formatted CSV Export** in `ReportsView` exporting full invoice lines and customer registries.

---

## 1. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BIZCORE Front-End Layer                         │
│   React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts       │
│                                                                        │
│   ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐  │
│   │ Auto Dealer Studio │ │  Retail POS Studio │ │ Bahi Khata Ledger  │  │
│   │ Vehicle Specs, RTO,│ │ Items Catalog, GST │ │ Customers, Dues,   │  │
│   │ Chassis, Challan   │ │ Scanning, Discounts│ │ WhatsApp Reminders │  │
│   └────────────────────┘ └────────────────────┘ └────────────────────┘  │
│             │                      │                      │            │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │          Unified Storage Manager & Offline Hybrid Cache          │ │
│   │      (IndexedDB/localStorage + Sync Status + Replay Queue)       │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      Firebase Cloud Layer       │   │       Node/Express Backend       │
│  - Firestore Database           │   │  - /api/otp/send & verify        │
│  - Firebase Auth                │   │  - Mock OTP In-Memory Store      │
│  - User-isolated Security Rules │   │  - Fast2SMS / Twilio / MSG91     │
│  - Multi-business namespaces    │   │  - Resend / SendGrid Email       │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

### Technology Matrix
- **Frontend Core**: React 19, TypeScript 5.8+, Vite 6, Tailwind CSS 4.
- **Visual Design**: Sleek slate & gold enterprise theme, responsive mobile-first drawer and bottom navigation, high-contrast print typography.
- **State & Data Persistence**: Hybrid Storage Service combining browser offline cache with live Firestore snapshot synchronization (`users/{userId}/...`).
- **Backend API**: Express on Node.js (`server.ts` running on port 3000), mounting modular routes (`/api/otp`, `/api/health`, `/api/account`).
- **Security & RBAC**: Firebase Security Rules enforcing strict per-user document isolation (`request.auth.uid == userId`) and root admin PIN authorization (`utils/adminAuth.ts`).

---

## 2. Core Feature Requirements & Specifications

### 2.1. Dual-Mode Billing & Document Generation
- **Auto Dealer Mode**:
  - Vehicle attributes: Category (Two-Wheeler, Four-Wheeler, EV, Commercial), Make, Model, Variant, Manufacturing Year, Color, Chassis / VIN Number, Engine / Motor Number, Odometer KM, Battery Serial (for EVs), Key Number.
  - Buyer KYC: Full Name, Primary Mobile, Alternate Mobile, ID Type (Aadhaar / Voter ID / PAN / Driving License), ID Number, Address, State, Pincode.
  - Price Matrix: Ex-Showroom / Base Price, RTO Registration Fee, Comprehensive Insurance, Accessories & Spares, Extended Warranty, Hypothecation / Financer Details, Trade-in Discount, Net Total, Advance Received, Pending Dues, Payment Mode (UPI, Cash, NEFT/IMPS, Cheque, Finance/Loan).
  - Documents: Official **Tax Invoice** and legal **Delivery Challan & Gate Pass** (with vehicle odometer acknowledgment, handover checklist, and signature blocks).
- **General Retail POS Mode**:
  - Multi-line itemized billing with live barcode/SKU lookup, product picker modal, quantity adjustments, unit types (Pcs, Box, Kg, Mtr, Ltr), HSN/SAC codes, and customizable GST tax slabs (0%, 5%, 12%, 18%, 28%).
  - Real-time tax computation: Subtotal, CGST + SGST (Intra-state) vs IGST (Inter-state), Trade Discounts, Round-off, and Net Payable.
- **Instant Mode Switcher**:
  - Global toggle in the Header and Sidebar preserving draft states and immediately adapting UI fields, templates, and analytics without page reloads.

### 2.2. Multi-Factor OTP Authentication & Testing Provider
- **Mock OTP Provider (`src/server/providers.ts` & `src/server/otpRouter.ts`)**:
  - In-memory temporary store (`mockOtpMemoryStore`) holding active verification codes, channel type (`sms` or `email`), timestamps, expiration timers (15 minutes), and attempt counters.
  - Seamless testing fallback: Automatically invoked whenever external SMS gateway API keys (`FAST2SMS_API_KEY`, `TWILIO_ACCOUNT_SID`, `MSG91_AUTH_KEY`) are not present.
  - Universal testing code (`123456`) enabled in test environments alongside auto-generated 6-digit random codes printed to server diagnostic logs for zero-friction end-to-end verification.
  - Endpoints:
    - `POST /api/otp/send` & `POST /api/otp/send-mobile`: Generates and caches verification code in memory.
    - `POST /api/otp/verify` & `POST /api/otp/verify-mobile`: Validates incoming user OTP against stored record, validates attempt limits, and returns signed verification token.
    - `POST /api/account/register`: Validates cryptographic token, sanitizes mobile/email/GSTIN, and finalizes business profile setup.
- **Frontend Auth Modal (`src/components/AuthModal.tsx`)**:
  - Multi-step modal supporting Google Sign-In, 10-digit mobile number input, instant OTP dispatch, 6-digit PIN input with auto-focus and resend countdown, and direct verification.

### 2.3. Real-Time Global Invoice Search (`Header` & `SalesView`)
- **Global Header Search**:
  - Prominent search input with shortcut hint (`Ctrl+K` / `Cmd+K`) and clear button.
  - Real-time filtering matching against:
    - Customer / Buyer Full Name (case-insensitive substring)
    - Mobile Phone & Alternate Number (normalized numeric matching)
    - Formatted Invoice Number (e.g. `INV-2026-0042` or `CHAL-0012`)
    - Vehicle Model or Chassis/Engine Number (in Auto Dealer mode)
  - Quick-results preview dropdown with status chips (`PAID`, `PARTIAL`, `UNPAID`), amounts, and one-click direct navigation to document view.
- **SalesView Synchronization**:
  - Real-time synchronization: When typing in the Header search bar, the `SalesView` grid and table instantly filter down to matched invoices with query term highlighting.

### 2.4. Comprehensive Report Analytics & Complete CSV Export
- **GSTR-1 Tax Summary**:
  - Aggregated gross turnover, taxable value, CGST (Central GST), SGST (State GST), total tax liability, total collected amounts, and outstanding receivables.
  - Time-range selector: Today, This Month, All Time, or custom date ranges.
- **Full Invoice History & Customer CSV Export**:
  - In addition to GSTR-1 summary export, a dedicated **"Export All Invoices to CSV"** and **"Export Customers & Khata to CSV"** button.
  - Formatted CSV includes:
    - Invoice Number, Date, Delivery Time, Billing Mode (Auto / Retail), Customer Name, Customer Phone, Customer GSTIN, Vehicle Details / Items Count, Total Amount, Advance Paid, Balance Due, Payment Status, Payment Mode, Transaction Reference.
    - Automatic CSV header escaping, double-quote wrapping, RFC 4180 compliance, and UTF-8 BOM encoding for seamless opening in Microsoft Excel and Google Sheets.

### 2.5. Bahi Khata Customer Ledger & WhatsApp Automation
- Customer profile directory with balance due tracking, transaction history, and payment collection modal.
- One-click WhatsApp payment reminder modal generating localized reminder templates with customer name, outstanding amount, invoice link, and UPI payment string.

### 2.6. Root Admin Controls & Data Diagnostics
- Secure PIN-authenticated Admin Panel (`src/components/AdminPanelModal.tsx`).
- Diagnostics view: Active Firestore connection state, offline record counts, cache storage consumption.
- Data management: JSON backup creation, JSON data restore with schema validation, false data purging, and factory reset safeguard.

---

## 3. Database Schema & Firestore Security Architecture

### Firestore Collections (`firebase-blueprint.json`)
```
/users/{userId}
  ├── profile/business (document: businessProfile)
  ├── invoices/{invoiceId} (collection of invoices)
  ├── customers/{customerId} (collection of party records & balances)
  └── products/{productId} (collection of stock inventory items)
```

### Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Offline-First Synchronization Strategy
1. **Local Reads**: Always instantaneous from local cache.
2. **Optimistic Writes**: Writes succeed immediately in memory and localStorage/IndexedDB.
3. **Background Cloud Push**: If online and authenticated with Firebase, document writes are dispatched to Firestore using the official SDK (`setDoc`, `updateDoc`, `deleteDoc`).
4. **Offline Replay**: If the device loses internet connectivity, pending mutations are tagged in a persistent queue (`bizcore_pending_sync_queue`) and automatically flushed upon receiving the browser `online` event.

---

## 4. UI/UX Design & Component Hierarchy

### Design Guidelines
- **Color Palette**: Sophisticated Deep Slate (`#0f172a`), Clean Neutral White (`#ffffff`), Warm Amber/Gold accent (`#f59e0b` / `#fbbf24`) for automotive/premium commercial identity, and Emerald (`#10b981`) for completed payments.
- **Typography & Layout**: Clear hierarchical headings, tabular figures for currency values (`font-mono` / `tabular-nums`), clean borders (`border-slate-200`), smooth transitions, and zero AI slop.
- **Responsive Architecture**:
  - Desktop: Full sidebar navigation with instant mode toggle, stats bar, and expanded data tables.
  - Mobile: Slide-over navigation drawer, compact sticky header with quick search trigger, and ergonomic bottom action bar (`MobileBottomNav`).

### Component Tree
```
App.tsx
├── Header (Mode Toggle, Global Search Bar, Quick Add, Auth Button, Language Toggle)
├── StatsBar (Daily Sales, Monthly Collection, Pending Balance Count, Active Mode)
├── VyaparSidebar (Desktop Navigation, Business Switching, Mode Badge)
├── SlideOverDrawer (Mobile Navigation)
├── MobileBottomNav (Mobile Tabs: Home, Sales, Khata, Items, Reports)
└── Main Content Container
    ├── HomePage (Executive Dashboard, Quick Action Cards, Recent Activity)
    ├── AutoDealerForm (Dealership Invoice & Challan Creator)
    ├── RetailForm (General Retail POS Invoice Creator)
    ├── SalesView (Live Invoice Table, Filter Chips, Global Search Integration)
    ├── PartiesView (Khata Directory, Customer Balances, Add Customer)
    ├── ItemsView (Vehicle Stock & Inventory Management)
    ├── ReportsView (GSTR-1 Tax Audit, Sales Charts, Full CSV Exporters)
    ├── InvoiceDocument (Printable/PDF GST Tax Invoice)
    └── DeliveryChallanDocument (Printable/PDF Vehicle Delivery Challan)
```

---

## 5. Error Handling, Edge Cases & Resilience

1. **Network Disconnection**:
   - The application displays an unobtrusive sync indicator (`Synced to Cloud` vs `Offline - Saving Locally`).
   - All invoices, items, and customers save locally without blocking user operations.
2. **Mock OTP Resilience**:
   - If network requests to third-party SMS providers fail or credentials are empty, the backend seamlessly routes to `MockOtpProvider`.
   - Caches verification codes safely in `mockOtpMemoryStore` with automatic TTL cleanup and attempt throttling.
3. **GST & Currency Rounding**:
   - High-precision decimal calculations with standard `Math.round((val + Number.EPSILON) * 100) / 100` preventing floating-point precision anomalies in GST summaries and grand totals.
4. **Duplicate Invoice Number Prevention**:
   - Monotonically increasing sequential numbers (`INV-YYYY-XXXX`) generated with local lock and Firestore transaction checks.
5. **Print & PDF Export Safeguards**:
   - Print-only CSS rules (`@media print`) hiding buttons, headers, sidebars, and drawers, preserving exact A4 layout margins and high-contrast typography.

---

## 6. Testing, Verification & Quality Assurance Plan

### 6.1. Unit & Functional Verification
- **OTP Verification Flow**:
  1. Trigger `POST /api/otp/send-mobile` with sample phone `9876543210`. Verify response has `success: true`.
  2. Verify mock memory record created in `mockOtpMemoryStore['sms:9876543210']`.
  3. Trigger `POST /api/otp/verify-mobile` with correct code. Verify validation passes and token is returned.
  4. Test edge case: incorrect code returns 400 with invalid code message; test 5 incorrect attempts triggers rate limiting.
- **Global Search Functionality**:
  1. Populate invoices with varied customer names, mobile numbers, and invoice codes.
  2. Enter query into Header search input; verify real-time filtering updates both header dropdown and `SalesView` list.
  3. Verify clear query (`X` button or escape) immediately restores the full dataset.
- **CSV Data Export**:
  1. Click 'Export All Invoices CSV' in `ReportsView`.
  2. Verify downloaded CSV includes all invoice columns, correct date formats, itemized summaries, and opens cleanly in spreadsheet tools without corrupted characters.

### 6.2. Cross-Browser & Device Verification
- Chrome, Safari, Firefox, Edge, and Mobile Safari/Chrome.
- High-DPI screens and print layout previews.

---

## 7. Step-by-Step Implementation Sequence

1. **Step 1: Mock OTP Provider & Server Endpoint Hardening**
   - Ensure `src/server/otpRouter.ts` and `src/server/providers.ts` provide transparent mock OTP verification for testing with informative logs and robust fallback.
2. **Step 2: Global Search Bar State & Real-Time Sync**
   - Wire `searchQuery` and `onSearchChange` cleanly between `Header.tsx`, `App.tsx`, and `SalesView.tsx`.
   - Add match highlighting and quick invoice preview drawer.
3. **Step 3: Comprehensive CSV Export in ReportsView**
   - Implement both `handleExportAllInvoicesCSV` and `handleExportCustomersCSV` alongside existing GSTR-1 summary export.
   - Format with comprehensive columns, sanitizing formulas and commas.
4. **Step 4: Dual-Mode Form & Print Polish**
   - Verify seamless transition between Auto Dealer (Vehicle Specs & Challan) and Retail (Items & Scanning).
   - Ensure print CSS produces clean A4 invoices and Delivery Challans.
5. **Step 5: Firestore & Offline Hybrid Sync Audit**
   - Validate Firestore security rules deployment and ensure offline cache persistence functions without exceptions.
6. **Step 6: Build Compilation & Final Verification**
   - Run `compile_applet` and test all operational workflows.
