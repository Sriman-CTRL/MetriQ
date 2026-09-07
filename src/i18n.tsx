import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'mr';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    portalTitle: 'Legal Metrology Department',
    portalSubtitle: 'National Digital Verification & Certification Platform',
    home: 'Home',
    verify: 'Verify Certificate',
    track: 'Track Status',
    apply: 'Apply Online',
    services: 'Services',
    demo: 'Judge Showcase',
    dashboard: 'Dashboard',
    logout: 'Logout',
    switchRole: 'Switch Persona',
    notifications: 'Notifications',
    statutoryNotice: 'Statutory Verification under Legal Metrology Act, 2009',
    verifyHeading: 'Verify Weights & Measures Certificate',
    verifySubtitle: 'Instant cryptographic verification against National Central Registry',
    searchPlaceholder: 'Enter Certificate Number (e.g. LM-HYD-2026-000184) or Instrument ID',
    verifyBtn: 'Verify Certificate',
    scanQrBtn: 'Scan QR Camera',
    uploadQrBtn: 'Upload QR File',
    reportViolation: 'Report Short-Weighing / Broken Seal',
    diagnosticsTitle: 'Platform System Diagnostics',
    resetDemo: 'Reset Demo Database',
    validCert: 'CERTIFICATE AUTHENTIC & VALID',
    tamperedCert: 'PHYSICAL TAMPERING DETECTED',
    expiredCert: 'CERTIFICATE EXPIRED - RE-VERIFICATION REQUIRED',
    printCert: 'Print Official Certificate',
    downloadPdf: 'Download PDF',
    shareVerification: 'Share Link',
  },
  hi: {
    portalTitle: 'विधिक मापविज्ञान विभाग',
    portalSubtitle: 'राष्ट्रीय डिजिटल सत्यापन एवं प्रमाणन मंच',
    home: 'मुख्य पृष्ठ',
    verify: 'प्रमाणपत्र सत्यापन',
    track: 'स्थिति ट्रैक करें',
    apply: 'ऑनलाइन आवेदन',
    services: 'सेवाएं',
    demo: 'जज डेमो प्रदर्शन',
    dashboard: 'डैशबोर्ड',
    logout: 'लॉग आउट',
    switchRole: 'भूमिका बदलें',
    notifications: 'सूचनाएं',
    statutoryNotice: 'विधिक मापविज्ञान अधिनियम, 2009 के अंतर्गत सांविधिक सत्यापन',
    verifyHeading: 'बाट और माप डिजिटल प्रमाणपत्र सत्यापन',
    verifySubtitle: 'राष्ट्रीय केंद्रीय रजिस्ट्री के विरुद्ध तत्काल क्रिप्टोग्राफिक सत्यापन',
    searchPlaceholder: 'प्रमाणपत्र संख्या दर्ज करें (जैसे LM-HYD-2026-000184)',
    verifyBtn: 'सत्यापन करें',
    scanQrBtn: 'क्यूआर कैमरा स्कैन',
    uploadQrBtn: 'क्यूआर फ़ाइल अपलोड',
    reportViolation: 'कम तौल या टूटी सील की शिकायत करें',
    diagnosticsTitle: 'प्लेटफ़ॉर्म सिस्टम डायग्नोस्टिक्स',
    resetDemo: 'डेमो डेटा रीसेट करें',
    validCert: 'प्रमाणपत्र प्रामाणिक और वैध है',
    tamperedCert: 'भौतिक छेड़छाड़ का पता चला',
    expiredCert: 'प्रमाणपत्र समाप्त - पुनः सत्यापन आवश्यक',
    printCert: 'आधिकारिक प्रमाणपत्र प्रिंट करें',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    shareVerification: 'सत्यापन लिंक साझा करें',
  },
  te: {
    portalTitle: 'లీగల్ మెట్రాలజీ విభాగం',
    portalSubtitle: 'జాతీయ డిజిటల్ ధృవీకరణ మరియు సర్టిఫికేషన్ పోర్టల్',
    home: 'హోమ్',
    verify: 'సర్టిఫికేట్ ధృవీకరణ',
    track: 'స్థితిని ట్రాక్ చేయండి',
    apply: 'ఆన్‌లైన్ దరఖాస్తు',
    services: 'సేవలు',
    demo: 'జడ్జ్ డెమో షోకేస్',
    dashboard: 'డాష్‌బోర్డ్',
    logout: 'లాగౌట్',
    switchRole: 'పాత్రను మార్చండి',
    notifications: 'నోటిఫికేషన్లు',
    statutoryNotice: 'లీగల్ మెట్రాలజీ చట్టం, 2009 ప్రకారం చట్టబద్ధమైన ధృవీకరణ',
    verifyHeading: 'తూనికలు మరియు కొలతల డిజిటల్ సర్టిఫికేట్ ధృవీకరణ',
    verifySubtitle: 'కేంద్ర రిజిస్ట్రీతో తక్షణ క్రిప్టోగ్రాఫిక్ నిరూపణ',
    searchPlaceholder: 'సర్టిఫికేట్ సంఖ్యను నమోదు చేయండి (ఉదా. LM-HYD-2026-000184)',
    verifyBtn: 'ధృవీకరించండి',
    scanQrBtn: 'QR కెమెరా స్కాన్',
    uploadQrBtn: 'QR ఫైల్ అప్‌లోడ్',
    reportViolation: 'తక్కువ తూకం లేదా సీల్ ఉల్లంఘనను నివేదించండి',
    diagnosticsTitle: 'సిస్టమ్ డయాగ్నోస్టిక్స్',
    resetDemo: 'డెమో డేటా రీసెట్',
    validCert: 'సర్టిఫికేట్ చెల్లుబాటులో ఉంది',
    tamperedCert: 'సీల్ ట్యాంపరింగ్ గుర్తించబడింది',
    expiredCert: 'గడువు ముగిసింది - పునఃపరిశీలన అవసరం',
    printCert: 'సర్టిఫికేట్ ప్రింట్ చేయండి',
    downloadPdf: 'PDF డౌన్‌లోడ్',
    shareVerification: 'లింక్ షేర్ చేయండి',
  },
  ta: {
    portalTitle: 'சட்ட அளவியல் துறை',
    portalSubtitle: 'தேசிய டிஜிட்டல் சரிபார்ப்பு மற்றும் சான்றிதழ் தளம்',
    home: 'முகப்பு',
    verify: 'சான்றிதழ் சரிபார்ப்பு',
    track: 'நிலையை கண்காணிக்கவும்',
    apply: 'ஆன்லைனில் விண்ணப்பிக்கவும்',
    services: 'சேவைகள்',
    demo: 'மதிப்பீட்டாளர் டெமோ',
    dashboard: 'டாஷ்போர்டு',
    logout: 'வெளியேறு',
    switchRole: 'பங்கை மாற்றவும்',
    notifications: 'அறிவிப்புகள்',
    statutoryNotice: 'சட்ட அளவியல் சட்டம், 2009-ன் கீழ் சட்டப்பூர்வ சரிபார்ப்பு',
    verifyHeading: 'எடைகள் மற்றும் அளவைகள் சான்றிதழ் சரிபார்ப்பு',
    verifySubtitle: 'தேசிய பதிவேடு மூலம் உடனடி பாதுகாப்பான சரிபார்ப்பு',
    searchPlaceholder: 'சான்றிதழ் எண்ணை உள்ளிடவும் (எ.கா. LM-HYD-2026-000184)',
    verifyBtn: 'சரிபார்க்கவும்',
    scanQrBtn: 'QR கேமரா ஸ்கேன்',
    uploadQrBtn: 'QR கோப்பை பதிவேற்றவும்',
    reportViolation: 'குறைந்த எடை அல்லது முத்திரை சேதத்தை புகாரளிக்கவும்',
    diagnosticsTitle: 'கணினி கண்டறிதல்',
    resetDemo: 'டெமோவை மீட்டமைக்கவும்',
    validCert: 'சான்றிதழ் உண்மையானது மற்றும் செல்லுபடியாகும்',
    tamperedCert: 'முத்திரை சேதம் கண்டறியப்பட்டது',
    expiredCert: 'காலாவதியானது - மறு சரிபார்ப்பு தேவை',
    printCert: 'சான்றிதழை அச்சிடுக',
    downloadPdf: 'PDF பதிவிறக்கம்',
    shareVerification: 'இணைப்பைப் பகிரவும்',
  },
  mr: {
    portalTitle: 'कायदेशीर मापनशास्त्र विभाग',
    portalSubtitle: 'राष्ट्रीय डिजिटल पडताळणी आणि प्रमाणपत्र पोर्टल',
    home: 'मुख्यपृष्ठ',
    verify: 'प्रमाणपत्र पडताळणी',
    track: 'स्थिती तपासा',
    apply: 'ऑनलाइन अर्ज',
    services: 'सेवा',
    demo: 'परीक्षक डेमो शोकेस',
    dashboard: 'डॅशबोर्ड',
    logout: 'लॉगआउट',
    switchRole: 'भूमिका बदला',
    notifications: 'सूचना',
    statutoryNotice: 'कायदेशीर मापनशास्त्र अधिनियम, 2009 अंतर्गत वैधानिक पडताळणी',
    verifyHeading: 'वजने आणि मापे डिजिटल प्रमाणपत्र पडताळणी',
    verifySubtitle: 'मध्यवर्ती नोंदणीसह तात्काळ क्रिप्टोग्राफिक पडताळणी',
    searchPlaceholder: 'प्रमाणपत्र क्रमांक प्रविष्ट करा (उदा. LM-HYD-2026-000184)',
    verifyBtn: 'पडताळणी करा',
    scanQrBtn: 'QR कॅमेरा स्कॅन',
    uploadQrBtn: 'QR फाईल अपलोड',
    reportViolation: 'कमी वजन किंवा छेडछाड केलेली सील तक्रार करा',
    diagnosticsTitle: 'प्रणाली डायग्नोस्टिक्स',
    resetDemo: 'डेमो डेटा रीसेट करा',
    validCert: 'प्रमाणपत्र अस्सल आणि वैध आहे',
    tamperedCert: 'छेडछाड आढळली',
    expiredCert: 'कालबाह्य झाले - पुनर्रपडताळणी आवश्यक',
    printCert: 'प्रमाणपत्र मुद्रित करा',
    downloadPdf: 'PDF डाउनलोड करा',
    shareVerification: 'लिंक शेअर करा',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('metriq-lang') as Language) || 'en';
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('metriq-lang', l);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
