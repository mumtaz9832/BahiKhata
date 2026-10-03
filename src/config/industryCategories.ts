/**
 * Multi-Industry & Business Model Configuration for BahiKhata
 * Complete catalog of 26 industries, dynamic subcategories,
 * 18 business models, recommended features, and measurement units.
 */

export interface IndustryCategoryConfig {
  id: string;
  name: string;
  iconName: string;
  description: string;
  subcategories: string[];
  recommendedModels: string[];
  defaultUnits: string[];
  specializedDashboard: 'scrap' | 'construction' | 'manufacturing' | 'wholesale' | 'retail' | 'automobile' | 'service' | 'general';
}

export const INDUSTRY_CATEGORIES: IndustryCategoryConfig[] = [
  {
    id: 'scrap_recycling',
    name: 'Scrap & Recycling',
    iconName: 'Recycle',
    description: 'Ferrous, non-ferrous, e-waste, plastic & industrial scrap recycling',
    subcategories: [
      'Iron Scrap',
      'Steel Scrap',
      'Aluminium Scrap',
      'Copper Scrap',
      'Brass Scrap',
      'Battery Scrap',
      'E-Waste',
      'Plastic Scrap',
      'Paper Scrap',
      'Vehicle Scrap',
      'Scrap Recycling & Processing',
    ],
    recommendedModels: ['Wholesale', 'Recycler', 'Trader', 'Manufacturer'],
    defaultUnits: ['Kilograms', 'Tons', 'Grams', 'Pieces'],
    specializedDashboard: 'scrap',
  },
  {
    id: 'construction_building',
    name: 'Construction & Building',
    iconName: 'Building',
    description: 'Civil construction, contractors, infrastructure & site management',
    subcategories: [
      'Civil Construction',
      'Building Contractor',
      'Road Construction',
      'Infrastructure',
      'Interior Construction',
      'Real Estate Development',
      'Construction Material Supply',
      'Building Maintenance',
      'Demolition',
    ],
    recommendedModels: ['Contractor', 'Service Provider', 'Trader'],
    defaultUnits: ['Square Feet', 'Cubic Feet', 'Metres', 'Pieces', 'Days'],
    specializedDashboard: 'construction',
  },
  {
    id: 'building_materials',
    name: 'Building Materials',
    iconName: 'Layers',
    description: 'Cement, steel, TMT, bricks, sanitaryware, paints & hardware',
    subcategories: [
      'Cement',
      'TMT Bars & Steel',
      'Bricks & Blocks',
      'Sand & Aggregates',
      'Stone & Marble',
      'Tiles & Sanitaryware',
      'Paints',
      'Glass & Aluminium',
      'Plywood & Timber',
      'Roofing Materials',
    ],
    recommendedModels: ['Wholesale', 'Retail', 'Distributor', 'Dealer'],
    defaultUnits: ['Bags', 'Tons', 'Pieces', 'Square Feet', 'Boxes'],
    specializedDashboard: 'construction',
  },
  {
    id: 'fmcg_consumer_goods',
    name: 'FMCG & Consumer Goods',
    iconName: 'ShoppingBag',
    description: 'Fast moving packaged foods, personal care, beverages & household',
    subcategories: [
      'Food & Beverages',
      'Personal Care',
      'Home Care',
      'Packaged Goods',
      'Cosmetics',
      'Household Products',
    ],
    recommendedModels: ['Distributor', 'Wholesale', 'Super Stockist', 'Retail'],
    defaultUnits: ['Boxes', 'Pieces', 'Dozens', 'Kilograms', 'Litres'],
    specializedDashboard: 'wholesale',
  },
  {
    id: 'industrial_manufacturing',
    name: 'Industrial & Manufacturing',
    iconName: 'Factory',
    description: 'Metal fabrication, machinery, chemicals, production & plant operations',
    subcategories: [
      'Metal Fabrication',
      'Machinery',
      'Plastic Manufacturing',
      'Chemical Manufacturing',
      'Packaging',
      'Textile Manufacturing',
      'Furniture Manufacturing',
      'Battery Manufacturing',
      'Food Processing',
    ],
    recommendedModels: ['Manufacturer', 'Wholesale', 'Exporter'],
    defaultUnits: ['Pieces', 'Kilograms', 'Tons', 'Boxes', 'Metres'],
    specializedDashboard: 'manufacturing',
  },
  {
    id: 'agriculture_farming',
    name: 'Agriculture & Farming',
    iconName: 'Sprout',
    description: 'Seeds, fertilizers, farm produce, pesticides, dairy & poultry',
    subcategories: [
      'Fertilizers',
      'Seeds',
      'Pesticides',
      'Agricultural Equipment',
      'Farm Produce',
      'Dairy & Poultry',
      'Agricultural Trading',
    ],
    recommendedModels: ['Dealer', 'Distributor', 'Trader', 'Retail'],
    defaultUnits: ['Bags', 'Kilograms', 'Litres', 'Tons', 'Pieces'],
    specializedDashboard: 'wholesale',
  },
  {
    id: 'automobile_transport',
    name: 'Automobile & Transport',
    iconName: 'Car',
    description: 'Vehicle sales, spare parts, commercial vehicles & transport services',
    subcategories: [
      'Two-Wheeler',
      'Four-Wheeler',
      'Commercial Vehicles',
      'Electric Vehicles',
      'Spare Parts',
      'Vehicle Accessories',
      'Transport Services',
      'Vehicle Trading',
    ],
    recommendedModels: ['Dealer', 'Distributor', 'Service Provider', 'Retail'],
    defaultUnits: ['Pieces', 'Sets', 'Boxes', 'Hours'],
    specializedDashboard: 'automobile',
  },
  {
    id: 'electrical_electronics',
    name: 'Electrical & Electronics',
    iconName: 'Zap',
    description: 'Wires, switches, LED lighting, appliances & electrical wholesale',
    subcategories: [
      'Electrical Wires',
      'Switches & Sockets',
      'Lighting & LED',
      'Electronics',
      'Home Appliances',
      'Electrical Components',
      'Electrical Wholesale',
    ],
    recommendedModels: ['Wholesale', 'Retail', 'Distributor', 'Contractor'],
    defaultUnits: ['Pieces', 'Boxes', 'Metres', 'Sets'],
    specializedDashboard: 'wholesale',
  },
  {
    id: 'renewable_energy_solar',
    name: 'Renewable Energy & Solar',
    iconName: 'Sun',
    description: 'Solar panels, inverters, solar batteries & turnkey EPC installations',
    subcategories: [
      'Solar Panels',
      'Solar Inverters',
      'Solar Batteries',
      'Solar Installation',
      'Solar Maintenance',
      'Energy Storage Systems',
    ],
    recommendedModels: ['Contractor', 'Distributor', 'Service Provider', 'Dealer'],
    defaultUnits: ['Pieces', 'Sets', 'Kilowatt', 'Hours'],
    specializedDashboard: 'service',
  },
  {
    id: 'textile_garments',
    name: 'Textile & Garments',
    iconName: 'Scissors',
    description: 'Fabrics, ready-made garments, apparel manufacturing & wholesale',
    subcategories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Kids\' Clothing',
      'Fabric Wholesale',
      'Textile Manufacturing',
      'Garment Manufacturing',
      'Fashion Accessories',
    ],
    recommendedModels: ['Manufacturer', 'Wholesale', 'Retail', 'Exporter'],
    defaultUnits: ['Pieces', 'Metres', 'Boxes', 'Dozens'],
    specializedDashboard: 'retail',
  },
  {
    id: 'it_digital_services',
    name: 'IT & Digital Services',
    iconName: 'Laptop',
    description: 'Software, mobile apps, web, digital marketing & automation',
    subcategories: [
      'Website Development',
      'Android App Development',
      'Software Development',
      'Graphic Design',
      'Video Editing',
      'Digital Marketing',
      'SEO Services',
      'AI Automation',
      'Data Entry',
    ],
    recommendedModels: ['Service Provider', 'Contractor', 'Franchise'],
    defaultUnits: ['Hours', 'Days', 'Projects', 'Pieces'],
    specializedDashboard: 'service',
  },
  {
    id: 'grocery_general_store',
    name: 'Grocery & General Store',
    iconName: 'Store',
    description: 'Kirana, staples, grains, spices, packaged foods & daily essentials',
    subcategories: [
      'Rice, Dal & Atta',
      'Oil & Spices',
      'Beverages',
      'Snacks & Packaged Food',
      'Household Items',
      'Personal Care',
      'Dairy Products',
      'Fresh Vegetables',
    ],
    recommendedModels: ['Retail', 'Wholesale', 'Super Stockist'],
    defaultUnits: ['Kilograms', 'Grams', 'Litres', 'Packets', 'Pieces'],
    specializedDashboard: 'retail',
  },
  {
    id: 'electronics_home_appliances',
    name: 'Electronics & Home Appliances',
    iconName: 'Tv',
    description: 'Smartphones, computers, TVs, refrigerators & cooling appliances',
    subcategories: [
      'Mobile Phones',
      'Laptops & Computers',
      'Television',
      'Refrigerator',
      'Washing Machine',
      'AC & Cooler',
      'Small Appliances',
      'Electronic Accessories',
    ],
    recommendedModels: ['Retail', 'Dealer', 'Distributor', 'Wholesale'],
    defaultUnits: ['Pieces', 'Sets', 'Boxes'],
    specializedDashboard: 'retail',
  },
  {
    id: 'automobile_ev',
    name: 'Automobile & EV',
    iconName: 'Bike',
    description: 'Electric 2W/3W/rickshaws, petrol vehicles, batteries & chargers',
    subcategories: [
      'Electric Scooter',
      'Electric Rickshaw',
      'Electric Bicycle',
      'Petrol Two-Wheeler',
      'Used Vehicles',
      'EV Spare Parts',
      'Vehicle Accessories',
      'Batteries & Chargers',
    ],
    recommendedModels: ['Dealer', 'Distributor', 'Service Provider', 'Retail'],
    defaultUnits: ['Pieces', 'Sets', 'Boxes'],
    specializedDashboard: 'automobile',
  },
  {
    id: 'battery_solar_products',
    name: 'Battery & Solar Products',
    iconName: 'BatteryCharging',
    description: 'Lithium, lead-acid, tubular inverter batteries & solar power kits',
    subcategories: [
      'Lithium-Ion Battery',
      'Lead-Acid Battery',
      'Inverter Battery',
      'Solar Panel',
      'Solar Inverter',
      'Battery Charger',
      'Solar Accessories',
    ],
    recommendedModels: ['Dealer', 'Distributor', 'Wholesale', 'Service Provider'],
    defaultUnits: ['Pieces', 'Sets', 'Boxes'],
    specializedDashboard: 'automobile',
  },
  {
    id: 'hardware_electrical',
    name: 'Hardware & Electrical',
    iconName: 'Wrench',
    description: 'Pipes, fittings, plumbing, tools, wires, switches & paint accessories',
    subcategories: [
      'Electrical Wires',
      'Switches & Sockets',
      'Lighting & LED',
      'Plumbing Materials',
      'Hardware Tools',
      'Paints & Accessories',
      'Construction Materials',
    ],
    recommendedModels: ['Retail', 'Wholesale', 'Dealer'],
    defaultUnits: ['Pieces', 'Boxes', 'Metres', 'Kilograms', 'Bags'],
    specializedDashboard: 'retail',
  },
  {
    id: 'fashion_lifestyle',
    name: 'Fashion & Lifestyle',
    iconName: 'Shirt',
    description: 'Apparel, footwear, cosmetics, bags, eyewear & fashion jewellery',
    subcategories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Kids\' Clothing',
      'Footwear',
      'Bags & Accessories',
      'Cosmetics',
      'Jewellery',
    ],
    recommendedModels: ['Retail', 'Wholesale', 'E-commerce Seller'],
    defaultUnits: ['Pieces', 'Pairs', 'Boxes', 'Dozens'],
    specializedDashboard: 'retail',
  },
  {
    id: 'mobile_computer_accessories',
    name: 'Mobile & Computer Accessories',
    iconName: 'Smartphone',
    description: 'Cases, tempered glass, cables, audio, peripherals & flash storage',
    subcategories: [
      'Mobile Covers',
      'Tempered Glass',
      'Chargers & Cables',
      'Earphones & Headphones',
      'Keyboards & Mouse',
      'Storage Devices',
      'Printers & Accessories',
    ],
    recommendedModels: ['Wholesale', 'Retail', 'Distributor'],
    defaultUnits: ['Pieces', 'Boxes', 'Sets'],
    specializedDashboard: 'retail',
  },
  {
    id: 'furniture_home_decor',
    name: 'Furniture & Home Decor',
    iconName: 'Armchair',
    description: 'Wooden, modular furniture, mattresses, curtains & home aesthetics',
    subcategories: [
      'Home Furniture',
      'Office Furniture',
      'Modular Furniture',
      'Home Decor',
      'Mattresses',
      'Furnishing',
    ],
    recommendedModels: ['Manufacturer', 'Retail', 'Wholesale'],
    defaultUnits: ['Pieces', 'Sets', 'Square Feet'],
    specializedDashboard: 'retail',
  },
  {
    id: 'medical_pharmacy',
    name: 'Medical & Pharmacy',
    iconName: 'Pill',
    description: 'Pharmaceuticals, surgical goods, diagnostics & healthcare retail',
    subcategories: [
      'Medicines',
      'Medical Equipment',
      'Surgical Supplies',
      'Healthcare Products',
      'Pharmacy Wholesale',
    ],
    recommendedModels: ['Retail', 'Distributor', 'Wholesale'],
    defaultUnits: ['Strips', 'Boxes', 'Bottles', 'Pieces'],
    specializedDashboard: 'retail',
  },
  {
    id: 'books_stationery',
    name: 'Books & Stationery',
    iconName: 'Book',
    description: 'Educational books, office stationery, paper products & craft supplies',
    subcategories: [
      'Books',
      'School Stationery',
      'Office Stationery',
      'Printing Supplies',
      'Educational Materials',
    ],
    recommendedModels: ['Retail', 'Wholesale', 'Distributor'],
    defaultUnits: ['Pieces', 'Packets', 'Dozens', 'Boxes'],
    specializedDashboard: 'retail',
  },
  {
    id: 'hospitality_restaurants',
    name: 'Hospitality & Restaurants',
    iconName: 'Utensils',
    description: 'Dine-in, quick service, cafes, bakeries, cloud kitchens & catering',
    subcategories: [
      'Restaurant',
      'Cafe',
      'Hotel',
      'Catering',
      'Bakery',
      'Food Delivery',
    ],
    recommendedModels: ['Retail', 'Service Provider', 'Franchise'],
    defaultUnits: ['Plates', 'Pieces', 'Kilograms', 'Orders'],
    specializedDashboard: 'retail',
  },
  {
    id: 'logistics_transport',
    name: 'Logistics & Transport',
    iconName: 'Truck',
    description: 'Freight, parcel delivery, courier, warehousing & fleet booking',
    subcategories: [
      'Goods Transport',
      'Courier',
      'Delivery Services',
      'Fleet Management',
      'Warehousing',
      'Logistics Consultancy',
    ],
    recommendedModels: ['Service Provider', 'Contractor', 'C&F Agent'],
    defaultUnits: ['Kilograms', 'Tons', 'Trips', 'Kilometres'],
    specializedDashboard: 'service',
  },
  {
    id: 'education_training',
    name: 'Education & Training',
    iconName: 'GraduationCap',
    description: 'Coaching centers, institutes, skills training & online academies',
    subcategories: [
      'Coaching Centre',
      'Training Institute',
      'Online Education',
      'Skill Development',
      'Computer Training',
    ],
    recommendedModels: ['Service Provider', 'Franchise'],
    defaultUnits: ['Students', 'Courses', 'Months', 'Hours'],
    specializedDashboard: 'service',
  },
  {
    id: 'financial_professional_services',
    name: 'Financial & Professional Services',
    iconName: 'Briefcase',
    description: 'CA, tax, legal, consulting, insurance & corporate services',
    subcategories: [
      'Insurance Services',
      'Financial Consultancy',
      'Accounting',
      'Tax Consultancy',
      'Business Consultancy',
      'Other Professional Services',
    ],
    recommendedModels: ['Service Provider', 'Commission Agent'],
    defaultUnits: ['Services', 'Hours', 'Consultations', 'Clients'],
    specializedDashboard: 'service',
  },
  {
    id: 'other_industries',
    name: 'Other Industries',
    iconName: 'Boxes',
    description: 'General merchant, mixed trading, custom business & unlisted goods',
    subcategories: [
      'General Trading',
      'Mixed Business',
      'Custom Industry',
    ],
    recommendedModels: ['Trader', 'Retail', 'Wholesale', 'Mixed Business', 'Other'],
    defaultUnits: ['Pieces', 'Kilograms', 'Boxes', 'Sets'],
    specializedDashboard: 'general',
  },
];

