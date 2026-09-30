/**
 * Converts Indian currency numbers to words strictly following Indian Numbering System
 * (Crores, Lakhs, Thousands, Hundreds, Tens, Ones, and Paise)
 * e.g., 85400.50 -> "Rupees Eighty-Five Thousand Four Hundred and Fifty Paise Only"
 */

const ones: string[] = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens: string[] = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + ' ';
  }
  return str.trim();
}

function convertIntegerToWords(n: number): string {
  if (n === 0) return 'Zero';

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let result = '';

  if (crore > 0) {
    result += (crore >= 100 ? convertIntegerToWords(crore) : convertBelowThousand(crore)) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertBelowThousand(remainder) + ' ';
  }

  return result.trim().replace(/\s+/g, ' ');
}

export function numberToWords(num: number): string {
  if (num === undefined || num === null || isNaN(num) || num <= 0) {
    return 'Zero Rupees Only';
  }

  const absNum = Math.abs(num);
  const rupees = Math.floor(absNum);
  const paise = Math.round((absNum - rupees) * 100);

  let output = '';

  if (rupees > 0) {
    output = 'Rupees ' + convertIntegerToWords(rupees);
  } else {
    output = 'Rupees Zero';
  }

  if (paise > 0) {
    output += ' and ' + convertBelowThousand(paise) + ' Paise';
  }

  return output.trim() + ' Only';
}

export function formatINR(val: number): string {
  if (isNaN(val) || val === undefined || val === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatINRWithDecimals(val: number): string {
  if (isNaN(val) || val === undefined || val === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}
