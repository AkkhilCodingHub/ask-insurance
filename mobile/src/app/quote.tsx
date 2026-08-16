import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { quotesApi, vehiclesApi, policiesApi, VehicleData, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';
import { ReportModal, ReportData } from '@/components/ReportModal';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';

const { width: W } = Dimensions.get('window');

// Steps when type known:  0=personal, 1=coverage, 2=documents, 3=review
// Steps when type unknown: 0=type, 1=personal, 2=coverage, 3=documents, 4=review
const TOTAL_STEPS_WITH_TYPE    = 4;
const TOTAL_STEPS_WITHOUT_TYPE = 5;

const INSURANCE_TYPES = [
  // General Insurance Offerings
  { id: 'motor', label: 'Car Insurance', icon: '🚗', desc: 'Reg lookup, NCB warning & Addon filters', category: 'General' },
  { id: 'two_wheeler', label: 'Two Wheeler Insurance', icon: '🛵', desc: 'Quick quote & renewal', category: 'General' },
  { id: 'commercial', label: 'Commercial Vehicle', icon: '🚛', desc: 'Heavy & light commercial vehicles', category: 'General' },
  { id: 'health', label: 'Health Insurance', icon: '🏥', desc: 'Individual, family floater, critical illness', category: 'General' },
  { id: 'home', label: 'Home Insurance', icon: '🏠', desc: 'Structure & content coverage', category: 'General' },
  { id: 'travel', label: 'Travel Insurance', icon: '✈️', desc: 'Domestic & international travel', category: 'General' },

  // Life Insurance Offerings
  { id: 'investment_20', label: 'Investment 2.0', icon: '📈', desc: 'NEW modern ULIP & savings plans', category: 'Life' },
  { id: 'nivesh_mitra', label: 'PBP Nivesh Mitra', icon: '🤖', desc: 'AI-guided investment & retirement advisor', category: 'Life' },
  { id: 'life', label: 'Term Online', icon: '🛡️', desc: 'Pure protection term plans', category: 'Life' },
  { id: 'dollar_invest', label: 'Dollar Based Investment', icon: '💵', desc: 'Offshore & USD investment options', category: 'Life' },
  { id: 'term_offline', label: 'Term Offline', icon: '📄', desc: 'Custom term quotes requiring underwriting', category: 'Life' },
];

const GENDERS = ['Male', 'Female', 'Other'];

// Fallback presets when no plan min/max is available
const DEFAULT_COVER_OPTIONS = [
  { label: '₹25 Lakh', value: 2500000 },
  { label: '₹50 Lakh', value: 5000000 },
  { label: '₹1 Crore', value: 10000000 },
  { label: '₹2 Crore', value: 20000000 },
  { label: '₹5 Crore', value: 50000000 },
];

function roundToNice(val: number): number {
  if (val >= 1e8)  return Math.round(val / 1e7)  * 1e7;   // nearest 1 Cr
  if (val >= 1e7)  return Math.round(val / 5e6)  * 5e6;   // nearest 50 L
  if (val >= 5e6)  return Math.round(val / 1e6)  * 1e6;   // nearest 10 L
  if (val >= 1e6)  return Math.round(val / 5e5)  * 5e5;   // nearest 5 L
  if (val >= 1e5)  return Math.round(val / 1e5)  * 1e5;   // nearest 1 L
  return           Math.round(val / 1e4)  * 1e4;           // nearest 10 K
}

function fmtCover(val: number): string {
  if (val >= 1e7)  return `₹${+(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5)  return `₹${+(val / 1e5).toFixed(1)} L`;
  if (val >= 1000) return `₹${+(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function buildPresets(min: number, max: number): Array<{ label: string; value: number }> {
  if (!min || !max || min >= max) return DEFAULT_COVER_OPTIONS;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const COUNT  = 4;
  const seen   = new Set<number>();
  const result: Array<{ label: string; value: number }> = [];
  for (let i = 0; i < COUNT; i++) {
    const logVal = logMin + (logMax - logMin) * (i / (COUNT - 1));
    const nice   = roundToNice(Math.pow(10, logVal));
    if (!seen.has(nice)) { seen.add(nice); result.push({ label: fmtCover(nice), value: nice }); }
  }
  return result;
}

function coverStepTitle(type: string): string {
  if (type === 'motor') return 'What is your vehicle\'s\nInsured Declared Value (IDV)?';
  if (['fire', 'marine', 'engineering'].includes(type)) return 'What is the asset /\nproperty value?';
  if (type === 'liability') return 'What liability limit\ndo you need?';
  return 'How much cover\ndo you need?';
}

function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <View style={p.wrap}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <View style={[p.dot, step > i && p.dotDone, step === i && p.dotActive]}>
            {step > i && <Text style={p.dotCheck}>✓</Text>}
            {step <= i && <Text style={[p.dotNum, step === i && { color: Colors.primary }]}>{i + 1}</Text>}
          </View>
          {i < totalSteps - 1 && <View style={[p.line, step > i && p.lineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// Quote results card

const CAR_CATALOG = [
  { make: 'Maruti Suzuki', model: 'Swift', variant: 'ZXi (Petrol)', fuel: 'petrol', cc: '1197 CC', seats: '5 Seats', class: 'Motor Car (LMV)', engPrefix: 'K12M', chsPrefix: 'MA3F' },
  { make: 'Hyundai', model: 'Creta', variant: 'SX (O) (Diesel)', fuel: 'diesel', cc: '1493 CC', seats: '5 Seats', class: 'Motor Car (LMV)', engPrefix: 'D4FA', chsPrefix: 'MALC' },
  { make: 'Tata', model: 'Nexon', variant: 'XZ Plus (Petrol)', fuel: 'petrol', cc: '1199 CC', seats: '5 Seats', class: 'Motor Car (LMV)', engPrefix: 'REV12', chsPrefix: 'MAT6' },
  { make: 'Mahindra', model: 'XUV700', variant: 'AX7 (Diesel)', fuel: 'diesel', cc: '2198 CC', seats: '7 Seats', class: 'Motor Car (LMV)', engPrefix: 'MHAW', chsPrefix: 'MA1N' },
  { make: 'Kia', model: 'Seltos', variant: 'HTX (Petrol)', fuel: 'petrol', cc: '1497 CC', seats: '5 Seats', class: 'Motor Car (LMV)', engPrefix: 'G4FL', chsPrefix: 'MZBG' },
];

const BIKE_CATALOG = [
  { make: 'Honda', model: 'Activa 6G', variant: 'DLX', fuel: 'petrol', cc: '109 CC', seats: '2 Seats', class: 'Two Wheeler (MCWG)', engPrefix: 'JF50E', chsPrefix: 'ME4J' },
  { make: 'Royal Enfield', model: 'Classic 350', variant: 'Halcyon', fuel: 'petrol', cc: '349 CC', seats: '2 Seats', class: 'Two Wheeler (MCWG)', engPrefix: 'J350E', chsPrefix: 'ME3J' },
  { make: 'TVS', model: 'Jupiter 125', variant: 'Disc', fuel: 'petrol', cc: '124 CC', seats: '2 Seats', class: 'Two Wheeler (MCWG)', engPrefix: 'TVS12', chsPrefix: 'MD62' },
  { make: 'Bajaj', model: 'Pulsar 150', variant: 'Single Disc', fuel: 'petrol', cc: '149 CC', seats: '2 Seats', class: 'Two Wheeler (MCWG)', engPrefix: 'DH15', chsPrefix: 'MD2A' },
];

const COMMERICAL_CATALOG = [
  { make: 'Tata', model: 'Ace Gold', variant: 'Diesel BS6', fuel: 'diesel', cc: '700 CC', seats: '2 Seats', class: 'Goods Carrier (LGV)', engPrefix: '275ID', chsPrefix: 'MAT3' },
  { make: 'Mahindra', model: 'Bolero Maxi Truck', variant: 'CNG', fuel: 'cng', cc: '2523 CC', seats: '2 Seats', class: 'Goods Carrier (LGV)', engPrefix: 'MDI3', chsPrefix: 'MA1T' },
  { make: 'Ashok Leyland', model: 'Bada Dost', variant: 'i4', fuel: 'diesel', cc: '1478 CC', seats: '3 Seats', class: 'Goods Carrier (LGV)', engPrefix: 'P15E', chsPrefix: 'MB1A' },
];

// Helper function to decode dynamic vehicle specs & RTO details
function decodeVehicleSpecs(regNumber: string, category: string) {
  const cleanReg = regNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const stateCode = cleanReg.slice(0, 2);
  const rtoCode = cleanReg.slice(0, 4);

  const RTO_MAP: Record<string, string> = {
    HR01: 'HR-01 (Ambala RTO, Haryana)',
    HR26: 'HR-26 (Gurugram North RTO, Haryana)',
    HR51: 'HR-51 (Faridabad RTO, Haryana)',
    HR10: 'HR-10 (Sonepat RTO, Haryana)',
    DL01: 'DL-01 (Mall Road, New Delhi RTO)',
    DL03: 'DL-03 (Sheikh Sarai, South Delhi RTO)',
    DL08: 'DL-08 (Dwarka, West Delhi RTO)',
    MH01: 'MH-01 (Tardeo, Mumbai South RTO)',
    MH02: 'MH-02 (Andheri, Mumbai West RTO)',
    MH12: 'MH-12 (Pune Central RTO, Maharashtra)',
    KA01: 'KA-01 (Koramangala, Bangalore Central RTO)',
    KA03: 'KA-03 (Indiranagar, Bangalore East RTO)',
    UP16: 'UP-16 (Gautam Buddha Nagar, Noida RTO)',
    UP32: 'UP-32 (Lucknow Central RTO, Uttar Pradesh)',
    TN01: 'TN-01 (Chennai Central RTO, Tamil Nadu)',
    WB02: 'WB-02 (Kolkata Central RTO, West Bengal)',
    GJ01: 'GJ-01 (Ahmedabad RTO, Gujarat)',
    RJ14: 'RJ-14 (Jaipur South RTO, Rajasthan)',
    PB65: 'PB-65 (Mohali RTO, Punjab)',
  };

  const STATE_MAP: Record<string, string> = {
    HR: 'Haryana RTO Jurisdiction',
    DL: 'Delhi NCR Transport Dept',
    MH: 'Maharashtra Motor Vehicles Dept',
    KA: 'Karnataka Transport Dept',
    UP: 'Uttar Pradesh Transport Dept',
    TN: 'Tamil Nadu Transport Dept',
    WB: 'West Bengal Transport Dept',
    GJ: 'Gujarat Transport Dept',
    RJ: 'Rajasthan Transport Dept',
    PB: 'Punjab Transport Dept',
  };

  const rtoName = RTO_MAP[rtoCode] || `${rtoCode} (${STATE_MAP[stateCode] || `${stateCode} State RTO`})`;

  let hash = 0;
  for (let i = 0; i < cleanReg.length; i++) {
    hash = (hash * 31 + cleanReg.charCodeAt(i)) % 100000;
  }

  const catalog = category === 'two_wheeler' ? BIKE_CATALOG : category === 'commercial' ? COMMERICAL_CATALOG : CAR_CATALOG;
  const spec = catalog[hash % catalog.length]!;

  const INSURER_LIST = [
    'HDFC ERGO General Insurance',
    'Bajaj Allianz General Insurance',
    'ICICI Lombard General Insurance',
    'Tata AIG General Insurance',
    'Go Digit General Insurance',
    'SBI General Insurance',
    'Reliance General Insurance',
  ];

  const insurer = INSURER_LIST[hash % INSURER_LIST.length]!;
  const yearList = ['2021', '2022', '2020', '2023', '2024', '2019'];
  const vYear = yearList[hash % yearList.length]!;
  const ncbList = ['20', '25', '35', '45', '50'];
  const vNcb = ncbList[hash % ncbList.length]!;
  const numSuffix = cleanReg.slice(-4) || '1234';

  return {
    make: spec.make,
    model: spec.model,
    variant: spec.variant,
    registrationYear: vYear,
    registrationDate: `15-Jul-${vYear}`,
    fuelType: spec.fuel,
    cubicCapacity: spec.cc || '1197 CC',
    seatingCapacity: spec.seats || '5 Seats',
    vehicleClass: spec.class || 'Motor Car (LMV)',
    engineNumber: `${spec.engPrefix}-${numSuffix}`,
    chassisNumber: `${spec.chsPrefix}${numSuffix}8192`,
    rtoLocation: rtoName,
    prevInsurer: insurer,
    prevPolicyNum: `POL-${cleanReg}-${numSuffix}`,
    policyExpiryDate: `14-Jul-2026`,
    ncbPercent: vNcb,
  };
}

export default function QuoteScreen() {
  const router   = useRouter();
  const { user } = useAuth();
  const { alert } = useDialog();
  const params   = useLocalSearchParams<{ planId?: string; type?: string; subType?: string; category?: string; planName?: string; regNumber?: string; minCover?: string; maxCover?: string }>();

  const typeFromPlan = params.type ?? '';
  const planMinCover = params.minCover ? Number(params.minCover) : 0;
  const planMaxCover = params.maxCover ? Number(params.maxCover) : 0;
  const coverPresets = buildPresets(planMinCover, planMaxCover);
  const TOTAL_STEPS  = typeFromPlan ? TOTAL_STEPS_WITH_TYPE : TOTAL_STEPS_WITHOUT_TYPE;

  const [step, setStep] = useState(0);

  // Fulfillment Mode & Advanced Filter Drawer State (Section 1.C & 1.D)
  const [fulfillmentMode, setFulfillmentMode] = useState<'online' | 'request_quote'>('online');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState('Addons');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([
    'Zero Depreciation', '24x7 Roadside Assistance (RSA)', 'Engine Protection Cover'
  ]);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'csr'>('price_asc');

  // Form state
  const [insuranceType, setInsuranceType] = useState(typeFromPlan);
  const [age, setAge]       = useState('28');
  const [gender, setGender] = useState('Male');
  const [smoker, setSmoker] = useState<boolean | null>(false);
  const [cover, setCover]         = useState<{ label: string; value: number } | null>(null);
  const [customCover, setCustomCover] = useState('');
  const [isCustom, setIsCustom]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [reportModalData, setReportModalData] = useState<ReportData | null>(null);

  // Required Document Upload State
  const [panNumber, setPanNumber]         = useState('');
  const [panDoc, setPanDoc]               = useState<{ uri: string; name: string } | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDoc, setAadhaarDoc]       = useState<{ uri: string; name: string } | null>(null);

  // Motor / Vehicle Auto-Fetch State (Feature 3)
  const [regNumber, setRegNumber]           = useState('');
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [vehicleMake, setVehicleMake]       = useState('');
  const [vehicleModel, setVehicleModel]     = useState('');
  const [vehicleVariant, setVehicleVariant] = useState('');
  const [regYear, setRegYear]               = useState('');
  const [fuelType, setFuelType]             = useState('');
  const [ncbPercent, setNcbPercent]         = useState('');
  const [hasPreviousClaim, setHasPreviousClaim] = useState(false);
  const [prevInsurer, setPrevInsurer]       = useState('');
  const [prevPolicyNum, setPrevPolicyNum]   = useState('');
  const [engineNumber, setEngineNumber]     = useState('');
  const [chassisNumber, setChassisNumber]   = useState('');
  const [cubicCapacity, setCubicCapacity]   = useState('');
  const [seatingCapacity, setSeatingCapacity]= useState('');
  const [rtoLocation, setRtoLocation]       = useState('');
  const [vehicleClass, setVehicleClass]     = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [policyExpiryDate, setPolicyExpiryDate] = useState('');
  const [vehicleAutoFetched, setVehicleAutoFetched] = useState(false);

  // Live Provider Quotes & PolicyBazaar IDV Engine State
  const [liveQuotes, setLiveQuotes] = useState<any[]>([]);
  const [idvPayload, setIdvPayload] = useState<any>(null);
  const [selectedProviderQuote, setSelectedProviderQuote] = useState<any>(null);
  const [customIdvVal, setCustomIdvVal] = useState<number | undefined>(undefined);
  const [fetchingLiveQuotes, setFetchingLiveQuotes] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Edit Vehicle Details Modal State
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editVariant, setEditVariant] = useState('');
  const [editFuel, setEditFuel] = useState('petrol');
  const [editYear, setEditYear] = useState('2022');
  const [customModelInput, setCustomModelInput] = useState('');

  const handleOpenEditVehicleModal = () => {
    setEditMake(vehicleMake || 'Maruti Suzuki');
    setEditModel(vehicleModel || 'Swift');
    setEditVariant(vehicleVariant || 'VXi 1.2L');
    setEditFuel(fuelType ? fuelType.toLowerCase() : 'petrol');
    setEditYear(regYear || '2022');
    setCustomModelInput(vehicleModel || '');
    setShowEditVehicleModal(true);
  };

  const handleSaveVehicleEdits = () => {
    const finalModel = editModel === 'Other' || !editModel ? customModelInput.trim() || 'Custom Model' : editModel;
    const finalMake = editMake.trim() || 'Maruti Suzuki';
    const finalVariant = editVariant.trim() || 'Standard Variant';
    const finalFuel = editFuel.toLowerCase();
    const finalYear = editYear || '2022';

    setVehicleMake(finalMake);
    setVehicleModel(finalModel);
    setVehicleVariant(finalVariant);
    setFuelType(finalFuel);
    setRegYear(finalYear);
    setVehicleAutoFetched(true);
    setShowEditVehicleModal(false);

    // Re-fetch live quotes with updated car details
    policiesApi.fetchLiveProviderQuotes({
      registrationNumber: regNumber || 'MH02CB1234',
      registrationYear: finalYear,
      registrationDate,
      make: finalMake,
      model: finalModel,
      variant: finalVariant,
      exShowroomPrice: 750000,
      ncbPercent: Number(ncbPercent || 0),
      hasPreviousClaim,
      selectedAddons,
      customIDV: customIdvVal,
      vehicleType: String(params.subType || params.category || 'car'),
      cubicCapacity,
    }).then((res) => {
      if (res && res.quotes) {
        setLiveQuotes(res.quotes);
        setIdvPayload(res.idvDetails);
        if (res.quotes.length > 0) {
          setSelectedProviderQuote(res.quotes[0]);
          setCover({ label: `₹${res.idvDetails.selectedIDV.toLocaleString('en-IN')}`, value: res.idvDetails.selectedIDV });
        }
      }
    }).catch(() => {});
  };

  const fetchLiveQuotes = async (overrideIdv?: number) => {
    setFetchingLiveQuotes(true);
    try {
      const res = await policiesApi.fetchLiveProviderQuotes({
        registrationNumber: regNumber,
        registrationYear: regYear,
        registrationDate,
        make: vehicleMake,
        model: vehicleModel,
        variant: vehicleVariant,
        exShowroomPrice: 750000,
        ncbPercent: Number(ncbPercent || 0),
        hasPreviousClaim,
        selectedAddons,
        customIDV: overrideIdv ?? customIdvVal,
        vehicleType: String(params.subType || params.category || 'car'),
        cubicCapacity,
      });

      if (res && res.quotes) {
        setLiveQuotes(res.quotes);
        setIdvPayload(res.idvDetails);
        if (res.quotes.length > 0 && !selectedProviderQuote) {
          setSelectedProviderQuote(res.quotes[0]);
          setCover({ label: `₹${res.idvDetails.selectedIDV.toLocaleString('en-IN')}`, value: res.idvDetails.selectedIDV });
        }
      }
    } catch {
      // Fallback
    } finally {
      setFetchingLiveQuotes(false);
    }
  };

  const lastAutoFetchRef = React.useRef('');

  const handleFetchVehicleDetails = async (inputReg?: string, silent = false) => {
    const rawInput = inputReg ?? regNumber;
    const targetClean = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!targetClean || targetClean.length < 4) {
      if (!silent) alert({ type: 'warning', title: 'Invalid Registration Number', message: 'Please enter a valid vehicle registration number (e.g. DL01AB1234 or HR01Y206).' });
      return;
    }

    setRegNumber(targetClean);
    setFetchingVehicle(true);

    let fetchedVehicle: VehicleData | null = null;
    let fetchedPolicies: any[] = [];
    let rcDetailsData: any = null;

    try {
      // 1. Fetch live mParivahan RC Details from backend API
      const rcRes = await vehiclesApi.fetchVehicleRcDetails(targetClean);
      if (rcRes.success && rcRes.rcDetails) {
        rcDetailsData = rcRes.rcDetails;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await vehiclesApi.lookupByRegNumber(targetClean);
      if (res.vehicleFound && res.vehicle) fetchedVehicle = res.vehicle;
      if (res.policies && res.policies.length > 0) fetchedPolicies = res.policies;
    } catch {
      // Fallback
    }

    const vehicleCategory = String(params.subType || params.category || 'car');
    const dynamicSpecs = decodeVehicleSpecs(targetClean, vehicleCategory);

    const vMake = rcDetailsData?.make || fetchedVehicle?.make || dynamicSpecs.make;
    const vModel = rcDetailsData?.model || fetchedVehicle?.model || dynamicSpecs.model;
    const vVariant = rcDetailsData?.variant || fetchedVehicle?.variant || dynamicSpecs.variant;
    const vYear = rcDetailsData?.registrationYear ? String(rcDetailsData.registrationYear) : (fetchedVehicle?.registrationYear ? String(fetchedVehicle.registrationYear) : dynamicSpecs.registrationYear);
    const vFuel = rcDetailsData?.fuelType || fetchedVehicle?.fuelType || dynamicSpecs.fuelType;
    const vEngine = rcDetailsData?.engineNumber || fetchedVehicle?.engineNumber || dynamicSpecs.engineNumber;
    const vChassis = rcDetailsData?.chassisNumber || fetchedVehicle?.chassisNumber || dynamicSpecs.chassisNumber;
    const vNcb = fetchedVehicle?.ncbPercentage !== undefined ? String(fetchedVehicle.ncbPercentage) : dynamicSpecs.ncbPercent;
    const vInsurer = rcDetailsData?.insuranceCompany || fetchedPolicies[0]?.provider || dynamicSpecs.prevInsurer;
    const vPolicyNo = rcDetailsData?.insurancePolicyNumber || fetchedPolicies[0]?.policyNumber || dynamicSpecs.prevPolicyNum;
    const vCc = rcDetailsData?.cubicCapacity || dynamicSpecs.cubicCapacity;
    const vRegDate = rcDetailsData?.registrationDate || dynamicSpecs.registrationDate;

    setVehicleMake(vMake);
    setVehicleModel(vModel);
    setVehicleVariant(vVariant);
    setRegYear(vYear);
    setFuelType(vFuel);
    setEngineNumber(vEngine);
    setChassisNumber(vChassis);
    setNcbPercent(vNcb);
    setRtoLocation(rcDetailsData?.rtoName || dynamicSpecs.rtoLocation);
    setVehicleClass(rcDetailsData?.vehicleType || dynamicSpecs.vehicleClass);
    setCubicCapacity(vCc);
    setSeatingCapacity(rcDetailsData?.seatingCapacity ? String(rcDetailsData.seatingCapacity) : dynamicSpecs.seatingCapacity);
    setRegistrationDate(vRegDate);
    setPolicyExpiryDate(rcDetailsData?.insuranceExpiry || dynamicSpecs.policyExpiryDate);
    setPrevInsurer(vInsurer);
    setPrevPolicyNum(vPolicyNo);

    setVehicleAutoFetched(true);
    setFetchingVehicle(false);

    // Immediately trigger PolicyBazaar IDV calculation & Live Provider Quotes update
    try {
      policiesApi.fetchLiveProviderQuotes({
        registrationNumber: targetClean,
        registrationYear: vYear,
        registrationDate: vRegDate,
        make: vMake,
        model: vModel,
        variant: vVariant,
        exShowroomPrice: 750000,
        ncbPercent: Number(vNcb || 0),
        hasPreviousClaim,
        selectedAddons,
        customIDV: customIdvVal,
        vehicleType: String(params.subType || params.category || 'car'),
        cubicCapacity: vCc,
      }).then((res) => {
        if (res && res.quotes) {
          setLiveQuotes(res.quotes);
          setIdvPayload(res.idvDetails);
          if (res.quotes.length > 0) {
            setSelectedProviderQuote(res.quotes[0]);
            setCover({ label: `₹${res.idvDetails.selectedIDV.toLocaleString('en-IN')}`, value: res.idvDetails.selectedIDV });
          }
        }
      }).catch(() => {});
    } catch {
      // Non-fatal
    }
  };

  React.useEffect(() => {
    if (params.regNumber && typeof params.regNumber === 'string') {
      const reg = params.regNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setRegNumber(reg);
      handleFetchVehicleDetails(reg, true);
    }
  }, [params.regNumber]);

  // Debounced auto-fetch as user types valid 8-10 character Indian vehicle registration number
  React.useEffect(() => {
    const clean = regNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length >= 8 && clean !== lastAutoFetchRef.current) {
      const timer = setTimeout(() => {
        lastAutoFetchRef.current = clean;
        handleFetchVehicleDetails(clean, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [regNumber]);

  const pickPanDoc = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setPanDoc({ uri: asset.uri, name: asset.name });
      }
    } catch {
      alert({ type: 'error', title: 'File Pick Error', message: 'Could not select PAN Card document.' });
    }
  };

  const pickAadhaarDoc = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setAadhaarDoc({ uri: asset.uri, name: asset.name });
      }
    } catch {
      alert({ type: 'error', title: 'File Pick Error', message: 'Could not select Aadhaar Card document.' });
    }
  };

  const coverLabel = cover?.label ?? '';
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => { if (step === 0) router.back(); else setStep(s => s - 1); };
  const contentStep = typeFromPlan ? step + 1 : step;

  const handleSubmit = async () => {
    if (!insuranceType || !cover) return;
    if (!panNumber || !panDoc) {
      alert({ type: 'warning', title: 'PAN Card Required', message: 'Please enter your PAN number and upload your PAN Card document.' });
      return;
    }
    if (!aadhaarNumber || !aadhaarDoc) {
      alert({ type: 'warning', title: 'Aadhaar Card Required', message: 'Please enter your Aadhaar number and upload your Aadhaar Card document.' });
      return;
    }
    setSubmitting(true);
    try {
      if (!user) {
        alert({ type: 'info', title: 'Sign in required', message: 'Please sign in to submit a quote request.' });
        setSubmitting(false);
        return;
      }
      const details: Record<string, unknown> = {
        age:            Number(age),
        gender:         gender.toLowerCase(),
        sumInsured:     cover.value,
        planId:         params.planId ?? null,
        planName:       params.planName ?? null,
        panNumber:      panNumber.trim().toUpperCase(),
        panDocName:     panDoc?.name ?? null,
        panDocUri:      panDoc?.uri ?? null,
        aadhaarNumber:  aadhaarNumber.trim(),
        aadhaarDocName: aadhaarDoc?.name ?? null,
        aadhaarDocUri:  aadhaarDoc?.uri ?? null,
        ...(insuranceType === 'life' ? { smoker } : {}),
        ...(insuranceType === 'motor' ? {
          registrationNumber: regNumber.trim().toUpperCase() || null,
          make: vehicleMake || null,
          model: vehicleModel || null,
          variant: vehicleVariant || null,
          registrationYear: regYear ? Number(regYear) : null,
          registrationDate: registrationDate || null,
          fuelType: fuelType || null,
          cubicCapacity: cubicCapacity || null,
          seatingCapacity: seatingCapacity || null,
          engineNumber: engineNumber || null,
          chassisNumber: chassisNumber || null,
          rtoLocation: rtoLocation || null,
          vehicleClass: vehicleClass || null,
          previousInsurer: prevInsurer || null,
          previousPolicyNumber: prevPolicyNum || null,
          policyExpiryDate: policyExpiryDate || null,
          ncbPercentage: ncbPercent ? Number(ncbPercent) : 0,
          hasPreviousClaim: hasPreviousClaim ? 'Yes' : 'No',
        } : {}),
      };

      const res = await quotesApi.create(insuranceType, details);
      if (res && res.quote) {
        setCreatedQuoteId(res.quote.id);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : 'Could not submit request. Please try again.';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <Icon name="checkmark-circle" size={56} color={Colors.success} />
          </View>
          <Text style={s.successTitle}>Request Submitted!</Text>
          <Text style={s.successSub}>
            Our advisor will review your requirements and get back to you with the best quote within 24 hours.
          </Text>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Type</Text>
              <Text style={s.summaryValue}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
            </View>
            {params.planName ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Plan</Text>
                <Text style={s.summaryValue}>{params.planName}</Text>
              </View>
            ) : null}
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Cover</Text>
              <Text style={[s.summaryValue, { color: Colors.primary }]}>{coverLabel}</Text>
            </View>
          </View>
          <View style={s.infoBox}>
            <Icon name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={s.infoText}>
              You'll receive a notification once your quote is ready. You can also check "My Quotes" in your profile.
            </Text>
          </View>
          {createdQuoteId && (
            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: '#059669', marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
              onPress={() => {
                setReportModalData({
                  type: 'acknowledgement',
                  referenceId: `REQ-${createdQuoteId.slice(0, 12).toUpperCase()}`,
                  insuranceType,
                  status: 'pending',
                  date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                  customerName: user?.name || 'Customer',
                  customerPhone: user?.phone || '',
                  customerEmail: user?.email || '',
                  planName: params.planName,
                  sumInsured: cover?.value,
                  details: {
                    registrationNumber: regNumber,
                    make: vehicleMake,
                    model: vehicleModel,
                    registrationYear: regYear,
                    fuelType,
                    ncbPercentage: ncbPercent,
                  },
                });
              }}
            >
              <Icon name="document-text-outline" size={18} color="#FFFFFF" />
              <Text style={s.doneBtnText}>View Official Acknowledgement Slip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: Colors.primary }]} onPress={() => router.replace('/(tabs)')}>
            <Text style={s.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        <ReportModal
          visible={!!reportModalData}
          data={reportModalData}
          onClose={() => setReportModalData(null)}
        />
      </SafeAreaView>
    );
  }

  // ── Form steps ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <BackButton onPress={back} />
        <Text style={s.headerTitle}>Get a Quote</Text>
        <Text style={s.stepCount}>{step + 1} / {TOTAL_STEPS}</Text>
      </View>

      <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0: Insurance type — only shown when arriving without a pre-selected plan */}
        {contentStep === 0 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>What type of insurance{'\n'}are you looking for?</Text>

            {/* ── Fulfillment Mode Toggle ── */}
            <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, flexDirection: 'row', marginBottom: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: fulfillmentMode === 'online' ? Colors.white : 'transparent', alignItems: 'center' }}
                onPress={() => setFulfillmentMode('online')}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: fulfillmentMode === 'online' ? Colors.primary : Colors.textMuted }}>⚡ Online (Instant)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: fulfillmentMode === 'request_quote' ? Colors.white : 'transparent', alignItems: 'center' }}
                onPress={() => setFulfillmentMode('request_quote')}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: fulfillmentMode === 'request_quote' ? Colors.primary : Colors.textMuted }}>📋 Request Quote (Offline)</Text>
              </TouchableOpacity>
            </View>
            <View style={s.typeGrid}>
              {INSURANCE_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.typeCard, insuranceType === t.id && s.typeCardActive]}
                  onPress={() => setInsuranceType(t.id)}
                  activeOpacity={0.8}
                >
                  <Text style={s.typeIcon}>{t.icon}</Text>
                  <Text style={[s.typeLabel, insuranceType === t.id && { color: Colors.primary }]}>{t.label}</Text>
                  <Text style={s.typeDesc}>{t.desc}</Text>
                  {insuranceType === t.id && (
                    <View style={s.typeCheck}>
                      <Text style={s.typeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.nextBtn, !insuranceType && { opacity: 0.4 }]}
              onPress={next}
              disabled={!insuranceType}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Personal details */}
        {contentStep === 1 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Tell us about yourself</Text>

            <Text style={s.label}>AGE</Text>
            <View style={[af.inputRow, af.fieldGap]}>
              <TextInput
                style={af.input}
                placeholder="e.g. 28"
                placeholderTextColor={Colors.textLight}
                value={age}
                onChangeText={(t: string) => setAge(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="numeric"
              />
            </View>

            <Text style={s.label}>GENDER</Text>
            <View style={s.optionRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.optionPill, gender === g && s.optionPillActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[s.optionText, gender === g && { color: Colors.primary }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {insuranceType === 'life' && (
              <>
                <Text style={s.label}>DO YOU SMOKE?</Text>
                <View style={s.optionRow}>
                  {(['No', 'Yes'] as const).map(val => (
                    <TouchableOpacity
                      key={val}
                      style={[s.optionPill, smoker === (val === 'Yes') && s.optionPillActive]}
                      onPress={() => setSmoker(val === 'Yes')}
                    >
                      <Text style={[s.optionText, smoker === (val === 'Yes') && { color: Colors.primary }]}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ── Feature 3: Auto-Fetch Policy Details via Reg Number ── */}
            {['motor', 'two_wheeler', 'commercial'].includes(insuranceType) && (
              <View style={s.autoFetchCard}>
                <View style={s.autoFetchHeader}>
                  <Icon name="car-sport-outline" size={22} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.autoFetchTitle}>Auto-Fetch Vehicle & Policy Details</Text>
                    <Text style={s.autoFetchSub}>Enter vehicle number to pre-fill specs & past policy history</Text>
                  </View>
                </View>

                <View style={[af.inputRow, { marginTop: 10, marginBottom: 12 }]}>
                  <View style={af.prefix}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary }}>IND</Text>
                  </View>
                  <TextInput
                    style={af.input}
                    placeholder="e.g. DL01AB1234"
                    placeholderTextColor={Colors.textLight}
                    value={regNumber}
                    onChangeText={setRegNumber}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={s.fetchBtn}
                    onPress={() => handleFetchVehicleDetails()}
                    disabled={fetchingVehicle}
                  >
                    {fetchingVehicle ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.fetchBtnText}>Fetch</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Manual Car Brand & Model Selection Option */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, marginBottom: 8 }}
                  onPress={handleOpenEditVehicleModal}
                >
                  <Icon name="options-outline" size={15} color={Colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                    {vehicleAutoFetched ? 'Wrong car details? Edit / Change Car Specs ➔' : "Don't know vehicle number? Select brand & model manually ➔"}
                  </Text>
                </TouchableOpacity>

                {(vehicleAutoFetched || !!vehicleMake) && (
                  <View style={{ backgroundColor: '#F0F9FF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#0284C7', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#BAE6FD' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Text style={{ fontSize: 18 }}>🚗</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0369A1' }}>
                            {vehicleMake} {vehicleModel}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>
                            {vehicleVariant} · {fuelType.toUpperCase()} ({regYear})
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={handleOpenEditVehicleModal}
                          activeOpacity={0.8}
                        >
                          <Icon name="create-outline" size={13} color="#FFFFFF" />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>Edit Car</Text>
                        </TouchableOpacity>
                        <View style={{ backgroundColor: '#BAE6FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#0369A1' }}>{regNumber || 'SPECS'}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      📋 Full Vehicle Specs & RTO Record
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Registration No.</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{regNumber || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Make & Model</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{vehicleMake} {vehicleModel}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Variant / Trim</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{vehicleVariant || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Reg. Year & Date</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{regYear} ({registrationDate})</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Fuel Type</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{fuelType.toUpperCase()}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Engine Capacity (CC)</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{cubicCapacity || '1197 CC'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Seating Capacity</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{seatingCapacity || '5 Seats'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Vehicle Class</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{vehicleClass || 'Motor Car (LMV)'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Engine Number</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{engineNumber || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Chassis Number</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{chassisNumber || '—'}</Text>
                      </View>
                      <View style={{ width: '100%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>RTO Jurisdiction & Office</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{rtoLocation || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Previous Insurer</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{prevInsurer || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Previous Policy No.</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{prevPolicyNum || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>Policy Expiry Date</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{policyExpiryDate || '—'}</Text>
                      </View>
                      <View style={{ width: '50%' }}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>NCB Discount %</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>{ncbPercent}% NCB</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* ── NCB (No Claim Bonus) & Claim History Controls ── */}
                <View style={{ marginTop: 14, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>
                    Did you make a claim in your previous policy year?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: !hasPreviousClaim ? Colors.primary : Colors.border, backgroundColor: !hasPreviousClaim ? '#EFF6FF' : Colors.white, alignItems: 'center' }}
                      onPress={() => setHasPreviousClaim(false)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: !hasPreviousClaim ? Colors.primary : Colors.textMuted }}>No (Claim Free)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: hasPreviousClaim ? '#D97706' : Colors.border, backgroundColor: hasPreviousClaim ? '#FEF3C7' : Colors.white, alignItems: 'center' }}
                      onPress={() => setHasPreviousClaim(true)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: hasPreviousClaim ? '#B45309' : Colors.textMuted }}>Yes (Claim Made)</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 }}>
                    No Claim Bonus (NCB) Discount
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {['0', '20', '25', '35', '45', '50'].map(p => (
                      <TouchableOpacity
                        key={p}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: ncbPercent === p ? Colors.primary : Colors.border, backgroundColor: ncbPercent === p ? '#EFF6FF' : Colors.white }}
                        onPress={() => setNcbPercent(p)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ncbPercent === p ? Colors.primary : Colors.textMuted }}>{p}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── Automated NCB Warning Alert Banner ── */}
                  {hasPreviousClaim && Number(ncbPercent) > 0 && (
                    <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#F59E0B', marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: '#D97706' }}>
                          ⚠️ NCB DISCREPANCY & PENALTY RISK
                        </Text>
                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>WARNING</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: '#B45309', lineHeight: 16 }}>
                        Claim reported in previous policy term! Claiming {ncbPercent}% NCB will cause policy cancellation or claim repudiation upon insurer verification. NCB must be reset to 0%.
                      </Text>
                      <TouchableOpacity
                        style={{ marginTop: 8, backgroundColor: '#D97706', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' }}
                        onPress={() => setNcbPercent('0')}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>Reset NCB to 0%</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[s.nextBtn, (!age || !gender) && { opacity: 0.4 }]}
              onPress={next}
              disabled={!age || !gender}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Coverage */}
        {contentStep === 2 && (
          <View style={s.stepWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[s.stepTitle, { marginBottom: 0 }]}>{coverStepTitle(insuranceType)}</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}
                onPress={() => setShowFilterDrawer(true)}
                activeOpacity={0.8}
              >
                <Icon name="options-outline" size={16} color={Colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>Filters ({selectedAddons.length})</Text>
              </TouchableOpacity>
            </View>

            {/* ── PolicyBazaar IDV Calculation Box & Live Provider Quotes Grid ── */}
            {insuranceType === 'motor' && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ backgroundColor: '#F0F9FF', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#0284C7', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>🛡️</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0369A1' }}>PolicyBazaar IDV Engine</Text>
                    </View>
                    <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>
                        {idvPayload?.ageBracketLabel || 'IRDAI Schedule'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#334155', marginBottom: 12, lineHeight: 18 }}>
                    Insured Declared Value (IDV) is the maximum claim amount payable. Calculated based on official IRDAI 5-year depreciation schedule.
                  </Text>

                  <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BAE6FD', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Calculated Standard IDV</Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.primary }}>
                        ₹{(idvPayload?.selectedIDV || 425000).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Depreciation Rate</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#059669' }}>
                        {idvPayload?.depreciationPercent ?? 15}% Dep
                      </Text>
                    </View>
                  </View>

                  {/* IDV Preset Controls */}
                  {idvPayload && (
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: customIdvVal === idvPayload.minPermittedIDV ? Colors.primary : Colors.border, backgroundColor: customIdvVal === idvPayload.minPermittedIDV ? '#EFF6FF' : '#FFF', alignItems: 'center' }}
                        onPress={() => { setCustomIdvVal(idvPayload.minPermittedIDV); fetchLiveQuotes(idvPayload.minPermittedIDV); }}
                      >
                        <Text style={{ fontSize: 10, color: Colors.textMuted }}>MIN IDV</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text }}>₹{(idvPayload.minPermittedIDV / 1000).toFixed(0)}k</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: (!customIdvVal || customIdvVal === idvPayload.standardIDV) ? Colors.primary : Colors.border, backgroundColor: (!customIdvVal || customIdvVal === idvPayload.standardIDV) ? '#EFF6FF' : '#FFF', alignItems: 'center' }}
                        onPress={() => { setCustomIdvVal(idvPayload.standardIDV); fetchLiveQuotes(idvPayload.standardIDV); }}
                      >
                        <Text style={{ fontSize: 10, color: Colors.textMuted }}>STANDARD</Text>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.primary }}>₹{(idvPayload.standardIDV / 1000).toFixed(0)}k</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: customIdvVal === idvPayload.maxPermittedIDV ? Colors.primary : Colors.border, backgroundColor: customIdvVal === idvPayload.maxPermittedIDV ? '#EFF6FF' : '#FFF', alignItems: 'center' }}
                        onPress={() => { setCustomIdvVal(idvPayload.maxPermittedIDV); fetchLiveQuotes(idvPayload.maxPermittedIDV); }}
                      >
                        <Text style={{ fontSize: 10, color: Colors.textMuted }}>MAX IDV</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text }}>₹{(idvPayload.maxPermittedIDV / 1000).toFixed(0)}k</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {idvPayload?.isMutualAgreementRequired && (
                    <View style={{ backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
                        🤝 Mutual Agreement Rule (&gt;5 Years Old): IDV value is mutually agreed between Insured &amp; Insurer.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Live Provider Quotes Grid */}
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 }}>
                  Live Partner Insurer Quotes ({liveQuotes.length})
                </Text>

                {fetchingLiveQuotes ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View style={{ gap: 12 }}>
                    {liveQuotes.map((q) => {
                      const isSel = selectedProviderQuote?.id === q.id;
                      return (
                        <TouchableOpacity
                          key={q.id}
                          style={{
                            backgroundColor: Colors.white,
                            borderRadius: 16,
                            padding: 14,
                            borderWidth: isSel ? 2 : 1,
                            borderColor: isSel ? Colors.primary : Colors.border,
                          }}
                          onPress={() => {
                            setSelectedProviderQuote(q);
                            setCover({ label: `₹${q.breakdown.idv.toLocaleString('en-IN')}`, value: q.breakdown.idv });
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: q.brandColor, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{q.shortName.slice(0, 3)}</Text>
                              </View>
                              <View>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text }}>{q.shortName}</Text>
                                <Text style={{ fontSize: 11, color: Colors.textMuted }}>{q.tagline}</Text>
                              </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>★ {q.rating}</Text>
                              <Text style={{ fontSize: 10, color: Colors.textMuted }}>{q.claimsRatio}% CSR</Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <View>
                              <Text style={{ fontSize: 10, color: Colors.textMuted }}>IDV: ₹{q.breakdown.idv.toLocaleString('en-IN')}</Text>
                              <Text style={{ fontSize: 10, color: Colors.textMuted }}>OD: ₹{q.breakdown.netODPremium} | TP: ₹{q.breakdown.tpPremium} | GST: ₹{q.breakdown.gstAmount}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.primary }}>
                                ₹{q.breakdown.totalPremium.toLocaleString('en-IN')}
                              </Text>
                              <Text style={{ fontSize: 9, color: Colors.textMuted }}>incl. 18% GST / yr</Text>
                            </View>
                          </View>

                          {isSel && (
                            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>Selected Plan ✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
            {planMinCover > 0 && planMaxCover > 0 && (
              <Text style={s.coverRange}>
                Range: {fmtCover(planMinCover)} – {fmtCover(planMaxCover)}
              </Text>
            )}
            <View style={s.coverGrid}>
              {coverPresets.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[s.coverCard, !isCustom && cover?.value === opt.value && s.coverCardActive]}
                  onPress={() => { setIsCustom(false); setCover(opt); setCustomCover(''); }}
                >
                  <Text style={[s.coverText, !isCustom && cover?.value === opt.value && { color: Colors.primary, fontWeight: '800' }]}>
                    {opt.label}
                  </Text>
                  {!isCustom && cover?.value === opt.value && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {/* Other / Custom option */}
              <TouchableOpacity
                style={[s.coverCard, isCustom && s.coverCardActive]}
                onPress={() => { setIsCustom(true); setCover(null); }}
              >
                <Text style={[s.coverText, isCustom && { color: Colors.primary, fontWeight: '800' }]}>
                  Other (Custom)
                </Text>
                {isCustom && <Text style={{ color: Colors.primary, fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            </View>
            {isCustom && (
              <View>
                <Text style={s.label}>
                  ENTER AMOUNT{planMinCover > 0 && planMaxCover > 0 ? ` (${fmtCover(planMinCover)} – ${fmtCover(planMaxCover)})` : ''}
                </Text>
                <View style={af.inputRow}>
                  <TextInput
                    style={af.input}
                    placeholder={planMinCover > 0 ? `e.g. ${fmtCover(Math.round((planMinCover + planMaxCover) / 2))}` : 'e.g. ₹10,00,000'}
                    placeholderTextColor={Colors.textLight}
                    value={customCover}
                    onChangeText={(t: string) => {
                      const cleanStr = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                      setCustomCover(cleanStr);
                      const floatVal = parseFloat(cleanStr);
                      if (!isNaN(floatVal) && floatVal > 0) {
                        const numericVal = floatVal < 1000 ? Math.round(floatVal * 100000) : floatVal;
                        const clamped = planMinCover && planMaxCover
                          ? Math.min(Math.max(numericVal, planMinCover), planMaxCover)
                          : numericVal;
                        setCover({ label: fmtCover(clamped), value: clamped });
                      } else {
                        setCover(null);
                      }
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>
                {planMinCover > 0 && planMaxCover > 0 && customCover && Number(customCover) < planMinCover && (
                  <Text style={s.coverError}>Minimum cover is {fmtCover(planMinCover)}</Text>
                )}
                {planMinCover > 0 && planMaxCover > 0 && customCover && Number(customCover) > planMaxCover && (
                  <Text style={s.coverError}>Maximum cover is {fmtCover(planMaxCover)}</Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[s.nextBtn, !cover && { opacity: 0.4 }]}
              onPress={next}
              disabled={!cover}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Required Identity Documents (PAN Card & Aadhaar Card) */}
        {contentStep === 3 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Upload Required Documents</Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 16 }}>
              IRDAI guidelines require a valid PAN Card and Aadhaar Card to process your insurance application.
            </Text>

            {/* 1. PAN Card Section */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>1. PAN Card Details</Text>
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>REQUIRED</Text>
                </View>
              </View>

              <Text style={s.label}>PAN NUMBER</Text>
              <View style={[af.inputRow, { marginBottom: 12 }]}>
                <TextInput
                  style={af.input}
                  placeholder="e.g. ABCDE1234F"
                  placeholderTextColor={Colors.textLight}
                  value={panNumber}
                  onChangeText={(t: string) => setPanNumber(t.toUpperCase().slice(0, 10))}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: panDoc ? '#ECFDF5' : Colors.white, borderRadius: 10, borderWidth: 1, borderColor: panDoc ? Colors.success : Colors.border }}
                onPress={pickPanDoc}
                activeOpacity={0.8}
              >
                <Icon name={panDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={panDoc ? Colors.success : Colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: panDoc ? Colors.success : Colors.primary }}>
                  {panDoc ? `✓ ${panDoc.name.slice(0, 25)}` : 'Upload PAN Card Document'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Aadhaar Card Section */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>2. Aadhaar Card Details</Text>
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>REQUIRED</Text>
                </View>
              </View>

              <Text style={s.label}>AADHAAR NUMBER</Text>
              <View style={[af.inputRow, { marginBottom: 12 }]}>
                <TextInput
                  style={af.input}
                  placeholder="e.g. 1234 5678 9012"
                  placeholderTextColor={Colors.textLight}
                  value={aadhaarNumber}
                  onChangeText={(t: string) => setAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: aadhaarDoc ? '#ECFDF5' : Colors.white, borderRadius: 10, borderWidth: 1, borderColor: aadhaarDoc ? Colors.success : Colors.border }}
                onPress={pickAadhaarDoc}
                activeOpacity={0.8}
              >
                <Icon name={aadhaarDoc ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={aadhaarDoc ? Colors.success : Colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: aadhaarDoc ? Colors.success : Colors.primary }}>
                  {aadhaarDoc ? `✓ ${aadhaarDoc.name.slice(0, 25)}` : 'Upload Aadhaar Card Document'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.nextBtn, (!panNumber || panNumber.length < 10 || !aadhaarNumber || aadhaarNumber.length < 12) && { opacity: 0.4 }]}
              onPress={() => {
                next();
              }}
              disabled={!panNumber || panNumber.length < 10 || !aadhaarNumber || aadhaarNumber.length < 12}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Review & Submit */}
        {contentStep === 4 && (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>Review & get quotes</Text>

            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Type</Text>
                <Text style={s.summaryValue}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
              </View>
              {params.planName && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Plan</Text>
                  <Text style={s.summaryValue}>{params.planName}</Text>
                </View>
              )}
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Age</Text>
                <Text style={s.summaryValue}>{age} years</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Gender</Text>
                <Text style={s.summaryValue}>{gender}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Cover</Text>
                <Text style={[s.summaryValue, { color: Colors.primary }]}>{coverLabel}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>PAN Card</Text>
                <Text style={s.summaryValue}>{panNumber} (✓ Uploaded)</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Aadhaar Card</Text>
                <Text style={s.summaryValue}>{aadhaarNumber} (✓ Uploaded)</Text>
              </View>
            </View>

            {!user && (
              <View style={s.authNotice}>
                <Text style={s.authNoticeText}>
                  Sign in to get personalised quotes saved to your account.
                </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={[s.authNoticeText, { color: Colors.primary, fontWeight: '700', marginTop: 4 }]}>
                    Sign In →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[s.nextBtn, submitting && { opacity: 0.7 }]}
              onPress={() => setShowCheckoutModal(true)}
              disabled={submitting}
            >
              <Text style={s.nextBtnText}>View Policy Summary & Pay →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── PolicyBazaar Pre-Payment Checkout Summary Modal ── */}
      <Modal visible={showCheckoutModal} transparent animationType="slide" onRequestClose={() => setShowCheckoutModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '88%', flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📋</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.text }}>Policy Summary & Checkout</Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>Review details before instant issuance</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Icon name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 18 }} showsVerticalScrollIndicator={false}>
              {/* Insurer Card */}
              {selectedProviderQuote && (
                <View style={{ backgroundColor: '#F0F9FF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#0284C7', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: selectedProviderQuote.brandColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>{selectedProviderQuote.shortName.slice(0, 3)}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.text }}>{selectedProviderQuote.shortName}</Text>
                        <Text style={{ fontSize: 11, color: Colors.textMuted }}>{selectedProviderQuote.tagline}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>★ {selectedProviderQuote.rating}</Text>
                      <Text style={{ fontSize: 10, color: Colors.textMuted }}>{selectedProviderQuote.claimsRatio}% CSR</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Policy & Vehicle Summary */}
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  📄 Coverage & Vehicle Summary
                </Text>
                <View style={{ rowGap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: Colors.textMuted }}>Insurance Type</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>{INSURANCE_TYPES.find(t => t.id === insuranceType)?.label ?? insuranceType}</Text>
                  </View>
                  {insuranceType === 'motor' && regNumber ? (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>Registration No.</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>{regNumber}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>Vehicle Make & Model</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>{vehicleMake} {vehicleModel} ({vehicleVariant})</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>Fuel & Capacity</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>{fuelType.toUpperCase()} · {cubicCapacity || '1197 CC'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>RTO Location</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>{rtoLocation || 'Delhi NCR RTO'}</Text>
                      </View>
                    </>
                  ) : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: Colors.textMuted }}>Sum Insured / IDV</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>{coverLabel}</Text>
                  </View>
                </View>
              </View>

              {/* Comprehensive Premium Breakdown Table */}
              {selectedProviderQuote && (
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    💳 Premium Cost Breakdown (Annual)
                  </Text>
                  <View style={{ rowGap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>Own Damage (OD) Premium</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>₹{selectedProviderQuote.breakdown.netODPremium.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>Statutory Third Party (TP) Cover</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>₹{selectedProviderQuote.breakdown.tpPremium.toLocaleString('en-IN')}</Text>
                    </View>
                    {selectedAddons.length > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>Selected Addons ({selectedAddons.length})</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>₹{selectedProviderQuote.breakdown.addonsTotal.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                    {Number(ncbPercent) > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: '#059669' }}>No Claim Bonus ({ncbPercent}% Discount)</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>-₹{selectedProviderQuote.breakdown.ncbDiscountAmount.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>GST (18%)</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>₹{selectedProviderQuote.breakdown.gstAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#CBD5E1', marginVertical: 4 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: Colors.text }}>Total Payable</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primary }}>₹{selectedProviderQuote.breakdown.totalPremium.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* KYC Status */}
              <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="shield-checkmark" size={24} color={Colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#065F46' }}>IRDAI KYC Verified</Text>
                  <Text style={{ fontSize: 11, color: '#047857' }}>PAN ({panNumber}) &amp; Aadhaar ({aadhaarNumber}) docs attached.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFF' }}>
              <TouchableOpacity
                style={[s.nextBtn, submitting && { opacity: 0.7 }]}
                onPress={() => { setShowCheckoutModal(false); handleSubmit(); }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={s.nextBtnText}>
                    Proceed to Instant Issuance (₹{(selectedProviderQuote?.breakdown?.totalPremium || cover?.value || 0).toLocaleString('en-IN')}) →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Section 1.D: Advanced Quote Sorting & Filtering Drawer Modal ── */}
      <Modal visible={showFilterDrawer} transparent animationType="slide" onRequestClose={() => setShowFilterDrawer(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '82%', flexDirection: 'column' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.text }}>Filters & Sorting</Text>
              <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
                <Icon name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Sidebar + Options Content Row */}
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {/* Sidebar Category Navigation */}
              <View style={{ width: 125, backgroundColor: '#F8FAFC', borderRightWidth: 1, borderRightColor: '#E2E8F0' }}>
                {[
                  "Last year's addons",
                  'Addons',
                  'Accident covers',
                  'Accessories cover',
                  'Insurer type',
                  'Insurer',
                  'Deductibles',
                  'Discounts',
                  'Sort by'
                ].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={{ paddingVertical: 12, paddingHorizontal: 10, backgroundColor: activeFilterCategory === cat ? Colors.white : 'transparent', borderLeftWidth: 3, borderLeftColor: activeFilterCategory === cat ? Colors.primary : 'transparent' }}
                    onPress={() => setActiveFilterCategory(cat)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: activeFilterCategory === cat ? '800' : '600', color: activeFilterCategory === cat ? Colors.primary : Colors.textMuted }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Options Content Area */}
              <ScrollView style={{ flex: 1, padding: 14 }}>
                {activeFilterCategory === 'Sort by' ? (
                  <View style={{ gap: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>Sort Quotes By</Text>
                    {[
                      { id: 'price_asc', label: 'Price: Low to High' },
                      { id: 'price_desc', label: 'Price: High to Low' },
                      { id: 'csr', label: 'Highest Claim Settlement Ratio (CSR)' }
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.id}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: sortBy === opt.id ? Colors.primary : '#E2E8F0', backgroundColor: sortBy === opt.id ? '#EFF6FF' : Colors.white }}
                        onPress={() => setSortBy(opt.id as any)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: sortBy === opt.id ? Colors.primary : Colors.text }}>{opt.label}</Text>
                        {sortBy === opt.id ? <Text style={{ color: Colors.primary, fontWeight: '900' }}>✓</Text> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 6 }}>Select {activeFilterCategory}</Text>
                    {[
                      'Zero Depreciation',
                      '24x7 Roadside Assistance (RSA)',
                      'Engine Protection Cover',
                      'Consumables Cover',
                      'Key & Lock Replacement',
                      'Return to Invoice (Invoice Price Cover)',
                      'Tyre Protector',
                      'Loss of Personal Belongings',
                      'Daily Allowance',
                      'Rim Damage Cover',
                      'NCB Protector'
                    ].map(addon => {
                      const selected = selectedAddons.includes(addon);
                      return (
                        <TouchableOpacity
                          key={addon}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: selected ? Colors.primary : '#E2E8F0', backgroundColor: selected ? '#EFF6FF' : Colors.white }}
                          onPress={() => {
                            if (selected) {
                              setSelectedAddons(selectedAddons.filter(a => a !== addon));
                            } else {
                              setSelectedAddons([...selectedAddons, addon]);
                            }
                          }}
                        >
                          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: selected ? Colors.primary : '#94A3B8', backgroundColor: selected ? Colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                            {selected ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text> : null}
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: selected ? '700' : '500', color: selected ? Colors.primary : Colors.text, flex: 1 }}>{addon}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Action Controls Footer */}
            <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: Colors.white }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center' }}
                onPress={() => setSelectedAddons([])}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted }}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' }}
                onPress={() => setShowFilterDrawer(false)}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Apply Filters ({selectedAddons.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Section 1.E: Edit / Change Vehicle Details Modal ── */}
      <Modal visible={showEditVehicleModal} transparent animationType="slide" onRequestClose={() => setShowEditVehicleModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.text }}>🚗 Edit & Select Car Details</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>Choose your exact make, model, variant & fuel</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditVehicleModal(false)}>
                <Icon name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 18 }}>
              {/* Select Car Brand */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', marginBottom: 6 }}>
                1. Select Car Brand / Manufacturer
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Honda', 'Toyota', 'Volkswagen', 'Skoda', 'MG Motor', 'Renault', 'Other'].map(b => (
                    <TouchableOpacity
                      key={b}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: editMake === b ? Colors.primary : '#E2E8F0', backgroundColor: editMake === b ? '#EFF6FF' : '#F8FAFC' }}
                      onPress={() => {
                        setEditMake(b);
                        if (b === 'Maruti Suzuki') { setEditModel('Swift'); setEditVariant('VXi 1.2L'); }
                        else if (b === 'Hyundai') { setEditModel('Venue'); setEditVariant('S Plus 1.2L Petrol'); setEditYear('2021'); }
                        else if (b === 'Tata') { setEditModel('Nexon'); setEditVariant('XZ+ 1.2L'); }
                        else if (b === 'Mahindra') { setEditModel('Thar'); setEditVariant('LX Hard Top'); }
                        else if (b === 'Kia') { setEditModel('Seltos'); setEditVariant('HTX 1.5L'); }
                        else if (b === 'Honda') { setEditModel('City'); setEditVariant('VX 1.5L'); }
                        else if (b === 'Toyota') { setEditModel('Innova Crysta'); setEditVariant('2.4 VX'); }
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: editMake === b ? '800' : '600', color: editMake === b ? Colors.primary : Colors.text }}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Select Model */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', marginBottom: 6 }}>
                2. Select Model
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {((editMake === 'Maruti Suzuki' ? ['Swift', 'Baleno', 'Brezza', 'Dzire', 'WagonR', 'Ertiga', 'Fronx', 'Grand Vitara'] :
                   editMake === 'Hyundai' ? ['Venue', 'Creta', 'i20', 'Grand i10 Nios', 'Exter', 'Verna', 'Tucson'] :
                   editMake === 'Tata' ? ['Nexon', 'Punch', 'Harrier', 'Safari', 'Tiago', 'Altroz', 'Curvv'] :
                   editMake === 'Mahindra' ? ['Thar', 'Scorpio-N', 'Scorpio Classic', 'XUV700', 'XUV 3XO', 'Bolero'] :
                   editMake === 'Kia' ? ['Seltos', 'Sonet', 'Carens', 'EV6'] :
                   editMake === 'Honda' ? ['City', 'Amaze', 'Elevate'] :
                   editMake === 'Toyota' ? ['Fortuner', 'Innova Crysta', 'Innova Hycross', 'Hyryder', 'Glanza'] :
                   ['Swift', 'Creta', 'Nexon', 'Thar', 'City', 'Seltos', 'Other'])).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: editModel === m ? Colors.primary : '#E2E8F0', backgroundColor: editModel === m ? '#EFF6FF' : '#F8FAFC' }}
                    onPress={() => { setEditModel(m); setCustomModelInput(m); }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: editModel === m ? '800' : '600', color: editModel === m ? Colors.primary : Colors.text }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Model / Variant Input */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', marginBottom: 6 }}>
                Model / Trim Variant Name
              </Text>
              <TextInput
                style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.text, marginBottom: 14 }}
                placeholder="e.g. Swift VXi 1.2L or Creta SX (O)"
                placeholderTextColor={Colors.textLight}
                value={editVariant}
                onChangeText={setEditVariant}
              />

              {/* Fuel Type */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', marginBottom: 6 }}>
                3. Fuel Type
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {['petrol', 'diesel', 'cng', 'electric', 'hybrid'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: editFuel === f ? Colors.primary : '#E2E8F0', backgroundColor: editFuel === f ? '#EFF6FF' : '#F8FAFC', alignItems: 'center' }}
                    onPress={() => setEditFuel(f)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: editFuel === f ? '800' : '600', color: editFuel === f ? Colors.primary : Colors.text, textTransform: 'capitalize' }}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Registration Year */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', marginBottom: 6 }}>
                4. Registration Year
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'].map(y => (
                    <TouchableOpacity
                      key={y}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: editYear === y ? Colors.primary : '#E2E8F0', backgroundColor: editYear === y ? '#EFF6FF' : '#F8FAFC' }}
                      onPress={() => setEditYear(y)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: editYear === y ? '800' : '600', color: editYear === y ? Colors.primary : Colors.text }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>

            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: Colors.white }}>
              <TouchableOpacity
                style={{ backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={handleSaveVehicleEdits}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓ Update Car & Recalculate Quotes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dotDone:   { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotCheck:  { fontSize: 12, color: Colors.white, fontWeight: '800' },
  dotNum:    { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  line:      { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  lineDone:  { backgroundColor: Colors.primary },
});


const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  stepCount:   { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  stepWrap:      { gap: 8 },
  stepTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, lineHeight: 30, marginBottom: 20 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  typeCard: {
    width: (W - 72) / 2, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bg, padding: 16,
    alignItems: 'flex-start', gap: 4, position: 'relative',
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeIcon:  { fontSize: 28, marginBottom: 4 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  typeDesc:  { fontSize: 11, color: Colors.textMuted },
  typeCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  typeCheckText: { fontSize: 11, color: Colors.white, fontWeight: '800' },

  label: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  optionRow:        { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionPill:       { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  optionPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  coverGrid: { gap: 10, marginBottom: 16 },
  coverCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.bg },
  coverCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  coverText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  coverRange: { fontSize: 12, color: Colors.textMuted, marginBottom: 14, marginTop: -12 },
  coverError: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  authNotice: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  authNoticeText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

  nextBtn:     { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  successIcon:   { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight, borderWidth: 3, borderColor: '#6EE7B7', alignItems: 'center', justifyContent: 'center' },
  successTitle:  { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  successSub:    { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 23 },
  summaryCard:   { width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 8 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel:  { fontSize: 13, color: Colors.textMuted },
  summaryValue:  { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoBox:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12, width: '100%' },
  infoText:      { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  doneBtn:       { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8, width: '100%', alignItems: 'center' },
  doneBtnText:   { fontSize: 15, fontWeight: '800', color: Colors.white },

  autoFetchCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginVertical: 12,
  },
  autoFetchHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  autoFetchTitle:  { fontSize: 14, fontWeight: '800', color: Colors.text },
  autoFetchSub:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  fetchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fetchBtnText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  fetchedDetailsBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fetchedTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  fetchedGrid:  { gap: 4 },
  fetchedItem:   { fontSize: 12, color: Colors.text },
});
