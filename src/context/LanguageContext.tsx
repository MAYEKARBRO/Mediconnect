import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple Translation Dictionary
const translations: Record<Language, Record<string, string>> = {
    en: {
        'profile.title': 'My Profile',
        'profile.personal_info': 'Personal Information',
        'profile.full_name': 'Full Name',
        'profile.phone': 'Phone',
        'profile.emergency_contact': 'Emergency Contact',
        'profile.vitals': 'Vitals & Stats',
        'profile.height': 'Height (cm/ft)',
        'profile.weight': 'Weight (kg/lbs)',
        'profile.medical_details': 'Medical Details',
        'profile.allergies': 'Allergies',
        'profile.conditions': 'Chronic Conditions / History',
        'profile.save': 'Save Profile',
        'profile.saving': 'Saving...',
        'profile.interface_settings': 'Interface Settings',
        'profile.change_language': 'Change Interface Language',
        'sidebar.dashboard': 'Dashboard',
        'sidebar.visits': 'My Visits',
        'sidebar.search': 'Find Doctors',
        'sidebar.messages': 'Messages',
        'sidebar.events': 'Health Events',
        'sidebar.chatbot': 'AI Assistant',
        'sidebar.pharmacy': 'Pharmacy',
        'sidebar.profile': 'Profile',
        'sidebar.logout': 'Logout'
    },
    hi: {
        'profile.title': 'मेरी प्रोफाइल',
        'profile.personal_info': 'व्यक्तिगत जानकारी',
        'profile.full_name': 'पूरा नाम',
        'profile.phone': 'फ़ोन नंबर',
        'profile.emergency_contact': 'आपातकालीन संपर्क',
        'profile.vitals': 'स्वास्थ्य आँकड़े',
        'profile.height': 'ऊंचाई (सेमी/फीट)',
        'profile.weight': 'वजन (किग्रा)',
        'profile.medical_details': 'चिकित्सा विवरण',
        'profile.allergies': 'एलेर्जी',
        'profile.conditions': 'पुरानी बीमारियाँ / इतिहास',
        'profile.save': 'प्रोफाइल सहेजें',
        'profile.saving': 'सहेजा जा रहा है...',
        'profile.interface_settings': 'इंटरफ़ेस सेटिंग्स',
        'profile.change_language': 'भाषा बदलें',
        'sidebar.dashboard': 'डैशबोर्ड',
        'sidebar.visits': 'मेरी यात्राएँ',
        'sidebar.search': 'डॉक्टर खोजें',
        'sidebar.messages': 'संदेश',
        'sidebar.events': 'स्वास्थ्य कार्यक्रम',
        'sidebar.chatbot': 'एआई सहायक',
        'sidebar.pharmacy': 'फार्मेसी',
        'sidebar.profile': 'प्रोफाइल',
        'sidebar.logout': 'लॉग आउट'
    },
    mr: {
        'profile.title': 'माझी प्रोफाइल',
        'profile.personal_info': 'वैयक्तिक माहिती',
        'profile.full_name': 'पूर्ण नाव',
        'profile.phone': 'फोन नंबर',
        'profile.emergency_contact': 'आणीबाणी संपर्क',
        'profile.vitals': 'आरोग्य आकडेवारी',
        'profile.height': 'उंची (सेमी/फूट)',
        'profile.weight': 'वजन (किग्रॅ)',
        'profile.medical_details': 'वैद्यकीय तपशील',
        'profile.allergies': 'अँलर्जी',
        'profile.conditions': 'जुनाट आजार / इतिहास',
        'profile.save': 'प्रोफाइल जतन करा',
        'profile.saving': 'जतन करत आहे...',
        'profile.interface_settings': 'इंटरफेस सेटिंग्ज',
        'profile.change_language': 'भाषा बदला',
        'sidebar.dashboard': 'डॅशबोर्ड',
        'sidebar.visits': 'माझ्या भेटी',
        'sidebar.search': 'डॉक्टर शोधा',
        'sidebar.messages': 'संदेश',
        'sidebar.events': 'आरोग्य कार्यक्रम',
        'sidebar.chatbot': 'एआय असिस्टंट',
        'sidebar.pharmacy': 'फार्मसी',
        'sidebar.profile': 'प्रोफाइल',
        'sidebar.logout': 'लॉग आउट'
    }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // Try to get language from localStorage, default to 'en'
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'hi' || saved === 'mr') ? saved : 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
