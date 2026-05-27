import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLedgerStore, ServiceRateConfig } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { Droplet, Wrench, ShieldAlert, Spade, Users, Check, ArrowRight } from 'lucide-react-native';

const SERVICES_METADATA = [
  { name: 'water', key: 'water', icon: Droplet },
  { name: 'tractor', key: 'tractor', icon: Wrench },
  { name: 'spray', key: 'spray', icon: ShieldAlert },
  { name: 'seeds', key: 'seeds', icon: Spade },
  { name: 'labor', key: 'labor', icon: Users },
];

export default function Onboarding() {
  const router = useRouter();
  const { 
    language, 
    setLanguage, 
    activeRates, 
    updateRates, 
    setOnboarded 
  } = useLedgerStore();

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>(['water', 'tractor']);
  const [rates, setRates] = useState<ServiceRateConfig[]>(activeRates);

  const t = translations[language];

  const handleLanguageSelect = async (lang: 'english' | 'hindi' | 'hinglish') => {
    await setLanguage(lang);
    setStep(2);
  };

  const handleToggleService = (name: string) => {
    setSelectedServices(prev => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== name);
      }
      return [...prev, name];
    });
  };

  const handleRateChange = (serviceName: string, delta: number) => {
    setRates(prev => prev.map(r => {
      if (r.name === serviceName) {
        return { ...r, rate: Math.max(0, r.rate + delta) };
      }
      return r;
    }));
  };

  const handleOnboardingComplete = async () => {
    const finalRates = rates.filter(r => selectedServices.includes(r.name));
    await updateRates(finalRates);
    await setOnboarded(true);
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>🌾 FarmMitra</Text>
        <Text style={styles.brandSubtitle}>{t.onboardingSub}</Text>
      </View>

      <View style={styles.content}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Language / भाषा चुनें</Text>
            
            <TouchableOpacity 
              style={[styles.langBtn, language === 'hinglish' && styles.langBtnActive]} 
              onPress={() => handleLanguageSelect('hinglish')}
            >
              <Text style={styles.langName}>Hinglish (Mix)</Text>
              <Text style={styles.langSample}>"Nayi Entry Karein", "Paisa Mila"</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langBtn, language === 'hindi' && styles.langBtnActive]} 
              onPress={() => handleLanguageSelect('hindi')}
            >
              <Text style={styles.langName}>हिन्दी (Hindi)</Text>
              <Text style={styles.langSample}>"नई एंट्री जोड़ें", "पैसे मिले"</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langBtn, language === 'english' && styles.langBtnActive]} 
              onPress={() => handleLanguageSelect('english')}
            >
              <Text style={styles.langName}>English (English)</Text>
              <Text style={styles.langSample}>"Add Service Entry", "Receive Payment"</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {language === 'english' ? 'What do you offer?' : 'Aap kya kaam karte hain?'}
            </Text>
            <Text style={styles.stepSub}>Select all service tasks you provide to farmers.</Text>
            
            <ScrollView style={styles.scroll}>
              {SERVICES_METADATA.map((service) => {
                const Icon = service.icon;
                const isChecked = selectedServices.includes(service.name);
                const localizedName = t[service.key as keyof typeof t] || service.name;
                
                return (
                  <TouchableOpacity
                    key={service.name}
                    style={[styles.serviceCard, isChecked && styles.serviceCardActive]}
                    onPress={() => handleToggleService(service.name)}
                  >
                    <View style={styles.serviceLeft}>
                      <View style={[styles.serviceIconWrap, isChecked && styles.serviceIconWrapActive]}>
                        <Icon size={20} color={isChecked ? '#ffffff' : '#94a3b8'} />
                      </View>
                      <Text style={styles.serviceName}>{localizedName}</Text>
                    </View>
                    <View style={[styles.checkCircle, isChecked && styles.checkCircleActive]}>
                      {isChecked && <Check size={14} color="#ffffff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t.setupRates}</Text>
            <Text style={styles.stepSub}>Adjust default rate per Bigha for selected tasks.</Text>
            
            <ScrollView style={styles.scroll}>
              {rates
                .filter(r => selectedServices.includes(r.name))
                .map((item) => {
                  const localizedName = t[item.name as keyof typeof t] || item.name;
                  return (
                    <View key={item.name} style={styles.rateRow}>
                      <View>
                        <Text style={styles.rateLabel}>{localizedName}</Text>
                        <Text style={styles.rateSub}>Rate per Bigha</Text>
                      </View>
                      <View style={styles.rateActions}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleRateChange(item.name, -50)}>
                          <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.rateVal}>₹{item.rate}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleRateChange(item.name, 50)}>
                          <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step > 1 && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(prev => prev - 1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            
            {step === 2 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                <Text style={styles.nextBtnText}>Next</Text>
                <ArrowRight size={16} color="#ffffff" style={styles.iconMargin} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={handleOnboardingComplete}>
                <Text style={styles.nextBtnText}>{t.getStarted}</Text>
                <Check size={16} color="#ffffff" style={styles.iconMargin} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {step === 1 && (
          <Text style={styles.footerInfo}>🛡️ Safe & Offline-First Diary App</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  langBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  langBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0fdf4',
  },
  langName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  langSample: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  scroll: {
    maxHeight: 340,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  serviceCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0fdf4',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceIconWrapActive: {
    backgroundColor: theme.colors.primary,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rateLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  rateSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  rateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  rateVal: {
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  footer: {
    paddingVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: {
    fontWeight: 'bold',
    color: '#475569',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconMargin: {
    marginLeft: 6,
  },
  footerInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginVertical: 10,
  },
});
