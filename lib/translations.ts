export type Language = 'english' | 'hindi' | 'hinglish';

export const translations = {
  english: {
    appName: "FarmMitra",
    home: "Home",
    farmers: "Farmers",
    addEntry: "Add Entry",
    payments: "Payments",
    settings: "Settings",
    dashboard: "Dashboard",
    
    // Dashboard Card Labels
    todayEntries: "Today's Entries",
    totalPending: "Pending Balance",
    todayCollection: "Today's Collections",
    topPendingFarmers: "Top Pending Farmers",
    noPendingFarmers: "No pending payments! Clean slate.",
    
    // Quick Actions
    receivePayment: "Receive Payment",
    viewLedger: "View Ledger",
    dailySummary: "Daily Summary",
    quickActions: "Quick Actions",
    
    // Farmer management
    addFarmer: "Add New Farmer",
    farmerName: "Farmer Name",
    village: "Village",
    selectVillage: "Select Village",
    mobileOptional: "Mobile Number (Optional)",
    notesOptional: "Notes (Optional)",
    recentVillages: "Recent Villages",
    searchFarmer: "Search Farmer...",
    villageFilter: "Filter by Village",
    allVillages: "All Villages",
    voiceHelpText: "Tap microphone and speak (e.g. 'Ramveer 3 Bigha Water')",
    saving: "Saving...",
    save: "Save",
    cancel: "Cancel",
    farmerAdded: "Farmer added successfully!",
    
    // Service Entry Flow
    selectFarmer: "Select Farmer",
    selectService: "Select Service",
    selectCrop: "Select Crop",
    enterArea: "Enter Area (Bigha)",
    ratePerBigha: "Rate per Bigha",
    autoTotal: "Auto-Calculated Total",
    saveEntry: "Save Entry",
    entrySaved: "Service entry saved!",
    today: "Today",
    yesterday: "Yesterday",
    
    // Service Types (Colloquial)
    water: "Water / Irrigation",
    tractor: "Tractor / Ploughing",
    spray: "Spray / Pesticide",
    seeds: "Seeds / Khad",
    labor: "Labor / Mazdoori",
    
    // Crops
    wheat: "Wheat (Gehun)",
    paddy: "Paddy (Dhan)",
    potato: "Potato (Aaloo)",
    sugarcane: "Sugarcane (Ganna)",
    mustard: "Mustard (Sarso)",
    other: "Other",

    // Payments
    amountReceived: "Amount Received (₹)",
    paymentMethod: "Payment Method",
    cash: "Cash (Nokad)",
    upi: "PhonePe/UPI",
    bank: "Bank Transfer",
    recordPayment: "Record Payment",
    paymentSaved: "Payment recorded successfully!",
    
    // Ledger
    outstandingBalance: "Outstanding Balance",
    totalPaid: "Total Paid",
    lastPayment: "Last Payment",
    noEntries: "No records found.",
    whatsappReminder: "WhatsApp Reminder",
    whatsappRemindText: "Hi *{farmer}*, your pending balance on FarmMitra is *₹{amount}*. Please clear it at your convenience. Thank you!",
    whatsappLedgerText: "Hi *{farmer}*, here is your ledger summary:\nPending: *₹{pending}*\nTotal Paid: *₹{paid}*\nLast Payment: {date}\nPowered by FarmMitra.",
    
    // Analytics
    reports: "Reports & Analytics",
    monthlyEarnings: "Monthly Earnings",
    villageWise: "Village-Wise Pending",
    cropWise: "Crop-Wise Revenue",
    delayedPayments: "Delayed Payments (>30 days)",
    topDebtors: "Highest Outstanding Dues",
    earningsSummary: "Earnings Summary",
    
    // Onboarding & Setup
    chooseLanguage: "Choose Your Language",
    setupRates: "Set Your Rates per Bigha",
    onboardingSub: "Your digital diary. Easy, offline, zero-typing ledger.",
    getStarted: "Get Started",
    
    // Login
    operatorLogin: "Operator Login",
    enterMobile: "Enter Mobile Number",
    enterPin: "Enter 4-Digit Security PIN",
    verifyOtp: "Verify OTP",
    otpSent: "OTP sent to your mobile (use 123456 for demo)",
    submit: "Submit",
    createPin: "Create Security PIN",
    confirmPin: "Confirm PIN",
    
    // Settings
    ratesConfig: "Configure Rates",
    backupSync: "Backup & Sync",
    syncNow: "Sync with Cloud",
    syncedSuccessfully: "Database backed up successfully!",
    offlineWarning: "You are currently offline. Changes will sync when internet returns.",
    onlineReady: "Database is online and synchronized."
  },
  hinglish: {
    appName: "FarmMitra",
    home: "Home",
    farmers: "Kisan List",
    addEntry: "Nayi Entry",
    payments: "Paisa Mila",
    settings: "Settings",
    dashboard: "Dashboard",
    
    // Dashboard Card Labels
    todayEntries: "Aaj ki Entries",
    totalPending: "Kul Bacha Paisa",
    todayCollection: "Aaj ka Mila Paisa",
    topPendingFarmers: "Sabse Zyada Baaki Wale Kisan",
    noPendingFarmers: "Koi baaki nahi hai! Sab clean hai.",
    
    // Quick Actions
    receivePayment: "Kisan se Paisa Mila",
    viewLedger: "Bahi Khata Dekhein",
    dailySummary: "Aaj ka Summary",
    quickActions: "Quick Actions",
    
    // Farmer management
    addFarmer: "Naya Kisan Jodein",
    farmerName: "Kisan ka Naam",
    village: "Gaon",
    selectVillage: "Gaon Chunein",
    mobileOptional: "Mobile Number (Zaroori nahi)",
    notesOptional: "Kuch Khaas Baat (Optional)",
    recentVillages: "Haal hi ke Gaon",
    searchFarmer: "Kisan ka Naam Khojein...",
    villageFilter: "Gaon ke hisab se dekhein",
    allVillages: "Sabhi Gaon",
    voiceHelpText: "Mic par click karke bolein (e.g. 'Ramveer 3 Bigha Paani')",
    saving: "Save ho raha hai...",
    save: "Save Karein",
    cancel: "Wapas",
    farmerAdded: "Naya Kisan jod diya gaya!",
    
    // Service Entry Flow
    selectFarmer: "Kisan Chunein",
    selectService: "Kaam Chunein",
    selectCrop: "Fasal Chunein",
    enterArea: "Zameen (Bigha mein)",
    ratePerBigha: "Rate per Bigha",
    autoTotal: "Kul Rupee (Auto Calculation)",
    saveEntry: "Entry Save Karein",
    entrySaved: "Kaam ki entry save ho gayi!",
    today: "Aaj",
    yesterday: "Kal",
    
    // Service Types
    water: "Paani / Sinchai",
    tractor: "Tractor / Jotai",
    spray: "Dawai Spray",
    seeds: "Beej / Khad",
    labor: "Mazdoor / Labor",
    
    // Crops
    wheat: "Gehun (Wheat)",
    paddy: "Dhan (Paddy)",
    potato: "Aaloo (Potato)",
    sugarcane: "Ganna (Sugarcane)",
    mustard: "Sarso (Mustard)",
    other: "Kuch aur",

    // Payments
    amountReceived: "Kitna Paisa Mila (₹)",
    paymentMethod: "Kaise Mila",
    cash: "Nokad (Cash)",
    upi: "PhonePe/GPay/UPI",
    bank: "Bank Transfer",
    recordPayment: "Entry Save Karein",
    paymentSaved: "Paisa milne ki entry save ho gayi!",
    
    // Ledger
    outstandingBalance: "Baaki Amount",
    totalPaid: "Ab tak Mila",
    lastPayment: "Aakhiri Payment",
    noEntries: "Koi record nahi mila.",
    whatsappReminder: "WhatsApp Reminder",
    whatsappRemindText: "Namaskar *{farmer}*, aapka FarmMitra par *₹{amount}* baaki hai. Kripya samay par jama karayein. Dhanyawad!",
    whatsappLedgerText: "Namaskar *{farmer}*, aapka bahi-khata summary:\nBaaki: *₹{pending}*\nKul Jama: *₹{paid}*\nAakhiri Payment: {date}\nPowered by FarmMitra.",
    
    // Analytics
    reports: "Hisab Kitab (Reports)",
    monthlyEarnings: "Mahine ki Kamai",
    villageWise: "Gaon ke hisab se baaki",
    cropWise: "Fasal ke hisab se kamai",
    delayedPayments: "Purana Baaki (>30 din)",
    topDebtors: "Sabse Zyada Baaki Wale",
    earningsSummary: "Kamai ka Summary",
    
    // Onboarding & Setup
    chooseLanguage: "Apni Bhasha Chunein",
    setupRates: "Apna Kaam aur Rate Set Karein",
    onboardingSub: "Aapka digital bahi-khata. Offline chalne wala aur bina typing ka dairy.",
    getStarted: "Shuru Karein",
    
    // Login
    operatorLogin: "Mitra Login",
    enterMobile: "Mobile Number Daalein",
    enterPin: "4-Digit PIN Daalein",
    verifyOtp: "OTP Enter Karein",
    otpSent: "OTP bhej diya gaya hai (demo ke liye 123456 daalein)",
    submit: "Submit",
    createPin: "Apna Security PIN Banayein",
    confirmPin: "PIN Dobara Daalein",
    
    // Settings
    ratesConfig: "Rate Change Karein",
    backupSync: "Backup aur Sync",
    syncNow: "Cloud par Backup Karein",
    syncedSuccessfully: "Database backup ho gaya!",
    offlineWarning: "Aap offline hain. Internet aane par data sync ho jayega.",
    onlineReady: "App online hai aur data sync hai."
  },
  hindi: {
    appName: "फार्ममित्र",
    home: "होम",
    farmers: "किसान सूची",
    addEntry: "नई एंट्री",
    payments: "पैसे मिले",
    settings: "सेटिंग्स",
    dashboard: "डैशबोर्ड",
    
    // Dashboard Card Labels
    todayEntries: "आज की एंट्री",
    totalPending: "कुल बकाया राशि",
    todayCollection: "आज की कुल वसूली",
    topPendingFarmers: "अधिक बकाया वाले किसान",
    noPendingFarmers: "कोई बकाया राशि नहीं है! सब ठीक है।",
    
    // Quick Actions
    receivePayment: "किसान से भुगतान लें",
    viewLedger: "बही-खाता देखें",
    dailySummary: "दैनिक सारांश",
    quickActions: "त्वरित विकल्प",
    
    // Farmer management
    addFarmer: "नया किसान जोड़ें",
    farmerName: "किसान का नाम",
    village: "गांव",
    selectVillage: "गांव चुनें",
    mobileOptional: "मोबाइल नंबर (वैकल्पिक)",
    notesOptional: "विशेष टिप्पणी (वैकल्पिक)",
    recentVillages: "हाल के गांव",
    searchFarmer: "किसान का नाम खोजें...",
    villageFilter: "गांव के अनुसार देखें",
    allVillages: "सभी गांव",
    voiceHelpText: "माइक बटन दबाएं और बोलें (जैसे: 'रामवीर ३ बीघा पानी')",
    saving: "सुरक्षित हो रहा है...",
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    farmerAdded: "किसान सफलतापूर्वक जोड़ दिया गया है!",
    
    // Service Entry Flow
    selectFarmer: "किसान का चयन करें",
    selectService: "कार्य चुनें",
    selectCrop: "फसल चुनें",
    enterArea: "रकबा (बीघा में)",
    ratePerBigha: "दर प्रति बीघा",
    autoTotal: "कुल राशि (स्वचालित गणना)",
    saveEntry: "एंट्री सुरक्षित करें",
    entrySaved: "सेवा प्रविष्टि सुरक्षित की गई!",
    today: "आज",
    yesterday: "कल",
    
    // Service Types
    water: "पानी / सिंचाई",
    tractor: "ट्रैक्टर / जुताई",
    spray: "कीटनाशक छिड़काव",
    seeds: "बीज / खाद",
    labor: "मजदूर / मजदूरी",
    
    // Crops
    wheat: "गेहूं",
    paddy: "धान",
    potato: "आलू",
    sugarcane: "गन्ना",
    mustard: "सरसों",
    other: "अन्य",

    // Payments
    amountReceived: "प्राप्त राशि (₹)",
    paymentMethod: "भुगतान का प्रकार",
    cash: "नकद (कैश)",
    upi: "फोनपे/यूपीआई",
    bank: "बैंक ट्रांसफर",
    recordPayment: "भुगतान दर्ज करें",
    paymentSaved: "भुगतान प्रविष्टि सुरक्षित कर दी गई है!",
    
    // Ledger
    outstandingBalance: "कुल बकाया राशि",
    totalPaid: "कुल प्राप्त राशि",
    lastPayment: "अंतिम भुगतान",
    noEntries: "कोई प्रविष्टि नहीं मिली।",
    whatsappReminder: "व्हाट्सएप संदेश",
    whatsappRemindText: "नमस्कार *{farmer}*, फार्ममित्र ऐप पर आपका बकाया *₹{amount}* है। कृपया जल्द से जल्द भुगतान करें। धन्यवाद!",
    whatsappLedgerText: "नमस्कार *{farmer}*, आपका बही-खाता सारांश:\nबकाया: *₹{pending}*\nकुल जमा: *₹{paid}*\nअंतिम भुगतान: {date}\nफार्ममित्र द्वारा संचालित।",
    
    // Analytics
    reports: "रिपोर्ट और विश्लेषण",
    monthlyEarnings: "मासिक आय",
    villageWise: "गांव के अनुसार बकाया",
    cropWise: "फसल के अनुसार आय",
    delayedPayments: "विलंबित भुगतान (>३० दिन)",
    topDebtors: "सर्वाधिक बकाया वाले",
    earningsSummary: "आय का सारांश",
    
    // Onboarding & Setup
    chooseLanguage: "अपनी भाषा चुनें",
    setupRates: "अपने कार्य की दरें सेट करें (प्रति बीघा)",
    onboardingSub: "आपका डिजिटल बही-खाता। बिना टाइपिंग का, ऑफलाइन चलने वाला डायरी।",
    getStarted: "शुरू करें",
    
    // Login
    operatorLogin: "ऑपरेटर लॉगिन",
    enterMobile: "मोबाइल नंबर दर्ज करें",
    enterPin: "४-अंकों का पिन दर्ज करें",
    verifyOtp: "ओटीपी दर्ज करें",
    otpSent: "ओटीपी भेज दिया गया है (डेमो के लिए 123456 का उपयोग करें)",
    submit: "सबमिट",
    createPin: "अपना सुरक्षा पिन बनाएं",
    confirmPin: "पिन की पुष्टि करें",
    
    // Settings
    ratesConfig: "दरें बदलें",
    backupSync: "बैकअप और सिंक",
    syncNow: "क्लाउड पर बैकअप लें",
    syncedSuccessfully: "डेटाबेस का बैकअप हो गया है!",
    offlineWarning: "आप अभी ऑफलाइन हैं। इंटरनेट आने पर सिंक हो जाएगा।",
    onlineReady: "ऐप ऑनलाइन है और डेटा सिंक है।"
  }
};
