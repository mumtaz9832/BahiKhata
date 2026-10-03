import React from 'react';
import {
  AutoDealerData,
  VehicleType,
  PaymentMode,
  AppLanguage,
  ExchangeVehicle,
  FinancingDetails,
} from '../types';
import {
  User,
  Phone,
  Car,
  Bike,
  Zap,
  Truck,
  IndianRupee,
  Sparkles,
  RefreshCw,
  Landmark,
  CheckCircle,
  AlertCircle,
  Printer,
  Save,
  Check,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface AutoDealerFormProps {
  data: AutoDealerData;
  onChange: (updated: AutoDealerData) => void;
  invoiceNo: string;
  onInvoiceNoChange: (no: string) => void;
  invoiceDate: string;
  onInvoiceDateChange: (date: string) => void;
  deliveryDate: string;
  onDeliveryDateChange: (date: string) => void;
  deliveryTime: string;
  onDeliveryTimeChange: (time: string) => void;
  lang?: AppLanguage;
  onSave?: () => void;
  onPrint?: () => void;
  onSaveAndPrint?: () => void;
  onPreview?: () => void;
  saveSuccess?: boolean;
}

const VEHICLE_PRESETS = [
  {
    name: 'Ola S1 Pro Gen 2 (EV)',
    type: 'electric_vehicle' as VehicleType,
    make: 'Ola Electric',
    model: 'S1 Pro Gen 2',
    variant: '4 kWh Matte Black',
    fuelType: 'Electric' as const,
    batteryCapacityKwh: '4.0 kWh (IP67)',
    chargerSerialNo: 'CHG-750W-99812',
    batteryWarrantyYears: '8 Years / 80,000 KM',
    motorPowerKw: '11 kW Peak',
    mfgYear: 2026,
    basePrice: 139999,
    rto: 3500,
    insurance: 6200,
    color: 'Matte Stellar Black',
  },
  {
    name: 'Tata Nexon EV (4W)',
    type: 'electric_vehicle' as VehicleType,
    make: 'Tata Motors',
    model: 'Nexon EV Long Range',
    variant: 'Empowered Plus 45 kWh',
    fuelType: 'Electric' as const,
    batteryCapacityKwh: '45.0 kWh Liquid Cooled',
    chargerSerialNo: 'CCS2-7.2KW-88419',
    batteryWarrantyYears: '8 Years / 1,60,000 KM',
    motorPowerKw: '106 kW (143 BHP)',
    mfgYear: 2026,
    basePrice: 1699000,
    rto: 12000,
    insurance: 48000,
    color: 'Daytona Grey',
  },
  {
    name: 'Hero Splendor+ XTEC (2W)',
    type: 'two_wheeler' as VehicleType,
    make: 'Hero MotoCorp',
    model: 'Splendor Plus XTEC',
    variant: 'i3S Bluetooth Drum',
    fuelType: 'Petrol' as const,
    mfgYear: 2026,
    basePrice: 79900,
    rto: 7200,
    insurance: 5400,
    color: 'Black with Silver Graphics',
  },
  {
    name: 'Honda Activa 6G (2W)',
    type: 'two_wheeler' as VehicleType,
    make: 'Honda',
    model: 'Activa 6G',
    variant: 'H-Smart Keyless',
    fuelType: 'Petrol' as const,
    mfgYear: 2026,
    basePrice: 82500,
    rto: 7800,
    insurance: 5600,
    color: 'Decent Blue Metallic',
  },
  {
    name: 'Royal Enfield Classic 350',
    type: 'two_wheeler' as VehicleType,
    make: 'Royal Enfield',
    model: 'Classic 350',
    variant: 'Dark Stealth Black Dual ABS',
    fuelType: 'Petrol' as const,
    mfgYear: 2026,
    basePrice: 220000,
    rto: 21500,
    insurance: 11200,
    color: 'Stealth Black',
  },
];

export const AutoDealerForm: React.FC<AutoDealerFormProps> = ({
  data,
  onChange,
  invoiceNo,
  onInvoiceNoChange,
  invoiceDate,
  onInvoiceDateChange,
  deliveryDate,
  onDeliveryDateChange,
  deliveryTime,
  onDeliveryTimeChange,
  lang = 'en',
  onSave,
  onPrint,
  onSaveAndPrint,
  onPreview,
  saveSuccess = false,
}) => {
  const t = getTranslation(lang);

  // Recalculate totals
  const recalculatePricing = (
    pricing: typeof data.pricing,
    exchange?: ExchangeVehicle
  ) => {
    const base = Number(pricing.basePrice) || 0;
    const rto = Number(pricing.rtoCharges) || 0;
    const ins = Number(pricing.insuranceCharges) || 0;
    const acc = Number(pricing.accessoriesCharges) || 0;
    const disc = Number(pricing.discount) || 0;

    const grossTotal = Math.max(0, base + rto + ins + acc - disc);
    const exchangeVal = exchange?.isExchange ? Number(exchange.exchangeValuation) || 0 : 0;
    const netPayable = Math.max(0, grossTotal - exchangeVal);

    const advance = Number(pricing.advanceReceived) || 0;
    const balance = Math.max(0, netPayable - advance);

    return {
      ...pricing,
      totalSaleValue: grossTotal,
      exchangeValuation: exchangeVal,
      netPayableAmount: netPayable,
      balanceAmount: balance,
    };
  };

  const handleBuyerChange = (field: keyof typeof data.buyer, value: string) => {
    onChange({
      ...data,
      buyer: {
        ...data.buyer,
        [field]: value,
      },
    });
  };

  const handleVehicleChange = (field: keyof typeof data.vehicle, value: any) => {
    let updatedFuel = data.vehicle.fuelType;
    if (field === 'vehicleType') {
      if (value === 'electric_vehicle') {
        updatedFuel = 'Electric';
      } else if (updatedFuel === 'Electric') {
        updatedFuel = 'Petrol';
      }
    }

    onChange({
      ...data,
      vehicle: {
        ...data.vehicle,
        fuelType: updatedFuel,
        [field]: value,
      },
    });
  };

  const handlePricingChange = (field: keyof typeof data.pricing, value: any) => {
    const updatedPricing = {
      ...data.pricing,
      [field]: value,
    };
    const recalculated = recalculatePricing(updatedPricing, data.exchange);

    onChange({
      ...data,
      pricing: recalculated,
    });
  };

  const handleExchangeChange = (field: keyof ExchangeVehicle, value: any) => {
    const currentExchange: ExchangeVehicle = data.exchange || {
      isExchange: false,
      exchangeValuation: 0,
    };

    const updatedExchange = {
      ...currentExchange,
      [field]: value,
    };

    const recalculated = recalculatePricing(data.pricing, updatedExchange);

    onChange({
      ...data,
      exchange: updatedExchange,
      pricing: recalculated,
    });
  };

  const handleFinancingChange = (field: keyof FinancingDetails, value: any) => {
    const currentFinancing: FinancingDetails = data.financing || {
      status: 'Cash',
    };

    const updatedFinancing = {
      ...currentFinancing,
      [field]: value,
    };

    // Update hypothecationBank in vehicle details for sync
    let hpaBank = data.vehicle.hypothecationBank;
    if (field === 'status' && value === 'Cash') {
      hpaBank = '';
    } else if (field === 'financierName') {
      hpaBank = value;
    }

    onChange({
      ...data,
      financing: updatedFinancing,
      vehicle: {
        ...data.vehicle,
        hypothecationBank: hpaBank,
      },
    });
  };

  const applyPreset = (preset: (typeof VEHICLE_PRESETS)[0]) => {
    const base = preset.basePrice;
    const rto = preset.rto;
    const ins = preset.insurance;
    const acc = 1500;
    const disc = 1000;
    const gross = base + rto + ins + acc - disc;
    const exchangeVal = data.exchange?.isExchange ? data.exchange.exchangeValuation : 0;
    const net = Math.max(0, gross - exchangeVal);
    const adv = Math.round(net * 0.4);
    const bal = Math.max(0, net - adv);

    onChange({
      ...data,
      vehicle: {
        ...data.vehicle,
        vehicleType: preset.type,
        make: preset.make,
        model: preset.model,
        variant: preset.variant,
        fuelType: preset.fuelType,
        color: preset.color,
        manufacturingYear: preset.mfgYear,
        batteryCapacityKwh: preset.batteryCapacityKwh || '',
        chargerSerialNo: preset.chargerSerialNo || '',
        batteryWarrantyYears: preset.batteryWarrantyYears || '',
        motorPowerKw: preset.motorPowerKw || '',
      },
      pricing: {
        ...data.pricing,
        basePrice: base,
        rtoCharges: rto,
        insuranceCharges: ins,
        accessoriesCharges: acc,
        discount: disc,
        totalSaleValue: gross,
        exchangeValuation: exchangeVal,
        netPayableAmount: net,
        advanceReceived: adv,
        balanceAmount: bal,
      },
    });
  };

  const isEV = data.vehicle.vehicleType === 'electric_vehicle';
  const chassisLength = (data.vehicle.chassisNo || '').length;
  const isChassisValid = chassisLength === 17;

  const [focusTab, setFocusTab] = React.useState<'all' | 'buyer' | 'vehicle' | 'finance' | 'pricing'>('all');

  return (
    <div className="space-y-5">
      {/* 1. Document Identity & Handover Time */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.billDetails}
          </span>
          <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Official Auto Bill
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Invoice / Bill No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => onInvoiceNoChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Bill Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => onInvoiceDateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Handover Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => onDeliveryDateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Handover Time</label>
            <input
              type="text"
              placeholder="e.g. 04:30 PM"
              value={deliveryTime}
              onChange={(e) => onDeliveryTimeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Focus Mode Navigation Bar */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto border border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => setFocusTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          All Sections
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('buyer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'buyer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          1. Buyer Details
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('vehicle')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'vehicle'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          2. Vehicle Particulars {isEV ? '(EV)' : ''}
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('finance')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'finance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          3. Finance &amp; Exchange
        </button>
        <button
          type="button"
          onClick={() => setFocusTab('pricing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            focusTab === 'pricing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          4. Pricing &amp; Payment
        </button>
      </div>

      {/* Quick Autofill Presets (Shown in 'all' or 'vehicle' tabs) */}
      {(focusTab === 'all' || focusTab === 'vehicle') && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Vehicle Template Autofill:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VEHICLE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Buyer Details */}
      {(focusTab === 'all' || focusTab === 'buyer') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            {t.buyerInfo}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Full Name (as per RC / Aadhaar) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Rajesh Kumar"
              value={data.buyer.fullName}
              onChange={(e) => handleBuyerChange('fullName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Mobile Phone (WhatsApp Active) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g., 9876543210"
              value={data.buyer.phone}
              onChange={(e) => handleBuyerChange('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Government ID Type
            </label>
            <select
              value={data.buyer.idType}
              onChange={(e) => handleBuyerChange('idType', e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              ID Number / Aadhaar / PAN
            </label>
            <input
              type="text"
              placeholder="e.g., 4920-8192-3841"
              value={data.buyer.idNumber}
              onChange={(e) => handleBuyerChange('idNumber', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-600 font-medium mb-1">
              Residential Address (Permanent / Present)
            </label>
            <input
              type="text"
              placeholder="Flat / House No, Building, Street, Area"
              value={data.buyer.address}
              onChange={(e) => handleBuyerChange('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">City / District</label>
            <input
              type="text"
              placeholder="e.g., Pune"
              value={data.buyer.city}
              onChange={(e) => handleBuyerChange('city', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">State &amp; Pincode</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Maharashtra"
                value={data.buyer.state}
                onChange={(e) => handleBuyerChange('state', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <input
                type="text"
                placeholder="411038"
                value={data.buyer.pincode}
                onChange={(e) => handleBuyerChange('pincode', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {focusTab === 'buyer' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setFocusTab('vehicle')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Vehicle Particulars</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* 3. Vehicle Details */}
      {(focusTab === 'all' || focusTab === 'vehicle') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              {t.vehicleSpecs}
            </h3>
          </div>
          {isEV && (
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" /> Electric Vehicle Mode
            </span>
          )}
        </div>

        {/* Vehicle Category Selector */}
        <div className="mb-4">
          <label className="block text-xs text-slate-600 font-medium mb-1.5">
            Vehicle Category / Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'two_wheeler', label: 'Two-Wheeler (2W)', icon: Bike },
              { id: 'four_wheeler', label: 'Four-Wheeler (4W)', icon: Car },
              { id: 'electric_vehicle', label: 'Electric Vehicle (EV)', icon: Zap },
              { id: 'commercial', label: 'Commercial Vehicle', icon: Truck },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = data.vehicle.vehicleType === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleVehicleChange('vehicleType', cat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? cat.id === 'electric_vehicle'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected
                        ? cat.id === 'electric_vehicle'
                          ? 'text-emerald-600'
                          : 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Make / Manufacturer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Tata Motors, Hero, Ola"
              value={data.vehicle.make}
              onChange={(e) => handleVehicleChange('make', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Model &amp; Variant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Nexon EV / Splendor XTEC"
              value={data.vehicle.model}
              onChange={(e) => handleVehicleChange('model', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Registration No. (RC / Temp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., MH12 AB 1234 or NEW"
              value={data.vehicle.registrationNo}
              onChange={(e) => handleVehicleChange('registrationNo', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Chassis No with 17-char validation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium">
                Chassis No. (VIN) <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isChassisValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {chassisLength}/17 chars
              </span>
            </div>
            <input
              type="text"
              maxLength={17}
              placeholder="17-Digit VIN Number"
              value={data.vehicle.chassisNo}
              onChange={(e) => handleVehicleChange('chassisNo', e.target.value.toUpperCase().replace(/\s/g, ''))}
              className={`w-full px-3 py-2 rounded-lg border font-mono font-semibold uppercase focus:outline-none ${
                isChassisValid
                  ? 'border-emerald-500 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900'
              }`}
            />
            {!isChassisValid && chassisLength > 0 && (
              <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Standard VIN requires exactly 17 characters ({17 - chassisLength} remaining)</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              {isEV ? 'Electric Motor No.' : 'Engine No.'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={isEV ? 'e.g., EM-OLA-2026-9932' : 'e.g., HA10EN890123'}
              value={data.vehicle.engineMotorNo}
              onChange={(e) => handleVehicleChange('engineMotorNo', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono font-semibold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Color</label>
            <input
              type="text"
              placeholder="e.g., Daytona Grey / Matte Black"
              value={data.vehicle.color}
              onChange={(e) => handleVehicleChange('color', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Manufacturing Year</label>
            <input
              type="number"
              value={data.vehicle.manufacturingYear}
              onChange={(e) => handleVehicleChange('manufacturingYear', parseInt(e.target.value) || 2026)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Odometer Reading (KM)</label>
            <input
              type="number"
              placeholder="e.g. 15"
              value={data.vehicle.odometerKm}
              onChange={(e) => handleVehicleChange('odometerKm', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Fuel / Propulsion</label>
            <select
              value={data.vehicle.fuelType}
              onChange={(e) => handleVehicleChange('fuelType', e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="Petrol">Petrol</option>
              <option value="Electric">Electric (EV)</option>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* CONDITIONAL EV SPECIFIC FIELDS */}
        {isEV && (
          <div className="mt-4 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.evSpecs}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-emerald-900 font-medium mb-1">
                  Battery Capacity (kWh)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4.0 kWh / 45 kWh"
                  value={data.vehicle.batteryCapacityKwh || ''}
                  onChange={(e) => handleVehicleChange('batteryCapacityKwh', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-emerald-900 font-medium mb-1">
                  Charger Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., CHG-750W-99201"
                  value={data.vehicle.chargerSerialNo || ''}
                  onChange={(e) => handleVehicleChange('chargerSerialNo', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-emerald-900 font-medium mb-1">
                  Battery Warranty
                </label>
                <input
                  type="text"
                  placeholder="e.g., 8 Years / 80,000 KM"
                  value={data.vehicle.batteryWarrantyYears || ''}
                  onChange={(e) => handleVehicleChange('batteryWarrantyYears', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-emerald-900 font-medium mb-1">
                  Motor Power Output
                </label>
                <input
                  type="text"
                  placeholder="e.g., 11 kW Peak / 143 BHP"
                  value={data.vehicle.motorPowerKw || ''}
                  onChange={(e) => handleVehicleChange('motorPowerKw', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {focusTab === 'vehicle' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocusTab('buyer')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              &larr; Back: Buyer
            </button>
            <button
              type="button"
              onClick={() => setFocusTab('finance')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Financing &amp; Exchange</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* 4. Old Vehicle Exchange Offer & Financing Section */}
      {(focusTab === 'all' || focusTab === 'finance') && (
      <>
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              {t.exchangeVehicle}
            </h3>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.exchange?.isExchange || false}
              onChange={(e) => handleExchangeChange('isExchange', e.target.checked)}
              className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900 border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">{t.enableExchange}</span>
          </label>
        </div>

        {data.exchange?.isExchange ? (
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Old Vehicle Make &amp; Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., Honda Activa 4G"
                  value={data.exchange.makeModel || ''}
                  onChange={(e) => handleExchangeChange('makeModel', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Old Vehicle Registration No. (RC)
                </label>
                <input
                  type="text"
                  placeholder="e.g., MH12 AB 9912"
                  value={data.exchange.registrationNo || ''}
                  onChange={(e) => handleExchangeChange('registrationNo', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Manufacturing Year
                </label>
                <input
                  type="number"
                  placeholder="2018"
                  value={data.exchange.manufacturingYear || 2018}
                  onChange={(e) => handleExchangeChange('manufacturingYear', parseInt(e.target.value) || 2018)}
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-900 font-bold mb-1 text-emerald-800">
                  Agreed Valuation Deduction (₹)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={data.exchange.exchangeValuation || 0}
                  onChange={(e) => handleExchangeChange('exchangeValuation', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-emerald-500 bg-white text-emerald-950 font-mono font-black text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-blue-900">
              * This valuation deduction will be automatically credited towards the vehicle's net payable price.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No old vehicle trade-in for this sale. Check the toggle above to deduct exchange valuation from the invoice.
          </p>
        )}
      </div>

      {/* 5. Hypothecation & Financing Details */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
          <Landmark className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            {t.financingSection}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Payment Settlement Type
            </label>
            <select
              value={data.financing?.status || 'Cash'}
              onChange={(e) => handleFinancingChange('status', e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="Cash">Full Cash / Direct Payment</option>
              <option value="Financed">Bank Finance / Auto Loan</option>
            </select>
          </div>

          {data.financing?.status === 'Financed' && (
            <>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Financier / Bank Name (HPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g., IDFC First Bank / HDFC"
                  value={data.financing.financierName || ''}
                  onChange={(e) => handleFinancingChange('financierName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Loan / DO Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g., TW-LON-992104"
                  value={data.financing.loanAccountNo || ''}
                  onChange={(e) => handleFinancingChange('loanAccountNo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Financed Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 85000"
                  value={data.financing.loanAmount || 0}
                  onChange={(e) => handleFinancingChange('loanAmount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {focusTab === 'finance' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocusTab('vehicle')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              &larr; Back: Vehicle
            </button>
            <button
              type="button"
              onClick={() => setFocusTab('pricing')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Pricing &amp; Payment</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {/* 6. Pricing, Breakdown & Payment Settlement */}
      {(focusTab === 'all' || focusTab === 'pricing') && (
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <IndianRupee className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            {t.pricingSettlement}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs mb-4">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Vehicle Base / Ex-Showroom (₹)
            </label>
            <input
              type="number"
              value={data.pricing.basePrice}
              onChange={(e) => handlePricingChange('basePrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              RTO &amp; Road Tax (₹)
            </label>
            <input
              type="number"
              value={data.pricing.rtoCharges}
              onChange={(e) => handlePricingChange('rtoCharges', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Insurance 1+4 / 1+5 (₹)
            </label>
            <input
              type="number"
              value={data.pricing.insuranceCharges}
              onChange={(e) => handlePricingChange('insuranceCharges', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Accessories &amp; Kit (₹)
            </label>
            <input
              type="number"
              value={data.pricing.accessoriesCharges}
              onChange={(e) => handlePricingChange('accessoriesCharges', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1 text-red-600">
              Dealer Discount (₹)
            </label>
            <input
              type="number"
              value={data.pricing.discount}
              onChange={(e) => handlePricingChange('discount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-red-600 font-mono font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Total, Exchange & Net Payable Highlights */}
        <div className="bg-slate-900 text-white p-4 rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              {t.grossOnRoad}
            </span>
            <span className="text-lg font-black text-amber-300 font-mono">
              ₹{data.pricing.totalSaleValue.toLocaleString('en-IN')}
            </span>
            {data.exchange?.isExchange && data.exchange.exchangeValuation > 0 && (
              <span className="text-[10px] text-rose-300 block">
                -₹{data.exchange.exchangeValuation.toLocaleString('en-IN')} Exchange
              </span>
            )}
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              {t.netPayable}
            </span>
            <span className="text-xl font-black text-white font-mono">
              ₹{(data.pricing.netPayableAmount || data.pricing.totalSaleValue).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-3">
            <label className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block mb-0.5">
              {t.tokenAdvance} (₹) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={data.pricing.advanceReceived}
              onChange={(e) => handlePricingChange('advanceReceived', parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-base focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              {t.remainingBalance}
            </span>
            <span
              className={`text-xl font-black font-mono ${
                data.pricing.balanceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ₹{data.pricing.balanceAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Mode & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Payment Mode Received
            </label>
            <select
              value={data.pricing.paymentMode}
              onChange={(e) => handlePricingChange('paymentMode', e.target.value as PaymentMode)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="UPI / QR">UPI / QR (Google Pay / PhonePe)</option>
              <option value="Cash">Cash at Counter</option>
              <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT / IMPS / RTGS)</option>
              <option value="Cheque">Cheque / Demand Draft</option>
              <option value="Finance / Loan">Bank Finance / Loan Disbursal</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Transaction / UTR / Cheque Ref No.
            </label>
            <input
              type="text"
              placeholder="e.g., UPI/829102849102"
              value={data.pricing.transactionRef || ''}
              onChange={(e) => handlePricingChange('transactionRef', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Balance Due Date (for Reminder)
            </label>
            <input
              type="date"
              value={data.pricing.balanceDueDate}
              onChange={(e) => handlePricingChange('balanceDueDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-slate-600 font-medium mb-1">
              Deal Remarks / Freebies Handed Over
            </label>
            <input
              type="text"
              placeholder="e.g., Includes 1 ISI Helmet, Teflon Coating, 5 Free Services coupon booklet, and Home Charger kit."
              value={data.pricing.notes || ''}
              onChange={(e) => handlePricingChange('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {focusTab === 'pricing' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocusTab('finance')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              &larr; Back: Financing
            </button>
            <button
              type="button"
              onClick={() => setFocusTab('all')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Review All Sections</span>
              <span>&check;</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Bill Save & Print Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Bill Finalization &amp; Printing</span>
          </span>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Invoice Saved!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Save & Print Primary Button */}
          <button
            type="button"
            onClick={onSaveAndPrint}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px]"
            title="Save bill into Khata and open print dialog"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Save &amp; Print Bill</span>
          </button>

          {/* 2. Save Only Button */}
          <button
            type="button"
            onClick={onSave}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[46px]"
            title="Save bill into Khata ledger"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved to Khata!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Bill to Khata</span>
              </>
            )}
          </button>

          {/* 3. Direct Print & Preview Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation min-h-[46px]"
              title="Print bill directly"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onPreview}
              className="flex-1 py-3 px-3 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 font-bold rounded-xl text-xs sm:text-sm border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation min-h-[46px]"
              title="View Live Invoice Preview"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
