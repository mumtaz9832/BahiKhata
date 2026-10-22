/**
 * Centralized Category & Subcategory Catalog for BIZCORE
 * Enforces strict Category (Sales | Service) and exact Subcategories
 * along with client and server validation helpers.
 */

export type BusinessMainCategory = 'Sales' | 'Service';

export const BUSINESS_MAIN_CATEGORIES: BusinessMainCategory[] = ['Sales', 'Service'];

/**
 * Exact SALES Subcategories
 */
export const SALES_SUBCATEGORIES: readonly string[] = [
  'General Store',
  'Kirana Store',
  'Sweets & Confectionery',
  'Gift Corner',
  'Garments & Clothing',
  'Footwear',
  'Auto Parts & Accessories',
  'Electric Vehicles (EV)',
  'Two-Wheeler Dealer',
  'Car Dealer',
  'GCV / Commercial Vehicles',
  'Hardware',
  'Electronics',
  'Jewellery',
  'Optical / Chashma Dukan',
  'Marble & Tiles',
  'Paints',
  'Supermarket',
  'Bakery',
  'Cosmetics & Beauty Products',
  'Pharmacy / Medical Store',
  'Mobile & Computer Store',
  'Furniture',
  'Books & Stationery',
  'Toys & Sports Goods',
  'Electrical Goods',
  'Plumbing Supplies',
  'Building Materials',
  'Cement & Construction Materials',
  'Sanitaryware & Bathroom Fittings',
  'Kitchenware & Utensils',
  'Home Appliances',
  'Watches & Accessories',
  'Bags & Luggage',
  'Sports Goods',
  'Baby Products',
  'Medical Equipment',
  'Agricultural Equipment',
  'Fertilizer, Seeds & Pesticides',
  'Dairy & Milk Products',
  'Meat, Fish & Poultry',
  'Wholesale / Distributor',
  'Manufacturing',
  'Scrap & Recycling',
  'Battery & Inverter',
  'Solar Products',
  'Automobile Accessories',
  'Tyres & Tubes',
  'Lubricants & Engine Oil',
  'Other Sales',
] as const;

/**
 * Exact SERVICE Subcategories
 * Note: "Gold Digger" is preserved exactly as required. "Goldsmith / Jewellery Repair" is a separate option.
 */
export const SERVICE_SUBCATEGORIES: readonly string[] = [
  'Auto Repair Service',
  'Car Washing & Detailing',
  'Construction',
  'Electrician',
  'Gold Digger',
  'Other Services',
  'Two-Wheeler Repair',
  'Car Repair & Maintenance',
  'Vehicle Denting & Painting',
  'Vehicle Towing Service',
  'Tyre Repair & Puncture Service',
  'Battery Repair & Service',
  'EV Repair & Service',
  'Solar Installation & Service',
  'Plumbing Service',
  'Carpenter',
  'Mason / Raj Mistri',
  'Painting Contractor',
  'Civil Contractor',
  'AC & Refrigeration Repair',
  'Mobile Repair',
  'Computer & Laptop Repair',
  'Electronics Repair',
  'Home Appliance Repair',
  'Washing Machine Repair',
  'Water Purifier Service',
  'CCTV Installation & Service',
  'Networking & IT Support',
  'Website Development',
  'Software Development',
  'Digital Marketing',
  'Graphic Design',
  'Photography & Videography',
  'Printing & Advertising',
  'Tailoring & Boutique',
  'Salon & Beauty Parlour',
  'Laundry & Dry Cleaning',
  'Cleaning Service',
  'Pest Control',
  'Transport & Logistics',
  'Courier & Delivery',
  'Packers & Movers',
  'Education & Coaching',
  'Consultancy',
  'Accounting & Tax Services',
  'Legal Services',
  'Event Management',
  'Catering Service',
  'Furniture Repair',
  'Home Repair & Maintenance',
  'Agriculture Services',
  'Machinery Repair',
  'Security Services',
  'Other Professional Services',
  'Goldsmith / Jewellery Repair',
] as const;

export type SalesSubcategory = typeof SALES_SUBCATEGORIES[number];
export type ServiceSubcategory = typeof SERVICE_SUBCATEGORIES[number];
export type BusinessSubcategory = SalesSubcategory | ServiceSubcategory;

export const CATEGORY_SUBCATEGORIES_MAP: Record<BusinessMainCategory, readonly string[]> = {
  Sales: SALES_SUBCATEGORIES,
  Service: SERVICE_SUBCATEGORIES,
};

/**
 * Validates if the category is either Sales or Service
 */
export function isValidCategory(category: unknown): category is BusinessMainCategory {
  return category === 'Sales' || category === 'Service';
}

/**
 * Validates if the subcategory belongs strictly to the selected category
 */
export function isValidSubcategory(category: unknown, subcategory: unknown): boolean {
  if (!isValidCategory(category)) return false;
  if (typeof subcategory !== 'string') return false;
  const list = CATEGORY_SUBCATEGORIES_MAP[category];
  return list.includes(subcategory.trim());
}

/**
 * Gets subcategories for a given category
 */
export function getSubcategoriesForCategory(category: unknown): readonly string[] {
  if (isValidCategory(category)) {
    return CATEGORY_SUBCATEGORIES_MAP[category];
  }
  return [];
}

/**
 * Validation: Name (required, trimmed, length-limited 2-100)
 */
export function validateName(name: unknown): { valid: boolean; error?: string; trimmed: string } {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name is required', trimmed: '' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long', trimmed };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name cannot exceed 100 characters', trimmed: trimmed.slice(0, 100) };
  }
  return { valid: true, trimmed };
}

/**
 * Validation: Mobile Number (10 Indian digits starting with 6-9)
 */
