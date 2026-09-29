import { SavedInvoice } from '../types';
import { formatINR } from './numberToWords';

export function sanitizePhoneNumber(phone: string): string {
  // Strip non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If 10 digits (India standard mobile), prefix with 91
  if (digits.length === 10) {
    return '91' + digits;
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
  type: WhatsAppTemplateType = 'balance_due'
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
    ? invoice.autoData?.pricing.balanceAmount || 0
    : invoice.retailData?.balanceAmount || 0;

  const total = isAuto
    ? invoice.autoData?.pricing.totalSaleValue || 0
    : invoice.retailData?.grandTotal || 0;

  const dueDate = isAuto
    ? invoice.autoData?.pricing.balanceDueDate || 'immediate'
    : invoice.retailData?.balanceDueDate || 'immediate';

  let text = '';

  if (type === 'balance_due') {
    text = `Hello *${buyerName}*,\n\nGreetings from *${profile.name}*!\n\nThis is a friendly reminder that a balance payment of *${formatINR(
      balance
    )}* for your ${isAuto ? `vehicle *${vehicleModel}* (Reg/Chassis: ${regNo})` : 'recent purchase'} is due on *${dueDate}*.\n\n*Summary:*\n• Invoice No: ${invoice.invoiceNo}\n• Total Amount: ${formatINR(
      total
    )}\n• Balance Outstanding: *${formatINR(balance)}*\n\nYou can pay directly via UPI: *${profile.upiId}*\nBank A/C: ${profile.accountNumber} (${profile.bankName}, IFSC: ${profile.ifscCode})\n\nPlease share the payment screenshot once transferred. Thank you for your business!`;
  } else if (type === 'delivery_congrats') {
    text = `🎉 *Heartiest Congratulations, ${buyerName}!* 🎉\n\nThank you for choosing *${profile.name}*! We are delighted to hand over your brand new *${vehicleModel}* (Reg: ${regNo}) today.\n\n*Delivery Summary:*\n• Invoice No: ${invoice.invoiceNo}\n• Delivery Date: ${invoice.deliveryDate} at ${invoice.deliveryTime}\n• Chassis No (VIN): ${isAuto ? invoice.autoData?.vehicle.chassisNo : 'N/A'}\n${isAuto && invoice.autoData?.vehicle.vehicleType === 'electric_vehicle' ? `• Battery Warranty: ${invoice.autoData.vehicle.batteryWarrantyYears || 'Standard'}\n` : ''}• Balance Due: ${balance > 0 ? formatINR(balance) : 'Nil (Fully Settled)'}\n\nWishing you thousands of happy, safe and memorable kilometers ahead! For any service or assistance, reach us at ${profile.phone}.\n\nWarm regards,\n*${profile.name}*`;
  } else {
    // Payment Receipt Confirmation
    text = `Dear *${buyerName}*,\n\nWe acknowledge and confirm receipt of payment towards Invoice *${invoice.invoiceNo}*.\n\n*Payment Details:*\n• Vehicle/Order: ${vehicleModel}\n• Total Amount: ${formatINR(total)}\n• Remaining Balance: *${formatINR(balance)}*\n\nThank you for transacting with *${profile.name}*. Please feel free to reach out to us at ${profile.phone} for any queries.\n\nBest regards,\n*${profile.name}*`;
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
