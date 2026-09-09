/**
 * Multilingual Knowledge Base and Guardrail Rules for NyayaSahayak.
 * Strictly covers platform workflows (Case Creation, Evidence Custody, Document Vault,
 * Charge Sheet Filing, Court Proceedings, Judgments, Legal Holds, and Audits).
 *
 * Guardrails: Strictly refuses to disclose source code, credentials, architecture,
 * database tables, or how the system was developed.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
];

// Guardrail check: detect questions about tech stack, source code, passwords, architecture, etc.
export const isSecurityOrArchitectureQuery = (text = '') => {
  const lower = text.toLowerCase();
  const forbiddenPatterns = [
    'how is this system made',
    'how was this built',
    'source code',
    'github',
    'spring boot',
    'react',
    'database password',
    'jwt secret',
    'api key',
    'backend code',
    'frontend code',
    'how to hack',
    'system architecture',
    'database schema',
    'show tables',
    'sql injection',
    'admin credentials',
    'कोड दिखाओ',
    'सिस्टम कैसे बना',
    'पासवर्ड क्या है',
    'सोर्स कोड',
    'किवें बनाया'
  ];
  return forbiddenPatterns.some(pattern => lower.includes(pattern));
};

export const GUARDRAIL_REFUSAL_MESSAGES = {
  en: "🛡️ **Operational Notice**: I am **Saarthi**, your workflow navigation assistant. For security protocols, I only provide guidance on using the platform (such as Case Creation, Evidence Custody, Charge Sheet Filing, and Court Proceedings). I do not provide technical implementation details, source code, or internal architecture. How can I help you navigate the system?",
  hi: "🛡️ **सुरक्षा सूचना**: मैं **सारथी (Saarthi)** हूँ, आपका कार्यप्रणाली सहायक। सुरक्षा प्रोटोकॉल के तहत, मैं केवल सिस्टम के उपयोग (जैसे केस बनाना, सबूत कस्टडी, चार्जशीट दाखिल करना और अदालत की कार्यवाही) में मदद कर सकता हूँ। मैं सिस्टम के तकनीकी कोड, डेटाबेस या बनावट की जानकारी नहीं दे सकता। कृपया बताएं मैं किस प्रक्रिया में आपकी मदद करूँ?",
  bn: "🛡️ **নিরাপত্তা বিজ্ঞপ্তি**: আমি **সারথি (Saarthi)**, আপনার সিস্টেম নির্দেশিকা সহকারী। আমি কেবল সিস্টেম ব্যবহারের নির্দেশিকা প্রদান করি (যেমন নতুন কেস তৈরি, প্রমাণের হেফাজত, চার্জশিট জমা ও আদালতের প্রক্রিয়া)। সিস্টেম তৈরির অভ্যন্তরীণ কোড বা প্রযুক্তিগত বিশদ আমি প্রকাশ করি না। আপনি কোন প্রক্রিয়ায় সহায়তা চান?",
  mr: "🛡️ **सुरक्षा सूचना**: मी **सारथी (Saarthi)** आहे, आपला कार्यप्रणाली मार्गदर्शक. सुरक्षेच्या कारणास्तव, मी फक्त प्रणालीच्या वापराबद्दल मार्गदर्शन करतो (उदा. नवीन केस तयार करणे, पुरावा हस्तांतरण, चार्जशीट दाखल करणे आणि न्यायालयीन कामकाज). मी प्रणालीचे कोडिंग किंवा तांत्रिक रचना सांगत नाही. आपल्याला कोणत्या कामात मदत हवी आहे?",
  ta: "🛡️ **பாதுகாப்பு அறிவிப்பு**: நான் **சாரதி (Saarthi)**, உங்கள் வழிகாட்டி உதவியாளர். பாதுகாப்பு நெறிமுறைகளின்படி, இந்த அமைப்பைப் பயன்படுத்துவதற்கான வழிகாட்டலை மட்டுமே வழங்குகிறேன் (வழக்கு பதிவு, சான்று பாதுகாப்பு, குற்றப்பத்திரிகை தாக்கல் மற்றும் நீதிமன்ற நடவடிக்கைகள்). இதன் மூல நிரல் அல்லது தொழில்நுட்ப விவரங்களை நான் வழங்குவதில்லை. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
  te: "🛡️ **భద్రతా సూచన**: నేను **సారథి (Saarthi)**, మీ సిస్టమ్ నావిగేషన్ అసిస్టెంట్. భద్రతా నిబంధనల ప్రకారం, నేను ఈ సిస్టమ్ ఉపయోగించే విధానంపై మాత్రమే మార్గదర్శనం చేస్తాను (కేసు నమోదు, సాక్ష్యాల సంరక్షణ, ఛార్జిషీట్ దాఖలు మరియు న్యాయస్థాన విచారణలు). సిస్టమ్ కోడ్ లేదా సాంకేతిక వివరాలను నేను వెల్లడించను. మీకు ఏ ప్రక్రియలో సహాయం కావాలి?",
  gu: "🛡️ **સુરક્ષા સૂચના**: હું **સારથી (Saarthi)** છું, તમારો સહાયક. સુરક્ષા નિયમો મુજબ, હું ફક્ત સિસ્ટમના ઉપયોગ વિશે માર્ગદર્શન આપું છું (જેમ કે નવો કેસ બનાવવો, પુરાવા કસ્ટડી, ચાર્જશીટ દાખલ કરવી અને અદાલતી કાર્યવાહી). હું સિસ્ટમનું કોડિંગ કે તકનીકી વિગતો આપતો નથી. હું તમને કઈ પ્રક્રિયામાં મદદ કરી શકું?",
  kn: "🛡️ **ಸುರಕ್ಷತಾ ಸೂಚನೆ**: ನಾನು **ಸಾರಥಿ (Saarthi)**, ನಿಮ್ಮ ಸಿಸ್ಟಮ್ ಮಾರ್ಗದರ್ಶಿ. ಭದ್ರತಾ ನಿಯಮಗಳ ಪ್ರಕಾರ, ನಾನು ಸಿಸ್ಟಮ್ ಬಳಸುವ ವಿಧಾನವನ್ನು ಮಾತ್ರ ವಿವರಿಸಬಲ್ಲೆ (ಹೊಸ ಕೇಸ್ ರಚನೆ, ಸಾಕ್ಷ್ಯಗಳ ರಕ್ಷಣೆ, ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಕೆ ಮತ್ತು ನ್ಯಾಯಾಲಯದ ವಿಚಾರಣೆಗಳು). ನಾನು ತಾಂತ್ರಿಕ ಕೋಡ್ ಅಥವಾ ಆಂತರಿಕ ರಚನೆಯ ವಿವರಗಳನ್ನು ನೀಡುವುದಿಲ್ಲ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
  ml: "🛡️ **സുരക്ഷാ അറിയിപ്പ്**: ഞാൻ **സാരഥി (Saarthi)**, നിങ്ങളുടെ സഹായകൻ. സിസ്റ്റം ഉപയോഗിക്കുന്നതിനുള്ള നിർദ്ദേശങ്ങൾ മാത്രമേ ഞാൻ നൽകൂ (കേസ് രജിസ്ട്രേഷൻ, തെളിവ് കൈമാറ്റം, കുറ്റപത്രം സമർപ്പിക്കൽ, കോടതി നടപടികൾ). സിസ്റ്റത്തിന്റെ കോഡോ സാങ്കേതിക വിവരങ്ങളോ ഞാൻ പങ്കുവെക്കില്ല. നിങ്ങൾക്ക് ഏത് വിഷയത്തിലാണ് സഹായം വേണ്ടത്?",
  pa: "🛡️ **ਸੁਰੱਖਿਆ ਸੂਚਨਾ**: ਮੈਂ **ਸਾਰਥੀ (Saarthi)** ਹਾਂ, ਤੁਹਾਡਾ ਸਹਾਇਕ। ਸੁਰੱਖਿਆ ਨਿਯਮਾਂ ਅਧੀਨ, ਮੈਂ ਸਿਰਫ਼ ਸਿਸਟਮ ਵਰਤੋਂ ਬਾਰੇ ਮਾਰਗਦਰਸ਼ਨ ਦੇ ਸਕਦਾ ਹਾਂ (ਜਿਵੇਂ ਨਵਾਂ ਕੇਸ ਦਰਜ ਕਰਨਾ, ਸਬੂਤ ਸੰਭਾਲ, ਚਾਰਜਸ਼ੀਟ ਦਾਖਲ ਕਰਨਾ ਅਤੇ ਅਦਾਲਤੀ ਕਾਰਵਾਈ)। ਮੈਂ ਸਿਸਟਮ ਕੋਡਿੰਗ ਜਾਂ ਤਕਨੀਕੀ ਵੇਰਵੇ ਨਹੀਂ ਦੱਸਦਾ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?"
};

export const QUICK_TOPICS = [
  {
    id: 'case_creation',
    title: {
      en: 'Case Creation (New Dossier)',
      hi: 'नया केस बनाना (New Dossier)',
      bn: 'নতুন কেস তৈরি',
      mr: 'नवीन केस तयार करणे',
      ta: 'புதிய வழக்கு பதிவு',
      te: 'కొత్త కేసు నమోదు',
      gu: 'નવો કેસ બનાવવો',
      kn: 'ಹೊಸ ಕೇಸ್ ರಚನೆ',
      ml: 'പുതിയ കേസ് രജിസ്ട്രേഷൻ',
      pa: 'ਨਵਾਂ ਕੇਸ ਬਣਾਉਣਾ'
    },
    icon: 'FolderPlus',
    route: '/cases?new=true'
  },
  {
    id: 'chargesheet_filing',
    title: {
      en: 'Charge Sheet Filing (Sec 173/193)',
      hi: 'चार्जशीट तैयार और दाखिल करना',
      bn: 'চার্জশিট দাখিল ও স্বাক্ষর',
      mr: 'चार्जशीट दाखल करणे',
      ta: 'குற்றப்பத்திரிகை தாக்கல்',
      te: 'ఛార్జిషీట్ దాఖలు',
      gu: 'ચાર્જશીટ દાખલ કરવી',
      kn: 'ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಕೆ',
      ml: 'കുറ്റപത്രം ഫയൽ ചെയ്യൽ',
      pa: 'ਚਾਰਜਸ਼ੀਟ ਦਾਇਰ ਕਰਨਾ'
    },
    icon: 'FileCheck',
    route: '/cases'
  },
  {
    id: 'court_proceedings',
    title: {
      en: 'Court Hearings & Judgment',
      hi: 'अदालत की सुनवाई और फैसला (Judgments)',
      bn: 'আদালতের শুনানি ও রায়',
      mr: 'न्यायालयीन सुनावणी व निकाल',
      ta: 'நீதிமன்ற விசாரணை & தீர்ப்பு',
      te: 'కోర్టు విచారణ & తీర్పు',
      gu: 'કોર્ટ સુનાવણી અને ચુકાદો',
      kn: 'ನ್ಯಾಯಾಲಯ ವಿಚಾರಣೆ & ತೀರ್ಪು',
      ml: 'കോടതി വിചാരണയും വിധിയും',
      pa: 'ਅਦਾਲਤੀ ਸੁਣਵਾਈ ਅਤੇ ਫੈਸਲਾ'
    },
    icon: 'Gavel',
    route: '/court'
  },
  {
    id: 'evidence_custody',
    title: {
      en: 'Evidence & Chain of Custody (Sec 65B)',
      hi: 'सबूत और कस्टडी ट्रांसफर (Chain of Custody)',
      bn: 'প্রমাণ ও হেফাজত স্থানান্তর',
      mr: 'पुरावा व कस्टडी हस्तांतरण',
      ta: 'சான்று மற்றும் பாதுகாப்பு தொடர்ச்சி',
      te: 'సాక్ష్యం & కస్టడీ బదిలీ',
      gu: 'પુરાવા અને કસ્ટડી ટ્રાન્સફર',
      kn: 'ಸಾಕ್ಷ್ಯ ಮತ್ತು ಕಸ್ಟಡಿ ವರ್ಗಾವಣೆ',
      ml: 'തെളിവ് കസ്റ്റഡി ട്രാൻസ്ഫർ',
      pa: 'ਸਬੂਤ ਅਤੇ ਕਸਟਡੀ ਟ੍ਰਾਂਸਫਰ'
    },
    icon: 'ShieldCheck',
    route: '/evidence'
  },
  {
    id: 'legal_hold',
    title: {
      en: 'Legal Hold & Case Retention',
      hi: 'लीगल होल्ड (Legal Hold) नियम',
      bn: 'লিগ্যাল হোল্ড ও ডেটা সুরক্ষা',
      mr: 'कायदेशीर होल्ड (Legal Hold)',
      ta: 'சட்டரீதியான நிறுத்திவைப்பு',
      te: 'లీగల్ హోల్డ్ నిబంధనలు',
      gu: 'કાનૂની હોલ્ડ (Legal Hold)',
      kn: 'ಕಾನೂನು ಹೋಲ್ಡ್ ನಿಯಮಗಳು',
      ml: 'ലീഗൽ ഹോൾഡ്',
      pa: 'ਕਾਨੂੰਨੀ ਹੋਲਡ (Legal Hold)'
    },
    icon: 'Lock',
    route: '/retention-disposal'
  }
];

export const KNOWLEDGE_GUIDES = {
  case_creation: {
    en: {
      title: 'How to Create a New Case / Dossier',
      steps: [
        '1. **Locate the Action**: Click the **"+ New Dossier"** button located in the top navigation bar or navigate to **Case Dossiers (`/cases`)**.',
        '2. **Required Information**: Fill in the **Case Title**, **FIR Number**, **Police Station / Jurisdiction**, and **Date of Incident**.',
        '3. **Legal Acts**: Enter relevant statutory sections (e.g. *IPC/BNS Sections 420, 468, 66D IT Act*).',
        '4. **Priority & Classification**: Set priority (*HIGH*, *CRITICAL*, *MEDIUM*) and select security clearance.',
        '5. **Assign Team**: Allocate the primary Investigating Officer (IO) and assigned unit officers.',
        '6. **Confirm Creation**: Click **"Create Case Dossier"**. The case will be assigned a permanent cryptographically tracked Case ID.'
      ],
      tip: '💡 Tip: Only Senior Officers, Investigators, and Admins possess authorization to register new dossiers.',
      actionRoute: '/cases?new=true',
      actionLabel: 'Open New Case Modal'
    },
    hi: {
      title: 'नया केस या डॉसियर कैसे बनाएं?',
      steps: [
        '1. **बटन ढूंढें**: ऊपरी नेविगेशन बार में **"+ New Dossier"** बटन पर क्लिक करें या **Case Dossiers (`/cases`)** पेज पर जाएं।',
        '2. **आवश्यक विवरण**: **केस का शीर्षक (Title)**, **एफआईआर संख्या (FIR Number)**, **संबंधित थाना (Police Station)** और **घटना की तारीख (Incident Date)** दर्ज करें।',
        '3. **कानूनी धाराएं**: संबंधित धाराएं दर्ज करें (जैसे *IPC/BNS 420, 468, IT Act 66D*)।',
        '4. **प्राथमिकता चुनें**: केस की प्राथमिकता (*CRITICAL*, *HIGH*, *NORMAL*) और सुरक्षा स्तर चुनें।',
        '5. **जांच टीम सौंपें**: मुख्य जांच अधिकारी (IO) और सहयोगी अधिकारियों को नियुक्त करें।',
        '6. **दर्ज करें**: **"Create Case Dossier"** पर क्लिक करें। सिस्टम केस को एक सुरक्षित डिजिटल केस आईडी प्रदान करेगा।'
      ],
      tip: '💡 ध्यान दें: केवल सीनियर ऑफिसर, जांच अधिकारी और एडमिन ही नया केस बना सकते हैं।',
      actionRoute: '/cases?new=true',
      actionLabel: 'नया केस फॉर्म खोलें'
    },
    bn: {
      title: 'কীভাবে নতুন কেস তৈরি করবেন?',
      steps: [
        '1. **বোতাম খুঁজুন**: উপরের বারে **"+ New Dossier"** বাটনে ক্লিক করুন অথবা **Case Dossiers** পেজে যান।',
        '2. **প্রয়োজনীয় তথ্য**: কেসের শিরোনাম, এফআইআর নম্বর, সংশ্লিষ্ট থানা ও ঘটনার তারিখ লিখুন।',
        '3. **আইনি ধারা**: প্রয়োজনীয় ধারা যুক্ত করুন (যেমন IPC/BNS, IT Act)।',
        '4. **অগ্রাধিকার নির্ধারণ**: High বা Critical অগ্রাধিকার স্তর নির্বাচন করুন।',
        '5. **তদন্তকারী নিয়োগ**: তদন্তকারী কর্মকর্তা (IO) ও দল নিযুক্ত করুন।',
        '6. **সংরক্ষণ করুন**: "Create Case Dossier" ক্লিক করলেই নতুন কেস রেজিস্টার হয়ে যাবে।'
      ],
      tip: '💡 শুধুমাত্র অনুমোদিত অফিসাররা নতুন কেস ফাইল করতে পারেন।',
      actionRoute: '/cases?new=true',
      actionLabel: 'কেস তৈরি পেজে যান'
    },
    mr: {
      title: 'नवीन केस / डॉसियर कशी तयार करावी?',
      steps: [
        '1. **बटण शोधा**: वरच्या नेव्हिगेशन बारमधील **"+ New Dossier"** बटणावर क्लिक करा किंवा **Case Dossiers** वर जा.',
        '2. **माहिती भरा**: केसचे नाव, एफआयआर क्रमांक, पोलीस स्टेशन आणि घटनेची तारीख टाका.',
        '3. **कायदेशीर कलमे**: संबंधित कलमे जोडा (उदा. IPC/BNS, IT Act).',
        '4. **प्राधान्य ठरवा**: केसचे प्राधान्य (High/Critical) निवडा.',
        '5. **तपास अधिकारी**: मुख्य तपास अधिकारी (IO) नियुक्त करा.',
        '6. **जतन करा**: "Create Case Dossier" वर क्लिक करून केस नोंदणी पूर्ण करा.'
      ],
      tip: '💡 केवळ तपास अधिकारी आणि वरिष्ठ अधिकारी नवीन केस नोंदवू शकतात.',
      actionRoute: '/cases?new=true',
      actionLabel: 'नवीन केस नोंदणी सुरू करा'
    },
    ta: {
      title: 'புதிய வழக்கை எவ்வாறு பதிவு செய்வது?',
      steps: [
        '1. மேல் பட்டியில் உள்ள **"+ New Dossier"** பொத்தானைக் கிளிக் செய்யவும்.',
        '2. வழக்கின் பெயர், முதல் தகவல் அறிக்கை (FIR) எண், காவல் நிலையம் மற்றும் சம்பவ தேதியை உள்ளிடவும்.',
        '3. சட்டப்பிரிவுகளை (IPC/BNS, IT சட்டம்) சேர்க்கவும்.',
        '4. வழக்கின் முன்னுரிமையை (High/Critical) தேர்வு செய்யவும்.',
        '5. புலனாய்வு அதிகாரியை (IO) நியமிக்கவும்.',
        '6. **"Create Case Dossier"** என்பதை கிளிக் செய்து சேமிக்கவும்.'
      ],
      tip: '💡 அங்கீகரிக்கப்பட்ட புலனாய்வு அதிகாரிகள் மட்டுமே புதிய வழக்கை உருவாக்க முடியும்.',
      actionRoute: '/cases?new=true',
      actionLabel: 'வழக்கு பதிவு படிவம்'
    },
    te: {
      title: 'కొత్త కేసును ఎలా నమోదు చేయాలి?',
      steps: [
        '1. పై నావిగేషన్ బార్‌లోని **"+ New Dossier"** బటన్‌ను క్లిక్ చేయండి.',
        '2. కేసు శీర్షిక, FIR నంబర్, పోలీస్ స్టేషన్ మరియు సంఘటన తేదీ నమోదు చేయండి.',
        '3. సంబంధిత చట్ట విభాగాలు (IPC/BNS సెక్షన్లు) జోడించండి.',
        '4. ప్రాధాన్యతను (High/Critical) ఎంచుకోండి.',
        '5. ఇన్వెస్టిగేటింగ్ ఆఫీసర్‌ను (IO) కేటాయించండి.',
        '6. **"Create Case Dossier"** క్లిక్ చేసి నమోదు పూర్తి చేయండి.'
      ],
      tip: '💡 ఇన్వెస్టిగేటర్లు మరియు సీనియర్ ఆఫీసర్లు మాత్రమే కొత్త కేసును నమోదు చేయగలరు.',
      actionRoute: '/cases?new=true',
      actionLabel: 'కేసు నమోదు ఫారమ్'
    },
    gu: {
      title: 'નવો કેસ કેવી રીતે બનાવવો?',
      steps: [
        '1. ઉપરના બારમાં **"+ New Dossier"** બટન પર ક્લિક કરો.',
        '2. કેસનું નામ, FIR નંબર, પોલીસ સ્ટેશન અને ઘટનાની તારીખ દાખલ કરો.',
        '3. કાયદાકીય કલમો (IPC/BNS) દાખલ કરો.',
        '4. પ્રાથમિકતા પસંદ કરો અને તપાસ અધિકારી (IO) ની નિમણૂક કરો.',
        '5. **"Create Case Dossier"** ક્લિક કરીને કેસ સબમિટ કરો.'
      ],
      tip: '💡 ફક્ત અધિકૃત તપાસ અધિકારીઓ જ નવો કેસ નોંધી શકે છે.',
      actionRoute: '/cases?new=true',
      actionLabel: 'કેસ નોંધણી શરૂ કરો'
    },
    kn: {
      title: 'ಹೊಸ ಕೇಸ್ ಅನ್ನು ಹೇಗೆ ರಚಿಸುವುದು?',
      steps: [
        '1. ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ **"+ New Dossier"** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.',
        '2. ಕೇಸ್ ಶೀರ್ಷಿಕೆ, ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ, ಪೊಲೀಸ್ ಠಾಣೆ ಮತ್ತು ಘಟನೆಯ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ.',
        '3. ಕಾನೂನು ಸೆಕ್ಷನ್‌ಗಳನ್ನು (IPC/BNS) ನಮೂದಿಸಿ.',
        '4. ಆದ್ಯತೆ ಮತ್ತು ತನಿಖಾಧಿಕಾರಿಯನ್ನು (IO) ಆಯ್ಕೆ ಮಾಡಿ.',
        '5. **"Create Case Dossier"** ಕ್ಲಿಕ್ ಮಾಡಿ ಕೇಸ್ ಸೇವ್ ಮಾಡಿ.'
      ],
      tip: '💡 ಅಧಿಕೃತ ತನಿಖಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ಹೊಸ ಕೇಸ್ ರಚಿಸಬಹುದು.',
      actionRoute: '/cases?new=true',
      actionLabel: 'ಹೊಸ ಕೇಸ್ ರಚಿಸಿ'
    },
    ml: {
      title: 'പുതിയ കേസ് എങ്ങനെ രജിസ്റ്റർ ചെയ്യാം?',
      steps: [
        '1. മുകളിലെ നാവിഗേഷൻ ബാറിലുള്ള **"+ New Dossier"** ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.',
        '2. കേസ് പേര്, FIR നമ്പർ, പോലീസ് സ്റ്റേഷൻ, തീയതി എന്നിവ രേഖപ്പെടുത്തുക.',
        '3. നിയമ വകുപ്പുകൾ (IPC/BNS) ചേർക്കുക.',
        '4. മുൻഗണനയും അന്വേഷണ ഉദ്യോഗസ്ഥനെയും (IO) തിരഞ്ഞെടുക്കുക.',
        '5. **"Create Case Dossier"** ക്ലിക്ക് ചെയ്ത് പൂർത്തിയാക്കുക.'
      ],
      tip: '💡 അന്വേഷണ ഉദ്യോഗസ്ഥർക്കും മുതിർന്ന ഉദ്യോഗസ്ഥർക്കും മാത്രമേ പുതിയ കേസ് രജിസ്റ്റർ ചെയ്യാനാകൂ.',
      actionRoute: '/cases?new=true',
      actionLabel: 'പുതിയ കേസ് ഫോം'
    },
    pa: {
      title: 'ਨਵਾਂ ਕੇਸ ਕਿਵੇਂ ਦਰਜ ਕਰਨਾ ਹੈ?',
      steps: [
        '1. ਉੱਪਰਲੇ ਬਾਰ ਵਿੱਚ **"+ New Dossier"** ਬਟਨ ਤੇ ਕਲਿੱਕ ਕਰੋ।',
        '2. ਕੇਸ ਦਾ ਨਾਮ, ਐਫਆਈਆਰ ਨੰਬਰ, ਥਾਣਾ ਅਤੇ ਘਟਨਾ ਦੀ ਮਿਤੀ ਭਰੋ।',
        '3. ਕਾਨੂੰਨੀ ਧਾਰਾਵਾਂ (IPC/BNS) ਦਰਜ ਕਰੋ।',
        '4. ਤਰਜੀਹ ਚੁਣੋ ਅਤੇ ਤਫਤੀਸ਼ੀ ਅਫਸਰ (IO) ਨਿਯੁਕਤ ਕਰੋ।',
        '5. **"Create Case Dossier"** ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਕੇਸ ਦਰਜ ਕਰੋ।'
      ],
      tip: '💡 ਸਿਰਫ਼ ਅਧਿਕਾਰਤ ਅਫਸਰ ਹੀ ਨਵਾਂ ਕੇਸ ਦਰਜ ਕਰ ਸਕਦੇ ਹਨ।',
      actionRoute: '/cases?new=true',
      actionLabel: 'ਨਵਾਂ ਕੇਸ ਸ਼ੁਰੂ ਕਰੋ'
    }
  },

  chargesheet_filing: {
    en: {
      title: 'How to Prepare & File a Charge Sheet (Sec 173 CrPC / 193 BNSS)',
      steps: [
        '1. **Navigate to Case**: Open **Case Dossiers (`/cases`)** and click into your active case.',
        '2. **Open Tab 5**: Select the **"Charge Sheet & Court Filing"** tab.',
        '3. **Draft the Charge Sheet**: Upload or select the Final Investigation Report document containing the summarized evidence, witness list, and accused particulars.',
        '4. **Senior Officer Review**: Submit the draft for **Scrutiny / Senior Review**. The SP / DySP reviews legal soundness and either approves or requests revisions.',
        '5. **Prosecutor Signoff**: Once senior review passes, the Public Prosecutor inspects compliance and applies their **PKI Digital Signature**.',
        '6. **File in Court**: Click **"File in Court"**, enter the Court Name, Judge / Magistrate, and generate the sealed Pre-Trial Evidence Bundle.'
      ],
      tip: '💡 Chain of Custody must be 100% verified before prosecutor signoff.',
      actionRoute: '/court',
      actionLabel: 'View Court & Filings Page'
    },
    hi: {
      title: 'चार्जशीट तैयार और कोर्ट में दाखिल कैसे करें?',
      steps: [
        '1. **केस खोलें**: **Case Dossiers (`/cases`)** में जाकर संबंधित केस पर क्लिक करें।',
        '2. **टैब 5 खोलें**: **"Charge Sheet & Court Filing"** टैब चुनें।',
        '3. **चार्जशीट ड्राफ्ट करें**: अंतिम जांच रिपोर्ट (Final Report) और गवाहों व आरोपियों की सूची वाला दस्तावेज़ चुनें।',
        '4. **वरिष्ठ अधिकारी जांच (Senior Review)**: चार्जशीट को एसपी/डीएसपी स्तर के अधिकारी के पास समीक्षा के लिए भेजें।',
        '5. **सरकारी वकील (Prosecutor) हस्ताक्षर**: समीक्षा पास होने के बाद सरकारी वकील कानूनी जांच कर डिजिटल हस्ताक्षर (Digital Signature) करेंगे।',
        '6. **कोर्ट में दाखिल (File in Court)**: न्यायालय का नाम और मजिस्ट्रेट दर्ज करके **"File in Court"** पर क्लिक करें।'
      ],
      tip: '💡 चार्जशीट दाखिल करने से पहले सभी सबूतों की कस्टडी चैन सत्यापित होनी चाहिए।',
      actionRoute: '/court',
      actionLabel: 'अदालत और फाइलिंग देखें'
    },
    bn: {
      title: 'কীভাবে চার্জশিট প্রস্তুত ও আদালতে দাখিল করবেন?',
      steps: [
        '1. কেস ফাইলটি ওপেন করে **"Charge Sheet & Court Filing"** ট্যাবে যান।',
        '2. চূড়ান্ত তদন্ত প্রতিবেদন ও প্রমাণের তালিকা সংযুক্ত করে চার্জশিট খসড়া করুন।',
        '3. সিনিয়র অফিসারের পর্যালোচনার জন্য জমা দিন।',
        '4. সরকারি কৌঁসুলি (Public Prosecutor) ডিজিটাল স্বাক্ষর করবেন।',
        '5. আদালতের নাম দিয়ে **"File in Court"** ক্লিক করে আদালতে দাখিল করুন।'
      ],
      tip: '💡 আদালতে জমা দেওয়ার আগে সাক্ষ্যপ্রমাণের হেফাজত নিশ্চিত করুন।',
      actionRoute: '/court',
      actionLabel: 'আদালত পেজে যান'
    },
    mr: {
      title: 'चार्जशीट कशी तयार करावी आणि कोर्टात कशी दाखल करावी?',
      steps: [
        '1. संबंधित केस उघडून **"Charge Sheet & Court Filing"** टॅब निवडा.',
        '2. अंतिम तपास अहवाल आणि साक्षीदारांची यादी जोडून चार्जशीटचा मसुदा तयार करा.',
        '3. वरिष्ठ पोलीस अधिकाऱ्यांच्या पुनरावलोकनासाठी पाठवा.',
        '4. सरकारी अभियोक्ता (Prosecutor) डिजिटल स्वाक्षरी करतील.',
        '5. न्यायालयाचे नाव टाकून **"File in Court"** वर क्लिक करा.'
      ],
      tip: '💡 डिजिटल स्वाक्षरी नंतर चार्जशीट अधिकृत मानली जाते.',
      actionRoute: '/court',
      actionLabel: 'कोर्ट कामकाज पहा'
    },
    ta: {
      title: 'குற்றப்பத்திரிகையை எவ்வாறு தயாரித்து தாக்கல் செய்வது?',
      steps: [
        '1. வழக்கைத் திறந்து **"Charge Sheet & Court Filing"** பகுதிக்குச் செல்லவும்.',
        '2. இறுதி விசாரணை அறிக்கையை இணைத்து குற்றப்பத்திரிகையை உருவாக்கவும்.',
        '3. உயர் அதிகாரியின் மறுஆய்வுக்குச் சமர்ப்பிக்கவும்.',
        '4. அரசு வழக்கறிஞர் டிஜிட்டல் கையொப்பமிடுவார்.',
        '5. நீதிமன்ற விவரங்களை உள்ளிட்டு **"File in Court"** என்பதை கிளிக் செய்யவும்.'
      ],
      tip: '💡 நீதிமன்றத்தில் தாக்கல் செய்ய சான்று தொடர்ச்சி மிக முக்கியம்.',
      actionRoute: '/court',
      actionLabel: 'நீதிமன்றப் பக்கம்'
    },
    te: {
      title: 'ఛార్జిషీట్‌ను ఎలా తయారు చేసి కోర్టులో దాఖలు చేయాలి?',
      steps: [
        '1. కేసుకు వెళ్లి **"Charge Sheet & Court Filing"** ట్యాబ్ తెరవండి.',
        '2. తుది విచారణ నివేదిక మరియు సాక్షుల వివరాలతో ఛార్జిషీట్ సిద్ధం చేయండి.',
        '3. సీనియర్ అధికారి ఆమోదం కోసం పంపండి.',
        '4. పబ్లిక్ ప్రాసిక్యూటర్ డిజిటల్ సంతకం చేస్తారు.',
        '5. కోర్టు వివరాలు నమోదు చేసి **"File in Court"** క్లిక్ చేయండి.'
      ],
      tip: '💡 చట్టపరమైన నిబంధనల ప్రకారం డిజిటల్ సంతకం తప్పనిసరి.',
      actionRoute: '/court',
      actionLabel: 'కోర్టు పేజీకి వెళ్లండి'
    },
    gu: {
      title: 'ચાર્જશીટ કેવી રીતે તૈયાર કરવી અને કોર્ટમાં દાખલ કરવી?',
      steps: [
        '1. કેસ ખોલીને **"Charge Sheet & Court Filing"** ટેબમાં જાઓ.',
        '2. અંતિમ તપાસ અહેવાલ ઉમેરીને ચાર્જશીટ તૈયાર કરો.',
        '3. વરિષ્ઠ અધિકારીની સમીક્ષા માટે મોકલો.',
        '4. સરકારી વકીલ (Prosecutor) ડિજિટલ હસ્તાક્ષર કરશે.',
        '5. કોર્ટનું નામ દાખલ કરીને **"File in Court"** પર ક્લિક કરો.'
      ],
      tip: '💡 ચાર્જશીટ સબમિટ કરતાં પહેલાં તમામ પુરાવા ચકાસી લો.',
      actionRoute: '/court',
      actionLabel: 'કોર્ટ કાર્યવાહી જુઓ'
    },
    kn: {
      title: 'ಚಾರ್ಜ್‌ಶೀಟ್ ತಯಾರಿಸಿ ನ್ಯಾಯಾಲಯಕ್ಕೆ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?',
      steps: [
        '1. ಕೇಸ್ ವಿವರಗಳಿಗೆ ಹೋಗಿ **"Charge Sheet & Court Filing"** ಟ್ಯಾಬ್ ತೆರೆಯಿರಿ.',
        '2. ಅಂತಿಮ ತನಿಖಾ ವರದಿ ಮತ್ತು ಸಾಕ್ಷಿಗಳ ವಿವರ ಸೇರಿಸಿ ಚಾರ್ಜ್‌ಶೀಟ್ ಸಿದ್ಧಪಡಿಸಿ.',
        '3. ಹಿರಿಯ ಅಧಿಕಾರಿಗಳ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಿ.',
        '4. ಪಬ್ಲಿಕ್ ಪ್ರಾಸಿಕ್ಯೂಟರ್ ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡುತ್ತಾರೆ.',
        '5. ನ್ಯಾಯಾಲಯದ ವಿವರ ನೀಡಿ **"File in Court"** ಕ್ಲಿಕ್ ಮಾಡಿ.'
      ],
      tip: '💡 ನ್ಯಾಯಾಲಯಕ್ಕೆ ಸಲ್ಲಿಸುವ ಮುನ್ನ ಡಿಜಿಟಲ್ ಸಹಿ ಅಗತ್ಯ.',
      actionRoute: '/court',
      actionLabel: 'ನ್ಯಾಯಾಲಯ ಪುಟಕ್ಕೆ ಹೋಗಿ'
    },
    ml: {
      title: 'കുറ്റപത്രം എങ്ങനെ തയ്യാറാക്കി കോടതിയിൽ സമർപ്പിക്കാം?',
      steps: [
        '1. കേസ് വിവരങ്ങൾ തുറന്ന് **"Charge Sheet & Court Filing"** ടാബിലേക്ക് പോകുക.',
        '2. അന്തിമ റിപ്പോർട്ടും സാക്ഷികളുടെ വിവരങ്ങളും ചേർത്ത് കുറ്റപത്രം തയ്യാറാക്കുക.',
        '3. മുതിർന്ന ഉദ്യോഗസ്ഥന്റെ പരിശോധനയ്ക്കായി സമർപ്പിക്കുക.',
        '4. പബ്ലിക് പ്രോസിക്യൂട്ടർ ഡിജിറ്റൽ ഒപ്പ് രേഖപ്പെടുത്തും.',
        '5. കോടതി വിവരങ്ങൾ നൽകി **"File in Court"** ക്ലിക്ക് ചെയ്യുക.'
      ],
      tip: '💡 പ്രോസിക്യൂട്ടർ ഒപ്പുവെച്ച ശേഷം കോടതിയിൽ സമർപ്പിക്കാം.',
      actionRoute: '/court',
      actionLabel: 'കോടതി പേജിലേക്ക് പോകുക'
    },
    pa: {
      title: 'ਚਾਰਜਸ਼ੀਟ ਕਿਵੇਂ ਤਿਆਰ ਕਰਕੇ ਅਦਾਲਤ ਵਿੱਚ ਦਾਇਰ ਕਰਨੀ ਹੈ?',
      steps: [
        '1. ਕੇਸ ਖੋਲ੍ਹ ਕੇ **"Charge Sheet & Court Filing"** ਟੈਬ ਵਿੱਚ ਜਾਓ।',
        '2. ਅੰਤਿਮ ਰਿਪੋਰਟ ਅਤੇ ਗਵਾਹਾਂ ਦੀ ਸੂਚੀ ਨਾਲ ਚਾਰਜਸ਼ੀਟ ਤਿਆਰ ਕਰੋ।',
        '3. ਸੀਨੀਅਰ ਅਫਸਰ ਦੀ ਜਾਂਚ ਲਈ ਭੇਜੋ।',
        '4. ਸਰਕਾਰੀ ਵਕੀਲ ਡਿਜੀਟਲ ਦਸਤਖਤ ਕਰੇਗਾ।',
        '5. ਅਦਾਲਤ ਦਾ ਨਾਮ ਦਰਜ ਕਰਕੇ **"File in Court"** ਤੇ ਕਲਿੱਕ ਕਰੋ।'
      ],
      tip: '💡 ਚਾਰਜਸ਼ੀਟ ਦਾਇਰ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਸਬੂਤਾਂ ਦੀ ਪੜਤਾਲ ਜ਼ਰੂਰੀ ਹੈ।',
      actionRoute: '/court',
      actionLabel: 'ਅਦਾਲਤੀ ਕਾਰਵਾਈ ਵੇਖੋ'
    }
  },

  court_proceedings: {
    en: {
      title: 'Court Hearings, Orders & Final Judgments',
      steps: [
        '1. **Access Court Module**: Click **"Court Proceedings"** in the sidebar (`/court`).',
        '2. **Pre-Trial Bundle**: Download the cryptographically sealed Pre-Trial Evidence Bundle for judicial scrutiny.',
        '3. **Record a Hearing**: Click **"+ Record Court Hearing"**.',
        '4. **Fill Hearing Log**: Specify the Hearing Date, Presiding Judge, Bench/Courtroom, and Hearing Stage (*Framing of Charges*, *Witness Examination*, *Arguments*).',
        '5. **Enter Orders & Bail**: Record bail status (*GRANTED*, *REJECTED*, *RESERVED*) and judge summary directives.',
        '6. **Record Verdict / Judgment**: When the trial concludes, update the final case outcome (*CONVICTION*, *ACQUITTAL*, *DISCHARGED*) and upload the certified judgment decree.'
      ],
      tip: '💡 Judgments recorded here automatically update the Case status and set statutory appeal retention timers.',
      actionRoute: '/court',
      actionLabel: 'Go to Court Proceedings'
    },
    hi: {
      title: 'अदालत की सुनवाई, आदेश और फैसला (Judgments) कैसे दर्ज करें?',
      steps: [
        '1. **कोर्ट पेज पर जाएं**: साइडबार में **"Court Proceedings"** (`/court`) पर क्लिक करें।',
        '2. **प्री-ट्रायल बंडल**: जज के अवलोकन के लिए डिजिटल रूप से सील किया गया एविडेंस बंडल डाउनलोड करें।',
        '3. **सुनवाई दर्ज करें**: **"+ Record Court Hearing"** बटन दबाएं।',
        '4. **सुनवाई का विवरण**: सुनवाई की तारीख, जज का नाम, कोर्ट रूम और सुनवाई का चरण (जैसे *आरोप तय करना*, *गवाही*, *अंतिम बहस*) भरें।',
        '5. **जमानत और आदेश**: कोर्ट का आदेश और जमानत की स्थिति (*GRANTED*, *REJECTED*) दर्ज करें।',
        '6. **अंतिम फैसला (Judgment)**: ट्रायल पूरा होने पर अंतिम परिणाम (*दोषसिद्धि/Conviction* या *बरी/Acquittal*) दर्ज करें और प्रमाणित फैसला पत्र अपलोड करें।'
      ],
      tip: '💡 फैसला दर्ज होने पर केस की स्थिति स्वतः अपडेट हो जाती है और अपील की समयसीमा शुरू होती है।',
      actionRoute: '/court',
      actionLabel: 'कोर्ट प्रोसीडिंग्स पेज खोलें'
    },
    bn: {
      title: 'আদালতের শুনানি ও রায় কীভাবে নথিভুক্ত করবেন?',
      steps: [
        '1. সাইডবার থেকে **"Court Proceedings"** পেজে যান।',
        '2. আদালতের জন্য সুরক্ষিত প্রি-ট্রায়াল এভিডেন্স বান্ডিল ডাউনলোড করুন।',
        '3. **"+ Record Court Hearing"** ক্লিক করে শুনানির বিবরণ দিন।',
        '4. বিচারকের নাম, শুনানির পর্যায় ও জামিনের নির্দেশ লিপিবদ্ধ করুন।',
        '5. চূড়ান্ত রায় (Conviction / Acquittal) ঘোষণা হলে ফলাফল আপডেট করুন।'
      ],
      tip: '💡 রায়ের নথি আপলোড করলে কেসের স্থিতি স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়।',
      actionRoute: '/court',
      actionLabel: 'আদালত শুনানিতে যান'
    },
    mr: {
      title: 'न्यायालयीन सुनावणी आणि निकाल कसा नोंदवावा?',
      steps: [
        '1. साइडबारमधील **"Court Proceedings"** वर क्लिक करा.',
        '2. न्यायाधीशांसाठी सुरक्षित पुरावा बंडल डाऊनलोड करा.',
        '3. **"+ Record Court Hearing"** वर क्लिक करा.',
        '4. सुनावणीची तारीख, न्यायाधीश, कोर्टाचे आदेश आणि जामीन स्थिती नोंदवा.',
        '5. अंतिम निकाल (दोषी किंवा निर्दोष मुक्तता) नोंदवून प्रमाणित निकालपत्र अपलोड करा.'
      ],
      tip: '💡 निकाल नोंदवल्यानंतर केसची स्थिती स्वयंचलितपणे अद्ययावत होते.',
      actionRoute: '/court',
      actionLabel: 'कोर्ट कामकाजावर जा'
    },
    ta: {
      title: 'நீதிமன்ற விசாரணை மற்றும் தீர்ப்பை எவ்வாறு பதிவு செய்வது?',
      steps: [
        '1. மெனுவில் **"Court Proceedings"** பகுதிக்குச் செல்லவும்.',
        '2. நீதிமன்றத்திற்கான பாதுகாக்கப்பட்ட சான்றுத் தொகுப்பைப் பதிவிறக்கவும்.',
        '3. **"+ Record Court Hearing"** என்பதை கிளிக் செய்யவும்.',
        '4. விசாரணை தேதி, நீதிபதி பெயர், இடைக்கால உத்தரவு மற்றும் ஜாமீன் நிலையை உள்ளிடவும்.',
        '5. வழக்கின் இறுதி தீர்ப்பை (குற்றவாளி / விடுதலை) பதிவு செய்யவும்.'
      ],
      tip: '💡 தீர்ப்பு பதிவு செய்யப்பட்டதும் வழக்கின் நிலை தானாக மாறும்.',
      actionRoute: '/court',
      actionLabel: 'நீதிமன்ற விசாரணை பக்கம்'
    },
    te: {
      title: 'కోర్టు విచారణ మరియు తుది తీర్పును ఎలా రికార్డ్ చేయాలి?',
      steps: [
        '1. సైడ్‌బార్‌లో **"Court Proceedings"** క్లిక్ చేయండి.',
        '2. న్యాయమూర్తి పరిశీలన కోసం ప్రీ-ట్రయల్ బండిల్‌ను డౌన్‌లోడ్ చేయండి.',
        '3. **"+ Record Court Hearing"** క్లిక్ చేసి వివరాలు నమోదు చేయండి.',
        '4. విచారణ తేదీ, న్యాయమూర్తి ఆదేశాలు మరియు బెయిల్ స్థితిని నమోదు చేయండి.',
        '5. తుది తీర్పును (Conviction / Acquittal) రికార్డ్ చేసి ఆర్డర్ కాపీని అప్‌లోడ్ చేయండి.'
      ],
      tip: '💡 తుది తీర్పుతో కేస్ స్టేటస్ ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది.',
      actionRoute: '/court',
      actionLabel: 'కోర్టు పేజీ తెరవండి'
    },
    gu: {
      title: 'અદાલતી સુનાવણી અને ચુકાદો કેવી રીતે નોંધવો?',
      steps: [
        '1. સાઇડબારમાં **"Court Proceedings"** પર ક્લિક કરો.',
        '2. પ્રી-ટ્રાયલ પુરાવા બંડલ ડાઉનલોડ કરો.',
        '3. **"+ Record Court Hearing"** બટન દબાવો.',
        '4. સુનાવણીની તારીખ, ન્યાયાધીશનું નામ અને જામીન સ્થિતિ નોંધો.',
        '5. અંતિમ ચુકાદો (દોષિત / નિર્દોષ) દાખલ કરીને ચુકાદાની નકલ અપલોડ કરો.'
      ],
      tip: '💡 ચુકાદો નોંધાતા જ કેસનું સ્ટેટસ આપમેળે અપડેટ થઈ જશે.',
      actionRoute: '/court',
      actionLabel: 'અદાલતી કાર્યવાહી પર જાઓ'
    },
    kn: {
      title: 'ನ್ಯಾಯಾಲಯದ ವಿಚಾರಣೆ ಮತ್ತು ತೀರ್ಪನ್ನು ಹೇಗೆ ದಾಖಲಿಸುವುದು?',
      steps: [
        '1. ಸೈಡ್‌ಬಾರ್‌ನಲ್ಲಿ **"Court Proceedings"** ಕ್ಲಿಕ್ ಮಾಡಿ.',
        '2. ಸುರಕ್ಷಿತ ಸಾಕ್ಷ್ಯ ಬಂಡಲ್ ಅನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
        '3. **"+ Record Court Hearing"** ಕ್ಲಿಕ್ ಮಾಡಿ ವಿವರ ನಮೂದಿಸಿ.',
        '4. ವಿಚಾರಣೆ ದಿನಾಂಕ, ನ್ಯಾಯಾಧೀಶರ ಆದೇಶ ಮತ್ತು ಜಾಮೀನು ಸ್ಥಿತಿ ದಾಖಲಿಸಿ.',
        '5. ಅಂತಿಮ ತೀರ್ಪನ್ನು (Conviction / Acquittal) ದಾಖಲಿಸಿ.'
      ],
      tip: '💡 ತೀರ್ಪು ದಾಖಲಾದ ನಂತರ ಕೇಸ್ ಸ್ಥಿತಿ ಬದಲಾಗುತ್ತದೆ.',
      actionRoute: '/court',
      actionLabel: 'ನ್ಯಾಯಾಲಯ ಪುಟ ತೆರೆಯಿರಿ'
    },
    ml: {
      title: 'കോടതി വിചാരണയും വിധിയും എങ്ങനെ രേഖപ്പെടുത്താം?',
      steps: [
        '1. സൈഡ്ബാർ വഴി **"Court Proceedings"** പേജിലേക്ക് പോകുക.',
        '2. ജഡ്ജിയുടെ പരിശോധനയ്ക്കായി തെളിവ് ബണ്ടിൽ ഡൗൺലോഡ് ചെയ്യുക.',
        '3. **"+ Record Court Hearing"** ക്ലിക്ക് ചെയ്ത് വിവരങ്ങൾ നൽകുക.',
        '4. വിചാരണ തീയതി, ജാമ്യ ഉത്തരവുകൾ, കോടതി നിർദ്ദേശങ്ങൾ എന്നിവ രേഖപ്പെടുത്തുക.',
        '5. അന്തിമ വിധി (ശിക്ഷ / കുറ്റവിമുക്തൻ) രേഖപ്പെടുത്തി സർട്ടിഫൈഡ് ഉത്തരവ് അപ്‌ലോഡ് ചെയ്യുക.'
      ],
      tip: '💡 വിധി രേഖപ്പെടുത്തുമ്പോൾ കേസ് സ്റ്റാറ്റസ് ഓട്ടോമാറ്റിക്കായി മാറുന്നു.',
      actionRoute: '/court',
      actionLabel: 'കോടതി വിചാരണ പേജ്'
    },
    pa: {
      title: 'ਅਦਾਲਤੀ ਸੁਣਵਾਈ ਅਤੇ ਫੈਸਲਾ ਕਿਵੇਂ ਦਰਜ ਕਰਨਾ ਹੈ?',
      steps: [
        '1. ਸਾਈਡਬਾਰ ਵਿੱਚ **"Court Proceedings"** ਤੇ ਜਾਓ।',
        '2. ਅਦਾਲਤ ਲਈ ਸੀਲਬੰਦ ਸਬੂਤ ਬੰਡਲ ਡਾਊਨਲੋਡ ਕਰੋ।',
        '3. **"+ Record Court Hearing"** ਤੇ ਕਲਿੱਕ ਕਰੋ।',
        '4. ਸੁਣਵਾਈ ਦੀ ਮਿਤੀ, ਜੱਜ ਦਾ ਨਾਮ ਅਤੇ ਜ਼ਮਾਨਤ ਦਾ ਹੁਕਮ ਦਰਜ ਕਰੋ।',
        '5. ਅੰਤਿਮ ਫੈਸਲਾ (ਸਜ਼ਾ ਜਾਂ ਬਰੀ) ਦਰਜ ਕਰੋ ਅਤੇ ਫੈਸਲੇ ਦੀ ਕਾਪੀ ਅੱਪਲੋਡ ਕਰੋ।'
      ],
      tip: '💡 ਫੈਸਲਾ ਦਰਜ ਹੋਣ ਨਾਲ ਕੇਸ ਦਾ ਦਰਜਾ ਆਪੇ ਅੱਪਡੇਟ ਹੋ ਜਾਂਦਾ ਹੈ।',
      actionRoute: '/court',
      actionLabel: 'ਅਦਾਲਤੀ ਕਾਰਵਾਈ ਖੋਲ੍ਹੋ'
    }
  },

  evidence_custody: {
    en: {
      title: 'Evidence Registration & Chain of Custody (Sec 65B)',
      steps: [
        '1. **Go to Evidence Locker**: Click **"Evidence Locker"** (`/evidence`) or open a specific case dossier.',
        '2. **Register Evidence**: Click **"+ Register Evidence"** and record item description, serial/IMEI, seizure location, and seizing officer.',
        '3. **Automated Hash**: The platform automatically generates a cryptographic **SHA-256 / SHA-3** checksum to guarantee digital integrity.',
        '4. **Request Transfer**: To hand over evidence (e.g. to the Forensic Lab or Court), click **"Transfer Custody"**.',
        '5. **Accept Transfer**: The receiving custodian inspects tamper-evident seals and clicks **"Accept Custody"** with their PIN/signature.',
        '6. **Section 65B Certificate**: Generates compliant electronic evidence admissibility certificates.'
      ],
      tip: '💡 Any broken chain or hash mismatch triggers an immediate Critical Security Alert.',
      actionRoute: '/evidence',
      actionLabel: 'Open Evidence Locker'
    },
    hi: {
      title: 'सबूत दर्ज करना और कस्टडी ट्रांसफर (Chain of Custody)',
      steps: [
        '1. **एविडेंस लॉकर खोलें**: साइडबार से **"Evidence Locker"** (`/evidence`) पर जाएं।',
        '2. **सबूत दर्ज करें**: **"+ Register Evidence"** पर क्लिक करें। वस्तु का नाम, बारकोड, जब्ती स्थल और अधिकारी का नाम भरें।',
        '3. **डिजिटल हैश (SHA-256)**: सिस्टम स्वतः फाइल या डिवाइस का अद्वितीय डिजिटल फिंगरप्रिंट (SHA-256) बनाता है।',
        '4. **कस्टडी ट्रांसफर अनुरोध**: सबूत को फॉरेंसिक लैब या कोर्ट भेजने के लिए **"Transfer Custody"** पर क्लिक करें।',
        '5. **कस्टडी स्वीकार करें**: प्राप्तकर्ता अधिकारी सील की जांच करके **"Accept Custody"** दबाकर जिम्मेदारी लेता है।',
        '6. **धारा 65B प्रमाणपत्र**: अदालत में सबूत की वैधता साबित करने के लिए स्वतः 65B प्रमाण पत्र जारी होता है।'
      ],
      tip: '💡 सबूत के साथ किसी भी छेड़छाड़ पर तत्काल सुरक्षा अलर्ट जारी होता है।',
      actionRoute: '/evidence',
      actionLabel: 'एविडेंस लॉकर खोलें'
    },
    bn: {
      title: 'প্রমাণ নিবন্ধন ও হেফাজত স্থানান্তর (Chain of Custody)',
      steps: [
        '1. **"Evidence Locker"** পেজে গিয়ে **"+ Register Evidence"** ক্লিক করুন।',
        '2. প্রমাণের বিবরণ, বারকোড ও জব্দের স্থান লিপিবদ্ধ করুন।',
        '3. সিস্টেম স্বয়ংক্রিয়ভাবে নিরাপদ SHA-256 হ্যাশ তৈরি করবে।',
        '4. ফরেনসিক ল্যাবে পাঠানোর জন্য **"Transfer Custody"** রিকোয়েস্ট করুন।',
        '5. গ্রহণকারী অফিসার যাচাই করে কাস্টডি গ্রহণ করবেন।'
      ],
      tip: '💡 ধারা ৬৫বি অনুযায়ী ইলেকট্রনিক প্রমাণ সুরক্ষিত রাখা হয়।',
      actionRoute: '/evidence',
      actionLabel: 'এভিডেন্স লকার দেখুন'
    },
    mr: {
      title: 'पुरावा नोंदणी आणि कस्टडी हस्तांतरण प्रक्रिया',
      steps: [
        '1. **"Evidence Locker"** वर जा आणि **"+ Register Evidence"** निवडा.',
        '2. जप्त केलेल्या वस्तूचा तपशील, बारकोड व ठिकाण नोंदवा.',
        '3. प्रणाली तात्काळ SHA-256 डिजिटल हॅश तयार करते.',
        '4. पुरावा दुसऱ्या अधिकाऱ्याकडे सोपवण्यासाठी **"Transfer Custody"** करा.',
        '5. स्वीकारणाऱ्या अधिकाऱ्याने तपासणी करून कस्टडी स्वीकारावी.'
      ],
      tip: '💡 पुरावा साखळीत कोणताही खंड पडल्यास त्वरित सुरक्षा इशारा मिळतो.',
      actionRoute: '/evidence',
      actionLabel: 'एव्हिडन्स लॉकर उघडा'
    },
    ta: {
      title: 'சான்று பதிவு மற்றும் பாதுகாப்பு தொடர்ச்சி (Chain of Custody)',
      steps: [
        '1. **"Evidence Locker"** பகுதிக்குச் சென்று **"+ Register Evidence"** என்பதை கிளிக் செய்யவும்.',
        '2. பறிமுதல் செய்யப்பட்ட பொருளின் விவரம் மற்றும் பார்-கோடை உள்ளிடவும்.',
        '3. கணினி தானாகவே SHA-256 பாதுகாப்புக் குறியீட்டை உருவாக்கும்.',
        '4. தடயவியல் ஆய்வகத்திற்கு அனுப்ப **"Transfer Custody"** செய்யவும்.',
        '5. பெறுபவர் சரிபார்த்து கஸ்டடியை ஏற்க வேண்டும்.'
      ],
      tip: '💡 சட்டப்பிரிவு 65B-ன் கீழ் மின்னணு சான்றுகள் பாதுகாக்கப்படுகின்றன.',
      actionRoute: '/evidence',
      actionLabel: 'சான்று பெட்டகம் திற'
    },
    te: {
      title: 'సాక్ష్యం నమోదు మరియు కస్టడీ బదిలీ విధానం',
      steps: [
        '1. **"Evidence Locker"** పేజీకి వెళ్లి **"+ Register Evidence"** క్లిక్ చేయండి.',
        '2. స్వాధీనం చేసుకున్న వస్తువు వివరాలు మరియు బార్‌కోడ్ నమోదు చేయండి.',
        '3. సిస్టమ్ స్వయంచಾಲితంగా SHA-256 డిజిటల్ హాష్‌ను సృష్టిస్తుంది.',
        '4. ల్యాబ్ లేదా కోర్టుకు పంపేందుకు **"Transfer Custody"** అభ్యర్థించండి.',
        '5. అందుకునే అధికారి తనిఖీ చేసి కస్టడీని ఆమోదిస్తారు.'
      ],
      tip: '💡 సెక్షన్ 65B ప్రకారం డిజిటల్ సాక్ష్యాలు ధృవీకరించబడతాయి.',
      actionRoute: '/evidence',
      actionLabel: 'ఎవిడెన్స్ లాకర్ తెరవండి'
    },
    gu: {
      title: 'પુરાવા નોંધણી અને કસ્ટડી ટ્રાન્સફર પ્રક્રિયા',
      steps: [
        '1. **"Evidence Locker"** માં જઈને **"+ Register Evidence"** ક્લિક કરો.',
        '2. જપ્ત કરેલ વસ્તુનું વર્ણન અને બારકોડ દાખલ કરો.',
        '3. સિસ્ટમ આપોઆપ સુરક્ષિત SHA-256 હેશ જનરેટ કરશે.',
        '4. ફોરેન્સિક લેબમાં મોકલવા માટે **"Transfer Custody"** વિનંતી કરો.',
        '5. મેળવનાર અધિકારી સીલ ચકાસીને કસ્ટડી સ્વીકારશે.'
      ],
      tip: '💡 પુરાવાની સાંકળમાં કોઈ પણ ખામી તાત્કાલિક એલર્ટ આપે છે.',
      actionRoute: '/evidence',
      actionLabel: 'પુરાવા લોકર ખોલો'
    },
    kn: {
      title: 'ಸಾಕ್ಷ್ಯ ನೋಂದಣಿ ಮತ್ತು ಕಸ್ಟಡಿ ವರ್ಗಾವಣೆ ವಿಧಾನ',
      steps: [
        '1. **"Evidence Locker"** ಪುಟಕ್ಕೆ ಹೋಗಿ **"+ Register Evidence"** ಕ್ಲಿಕ್ ಮಾಡಿ.',
        '2. ಜಪ್ತಿ ಮಾಡಿದ ವಸ್ತು, ಬಾರ್‌ಕೋಡ್ ಮತ್ತು ಸ್ಥಳವನ್ನು ದಾಖಲಿಸಿ.',
        '3. ಸಿಸ್ಟಮ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ SHA-256 ಹ್ಯಾಶ್ ಉತ್ಪಾದಿಸುತ್ತದೆ.',
        '4. ಲ್ಯಾಬ್‌ಗೆ ಕಳುಹಿಸಲು **"Transfer Custody"** ವಿನಂತಿಸಿ.',
        '5. ಸ್ವೀಕರಿಸುವ ಅಧಿಕಾರಿ ಪರಿಶೀಲಿಸಿ ಕಸ್ಟಡಿಯನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ.'
      ],
      tip: '💡 ಸೆಕ್ಷನ್ 65B ಅಡಿಯಲ್ಲಿ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಾಕ್ಷ್ಯಗಳು ಮಾನ್ಯವಾಗಿರುತ್ತವೆ.',
      actionRoute: '/evidence',
      actionLabel: 'ಎವಿಡೆನ್ಸ್ ಲಾಕರ್ ತೆರೆಯಿರಿ'
    },
    ml: {
      title: 'തെളിവ് രജിസ്ട്രേഷനും കസ്റ്റഡി കൈമാറ്റവും',
      steps: [
        '1. **"Evidence Locker"** പേജിൽ പോയി **"+ Register Evidence"** ക്ലിക്ക് ചെയ്യുക.',
        '2. പിടിച്ചെടുത്ത വസ്തുവിന്റെ വിവരങ്ങളും ബാർകോഡും രേഖപ്പെടുത്തുക.',
        '3. സിസ്റ്റം ഓട്ടോമാറ്റിക് ആയി SHA-256 ഡിജിറ്റൽ ഹാഷ് സൃഷ്ടിക്കുന്നു.',
        '4. ലാബിലേക്ക് അയക്കാൻ **"Transfer Custody"** അഭ്യർത്ഥിക്കുക.',
        '5. കൈപ്പറ്റുന്ന ഉദ്യോഗസ്ഥൻ പരിശോധിച്ച് കസ്റ്റഡി അംഗീകരിക്കുക.'
      ],
      tip: '💡 സെക്ഷൻ 65B പ്രകാരം ഇലക്ട്രോണിക് തെളിവുകൾ സുരക്ഷിതമാണ്.',
      actionRoute: '/evidence',
      actionLabel: 'തെളിവ് ലോക്കർ തുറക്കുക'
    },
    pa: {
      title: 'ਸਬੂਤ ਦਰਜ ਕਰਨਾ ਅਤੇ ਕਸਟਡੀ ਤਬਦੀਲੀ (Chain of Custody)',
      steps: [
        '1. **"Evidence Locker"** ਤੇ ਜਾ ਕੇ **"+ Register Evidence"** ਤੇ ਕਲਿੱਕ ਕਰੋ।',
        '2. ਜ਼ਬਤ ਕੀਤੀ ਵਸਤੂ ਦਾ ਵੇਰਵਾ ਅਤੇ ਬਾਰਕੋਡ ਦਰਜ ਕਰੋ।',
        '3. ਸਿਸਟਮ ਆਪਣੇ ਆਪ SHA-256 ਡਿਜੀਟਲ ਹੈਸ਼ ਬਣਾਉਂਦਾ ਹੈ।',
        '4. ਫੋਰੈਂਸਿਕ ਲੈਬ ਭੇਜਣ ਲਈ **"Transfer Custody"** ਬੇਨਤੀ ਕਰੋ।',
        '5. ਪ੍ਰਾਪਤਕਰਤਾ ਅਧਿਕਾਰੀ ਪੜਤਾਲ ਕਰਕੇ ਕਸਟਡੀ ਸਵੀਕਾਰ ਕਰੇਗਾ।'
      ],
      tip: '💡 ਸਬੂਤਾਂ ਦੀ ਸੁਰੱਖਿਅਤ ਲੜੀ ਕਾਨੂੰਨੀ ਤੌਰ ਤੇ ਲਾਜ਼ਮੀ ਹੈ।',
      actionRoute: '/evidence',
      actionLabel: 'ਸਬੂਤ ਲਾਕਰ ਖੋਲ੍ਹੋ'
    }
  },

  legal_hold: {
    en: {
      title: 'Legal Hold & Case Retention Policies',
      steps: [
        '1. **What is Legal Hold?**: A statutory freeze placed on a case to immediately prevent any automated data retention expiry, purging, or shredding.',
        '2. **How to Place Hold**: Open the Case Dossier (`/cases/:id`), locate the top right header badge, and click **"Place Legal Hold"**.',
        '3. **Provide Justification**: Enter the active court appeal reference or investigation directive.',
        '4. **How to Lift Hold**: When litigation and all statutory appeal windows are exhausted, an authorized Senior Officer can click **"Lift Legal Hold"**.',
        '5. **Retention & Disposal**: Access `/retention-disposal` to review retention schedules and execute certified cryptographic shredding.'
      ],
      tip: '💡 Files under Legal Hold cannot be modified or destroyed by any user or automated cron job.',
      actionRoute: '/retention-disposal',
      actionLabel: 'Open Retention & Disposal Vault'
    },
    hi: {
      title: 'लीगल होल्ड (Legal Hold) और डेटा सुरक्षा नियम',
      steps: [
        '1. **लीगल होल्ड क्या है?**: जब कोई केस अदालत में विचाराधीन होता है, तो उसके डेटा को स्वतः नष्ट (Auto-Purge) होने से रोकने के लिए उस पर कानूनी रोक (Legal Hold) लगाई जाती है।',
        '2. **होल्ड कैसे लगाएं?**: केस पेज (`/cases/:id`) पर जाएं और ऊपर दाईं ओर **"Place Legal Hold"** बटन दबाएं।',
        '3. **कारण दर्ज करें**: अपील संख्या या अदालत का आदेश दर्ज करें।',
        '4. **होल्ड कैसे हटाएं?**: सभी अपील प्रक्रियाएं पूरी होने पर अधिकृत सीनियर अधिकारी **"Lift Legal Hold"** कर सकते हैं।',
        '5. **डेटा नष्टीकरण (Disposal)**: `/retention-disposal` पेज पर जाकर निर्धारित समयसीमा पूरी होने के बाद कानूनी रूप से डेटा नष्ट किया जा सकता है।'
      ],
      tip: '💡 लीगल होल्ड वाले केस की फाइलों को कोई भी डिलीट नहीं कर सकता।',
      actionRoute: '/retention-disposal',
      actionLabel: 'रिटेंशन वॉल्ट खोलें'
    },
    bn: {
      title: 'লিগ্যাল হোল্ড ও ডেটা রিটেনশন নীতি',
      steps: [
        '1. **লিগ্যাল হোল্ড কী?**: আদালতে বিচারাধীন কেসের ডেটা যেন নষ্ট না হয় সেজন্য আইনি স্থগিতাদেশ দেওয়া হয়।',
        '2. কেস পেজে গিয়ে **"Place Legal Hold"** ক্লিক করে কারণ উল্লেখ করুন।',
        '3. আইনি প্রক্রিয়া সমাপ্ত হলে ঊর্ধ্বতন কর্মকর্তা **"Lift Legal Hold"** করতে পারেন।',
        '4. `/retention-disposal` পেজে সময়সীমা অনুযায়ী রেকর্ড সংরক্ষণ করা হয়।'
      ],
      tip: '💡 লিগ্যাল হোল্ড থাকা অবস্থায় কোনো ফাইল ডিলিট করা যায় না।',
      actionRoute: '/retention-disposal',
      actionLabel: 'রিটেনশন পেজ খুলুন'
    },
    mr: {
      title: 'कायदेशीर होल्ड (Legal Hold) आणि डेटा संरक्षण नियम',
      steps: [
        '1. न्यायालयीन प्रक्रिया सुरू असताना डेटा नष्ट होऊ नये म्हणून **Legal Hold** लावला जातो.',
        '2. केस उघडून **"Place Legal Hold"** बटण दाबा आणि कारण नोंदवा.',
        '3. खटला पूर्ण झाल्यावर वरिष्ठ अधिकारी होल्ड काढू शकतात (**Lift Legal Hold**).',
        '4. `/retention-disposal` वर जाऊन मुदत संपलेले रेकॉर्ड सुरक्षित नष्ट करता येतात.'
      ],
      tip: '💡 लीगल होल्ड असलेली कोणतीही फाईल हटवता येत नाही.',
      actionRoute: '/retention-disposal',
      actionLabel: 'रिटेंशन वॉल्ट पहा'
    },
    ta: {
      title: 'சட்டரீதியான நிறுத்திவைப்பு (Legal Hold) விதிகள்',
      steps: [
        '1. நீதிமன்றத்தில் வழக்கு நிலுவையில் இருக்கும்போது தரவுகள் அழிக்கப்படாமல் இருக்க **Legal Hold** வைக்கப்படுகிறது.',
        '2. வழக்கு பக்கத்தில் **"Place Legal Hold"** என்பதைக் கிளிக் செய்து காரணத்தைப் பதிவு செய்யவும்.',
        '3. அனைத்து மேல்முறையீடுகளும் முடிந்ததும் உயர் அதிகாரி அதை நீக்கலாம்.',
        '4. `/retention-disposal` பக்கத்தில் தரவு காலாவதி விதிகள் நிர்வகிக்கப்படுகின்றன.'
      ],
      tip: '💡 லீகல் ஹோல்டில் உள்ள ஆவணங்களை யாராலும் அழிக்க முடியாது.',
      actionRoute: '/retention-disposal',
      actionLabel: 'ரிடென்ஷன் பக்கம் செல்'
    },
    te: {
      title: 'లీగల్ హోల్డ్ మరియు డేటా రక్షణ నిబంధనలు',
      steps: [
        '1. కేసు కోర్టులో ఉన్నప్పుడు రికార్డులు నాశనం కాకుండా **Legal Hold** విధిస్తారు.',
        '2. కేస్ పేజీలో **"Place Legal Hold"** క్లిక్ చేసి కారణాన్ని నమోదు చేయండి.',
        '3. న్యాయ ప్రక్రియ పూర్తయిన తర్వాత సీనియర్ అధికారి హోల్డ్ తొలగించవచ్చు.',
        '4. `/retention-disposal` పేజీ ద్వారా నిబంధనల ప్రకారం రికార్డులను పర్యవేక్షించండి.'
      ],
      tip: '💡 లీగల్ హోల్డ్ ఉన్న ఫైళ్లను డిలీట్ చేయడం సాధ్యం కాదు.',
      actionRoute: '/retention-disposal',
      actionLabel: 'రిటెన్షన్ వాల్ట్ తెరవండి'
    },
    gu: {
      title: 'કાનૂની હોલ્ડ (Legal Hold) નિયમો',
      steps: [
        '1. કેસ અદાલતમાં ચાલતો હોય ત્યારે ડેટા નાશ થવાથી રોકવા **Legal Hold** મુકાય છે.',
        '2. કેસ પેજ પર **"Place Legal Hold"** ક્લિક કરીને કારણ જણાવો.',
        '3. કાનૂની પ્રક્રિયા પૂર્ણ થયા પછી વરિષ્ઠ અધિકારી હોલ્ડ હટાવી શકે છે.',
        '4. `/retention-disposal` પર જઈને રેકોર્ડ્સની જાળવણી સમીક્ષા કરી શકાય છે.'
      ],
      tip: '💡 લીગલ હોલ્ડ વાળા દસ્તાવેજો ક્યારેય ડીલીટ થઈ શકતા નથી.',
      actionRoute: '/retention-disposal',
      actionLabel: 'રીટેન્શન વોલ્ટ જુઓ'
    },
    kn: {
      title: 'ಕಾನೂನು ಹೋಲ್ಡ್ (Legal Hold) ನಿಯಮಗಳು',
      steps: [
        '1. ನ್ಯಾಯಾಲಯದಲ್ಲಿ ವಿಚಾರಣೆ ನಡೆಯುತ್ತಿರುವಾಗ ಡೇಟಾ ಅಳಿಸಿಹೋಗದಂತೆ **Legal Hold** ಹಾಕಲಾಗುತ್ತದೆ.',
        '2. ಕೇಸ್ ಪುಟದಲ್ಲಿ **"Place Legal Hold"** ಕ್ಲಿಕ್ ಮಾಡಿ ಕಾರಣ ದಾಖಲಿಸಿ.',
        '3. ವಿಚಾರಣೆ ಮುಗಿದ ನಂತರ ಹಿರಿಯ ಅಧಿಕಾರಿಗಳು ಹೋಲ್ಡ್ ತೆರವುಗೊಳಿಸಬಹುದು.',
        '4. `/retention-disposal` ಪುಟದಲ್ಲಿ ದಾಖಲೆಗಳ ಸಂರಕ್ಷಣಾ ಅವಧಿ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ.'
      ],
      tip: '💡 ಲೀಗಲ್ ಹೋಲ್ಡ್ ಇರುವ ಫೈಲ್‌ಗಳನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.',
      actionRoute: '/retention-disposal',
      actionLabel: 'ರಿಟೆನ್ಷನ್ ಪುಟಕ್ಕೆ ಹೋಗಿ'
    },
    ml: {
      title: 'ലീഗൽ ഹോൾഡും ഡാറ്റാ സംരക്ഷണ നിയമങ്ങളും',
      steps: [
        '1. കോടതിയിലുള്ള കേസുകളുടെ രേഖകൾ നഷ്ടപ്പെടാതിരിക്കാൻ **Legal Hold** ഏർപ്പെടുത്തുന്നു.',
        '2. കേസ് പേജിൽ പോയി **"Place Legal Hold"** ക്ലിക്ക് ചെയ്ത് കാരണം രേഖപ്പെടുത്തുക.',
        '3. വിചാരണ നടപടികൾ പൂർത്തിയായ ശേഷം മുതിർന്ന ഉദ്യോഗസ്ഥർക്ക് ഹോൾഡ് നീക്കം ചെയ്യാം.',
        '4. `/retention-disposal` പേജിൽ നിശ്ചിത കാലാവധി കഴിഞ്ഞ ഫയലുകൾ കൈകാര്യം ചെയ്യാം.'
      ],
      tip: '💡 ലീഗൽ ഹോൾഡിലുള്ള ഫയലുകൾ ഡിലീറ്റ് ചെയ്യാൻ സാധ്യമല്ല.',
      actionRoute: '/retention-disposal',
      actionLabel: 'റിടെൻഷൻ വോൾട്ട് തുറക്കുക'
    },
    pa: {
      title: 'ਕਾਨੂੰਨੀ ਹੋਲਡ (Legal Hold) ਨਿਯਮ',
      steps: [
        '1. ਅਦਾਲਤੀ ਕਾਰਵਾਈ ਦੌਰਾਨ ਡਾਟਾ ਸੁਰੱਖਿਅਤ ਰੱਖਣ ਲਈ **Legal Hold** ਲਗਾਇਆ ਜਾਂਦਾ ਹੈ।',
        '2. ਕੇਸ ਪੇਜ ਤੇ ਜਾ ਕੇ **"Place Legal Hold"** ਤੇ ਕਲਿੱਕ ਕਰੋ ਅਤੇ ਕਾਰਨ ਦਰਜ ਕਰੋ।',
        '3. ਅਪੀਲ ਪੂਰੀ ਹੋਣ ਤੇ ਸੀਨੀਅਰ ਅਫਸਰ ਹੋਲਡ ਹਟਾ ਸਕਦਾ ਹੈ।',
        '4. `/retention-disposal` ਤੇ ਜਾ ਕੇ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਡਾਟਾ ਪ੍ਰਬੰਧਨ ਵੇਖੋ।'
      ],
      tip: '💡 ਲੀਗਲ ਹੋਲਡ ਵਾਲੀਆਂ ਫਾਈਲਾਂ ਨੂੰ ਮਿਟਾਇਆ ਨਹੀਂ ਜਾ ਸਕਦਾ।',
      actionRoute: '/retention-disposal',
      actionLabel: 'ਰੀਟੈਂਸ਼ਨ ਵੌਲਟ ਖੋਲ੍ਹੋ'
    }
  }
};
export const findKnowledgeAnswer = (query = '', lang = 'en') => {
  const q = query.toLowerCase().trim();

  // Guardrail check first
  if (isSecurityOrArchitectureQuery(q)) {
    return {
      type: 'refusal',
      text: GUARDRAIL_REFUSAL_MESSAGES[lang] || GUARDRAIL_REFUSAL_MESSAGES.en
    };
  }

  // Number / Option Matching (1, 2, 3, 4, 5) in Arabic and Indic numerals
  const isOption1 = /^(1|one|first|option\s*1|topic\s*1|#1|१|১|૧|೧|൧|एक|पहला)$/i.test(q) || q === '1.' || q.startsWith('1 ');
  const isOption2 = /^(2|two|second|option\s*2|topic\s*2|#2|२|২|૨|೨|൨|दो|दूसरा)$/i.test(q) || q === '2.' || q.startsWith('2 ');
  const isOption3 = /^(3|three|third|option\s*3|topic\s*3|#3|३|৩|૩|೩|൩|तीन|तीसरा)$/i.test(q) || q === '3.' || q.startsWith('3 ');
  const isOption4 = /^(4|four|fourth|option\s*4|topic\s*4|#4|४|৪|૪|೪|൪|चार|चौथा)$/i.test(q) || q === '4.' || q.startsWith('4 ');
  const isOption5 = /^(5|five|fifth|option\s*5|topic\s*5|#5|५|৫|૫|೫|൫|पांच|पाँच|पांचवा)$/i.test(q) || q === '5.' || q.startsWith('5 ');

  if (isOption1) {
    const data = KNOWLEDGE_GUIDES.case_creation[lang] || KNOWLEDGE_GUIDES.case_creation.en;
    return {
      type: 'guide',
      optionNumber: 1,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (isOption2) {
    const data = KNOWLEDGE_GUIDES.chargesheet_filing[lang] || KNOWLEDGE_GUIDES.chargesheet_filing.en;
    return {
      type: 'guide',
      optionNumber: 2,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (isOption3) {
    const data = KNOWLEDGE_GUIDES.court_proceedings[lang] || KNOWLEDGE_GUIDES.court_proceedings.en;
    return {
      type: 'guide',
      optionNumber: 3,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (isOption4) {
    const data = KNOWLEDGE_GUIDES.evidence_custody[lang] || KNOWLEDGE_GUIDES.evidence_custody.en;
    return {
      type: 'guide',
      optionNumber: 4,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (isOption5) {
    const data = KNOWLEDGE_GUIDES.legal_hold[lang] || KNOWLEDGE_GUIDES.legal_hold.en;
    return {
      type: 'guide',
      optionNumber: 5,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  // Check intent keywords
  if (
    q.includes('case') || q.includes('dossier') || q.includes('केस') || q.includes('एफआईआर') ||
    q.includes('fir') || q.includes('register case') || q.includes('नया केस') || q.includes('মামলা')
  ) {
    const data = KNOWLEDGE_GUIDES.case_creation[lang] || KNOWLEDGE_GUIDES.case_creation.en;
    return {
      type: 'guide',
      optionNumber: 1,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (
    q.includes('chargesheet') || q.includes('charge sheet') || q.includes('चार्जशीट') ||
    q.includes('173') || q.includes('193') || q.includes('prosecutor') || q.includes('वकील') ||
    q.includes('चार्ज शीट') || q.includes('ফাইল')
  ) {
    const data = KNOWLEDGE_GUIDES.chargesheet_filing[lang] || KNOWLEDGE_GUIDES.chargesheet_filing.en;
    return {
      type: 'guide',
      optionNumber: 2,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (
    q.includes('court') || q.includes('hearing') || q.includes('judgment') || q.includes('verdict') ||
    q.includes('bail') || q.includes('कोर्ट') || q.includes('अदालत') || q.includes('सुनवाई') ||
    q.includes('फैसला') || q.includes('जमानत') || q.includes('বিচার') || q.includes('ನ್ಯಾಯಾಲಯ')
  ) {
    const data = KNOWLEDGE_GUIDES.court_proceedings[lang] || KNOWLEDGE_GUIDES.court_proceedings.en;
    return {
      type: 'guide',
      optionNumber: 3,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (
    q.includes('evidence') || q.includes('custody') || q.includes('65b') || q.includes('hash') ||
    q.includes('सबूत') || q.includes('कस्टडी') || q.includes('लॉकर') || q.includes('प्रमाण') ||
    q.includes('साक्ष्य') || q.includes('சான்று')
  ) {
    const data = KNOWLEDGE_GUIDES.evidence_custody[lang] || KNOWLEDGE_GUIDES.evidence_custody.en;
    return {
      type: 'guide',
      optionNumber: 4,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  if (
    q.includes('hold') || q.includes('retention') || q.includes('disposal') || q.includes('होल्ड') ||
    q.includes('डिस्पोजल') || q.includes('delete') || q.includes('हटाना')
  ) {
    const data = KNOWLEDGE_GUIDES.legal_hold[lang] || KNOWLEDGE_GUIDES.legal_hold.en;
    return {
      type: 'guide',
      optionNumber: 5,
      title: data.title,
      steps: data.steps,
      tip: data.tip,
      actionRoute: data.actionRoute,
      actionLabel: data.actionLabel
    };
  }

  // General helpful numbered overview
  const genericGreetings = {
    en: "Namaste! I am **Saarthi**, your multilingual operational assistant. You can ask me how to perform any task on this platform:\n\n1. **How to create a new case dossier?**\n2. **How to draft and file a charge sheet?**\n3. **How to record court hearings and final judgments?**\n4. **How to register evidence and transfer custody?**\n5. **What is Legal Hold and how does it work?**\n\n👉 **Type 1, 2, 3, 4, or 5:**",
    hi: "नमस्ते! मैं **सारथी (Saarthi)** हूँ, आपका कार्यप्रणाली सहायक। आप मुझसे इस सिस्टम के उपयोग के बारे में पूछ सकते हैं:\n\n1. **नया केस कैसे बनाएं? (Case Dossier)**\n2. **चार्जशीट तैयार कर कोर्ट में कैसे दाखिल करें?**\n3. **कोर्ट की सुनवाई और फैसला (Judgment) कैसे दर्ज करें?**\n4. **सबूत कैसे दर्ज करें और कस्टडी ट्रांसफर कैसे करें?**\n5. **लीगल होल्ड (Legal Hold) क्या है और इसका उपयोग कैसे करें?**\n\n👉 **विकल्प संख्या (1, 2, 3, 4 या 5) टाइप करें:**",
    bn: "নমস্কার! আমি **সারথি (Saarthi)**, আপনার সিস্টেম ব্যবহারের সহায়ক:\n\n1. **নতুন কেস তৈরি করা (Case Dossier)**\n2. **চার্জশিট দাখিল ও স্বাক্ষর করা**\n3. **আদালতের শুনানি ও রায় নথিভুক্ত করা**\n4. **প্রমাণ নিবন্ধন ও হেফাজত হস্তান্তর**\n5. **লিগ্যাল হোল্ড (Legal Hold) নিয়ম**\n\n👉 **1, 2, 3, 4 বা 5 টাইপ করুন:**",
    mr: "नमस्कार! मी **सारथी (Saarthi)** आहे. खालील विषयांवर माहितीसाठी क्रमांक निवडा:\n\n1. **नवीन केस कशी तयार करावी?**\n2. **चार्जशीट कशी दाखल करावी?**\n3. **कोर्टाची सुनावणी व निकाल कसा नोंदवावा?**\n4. **पुरावा कस्टडी हस्तांतरण कसे करावे?**\n5. **कायदेशीर होल्ड (Legal Hold) काय आहे?**\n\n👉 **1, 2, 3, 4 किंवा 5 टाइप करा:**",
    ta: "வணக்கம்! நான் **சாரதி (Saarthi)**. தகவலுக்கு எண்ணைத் தட்டச்சு செய்யவும்:\n\n1. **புதிய வழக்கு பதிவு செய்வது எப்படி?**\n2. **குற்றப்பத்திரிகை தாக்கல் செய்வது எப்படி?**\n3. **நீதிமன்ற விசாரணை & தீர்ப்பை பதிவு செய்வது எப்படி?**\n4. **சான்றுகளை பதிவு செய்து ஒப்படைப்பது எப்படி?**\n5. **சட்டரீதியான நிறுத்திவைப்பு (Legal Hold) என்றால் என்ன?**\n\n👉 **1, 2, 3, 4 அல்லது 5 தட்டச்சு செய்க:**",
    te: "నమస్కారం! నేను **సారథి (Saarthi)**. వివరణ కోసం సంఖ్యను టైప్ చేయండి:\n\n1. **కొత్త కేసును ఎలా నమోదు చేయాలి?**\n2. **ఛార్జిషీట్‌ను ఎలా దాఖలు చేయాలి?**\n3. **కోర్టు విచారణ మరియు తీర్పును ఎలా రికార్డ్ చేయాలి?**\n4. **సాక్ష్యాలను ఎలా బదిలీ చేయాలి?**\n5. **లీగల్ హోల్డ్ నిబంధనలు ఏమిటి?**\n\n👉 **1, 2, 3, 4 లేదా 5 టైప్ చేయండి:**",
    gu: "નમસ્તે! હું **સારથી (Saarthi)** છું. માહિતી માટે નંબર દાખલ કરો:\n\n1. **નવો કેસ કેવી રીતે બનાવવો?**\n2. **ચાર્જશીટ કેવી રીતે દાખલ કરવી?**\n3. **અદાલતી સુનાવણી અને ચુકાદો કેવી રીતે નોંધવો?**\n4. **પુરાવા અને કસ્ટડી ટ્રાન્સફર કેવી રીતે કરવી?**\n5. **કાનૂની હોલ્ડ (Legal Hold) શું છે?**\n\n👉 **1, 2, 3, 4 અથવા 5 ટાઈપ કરો:**",
    kn: "ನಮಸ್ಕಾರ! ನಾನು **ಸಾರಥಿ (Saarthi)**. ಮಾಹಿತಿಗಾಗಿ ಸಂಖ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ:\n\n1. **ಹೊಸ ಕೇಸ್ ಹೇಗೆ ರಚಿಸುವುದು?**\n2. **ಚಾರ್ಜ್‌ಶೀಟ್ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?**\n3. **ನ್ಯಾಯಾಲಯದ ವಿಚಾರಣೆ ಮತ್ತು ತೀರ್ಪು ದಾಖಲಿಸುವುದು ಹೇಗೆ?**\n4. **ಸಾಕ್ಷ್ಯ ವರ್ಗಾವಣೆ ಹೇಗೆ ಮಾಡುವುದು?**\n5. **ಕಾನೂನು ಹೋಲ್ಡ್ ನಿಯಮಗಳು ಯಾವುವು?**\n\n👉 **1, 2, 3, 4 ಅಥವಾ 5 ಟೈಪ್ ಮಾಡಿ:**",
    ml: "നമസ്കാരം! ഞാൻ **സാരഥി (Saarthi)**:\n\n1. **പുതിയ കേസ് എങ്ങനെ രജിസ്റ്റർ ചെയ്യാം?**\n2. **കുറ്റപത്രം എങ്ങനെ സമർപ്പിക്കാം?**\n3. **കോടതി വിചാരണയും വിധിയും എങ്ങനെ രേഖപ്പെടുത്താം?**\n4. **തെളിവ് കസ്റ്റഡി കൈമാറ്റം എങ്ങനെ ചെയ്യാം?**\n5. **ലീഗൽ ഹോൾഡ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?**\n\n👉 **1, 2, 3, 4 അല്ലെങ്കിൽ 5 ടൈപ്പ് ചെയ്യുക:**",
    pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ **ਸਾਰਥੀ (Saarthi)** ਹਾਂ:\n\n1. **ਨਵਾਂ ਕੇਸ ਕਿਵੇਂ ਦਰਜ ਕਰੀਏ?**\n2. **ਚਾਰਜਸ਼ੀਟ ਕਿਵੇਂ ਦਾਇਰ ਕਰੀਏ?**\n3. **ਅਦਾਲਤੀ ਸੁਣਵਾਈ ਅਤੇ ਫੈਸਲਾ ਕਿਵੇਂ ਦਰਜ ਕਰੀਏ?**\n4. **ਸਬੂਤ ਕਸਟਡੀ ਕਿਵੇਂ ਤਬਦੀਲ ਕਰੀਏ?**\n5. **ਕਾਨੂੰਨੀ ਹੋਲਡ (Legal Hold) ਕੀ ਹੈ?**\n\n👉 **1, 2, 3, 4 ਜਾਂ 5 ਟਾਈਪ ਕਰੋ:**"
  };

  return {
    type: 'general',
    text: genericGreetings[lang] || genericGreetings.en
  };
};