export function validateMobileNumber(phone: unknown): { valid: boolean; error?: string; normalized: string } {
  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { valid: false, error: 'Mobile number is required', normalized: '' };
  }
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    return { valid: false, error: 'Mobile number must be a 10-digit number', normalized: digits };
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9', normalized: digits };
  }
  return { valid: true, normalized: digits };
}

/**
 * Validation: Email ID (standard format RFC 5322 compliant, length-limited 5-120)
 */
export function validateEmail(email: unknown): { valid: boolean; error?: string; normalized: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email ID is required', normalized: '' };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, error: 'Email ID is required', normalized: '' };
  }
  if (normalized.length > 120) {
    return { valid: false, error: 'Email cannot exceed 120 characters', normalized };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@example.com)', normalized };
  }
  return { valid: true, normalized };
}

/**
 * Validation: Address (required, length-limited 3-300)
 */
export function validateAddress(address: unknown): { valid: boolean; error?: string; trimmed: string } {
  if (typeof address !== 'string') {
    return { valid: false, error: 'Address is required', trimmed: '' };
  }
  const trimmed = address.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Address must be at least 3 characters long', trimmed };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: 'Address cannot exceed 300 characters', trimmed: trimmed.slice(0, 300) };
  }
  return { valid: true, trimmed };
}

/**
 * Validation: Business Name (required, trimmed, length-limited 2-120)
 */
export function validateBusinessName(name: unknown): { valid: boolean; error?: string; trimmed: string } {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Business name is required', trimmed: '' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Business name must be at least 2 characters long', trimmed };
  }
  if (trimmed.length > 120) {
    return { valid: false, error: 'Business name cannot exceed 120 characters', trimmed: trimmed.slice(0, 120) };
  }
  return { valid: true, trimmed };
}

/**
 * Validation: GSTIN (Optional; if provided, validate 15-character standard structure and state code)
 * Note: Does not claim official government GST verification or ownership without a live GST API key.
 */
export function validateGSTIN(gstin: unknown): { valid: boolean; error?: string; normalized?: string } {
  if (gstin === undefined || gstin === null || gstin === '') {
    return { valid: true, normalized: '' };
  }
  if (typeof gstin !== 'string') {
    return { valid: false, error: 'GSTIN must be a string' };
  }
  const normalized = gstin.trim().toUpperCase();
  if (normalized.length === 0) {
    return { valid: true, normalized: '' };
  }
  if (normalized.length !== 15) {
    return {
      valid: false,
      error: `GSTIN must be exactly 15 characters long (currently ${normalized.length})`,
      normalized,
    };
  }
  // Standard Indian GSTIN Regex: 2 digits (State code) + 10 chars (PAN) + 1 char (Entity) + 1 char ('Z') + 1 char (Checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Invalid GSTIN structure. Expected format: 22AAAAA0000A1Z5 (2-digit state code + 10-digit PAN + 1 entity + Z + checksum)',
      normalized,
    };
  }

  // Validate state code (01 - 38 or 97)
  const stateCode = parseInt(normalized.slice(0, 2), 10);
  if (isNaN(stateCode) || (stateCode < 1 || (stateCode > 38 && stateCode !== 97))) {
    return {
      valid: false,
      error: 'Invalid state code in GSTIN. State code must be between 01 and 38 (or 97 for Other Territory).',
      normalized,
    };
  }

  return { valid: true, normalized };
}

/**
 * Full Registration Form Validator (usable on both frontend and backend)
 */
export interface RegistrationPayload {
  name: string;
  mobileNumber: string;
  email: string;
  address: string;
  businessName: string;
  gstin?: string;
  category: 'Sales' | 'Service';
  subcategory: string;
  mobileVerificationToken?: string;
  emailVerificationToken?: string;
}

export interface RegistrationValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: RegistrationPayload;
}

export function validateRegistrationPayload(payload: any): RegistrationValidationResult {
  const errors: Record<string, string> = {};

  const nameVal = validateName(payload?.name || payload?.fullName);
  if (!nameVal.valid) errors.name = nameVal.error!;

  const mobileVal = validateMobileNumber(payload?.mobileNumber || payload?.phone);
  if (!mobileVal.valid) errors.mobileNumber = mobileVal.error!;

  const emailVal = validateEmail(payload?.email || payload?.emailId);
  if (!emailVal.valid) errors.email = emailVal.error!;

  const addressVal = validateAddress(payload?.address || payload?.businessAddress);
  if (!addressVal.valid) errors.address = addressVal.error!;

  const bizNameVal = validateBusinessName(payload?.businessName || payload?.name);
  if (!bizNameVal.valid) errors.businessName = bizNameVal.error!;

  const gstinVal = validateGSTIN(payload?.gstin || payload?.gstNumber);
  if (!gstinVal.valid) errors.gstin = gstinVal.error!;

  const category = payload?.category;
  if (!isValidCategory(category)) {
    errors.category = 'Category must be either Sales or Service';
  }

  const subcategory = payload?.subcategory;
  if (!subcategory || typeof subcategory !== 'string' || !subcategory.trim()) {
    errors.subcategory = 'Subcategory is required';
  } else if (isValidCategory(category) && !isValidSubcategory(category, subcategory)) {
    errors.subcategory = `"${subcategory}" is not a valid subcategory for ${category}`;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      name: nameVal.trimmed,
      mobileNumber: mobileVal.normalized,
      email: emailVal.normalized,
      address: addressVal.trimmed,
      businessName: bizNameVal.trimmed,
      gstin: gstinVal.normalized || undefined,
      category: category as 'Sales' | 'Service',
      subcategory: (subcategory as string).trim(),
      mobileVerificationToken: payload?.mobileVerificationToken,
      emailVerificationToken: payload?.emailVerificationToken,
    },
  };
}
