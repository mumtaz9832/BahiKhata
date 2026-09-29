import React from 'react';
import { AutoDealerData, VehicleType, PaymentMode } from '../types';
import {
  User,
  Phone,
  FileBadge,
  MapPin,
  Car,
  Bike,
  Zap,
  Truck,
  IndianRupee,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

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
}) => {
  // Update Buyer
  const handleBuyerChange = (field: keyof typeof data.buyer, value: string) => {
    onChange({
      ...data,
      buyer: {
        ...data.buyer,
        [field]: value,
      },
    });
  };

  // Update Vehicle
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

  // Update Pricing
  const handlePricingChange = (field: keyof typeof data.pricing, value: any) => {
    const updatedPricing = {
      ...data.pricing,
      [field]: value,
    };

    // Auto-calculate Total Sale Value: base + rto + insurance + accessories - discount
    const base = Number(updatedPricing.basePrice) || 0;
    const rto = Number(updatedPricing.rtoCharges) || 0;
    const ins = Number(updatedPricing.insuranceCharges) || 0;
    const acc = Number(updatedPricing.accessoriesCharges) || 0;
    const disc = Number(updatedPricing.discount) || 0;

    const totalSale = Math.max(0, base + rto + ins + acc - disc);
    updatedPricing.totalSaleValue = totalSale;

    const advance = Number(updatedPricing.advanceReceived) || 0;
    updatedPricing.balanceAmount = Math.max(0, totalSale - advance);

    onChange({
      ...data,
      pricing: updatedPricing,
    });
  };

  // Quick Preset Loader
  const applyPreset = (preset: (typeof VEHICLE_PRESETS)[0]) => {
    const base = preset.basePrice;
    const rto = preset.rto;
    const ins = preset.insurance;
    const acc = 1500;
    const disc = 1000;
    const total = base + rto + ins + acc - disc;
    const adv = Math.round(total * 0.4); // 40% advance token
    const bal = total - adv;

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
        totalSaleValue: total,
        advanceReceived: adv,
        balanceAmount: bal,
      },
    });
  };

  const isEV = data.vehicle.vehicleType === 'electric_vehicle';

  return (
    <div className="space-y-6">
      {/* Invoice Meta Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Document Identity &amp; Handover Time
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
            <label className="block text-slate-600 font-medium mb-1">Delivery Date</label>
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
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Autofill Presets */}
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

      {/* 1. Buyer Details */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            1. Buyer / Purchaser Information
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
            <div className="relative">
              <input
                type="tel"
                placeholder="e.g., +91 98765 43210"
                value={data.buyer.phone}
                onChange={(e) => handleBuyerChange('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
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
      </div>

      {/* 2. Vehicle Details */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              2. Vehicle Specifications
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
              Variant / Trim
            </label>
            <input
              type="text"
              placeholder="e.g., Empowered Plus / Drum Cast"
              value={data.vehicle.variant || ''}
              onChange={(e) => handleVehicleChange('variant', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
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

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Chassis No. (VIN 17-digit) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., MD9XX4KWH26B88192"
              value={data.vehicle.chassisNo}
              onChange={(e) => handleVehicleChange('chassisNo', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono font-semibold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
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

          <div className="sm:col-span-2">
            <label className="block text-slate-600 font-medium mb-1">
              Hypothecated To / Financed Bank (HPA)
            </label>
            <input
              type="text"
              placeholder="e.g., IDFC First Bank / HDFC Bank (or leave empty if Full Cash)"
              value={data.vehicle.hypothecationBank || ''}
              onChange={(e) => handleVehicleChange('hypothecationBank', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* CONDITIONAL EV SPECIFIC FIELDS */}
        {isEV && (
          <div className="mt-4 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>EV Battery &amp; Charging Hardware Specifications (Mandatory for EV Delivery)</span>
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
      </div>

      {/* 3. Pricing, Token & Balance Details */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <IndianRupee className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            3. Pricing Breakdown &amp; Payment Settlement
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
              Dealer Discount / Subsidy (₹)
            </label>
            <input
              type="number"
              value={data.pricing.discount}
              onChange={(e) => handlePricingChange('discount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-red-600 font-mono font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Total & Balance Highlights */}
        <div className="bg-slate-900 text-white p-4 rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Total Deal / On-Road Value
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              ₹{data.pricing.totalSaleValue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-4">
            <label className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
              Token / Advance Received (₹) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={data.pricing.advanceReceived}
              onChange={(e) => handlePricingChange('advanceReceived', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Remaining Khata Balance Due
            </span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${data.pricing.balanceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{data.pricing.balanceAmount.toLocaleString('en-IN')}
            </span>
            {data.pricing.balanceAmount === 0 && (
              <span className="text-[10px] text-emerald-400 font-medium block">
                ✓ 100% Fully Settled
              </span>
            )}
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
      </div>
    </div>
  );
};
