import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { agentApi, AgentAdmin, getAgentToken, setAgentToken, clearAgentToken, getPrefs, setPrefs } from '@/lib/api';
import { Colors } from '@/constants/theme';

// ── Agent context ─────────────────────────────────────────────────────────────

interface AgentContextValue {
  agent:   AgentAdmin | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
  refreshAgent: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent,   setAgent]   = useState<AgentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getAgentToken();
        if (token) {
          const admin = await agentApi.getProfile();
          const SecureStore = await import('expo-secure-store');
          await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
          setAgent(admin);
        }
      } catch {
        try {
          const saved = await import('expo-secure-store').then(m =>
            m.getItemAsync('agent_profile')
          );
          if (saved) setAgent(JSON.parse(saved));
        } catch {
          await clearAgentToken();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, admin } = await agentApi.login(email, password);
    await setAgentToken(token);
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
    setAgent(admin);
  };

  const logout = async () => {
    await clearAgentToken();
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync('agent_profile');
    setAgent(null);
  };

  const refreshAgent = async () => {
    try {
      const admin = await agentApi.getProfile();
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
      setAgent(admin);
    } catch (e) {
      console.warn('[refreshAgent] error:', e);
    }
  };

  return (
    <AgentContext.Provider value={{ agent, loading, login, logout, refreshAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}

// ── Multi-Language i18n ───────────────────────────────────────────────────────

export type LanguageCode = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'bn' | 'kn';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English',  nativeName: 'English',  flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',    nativeName: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',  nativeName: 'मराठी',    flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી',  flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',    nativeName: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',   nativeName: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',  nativeName: 'বাংলা',    flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',  nativeName: 'ಕನ್ನಡ',   flag: '🇮🇳' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: 'Home', plans: 'Plans', claims: 'Claims', chat: 'Support', profile: 'Profile',
    quotes: 'Quotes', policies: 'Policies', customers: 'Customers', renewals: 'Renewals',
    settings: 'Settings', language: 'Language', selectLanguage: 'Select Preferred Language',
    changeLanguage: 'Change App Language', save: 'Save', cancel: 'Cancel', confirm: 'Confirm',
    back: 'Back', logout: 'Log Out', deleteAccount: 'Delete Account', search: 'Search',
    filter: 'Filter', viewAll: 'View All', loading: 'Loading...', error: 'Error',
    success: 'Success', urgent: 'Urgent', welcomeTitle: 'Protect what matters most',
    quickQuote: 'Get Instant Quote', myPoliciesSummary: 'My Active Policies',
    popularCategories: 'Popular Insurance Types', healthInsurance: 'Health Insurance',
    motorInsurance: 'Motor Insurance', lifeInsurance: 'Life Insurance', travelInsurance: 'Travel Insurance',
    homeInsurance: 'Home Insurance', businessInsurance: 'Business Insurance', helpFaq: 'Help & FAQ',
    contactSupport: 'Contact Support', privacyPolicy: 'Privacy Policy', termsOfService: 'Terms of Service',
    verified: 'Verified', totalPaid: 'Total Paid', totalClaims: 'Total Claims',
    agentPortal: 'Agent Portal', updateProgress: 'Update Progress', call: 'Call',
    whatsapp: 'WhatsApp', daysLeft: 'days left', expired: 'Expired', pending: 'Pending',
    contacted: 'Contacted', closed: 'Closed', lost: 'Lost', notes: 'Notes',
    fileNewClaim: 'File New Claim', claimNumber: 'Claim No.', submitted: 'Submitted',
    approved: 'Approved', rejected: 'Rejected', settled: 'Settled',
  },

  hi: {
    home: 'होम', plans: 'प्लान्स', claims: 'क्लेम्स', chat: 'सहायता', profile: 'प्रोफाइल',
    quotes: 'कोट्स', policies: 'पॉलिसीज', customers: 'ग्राहक', renewals: 'नवीनीकरण',
    settings: 'सेटिंग्स', language: 'भाषा', selectLanguage: 'पसंदीदा भाषा चुनें',
    changeLanguage: 'ऐप की भाषा बदलें', save: 'सहेजें', cancel: 'रद्द करें', confirm: 'पुष्टि करें',
    back: 'वापस', logout: 'लॉग आउट', deleteAccount: 'खाता हटाएं', search: 'खोजें',
    filter: 'फ़िल्टर', viewAll: 'सभी देखें', loading: 'लोड हो रहा है...', error: 'त्रुटि',
    success: 'सफलता', urgent: 'अति आवश्यक', welcomeTitle: 'जो सबसे महत्वपूर्ण है उसकी सुरक्षा करें',
    quickQuote: 'तुरंत कोट प्राप्त करें', myPoliciesSummary: 'मेरी सक्रिय पॉलिसी',
    popularCategories: 'लोकप्रिय बीमा प्रकार', healthInsurance: 'स्वास्थ्य बीमा',
    motorInsurance: 'वाहन बीमा', lifeInsurance: 'जीवन बीमा', travelInsurance: 'यात्रा बीमा',
    homeInsurance: 'गृह बीमा', businessInsurance: 'व्यापार बीमा', helpFaq: 'सहायता और अक्सर पूछे जाने वाले प्रश्न',
    contactSupport: 'सपोर्ट से संपर्क करें', privacyPolicy: 'गोपनीयता नीति', termsOfService: 'सेवा की शर्तें',
    verified: 'सत्यापित', totalPaid: 'कुल भुगतान', totalClaims: 'कुल दावा',
    agentPortal: 'एजेंट पोर्टल', updateProgress: 'प्रगति अपडेट करें', call: 'कॉल करें',
    whatsapp: 'व्हाट्सएप', daysLeft: 'दिन शेष', expired: 'समाप्त', pending: 'लंबित',
    contacted: 'संपर्क किया', closed: 'बंद किया गया', lost: 'अस्वीकृत', notes: 'टिप्पणियां',
    fileNewClaim: 'नया दावा दायर करें', claimNumber: 'दावा संख्या', submitted: 'जमा किया गया',
    approved: 'स्वीकृत', rejected: 'अस्वीकृत', settled: 'निपटाया गया',
  },

  mr: {
    home: 'मुख्यपृष्ठ', plans: 'योजना', claims: 'दावे', chat: 'मदत', profile: 'प्रोफाइल',
    quotes: 'कोटेशन्स', policies: 'पॉलिसीज', customers: 'ग्राहक', renewals: 'नूतनीकरण',
    settings: 'सेटिंग्ज', language: 'भाषा', selectLanguage: 'पसंतीची भाषा निवडा',
    changeLanguage: 'अ‍ॅपची भाषा बदला', save: 'जतन करा', cancel: 'रद्द करा', confirm: 'खात्री करा',
    back: 'मागे', logout: 'लॉग आउट', deleteAccount: 'खाते हटवा', search: 'शोधा',
    filter: 'फिल्टर', viewAll: 'सर्व पहा', loading: 'लोड होत आहे...', error: 'त्रुटी',
    success: 'यशस्वी', urgent: 'तातडीचे', welcomeTitle: 'सर्वात महत्त्वाच्या गोष्टीचे संरक्षण करा',
    quickQuote: 'झटपट कोट मिळवा', myPoliciesSummary: 'माझ्या सक्रिय पॉलिसी',
    popularCategories: 'लोकप्रिय विमा प्रकार', healthInsurance: 'आरोग्य विमा',
    motorInsurance: 'वाहन विमा', lifeInsurance: 'आयुष्य विमा', travelInsurance: 'प्रवास विमा',
    homeInsurance: 'घर विमा', businessInsurance: 'व्यवसाय विमा', helpFaq: 'मदत आणि वारंवार विचारलेले प्रश्न',
    contactSupport: 'सपोर्टशी संपर्क साधा', privacyPolicy: 'गोपनीयता धोरण', termsOfService: 'सेवा अटी',
    verified: 'सत्यशोधित', totalPaid: 'एकूण भरलेले', totalClaims: 'एकूण दावे',
    agentPortal: 'एजंट पोर्टल', updateProgress: 'प्रगती अपडेट करा', call: 'कॉल करा',
    whatsapp: 'व्हॉट्सअ‍ॅप', daysLeft: 'दिवस बाकी', expired: 'मुदत संपली', pending: 'प्रलंबित',
    contacted: 'संपर्क साधला', closed: 'पूर्ण झाले', lost: 'रद्द झाले', notes: 'टीपा',
    fileNewClaim: 'नवीन दावा दाखल करा', claimNumber: 'दावा क्रमांक', submitted: 'सादर केले',
    approved: 'मंजूर', rejected: 'नाकारले', settled: 'पूर्ण झाले',
  },

  gu: {
    home: 'હોમ', plans: 'પ્લાન્સ', claims: 'ક્લેમ્સ', chat: 'સપોર્ટ', profile: 'પ્રોફાઇલ',
    quotes: 'કોટ્સ', policies: 'પોલિસીઝ', customers: 'ગ્રાહકો', renewals: 'રિન્યુઅલ',
    settings: 'સેટિંગ્સ', language: 'ભાષા', selectLanguage: 'પસંદગીની ભાષા ચૂંટો',
    changeLanguage: 'એપની ભાષા બદલો', save: 'સાચવો', cancel: 'રદ કરો', confirm: 'કન્ફર્મ કરો',
    back: 'પાછા જાવ', logout: 'લોગ આઉટ', deleteAccount: 'ખાતું કાઢી નાખો', search: 'શોધો',
    filter: 'ફિલ્ટર', viewAll: 'બધું જુઓ', loading: 'લોડ થઈ રહ્યું છે...', error: 'ભૂલ',
    success: 'સફળ', urgent: 'અતિ મહત્વનું', welcomeTitle: 'સૌથી મહત્વપૂર્ણ વસ્તુનું રક્ષણ કરો',
    quickQuote: 'તરત જ કોટ મેળવો', myPoliciesSummary: 'મારી સક્રિય પોલિસીઝ',
    popularCategories: 'લોકપ્રિય વીમા પ્રકારો', healthInsurance: 'હેલ્થ ઇન્સ્યુરન્સ',
    motorInsurance: 'મોટર ઇન્સ્યુરન્સ', lifeInsurance: 'લાઈફ ઇન્સ્યુરન્સ', travelInsurance: 'ટ્રાવેલ ઇન્સ્યુરન્સ',
    homeInsurance: 'હોમ ઇન્સ્યુરન્સ', businessInsurance: 'બિઝનેસ ઇન્સ્યુરન્સ', helpFaq: 'મદદ અને પ્રશ્નો',
    contactSupport: 'સપોર્ટનો સંપર્ક કરો', privacyPolicy: 'પ્રાઈવસી પોલિસી', termsOfService: 'સેવાની શરતો',
    verified: 'ચકાસાયેલ', totalPaid: 'કુલ ચૂકવેલ', totalClaims: 'કુલ ક્લેમ્સ',
    agentPortal: 'એજન્ટ પોર્ટલ', updateProgress: 'પ્રગતિ અપડેટ કરો', call: 'કોલ કરો',
    whatsapp: 'વોટ્સએપ', daysLeft: 'દિવસો બાકી', expired: 'સમાપ્ત', pending: 'પેન્ડિંગ',
    contacted: 'સંપર્ક કર્યો', closed: 'બંધ થયું', lost: 'રદ થયું', notes: 'નોંધો',
    fileNewClaim: 'નવો ક્લેમ કરો', claimNumber: 'ક્લેમ નં.', submitted: 'સબમિટ કર્યું',
    approved: 'મંજૂર', rejected: 'નામંજૂર', settled: 'સેટલ થયું',
  },

  ta: {
    home: 'முகப்பு', plans: 'திட்டங்கள்', claims: 'கோரிக்கைகள்', chat: 'உதவி', profile: 'சுயவிவரம்',
    quotes: 'மதிப்பீடுகள்', policies: 'கொள்கைகள்', customers: 'வாடிக்கையாளர்கள்', renewals: 'புதுப்பித்தல்கள்',
    settings: 'அமைப்புகள்', language: 'மொழி', selectLanguage: 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    changeLanguage: 'செயலி மொழியை மாற்றவும்', save: 'சேமிக்க', cancel: 'ரத்து செய்', confirm: 'உறுதி செய்',
    back: 'பின்செல்', logout: 'வெளியேறு', deleteAccount: 'கணக்கை நீக்கு', search: 'தேடுக',
    filter: 'வடிகட்டல்', viewAll: 'அனைத்தையும் காண்க', loading: 'ஏற்றப்படுகிறது...', error: 'பிழை',
    success: 'வெற்றி', urgent: 'அவசரம்', welcomeTitle: 'மிக முக்கியமானவைகளைப் பாதுகாக்கவும்',
    quickQuote: 'உடனடி மதிப்பீடு பெறுக', myPoliciesSummary: 'எனது செயலில் உள்ள பாலிசிகள்',
    popularCategories: 'பிரபலமான காப்பீட்டு வகைகள்', healthInsurance: 'சுகாதார காப்பீடு',
    motorInsurance: 'வாகன காப்பீடு', lifeInsurance: 'ஆயுள் காப்பீடு', travelInsurance: 'பயண காப்பீடு',
    homeInsurance: 'வீட்டு காப்பீடு', businessInsurance: 'வணிக காப்பீடு', helpFaq: 'உதவி மற்றும் கேள்வி பதில்கள்',
    contactSupport: 'ஆதரவைத் தொடர்பு கொள்ளவும்', privacyPolicy: 'தனியுரிமைக் கொள்கை', termsOfService: 'சேவை விதிமுறைகள்',
    verified: 'சரிபார்க்கப்பட்டது', totalPaid: 'மொத்தம் செலுத்தியது', totalClaims: 'மொத்த கோரிக்கைகள்',
    agentPortal: 'முகவர் போர்டல்', updateProgress: 'முன்னேற்றத்தைப் புதுப்பிக்கவும்', call: 'அழைக்க',
    whatsapp: 'வாட்ஸ்அப்', daysLeft: 'நாட்கள் உள்ளன', expired: 'காலாவதியானது', pending: 'நிலுவையில் உள்ளது',
    contacted: 'தொடர்பு கொள்ளப்பட்டது', closed: 'முடிந்தது', lost: 'இழக்கப்பட்டது', notes: 'குறிப்புகள்',
    fileNewClaim: 'புதிய கோரிக்கையைத் தாக்கல் செய்', claimNumber: 'கோரிக்கை எண்', submitted: 'சமர்ப்பிக்கப்பட்டது',
    approved: 'ஒப்புதலளிக்கப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது', settled: 'தீர்க்கப்பட்டது',
  },

  te: {
    home: 'హోమ్', plans: 'ప్లాన్‌లు', claims: 'క్లెయిమ్‌లు', chat: 'సహాయం', profile: 'ప్రొఫైల్',
    quotes: 'కోట్స్', policies: 'పాలిసీలు', customers: 'వినియోగదారులు', renewals: 'నవీకరణలు',
    settings: 'సెట్టింగ్‌లు', language: 'భాష', selectLanguage: 'అభిమత భాషను ఎంచుకోండి',
    changeLanguage: 'యాప్ భాషను మార్చండి', save: 'సేవ్ చేయి', cancel: 'రద్దు చేయి', confirm: 'ధృవీకరించు',
    back: 'వెనుకకు', logout: 'లాగ్ అవుట్', deleteAccount: 'ఖాతాను తొలగించు', search: 'వెతకండి',
    filter: 'ఫిల్టర్', viewAll: 'అన్నీ చూడండి', loading: 'లోడ్ అవుతోంది...', error: 'లోపం',
    success: 'విజయం', urgent: 'అత్యవసరం', welcomeTitle: 'అత్యంత ముఖ్యమైన దానిని రక్షించండి',
    quickQuote: 'తక్షణ కోట్ పొందండి', myPoliciesSummary: 'నా క్రియాశీల పాలిసీలు',
    popularCategories: 'ప్రసిద్ధ భీమా రకాలు', healthInsurance: 'ఆరోగ్య భీమా',
    motorInsurance: 'వాహన భీమా', lifeInsurance: 'జీవిత భీమా', travelInsurance: 'ప్రయాణ భీమా',
    homeInsurance: 'ఇంటి భీమా', businessInsurance: 'వ్యాపార భీమా', helpFaq: 'సహాయం & తరచుగా అడిగే ప్రశ్నలు',
    contactSupport: 'సపోర్ట్‌ను సంప్రదించండి', privacyPolicy: 'గోప్యతా విధానం', termsOfService: 'సేవా నిబంధనలు',
    verified: 'నిర్ధారించబడింది', totalPaid: 'మొత్తం చెల్లించినది', totalClaims: 'మొత్తం క్లెయిమ్‌లు',
    agentPortal: 'ఏజెంట్ పోర్టల్', updateProgress: 'పురోగతిని అప్‌డేట్ చేయండి', call: 'కాల్ చేయండి',
    whatsapp: 'వాట్సాప్', daysLeft: 'రోజులు మిగిలి ఉన్నాయి', expired: 'గడువు ముగిసింది', pending: 'పెండింగ్‌లో ఉంది',
    contacted: 'సంప్రదించబడింది', closed: 'ముగిసింది', lost: 'కోల్పోయింది', notes: 'గమనికలు',
    fileNewClaim: 'కొత్త క్లెయిమ్‌ దాఖలు చేయండి', claimNumber: 'క్లెయిమ్ సంఖ్య', submitted: 'సమర్పించబడింది',
    approved: 'ఆమోదించబడింది', rejected: 'తిరస్కరించబడింది', settled: 'పరిష్కరించబడింది',
  },

  bn: {
    home: 'হোম', plans: 'প্ল্যানসমূহ', claims: 'দাবিসমূহ', chat: 'সহায়তা', profile: 'প্রোফাইল',
    quotes: 'কোটস', policies: 'পলিসিসমূহ', customers: 'গ্রাহকবৃন্দ', renewals: 'নবীকরণ',
    settings: 'সেটিংস', language: 'ভাষা', selectLanguage: 'পছন্দের ভাষা নির্বাচন করুন',
    changeLanguage: 'অ্যাপের ভাষা পরিবর্তন করুন', save: 'সংরক্ষণ করুন', cancel: 'বাতিল', confirm: 'নিশ্চিত করুন',
    back: 'ফিরে যান', logout: 'লগ আউট', deleteAccount: 'একাউন্ট মুছে ফেলুন', search: 'সন্ধান করুন',
    filter: 'ফিল্টার', viewAll: 'সব দেখুন', loading: 'লোড হচ্ছে...', error: 'ত্রুটি',
    success: 'সফল', urgent: 'জরুরি', welcomeTitle: 'সবচেয়ে গুরুত্বপূর্ণ যা তা সুরক্ষিত করুন',
    quickQuote: 'তাত্ক্ষণিক কোট পান', myPoliciesSummary: 'আমার সক্রিয় পলিসি',
    popularCategories: 'জনপ্রিয় বিমার ধরণ', healthInsurance: 'স্বাস্থ্য বিমা',
    motorInsurance: 'যানবাহন বিমা', lifeInsurance: 'জীবন বিমা', travelInsurance: 'ভ্রমণ বিমা',
    homeInsurance: 'গৃহ বিমা', businessInsurance: 'ব্যবসা বিমা', helpFaq: 'সহায়তা ও প্রশ্নোত্তর',
    contactSupport: 'সহায়তায় যোগাযোগ করুন', privacyPolicy: 'গোপনীয়তা নীতি', termsOfService: 'সেবার শর্তাবলী',
    verified: 'যাচাইকৃত', totalPaid: 'মোট পরিশোধিত', totalClaims: 'মোট দাবি',
    agentPortal: 'এজেন্ট পোর্টাল', updateProgress: 'অগ্রগতি আপডেট করুন', call: 'কল করুন',
    whatsapp: 'হোয়াটসঅ্যাপ', daysLeft: 'দিন বাকি', expired: 'মেয়াদউত্তীর্ণ', pending: 'বিবেচনাধীন',
    contacted: 'যোগাযোগ করা হয়েছে', closed: 'সম্পন্ন', lost: 'বাতিল', notes: 'নোটসমূহ',
    fileNewClaim: 'নতুন দাবি পেশ করুন', claimNumber: 'দাবি নং', submitted: 'জমা দেওয়া হয়েছে',
    approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত', settled: 'নিষ্পত্তি হয়েছে',
  },

  kn: {
    home: 'ಮುಖಪುಟ', plans: 'ಯೋಜನೆಗಳು', claims: 'ಹಕ್ಕುಗಳು', chat: 'ನೆರವು', profile: 'ಪ್ರೊಫೈಲ್',
    quotes: 'ಕೋಟ್‌ಗಳು', policies: 'ಪಾಲಿಸಿಗಳು', customers: 'ಗ್ರಾಹಕರು', renewals: 'ನವೀಕರಣಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', language: 'ಭಾಷೆ', selectLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    changeLanguage: 'ಆ್ಯಪ್ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ', confirm: 'ಖಚಿತಪಡಿಸಿ',
    back: 'ಹಿಂತಿರುಗಿ', logout: 'ಲಾಗ್ ಔಟ್', deleteAccount: 'ಖಾತೆಯನ್ನು ಅಳಿಸಿ', search: 'ಹುಡುಕಿ',
    filter: 'ಫಿಲ್ಟರ್', viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', error: 'ದೋಷ',
    success: 'ಯಶಸ್ಸು', urgent: 'ತುರ್ತು', welcomeTitle: 'ಅತ್ಯಂತ ಪ್ರಮುಖವಾದದ್ದನ್ನು ರಕ್ಷಿಸಿ',
    quickQuote: 'ತಕ್ಷಣದ ಕೋಟ್ ಪಡೆಯಿರಿ', myPoliciesSummary: 'ನನ್ನ ಸಕ್ರಿಯ ಪಾಲಿಸಿಗಳು',
    popularCategories: 'ಜನಪ್ರಿಯ ವಿಮೆ ವಿಧಗಳು', healthInsurance: 'ಆರೋಗ್ಯ ವಿಮೆ',
    motorInsurance: 'ವಾಹನ ವಿಮೆ', lifeInsurance: 'ಜೀವನ ವಿಮೆ', travelInsurance: 'ಪ್ರಯಾಣ ವಿಮೆ',
    homeInsurance: 'ಮನೆ ವಿಮೆ', businessInsurance: 'ವ್ಯಾಪಾರ ವಿಮೆ', helpFaq: 'ಸಹಾಯ ಮತ್ತು FAQ',
    contactSupport: 'ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ', privacyPolicy: 'ಗೌಪ್ಯತಾ ನೀತಿ', termsOfService: 'ಸೇವಾ ನಿಯಮಗಳು',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ', totalPaid: 'ಒಟ್ಟು ಪಾವತಿಸಲಾಗಿದೆ', totalClaims: 'ಒಟ್ಟು ಹಕ್ಕುಗಳು',
    agentPortal: 'ಏಜೆಂಟ್ ಪೋರ್ಟಲ್', updateProgress: 'ಪ್ರಗತಿಯನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ', call: 'ಕಾಲ್ ಮಾಡಿ',
    whatsapp: 'ವಾಟ್ಸಾಪ್', daysLeft: 'ದಿನಗಳು ಬಾಕಿ ಇವೆ', expired: 'ಅವಧಿ ಮುಗಿದಿದೆ', pending: 'ಬಾಕಿ ಇದೆ',
    contacted: 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ', closed: 'ಪೂರ್ಣಗೊಂಡಿದೆ', lost: 'ರದ್ದಾಗಿದೆ', notes: 'ಟಿಪ್ಪಣಿಗಳು',
    fileNewClaim: 'ಹೊಸ ಹಕ್ಕನ್ನು ಸಲ್ಲಿಸಿ', claimNumber: 'ಹಕ್ಕು ಸಂಖ್ಯೆ', submitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
    approved: 'ಅನುಮೋದಿಸಲಾಗಿದೆ', rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ', settled: 'ಇತ್ಯರ್ಥವಾಗಿದೆ',
  },
};

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  currentLangMeta: LanguageOption;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<LanguageCode>('en');

  useEffect(() => {
    (async () => {
      try {
        const prefs = await getPrefs();
        if (prefs?.language && translations[prefs.language as LanguageCode]) {
          setLangState(prefs.language as LanguageCode);
        }
      } catch {}
    })();
  }, []);

  const setLanguage = async (code: LanguageCode) => {
    setLangState(code);
    await setPrefs({ language: code });
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || fallback || translations.en[key] || key;
  };

  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangMeta }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function LanguagePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={lp.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={lp.sheet}>
          <View style={lp.header}>
            <Text style={lp.title}>{t('selectLanguage', 'Select Preferred Language')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close-circle" size={24} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView style={lp.scroll} showsVerticalScrollIndicator={false}>
            {SUPPORTED_LANGUAGES.map(item => {
              const selected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[lp.item, selected && lp.itemSelected]}
                  onPress={async () => {
                    await setLanguage(item.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={lp.flag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[lp.name, selected && lp.nameSelected]}>{item.name}</Text>
                    <Text style={lp.nativeName}>{item.nativeName}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const lp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { maxHeight: 400 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 8, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  itemSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  flag: { fontSize: 24 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  nameSelected: { color: Colors.primary },
  nativeName: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
});