export const BUSINESS_MODELS = [
  'Retail',
  'Wholesale',
  'Manufacturer',
  'Distributor',
  'Dealer',
  'Trader',
  'Service Provider',
  'Contractor',
  'Importer',
  'Exporter',
  'Recycler',
  'Super Stockist',
  'C&F Agent',
  'Commission Agent',
  'Franchise',
  'E-commerce Seller',
  'Mixed Business',
  'Other',
] as const;

export type BusinessModelType = typeof BUSINESS_MODELS[number];

export const STANDARD_UNITS = [
  'Pieces',
  'Kilograms',
  'Grams',
  'Tons',
  'Litres',
  'Millilitres',
  'Metres',
  'Square Feet',
  'Cubic Feet',
  'Bags',
  'Boxes',
  'Dozens',
  'Hours',
  'Days',
  'Custom Units',
];

export interface FeatureConfigItem {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultEnabled: boolean;
}

/**
 * Recommends feature set dynamically based on selected industry and business models.
 */
export function getRecommendedFeatures(industryName: string, selectedModels: string[]): FeatureConfigItem[] {
  const features: FeatureConfigItem[] = [
    {
      id: 'smart_billing',
      name: 'Smart Invoice & GST Billing',
      description: 'Generate GST-compliant tax invoices, cash memos and delivery challans',
      category: 'Core',
      defaultEnabled: true,
    },
    {
      id: 'digital_khata',
      name: 'Digital Khata & Ledger',
      description: 'Track customer balances, send WhatsApp payment reminders and record payments',
      category: 'Core',
      defaultEnabled: true,
    },
    {
      id: 'inventory_stock',
      name: 'Live Stock & Inventory',
      description: 'Manage quantities, low stock alerts, HSN codes and purchase valuations',
      category: 'Core',
      defaultEnabled: true,
    },
  ];

  const ind = industryName.toLowerCase();
  const models = selectedModels.map((m) => m.toLowerCase());

  // Scrap & Recycling
  if (ind.includes('scrap') || ind.includes('recycl')) {
    features.push(
      {
        id: 'scrap_weight_billing',
        name: 'Weight-Based Billing (Gross/Tare/Net)',
        description: 'Record vehicle weighbridge gross weight, tare weight and net scrap weight',
        category: 'Scrap & Weighbridge',
        defaultEnabled: true,
      },
      {
        id: 'scrap_grading',
        name: 'Material Grading & Sorting',
        description: 'Categorize scrap into iron, copper, brass, aluminium with scrap grade pricing',
        category: 'Scrap & Weighbridge',
        defaultEnabled: true,
      },
      {
        id: 'scrap_supplier_mgmt',
        name: 'Scrap Supplier & Vendor Management',
        description: 'Maintain scrap purchase records, supplier advance and payables',
        category: 'Scrap & Weighbridge',
        defaultEnabled: true,
      },
      {
        id: 'recycling_processing',
        name: 'Recycling & Processing Summary',
        description: 'Track raw scrap input, processing recovery rate and processed output batch',
        category: 'Scrap & Weighbridge',
        defaultEnabled: true,
      }
    );
  }

  // Construction & Building Materials
  if (ind.includes('construct') || ind.includes('building') || models.includes('contractor')) {
    features.push(
      {
        id: 'project_management',
        name: 'Project & Site Management',
        description: 'Track site-wise expenses, running work orders and project receivables',
        category: 'Construction & Projects',
        defaultEnabled: true,
      },
      {
        id: 'contractor_labour',
        name: 'Contractor & Labour Payments',
        description: 'Log daily labour wages, subcontractor bills and material consumption',
        category: 'Construction & Projects',
        defaultEnabled: true,
      },
      {
        id: 'measurement_billing',
        name: 'Measurement-Based Billing (Sq.Ft / Cu.Ft / Brass)',
        description: 'Bill materials and services based on dimensions, area, volume or weight',
        category: 'Construction & Projects',
        defaultEnabled: true,
      },
      {
        id: 'project_profitability',
        name: 'Project Profitability Tracking',
        description: 'Compare estimated material + labour cost vs actual billing realization',
        category: 'Construction & Projects',
        defaultEnabled: true,
      }
    );
  }

  // Wholesale, Distributor, Trader
  if (
    models.includes('wholesale') ||
    models.includes('distributor') ||
    models.includes('super stockist') ||
    models.includes('trader')
  ) {
    features.push(
      {
        id: 'bulk_pricing_discounts',
        name: 'Bulk Pricing & Quantity Discounts',
        description: 'Set tier pricing based on order volume and minimum order quantities (MOQ)',
        category: 'Wholesale & Distribution',
        defaultEnabled: true,
      },
      {
        id: 'dealer_management',
        name: 'Dealer & Distributor Management',
        description: 'Manage network of dealers, credit limits, overdue grace periods and commissions',
        category: 'Wholesale & Distribution',
        defaultEnabled: true,
      },
      {
        id: 'credit_limit_alerts',
        name: 'Credit Limit & Outstandings Alert',
        description: 'Prevent dispatch if customer balance exceeds approved credit ceiling',
        category: 'Wholesale & Distribution',
        defaultEnabled: true,
      }
    );
  }

  // Manufacturing & Industrial
  if (ind.includes('manufactur') || ind.includes('industrial') || models.includes('manufacturer')) {
    features.push(
      {
        id: 'bill_of_materials',
        name: 'Bill of Materials (BOM)',
        description: 'Define raw material recipes and parts needed per unit of finished product',
        category: 'Manufacturing',
        defaultEnabled: true,
      },
      {
        id: 'production_batches',
        name: 'Production Orders & Batch Tracking',
        description: 'Manage production runs, batch numbers, wastage tracking and manufacturing cost',
        category: 'Manufacturing',
        defaultEnabled: true,
      },
      {
        id: 'raw_vs_finished',
        name: 'Raw Material vs Finished Goods Stock',
        description: 'Separate stock valuation for raw inputs and ready-to-sell inventory',
        category: 'Manufacturing',
        defaultEnabled: true,
      }
    );
  }

  // Retail & POS
  if (models.includes('retail') || ind.includes('grocery') || ind.includes('fashion')) {
    features.push(
      {
        id: 'pos_barcode_billing',
        name: 'Quick POS & Barcode Scanning',
        description: 'High-speed retail checkout with USB / camera barcode scanning support',
        category: 'Retail & POS',
        defaultEnabled: true,
      },
      {
        id: 'daily_cash_register',
        name: 'Daily Cash in Hand & Till Reconciliation',
        description: 'Track cash drawer opening, cash sales, expenses and closing tally',
        category: 'Retail & POS',
        defaultEnabled: true,
      }
    );
  }

  // Automobile & EV
  if (ind.includes('automobile') || ind.includes('vehicle') || ind.includes('ev') || ind.includes('battery')) {
    features.push(
      {
        id: 'vehicle_tracking_vin',
        name: 'Chassis / Motor / VIN Tracking',
        description: 'Capture 17-digit VIN, motor serial, controller number and battery barcodes',
        category: 'Automobile & EV',
        defaultEnabled: true,
      },
      {
        id: 'vehicle_delivery_challan',
        name: 'Vehicle Delivery Challan & RTO Gate Pass',
        description: 'Generate gate passes with battery warranty certificates and hypothecation details',
        category: 'Automobile & EV',
        defaultEnabled: true,
      },
      {
        id: 'battery_warranty_tracking',
        name: 'Battery Warranty & Replacement Log',
        description: 'Track serial numbers and manufacturer warranty expiry dates',
        category: 'Automobile & EV',
        defaultEnabled: true,
      }
    );
  }

  // Service Businesses
  if (models.includes('service provider') || ind.includes('services') || ind.includes('repair')) {
    features.push(
      {
        id: 'service_job_cards',
        name: 'Service Job Cards & Work Orders',
        description: 'Record customer complaints, diagnosis, parts required and job progress',
        category: 'Services',
        defaultEnabled: true,
      },
      {
        id: 'technician_assignment',
        name: 'Technician & Labour Assignment',
        description: 'Assign jobs to mechanics/technicians and record individual labour charges',
        category: 'Services',
        defaultEnabled: true,
      },
      {
        id: 'service_warranty',
        name: 'Service Guarantee & Warranty Claims',
        description: 'Issue post-service guarantee certificates with claim status',
        category: 'Services',
        defaultEnabled: true,
      }
    );
  }

  return features;
}

/**
 * Returns the industry config object by industry name or id.
 */
export function getIndustryConfig(industryNameOrId?: string): IndustryCategoryConfig {
  if (!industryNameOrId) return INDUSTRY_CATEGORIES[0];
  const found = INDUSTRY_CATEGORIES.find(
    (c) => c.name.toLowerCase() === industryNameOrId.toLowerCase() || c.id === industryNameOrId
  );
  return found || INDUSTRY_CATEGORIES[0];
}
