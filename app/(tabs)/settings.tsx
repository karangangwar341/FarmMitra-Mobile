import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLedgerStore, ServiceRateConfig } from '../../lib/store';
import { translations, Language } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { ArrowLeft, Settings2, Database, Trash2, LogOut, Check, RefreshCw } from 'lucide-react-native';

export default function Settings() {
  const router = useRouter();
  const { 
    currentUser, 
    language, 
    setLanguage, 
    activeRates, 
    updateRates, 
    isOffline, 
    isSyncing, 
    syncQueueLength, 
    syncWithCloud,
    clearLocalCache
  } = useLedgerStore();

  const t = translations[language];

  const [rates, setRates] = useState<ServiceRateConfig[]>(activeRates);
  const [saveStatus, setSaveStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  const handleRateChange = (serviceName: string, delta: number) => {
    setRates(prev => prev.map(r => {
      if (r.name === serviceName) {
        return { ...r, rate: Math.max(0, r.rate + delta) };
      }
      return r;
    }));
  };

  const handleSaveRates = async () => {
    try {
      await updateRates(rates);
      setSaveStatus('Rates saved successfully!');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      setSaveStatus('Failed to save rates.');
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  const handleManualSync = async () => {
    if (isOffline) {
      setSyncStatus('Cannot sync: You are offline.');
      setTimeout(() => setSyncStatus(''), 3000);
      return;
    }

    setSyncStatus('Backing up to cloud...');
    const success = await syncWithCloud();
    if (success) {
      setSyncStatus('Backup completed successfully!');
    } else {
      setSyncStatus('Backup halted or failed. Try again.');
    }
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleLogout = async () => {
    Alert.alert(
      "साइन आउट",
      "Are you sure you want to log out and clear the offline cache? MAKE SURE YOU SYNC PENDING CHANGES.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await clearLocalCache();
            router.replace('/(onboarding)');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.settings}</Text>
          <Text style={styles.headerSubtitle}>Operator Settings & Profile</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        {currentUser ? (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {currentUser.name ? currentUser.name.charAt(0) : 'M'}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{currentUser.name || 'Mitra Operator'}</Text>
              <Text style={styles.profilePhone}>📞 {currentUser.phone}</Text>
            </View>
          </View>
        ) : null}

        {/* Section 1: Rates Config */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingWrap}>
            <Settings2 size={15} color={theme.colors.primary} />
            <Text style={styles.sectionHeadingText}>{t.ratesConfig}</Text>
          </View>

          {saveStatus ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>{saveStatus}</Text>
            </View>
          ) : null}

          <View style={styles.ratesList}>
            {rates.map(item => {
              const localizedName = t[item.name as keyof typeof t] || item.name;
              return (
                <View key={item.name} style={styles.rateRow}>
                  <Text style={styles.rateLabel}>{localizedName}</Text>
                  
                  <View style={styles.rateActions}>
                    <TouchableOpacity style={styles.miniQtyBtn} onPress={() => handleRateChange(item.name, -50)}>
                      <Text style={styles.miniQtyText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.rateValueText}>₹{item.rate}</Text>
                    <TouchableOpacity style={styles.miniQtyBtn} onPress={() => handleRateChange(item.name, 50)}>
                      <Text style={styles.miniQtyText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveRatesBtn} onPress={handleSaveRates}>
            <Check size={14} color="#ffffff" />
            <Text style={styles.saveRatesText}>Save Custom Rates</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Language Selection */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingWrap}>
            <Settings2 size={15} color={theme.colors.primary} />
            <Text style={styles.sectionHeadingText}>{t.chooseLanguage}</Text>
          </View>

          <View style={styles.languagesRow}>
            {[
              { code: 'english', label: 'English' },
              { code: 'hindi', label: 'हिन्दी' },
              { code: 'hinglish', label: 'Hinglish' }
            ].map(lang => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code as Language)}
                  style={[styles.langChip, isSelected && styles.langChipActive]}
                >
                  <Text style={[styles.langChipText, isSelected && styles.langChipTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Backup & Sync */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingWrap}>
            <Database size={15} color={theme.colors.primary} />
            <Text style={styles.sectionHeadingText}>{t.backupSync}</Text>
          </View>

          {syncStatus ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>{syncStatus}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending sync items:</Text>
            <Text style={[styles.infoVal, syncQueueLength > 0 ? styles.infoValPending : styles.infoValSynced]}>
              {syncQueueLength}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connection status:</Text>
            <Text style={[styles.infoVal, isOffline ? styles.infoValOffline : styles.infoValOnline]}>
              {isOffline ? 'Offline' : 'Online'}
            </Text>
          </View>

          <TouchableOpacity style={styles.syncBtn} onPress={handleManualSync} disabled={isSyncing}>
            <RefreshCw size={14} color={theme.colors.primary} />
            <Text style={styles.syncBtnText}>{t.syncNow}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Logout */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingWrap}>
            <Trash2 size={15} color="#ef4444" />
            <Text style={[styles.sectionHeadingText, { color: '#ef4444' }]}>Danger Zone</Text>
          </View>
          <Text style={styles.dangerDesc}>
            Clearing local cache deletes all database records stored on this device. Backup your data before signing out.
          </Text>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={14} color="#ffffff" />
            <Text style={styles.logoutText}>Sign Out & Clear Device Cache</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  profilePhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionHeadingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  statusBanner: {
    backgroundColor: theme.colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  ratesList: {
    gap: 12,
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'capitalize',
  },
  rateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniQtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniQtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
  },
  rateValueText: {
    width: 64,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  saveRatesBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveRatesText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  languagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  langChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  langChipTextActive: {
    color: '#ffffff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoValPending: {
    color: '#ef4444',
  },
  infoValSynced: {
    color: '#16a34a',
  },
  infoValOffline: {
    color: '#f59e0b',
  },
  infoValOnline: {
    color: '#16a34a',
  },
  syncBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dangerDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 10,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
