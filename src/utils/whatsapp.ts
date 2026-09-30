import { SavedInvoice, AppLanguage } from '../types';
import { formatINR } from './numberToWords';

/**
 * Normalizes input mobile numbers:
 * - Strips all spaces, hyphens, parentheses, symbols
 * - Strips leading zeroes (e.g. 09822012345 -> 9822012345)
 * - Enforces standard country code (e.g. 10-digit Indian numbers become 91XXXXXXXXXX)
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // 1. Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // 2. Remove all leading zeros (e.g., "009198...", "09822...")
  digits = digits.replace(/^0+/, '');

  // 3. If standard 10-digit Indian mobile number
  if (digits.length === 10) {
    return '91' + digits;
  }

  // 4. If already 12 digits starting with 91, it's correct
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return digits;
}

export type WhatsAppTemplateType = 'balance_due' | 'delivery_congrats' | 'payment_receipt';

export interface WhatsAppMessageData {
  text: string;
  phone: string;
  url: string;
}

export function generateWhatsAppMessage(
  invoice: SavedInvoice,
  type: WhatsAppTemplateType = 'balance_due',
  lang: AppLanguage = 'en'
): WhatsAppMessageData {
  const profile = invoice.businessProfile;
  const isAuto = invoice.mode === 'auto_dealer' && invoice.autoData;

  const buyerName = isAuto
    ? invoice.autoData?.buyer.fullName || 'Valued Customer'
    : invoice.retailData?.customer.fullName || 'Valued Customer';

  const buyerPhone = isAuto
    ? invoice.autoData?.buyer.phone || ''
    : invoice.retailData?.customer.phone || '';

  const cleanPhone = sanitizePhoneNumber(buyerPhone);

  const vehicleModel = isAuto
    ? `${invoice.autoData?.vehicle.make} ${invoice.autoData?.vehicle.model}`.trim()
    : 'Goods/Items';

  const regNo = isAuto ? invoice.autoData?.vehicle.registrationNo || 'New' : '';
  const balance = isAuto
    ? invoice.autoData?.pricing?.balanceAmount || 0
    : invoice.retailData?.balanceAmount || 0;

  const total = isAuto
    ? invoice.autoData?.pricing?.netPayableAmount || invoice.autoData?.pricing?.totalSaleValue || 0
    : invoice.retailData?.grandTotal || 0;

  const dueDate = isAuto
    ? invoice.autoData?.pricing?.balanceDueDate || 'immediate'
    : invoice.retailData?.balanceDueDate || 'immediate';

  let text = '';

  if (lang === 'hi') {
    if (type === 'balance_due') {
      text = `नमस्ते *${buyerName}* जी,\n\n*${profile.name}* की ओर से सादर अभिवादन!\n\nयह एक विनम्र स्मरण पत्र है कि आपके ${
        isAuto ? `वाहन *${vehicleModel}* (रेजि/चेसिस: ${regNo})` : 'हालिया सामान'
      } की बकाया राशि *${formatINR(balance)}* दिनांक *${dueDate}* तक देय है।\n\n*खाता सारांश:*\n• बिल संख्या: ${invoice.invoiceNo}\n• कुल राशि: ${formatINR(
        total
      )}\n• शेष बकाया: *${formatINR(balance)}*\n\nआप सीधे UPI से भुगतान कर सकते हैं: *${profile.upiId}*\nबैंक खाता: ${profile.accountNumber} (${profile.bankName}, IFSC: ${profile.ifscCode})\n\nकृपया भुगतान के बाद स्क्रीनशॉट साझा करें। धन्यवाद!`;
    } else if (type === 'delivery_congrats') {
      text = `🎉 *हार्दिक बधाई, ${buyerName} जी!* 🎉\n\n*${profile.name}* को चुनने के लिए धन्यवाद! आज आपका नया *${vehicleModel}* (रेजि: ${regNo}) सौंपते हुए हमें अत्यंत प्रसन्नता हो रही है।\n\n*डिलीवरी विवरण:*\n• बिल नं: ${invoice.invoiceNo}\n• डिलीवरी समय: ${invoice.deliveryDate} ${invoice.deliveryTime}\n• चेसिस (VIN): ${isAuto ? invoice.autoData?.vehicle.chassisNo : 'N/A'}\n• बकाया स्थिति: ${balance > 0 ? formatINR(balance) : 'पूर्ण चुकता (NIL)'}\n\nआपकी सुरक्षित और सुखद यात्रा की मंगलकामनाएं! किसी भी सेवा हेतु संपर्क करें: ${profile.phone}.\n\nसादर,\n*${profile.name}*`;
    } else {
      text = `प्रिय *${buyerName}* जी,\n\nबिल *${invoice.invoiceNo}* के एवज में प्राप्त भुगतान की पावती स्वीकार करें।\n\n*भुगतान सारांश:*\n• वाहन/सामान: ${vehicleModel}\n• कुल बिल: ${formatINR(total)}\n• शेष बकाया: *${formatINR(balance)}*\n\n*${profile.name}* के साथ व्यापार के लिए धन्यवाद।`;
    }
  } else {
    if (type === 'balance_due') {
      text = `Hello *${buyerName}*,\n\nGreetings from *${profile.name}*!\n\nThis is a friendly reminder that a balance payment of *${formatINR(
        balance
      )}* for your ${isAuto ? `vehicle *${vehicleModel}* (Reg/Chassis: ${regNo})` : 'recent purchase'} is due on *${dueDate}*.\n\n*Summary:*\n• Invoice No: ${invoice.invoiceNo}\n• Total Amount: ${formatINR(
        total
      )}\n• Balance Outstanding: *${formatINR(balance)}*\n\nYou can pay directly via UPI: *${profile.upiId}*\nBank A/C: ${profile.accountNumber} (${profile.bankName}, IFSC: ${profile.ifscCode})\n\nPlease share the payment screenshot once transferred. Thank you for your business!`;
    } else if (type === 'delivery_congrats') {
      text = `🎉 *Heartiest Congratulations, ${buyerName}!* 🎉\n\nThank you for choosing *${profile.name}*! We are delighted to hand over your brand new *${vehicleModel}* (Reg: ${regNo}) today.\n\n*Delivery Summary:*\n• Invoice No: ${invoice.invoiceNo}\n• Delivery Date: ${invoice.deliveryDate} at ${invoice.deliveryTime}\n• Chassis No (VIN): ${isAuto ? invoice.autoData?.vehicle.chassisNo : 'N/A'}\n${isAuto && invoice.autoData?.vehicle.vehicleType === 'electric_vehicle' ? `• Battery Warranty: ${invoice.autoData.vehicle.batteryWarrantyYears || 'Standard'}\n` : ''}• Balance Due: ${balance > 0 ? formatINR(balance) : 'Nil (Fully Settled)'}\n\nWishing you thousands of happy, safe and memorable kilometers ahead! For any service or assistance, reach us at ${profile.phone}.\n\nWarm regards,\n*${profile.name}*`;
    } else {
      text = `Dear *${buyerName}*,\n\nWe acknowledge and confirm receipt of payment towards Invoice *${invoice.invoiceNo}*.\n\n*Payment Details:*\n• Vehicle/Order: ${vehicleModel}\n• Total Amount: ${formatINR(total)}\n• Remaining Balance: *${formatINR(balance)}*\n\nThank you for transacting with *${profile.name}*. Please feel free to reach out to us at ${profile.phone} for any queries.\n\nBest regards,\n*${profile.name}*`;
    }
  }

  const encoded = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return {
    text,
    phone: cleanPhone,
    url,
  };
}

export function openWhatsAppCustomerReminder(
  invoice: SavedInvoice,
  lang: AppLanguage = 'en'
): void {
  const msg = generateWhatsAppMessage(invoice, 'balance_due', lang);
  window.open(msg.url, '_blank');
}

