/**
 * Converts Indian currency numbers to words
 * e.g., 85400 -> "Eighty-Five Thousand Four Hundred Rupees Only"
 */

const ones = [
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

const tens = [
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

export function numberToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const rounded = Math.round(num);
  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let result = '';

  if (crore > 0) {
    result += convertBelowThousand(crore) + ' Crore ';
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

  return (result.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
