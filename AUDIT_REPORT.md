# BIZCORE Comprehensive Security, Architecture & QA Audit Report

| Date | Local Time | Status | Scope |
| :--- | :--- | :--- | :--- |
| 2026-10-22 | 14:50:00-07:00 | **ACTIVE REMEDIATION** | Full Repository Audit & Hardening |

---

## 1. Prioritized Findings Matrix

### Issue 1: Hardcoded Plaintext Admin Credentials & Client-Side Session Spoofing
- **File Path**: `/src/utils/adminAuth.ts`
- **Severity**: **CRITICAL**
- **Root Cause**:
  - Plaintext login ID and password (`Mumtazkhan1985` / `Mumtaz@1985`) hardcoded in source file.
  - Credentials stored in browser `localStorage` (`bizcore_admin_credentials_v1`).
  - Admin authentication state was determined solely by client-side flag `localStorage.getItem('bizcore_admin_session_v1') === 'true'`.
- **Impact**: Any user could inspect source code or run `localStorage.setItem('bizcore_admin_session_v1', 'true')` in browser console to gain full admin privileges and access all data/audit tools.
- **Required Fix**:
  - Remove plaintext credentials from client code.
  - Implement server-side admin authentication endpoints (`POST /api/admin/login`, `POST /api/admin/verify-session`, `POST /api/admin/logout`).
  - Implement server-side rate limiting (max 5 failed attempts per 15 minutes), brute-force lockout, and cryptographic session token generation (SHA-256 HMAC/randomBytes with expiry).
  - Add server-side audit logs for all administrative operations.
- **Test Requirements**:
  - Automated tests verifying failed logins return 401.
  - Brute force lockout triggers after 5 consecutive failed attempts.
  - Valid credentials return short-lived session token.
  - Expired or tampered session tokens are rejected.
- **Status**: **REMEDIATING**

---

### Issue 2: Universal OTP Bypass ("123456") in Production OTP Verification
- **File Path**: `/src/server/otpService.ts` (lines 136, 278) & `/src/server/otpRouter.ts` (line 104)
- **Severity**: **CRITICAL**
- **Root Cause**:
  - Code explicitly checked `cleanInput === '123456'` and marked the verification as successful without checking stored hash or issuing provider verification.
- **Impact**: Anyone could verify any mobile number or email address by entering `123456`, bypassing multi-factor authentication and account ownership checks.
- **Required Fix**:
  - Completely remove universal `123456` bypass from both `otpService.ts` and `otpRouter.ts`.
  - Isolate mock providers strictly to non-production environments (`process.env.NODE_ENV !== 'production'`).
  - In production, if SMS/Email providers are not configured, fail closed with clear actionable configuration errors instead of allowing bypasses.
- **Test Requirements**:
  - Unit tests verifying `123456` is rejected as invalid OTP.
  - Tests ensuring only the exact OTP generated for that specific recipient hash is accepted.
- **Status**: **REMEDIATING**

---

### Issue 3: Insecure Logging of Plaintext OTPs, Request Bodies, and Sensitive Headers
- **File Path**: `/src/server/otpRouter.ts` (lines 58, 76, 170-184, 407, 478-495)
- **Severity**: **HIGH**
- **Root Cause**:
  - Console logging statements logged raw OTPs (`[MockOtpProvider] SMS OTP saved...`), full HTTP request headers (including Authorization/Cookies), and raw body payloads.
- **Impact**: Sensitive OTPs, passwords, and tokens could leak into persistent application logs, monitoring systems, and log aggregation platforms.
- **Required Fix**:
  - Remove all logging of OTP values, passwords, and sensitive token strings.
  - Sanitize request logging to only output timestamp, HTTP method, and route pathname.
- **Test Requirements**:
  - Verify log statements do not contain 6-digit OTP codes, passwords, or authentication bearer tokens.
- **Status**: **REMEDIATING**

---

### Issue 4: Registration Form Lacking Exact Required 8-Field Architecture & Dynamic Subcategories
- **File Path**: `/src/components/SingleRegistrationModal.tsx`, `/src/components/MultiStepRegistrationModal.tsx`, `/src/types/index.ts`
- **Severity**: **HIGH**
- **Root Cause**:
  - Previous registration forms used 26 arbitrary industry categories and multi-step wizards with mismatched fields.
  - Did not enforce the exact 8-field requirement: Name, Mobile Number, Email ID, Address, Business Name, GSTIN (Optional), Category (Sales | Service), and Subcategory.
  - Did not enforce strict subcategory reset when Category switches between Sales and Service.
- **Impact**: Inconsistent business profiles, mismatched categories, and failure to meet the user's specification (including exact subcategories such as preserving "Gold Digger" and separate "Goldsmith / Jewellery Repair").
- **Required Fix**:
  - Created centralized `/src/config/categories.ts` containing the complete 50 Sales subcategories and 55 Service subcategories.
  - Upgrade registration UI to display the exact 8 fields with instant dynamic subcategory filtering, automatic subcategory clearing on category toggle, and client-side validation.
- **Test Requirements**:
  - Tests verifying switching Category clears Subcategory.
  - Tests verifying submission rejects invalid or cross-category subcategories.
  - Tests validating Indian phone numbers (10 digits starting with 6-9) and standard 15-char GSTIN format.
- **Status**: **REMEDIATING**

---

### Issue 5: Single-Use Token Invalidation & Replay Attack Prevention
- **File Path**: `/src/server/otpService.ts`
- **Severity**: **MEDIUM**
- **Root Cause**:
  - Verification tokens generated upon OTP verification (`verifiedTokens`) were kept in memory for 30 minutes without being consumed upon registration completion.
- **Impact**: An attacker who intercepted a valid verification token could attempt replay attacks or register multiple unauthorized accounts under the same token.
- **Required Fix**:
  - Implement single-use token consumption (`consumeRegistrationToken(token)`).
  - Delete token immediately after successful account creation.
- **Test Requirements**:
  - Test verifying a used token cannot be reused for a second registration attempt.
- **Status**: **REMEDIATING**

---

### Issue 6: Missing Server-Side Validation for Category & Subcategory Combinations
- **File Path**: `/src/server/otpRouter.ts` (`/account/register` endpoint)
- **Severity**: **MEDIUM**
- **Root Cause**:
  - Server registration route only checked basic string lengths and did not validate Category against allowed enum (`Sales` | `Service`) or verify Subcategory against the allowed catalog.
- **Impact**: Bypassed frontend validation could insert invalid or corrupted business category data into the database.
- **Required Fix**:
  - Integrated `validateRegistrationPayload` from `src/config/categories.ts` into `/account/register` and `/api/register` endpoints.
- **Test Requirements**:
  - Test submitting invalid category (e.g. "Trading") returns 400.
  - Test submitting invalid subcategory returns 400.
- **Status**: **REMEDIATING**

---

### Issue 7: Firestore Security Rules Fine-Grained Protection
- **File Path**: `/firestore.rules`
- **Severity**: **MEDIUM**
- **Root Cause**:
  - Broad `/users/{userId}/{document=**}` wildcard rule without field-level protection against client-forged admin flags or corrupted data.
- **Impact**: An authenticated user could theoretically overwrite their profile with arbitrary fields (e.g. attempting to grant themselves admin privileges).
- **Required Fix**:
  - Strengthen rules to enforce schema expectations and ensure user isolation.
- **Test Requirements**:
  - Verify unauthorized cross-user access is denied.
- **Status**: **REMEDIATING**
