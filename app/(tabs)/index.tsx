import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  CloudLightning, 
  CloudOff, 
  FileText, 
  IndianRupee, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Wallet 
} from 'lucide-react-native';

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    currentUser,
    isOnboarded,
    farmers,
    entries,
    payments,
    language,
    isOffline,
    syncQueueLength,
    isInitialized,
  } = useLedgerStore();

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isOnboarded) {
      router.replace('/(onboarding)');
      return;
    }
    if (!currentUser) {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, isOnboarded, currentUser]);

  if (!isInitialized || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>FarmMitra लोड हो रहा है...</Text>
      </View>
    );
  }

  // ── Calculations ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEntries = entries.filter(e => new Date(e.date) >= todayStart);
  const todayPayments = payments.filter(p => new Date(p.date) >= todayStart);
  const todayEntryAmt = todayEntries.reduce((s, e) => s + e.totalAmount, 0);
  const todayCollectionAmt = todayPayments.reduce((s, p) => s + p.amount, 0);
  const totalPending = entries.reduce((s, e) => s + e.remainingAmount, 0);

  const farmersWithPending = farmers
    .map(f => ({
      ...f,
      pending: entries.filter(e => e.farmerId === f.id).reduce((s, e) => s + e.remainingAmount, 0),
    }))
    .filter(f => f.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO HEADER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextRow}>
            <View>
              <Text style={styles.businessText}>{currentUser.businessName || 'मेरा खेती खाता'}</Text>
              <Text style={styles.heroTitle}>🌾 FarmMitra</Text>
              <Text style={styles.statsText}>{farmers.length} किसान • {entries.length} एंट्री</Text>
            </View>

            {/* Sync status pill */}
            <View style={[styles.syncPill, isOffline && styles.syncPillOffline]}>
              {isOffline ? (
                <CloudOff size={13} color="#fcd34d" />
              ) : syncQueueLength > 0 ? (
                <CloudLightning size={13} color="#ffffff" />
              ) : (
                <CheckCircle2 size={13} color="#ffffff" />
              )}
              <Text style={[styles.syncPillText, isOffline && styles.syncPillTextOffline]}>
                {isOffline ? 'Offline' : syncQueueLength > 0 ? 'Syncing...' : 'Synced'}
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Balance Card */}
        <View style={styles.balanceCardWrap}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>कुल बकाया राशि</Text>
                <Text style={styles.balanceVal}>₹{totalPending.toLocaleString('en-IN')}</Text>
                <Text style={styles.balanceSub}>{farmersWithPending.length} किसानों का बकाया</Text>
              </View>
              <View style={styles.balanceIconWrap}>
                <TrendingDown size={32} color={theme.colors.danger} />
              </View>
            </View>

            <View style={styles.miniStatsRow}>
              {/* Today's Entries */}
              <View style={styles.miniStat}>
                <View style={styles.miniStatHeader}>
                  <TrendingDown size={13} color="#64748b" />
                  <Text style={styles.miniStatLabel}>आज का उधार</Text>
                </View>
                <Text style={styles.miniStatVal}>₹{todayEntryAmt.toLocaleString('en-IN')}</Text>
                <Text style={styles.miniStatSub}>{todayEntries.length} एंट्री</Text>
              </View>

              {/* Today's Collections */}
              <View style={[styles.miniStat, styles.miniStatSuccess]}>
                <View style={styles.miniStatHeader}>
                  <TrendingUp size={13} color={theme.colors.success} />
                  <Text style={[styles.miniStatLabel, styles.miniStatLabelSuccess]}>वसूली</Text>
                </View>
                <Text style={[styles.miniStatVal, styles.miniStatValSuccess]}>₹{todayCollectionAmt.toLocaleString('en-IN')}</Text>
                <Text style={[styles.miniStatSub, styles.miniStatSubSuccess]}>{todayPayments.length} भुगतान</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>त्वरित कार्य</Text>
          <View style={styles.quickGrid}>
            
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/entry')}>
              <View style={[styles.quickIconWrap, { backgroundColor: '#ccfbf1' }]}>
                <Plus size={22} color="#0f766e" />
              </View>
              <Text style={styles.quickTitle}>{t.addEntry}</Text>
              <Text style={styles.quickSub}>नया उधार</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/payment')}>
              <View style={[styles.quickIconWrap, { backgroundColor: '#dbeafe' }]}>
                <IndianRupee size={22} color="#1d4ed8" />
              </View>
              <Text style={styles.quickTitle}>{t.receivePayment}</Text>
              <Text style={styles.quickSub}>भुगतान</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/farmers')}>
              <View style={[styles.quickIconWrap, { backgroundColor: '#ede9fe' }]}>
                <BookOpen size={22} color="#7c3aed" />
              </View>
              <Text style={styles.quickTitle}>{t.viewLedger}</Text>
              <Text style={styles.quickSub}>बही खाता</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/settings')}>
              <View style={[styles.quickIconWrap, { backgroundColor: '#fef3c7' }]}>
                <FileText size={22} color="#b45309" />
              </View>
              <Text style={styles.quickTitle}>{t.settings}</Text>
              <Text style={styles.quickSub}>विकल्प</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Top Debtors Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionHeader}>बकाया किसान</Text>
              <Text style={styles.sectionHeaderDesc}>सबसे ज़्यादा बकाया पहले</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/farmers')}>
              <Text style={styles.viewAllText}>सभी देखें <ArrowRight size={12} color={theme.colors.primary} /></Text>
            </TouchableOpacity>
          </View>

          {farmers.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Users size={32} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>कोई किसान नहीं</Text>
              <Text style={styles.emptyDesc}>पहले किसान जोड़ें</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.emptyBtnText}>किसान जोड़ें</Text>
              </TouchableOpacity>
            </View>
          ) : farmersWithPending.length === 0 ? (
            <View style={styles.cleanSlateCard}>
              <CheckCircle2 size={44} color={theme.colors.success} style={{ marginBottom: 12 }} />
              <Text style={styles.cleanSlateTitle}>सभी भुगतान हो गए! 🎉</Text>
              <Text style={styles.cleanSlateDesc}>कोई बकाया नहीं</Text>
            </View>
          ) : (
            <View style={styles.debtorsList}>
              {farmersWithPending.map((farmer, i) => {
                const isHighest = i === 0;
                return (
                  <TouchableOpacity
                    key={farmer.id}
                    onPress={() => router.push(`/farmer/${farmer.id}`)}
                    style={[styles.debtorCard, isHighest && styles.debtorCardHighest]}
                  >
                    <View style={styles.debtorLeft}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{farmer.name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.debtorName}>{farmer.name}</Text>
                        <Text style={styles.debtorVillage}>📍 {farmer.villageName || 'अज्ञात गांव'}</Text>
                      </View>
                    </View>
                    <View style={styles.debtorRight}>
                      <Text style={styles.debtorRightLabel}>बकाया</Text>
                      <Text style={styles.debtorAmount}>₹{farmer.pending.toLocaleString('en-IN')}</Text>
                      {isHighest && (
                        <View style={styles.badgeDanger}>
                          <Text style={styles.badgeDangerText}>सबसे ज़्यादा</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Global Wallet Sum */}
        <View style={styles.walletCard}>
          <View>
            <Text style={styles.walletLabel}>कुल एंट्री राशि</Text>
            <Text style={styles.walletVal}>₹{entries.reduce((s, e) => s + e.totalAmount, 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.walletSub}>{entries.length} सेवाएं दी गईं</Text>
          </View>
          <View style={styles.walletIconWrap}>
            <Wallet size={28} color="#ffffff" />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)',
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 72,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(204,251,241,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  statsText: {
    fontSize: 13,
    color: 'rgba(204,251,241,0.7)',
    marginTop: 2,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  syncPillOffline: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '850',
    color: 'rgba(255,255,255,0.9)',
  },
  syncPillTextOffline: {
    color: '#fcd34d',
  },
  balanceCardWrap: {
    marginTop: -52,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceVal: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.danger,
    marginTop: 6,
  },
  balanceSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  balanceIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: theme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  miniStatSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: 'rgba(22,163,74,0.15)',
  },
  miniStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#64748b',
  },
  miniStatLabelSuccess: {
    color: theme.colors.success,
  },
  miniStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6,
  },
  miniStatValSuccess: {
    color: theme.colors.successDark,
  },
  miniStatSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  miniStatSubSuccess: {
    color: theme.colors.success,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionHeaderDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  quickSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 30,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cleanSlateCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  cleanSlateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.successDark,
  },
  cleanSlateDesc: {
    fontSize: 12,
    color: theme.colors.success,
    marginTop: 4,
  },
  debtorsList: {
    gap: 10,
  },
  debtorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  debtorCardHighest: {
    borderColor: 'rgba(220,38,38,0.2)',
    borderWidth: 1.5,
  },
  debtorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debtorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  debtorVillage: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  debtorRight: {
    alignItems: 'flex-end',
  },
  debtorRightLabel: {
    fontSize: 9,
    fontWeight: '850',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  debtorAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.danger,
    marginTop: 2,
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeDangerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  walletCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(204,251,241,0.8)',
    textTransform: 'uppercase',
  },
  walletVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  walletSub: {
    fontSize: 11,
    color: 'rgba(204,251,241,0.7)',
    marginTop: 2,
  },
  walletIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export { Dashboard };
