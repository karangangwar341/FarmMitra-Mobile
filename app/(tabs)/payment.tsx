import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { ArrowLeft, Check, Search, MapPin, X, CircleDollarSign, Smartphone, Landmark } from 'lucide-react-native';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function AddPayment() {
  const router = useRouter();
  const { farmers, entries, addPayment, language } = useLedgerStore();
  const t = translations[language];

  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'BANK'>('CASH');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.villageName && f.villageName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const outstandingDues = entries
    .filter(e => e.farmerId === selectedFarmerId)
    .reduce((s, e) => s + e.remainingAmount, 0);

  const amount = parseFloat(amountStr) || 0;
  const isValid = !!selectedFarmerId && amount > 0;

  const handleSavePayment = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await addPayment(selectedFarmerId, amount, method, paymentDate.toISOString(), notes);
      Alert.alert("सफलता", t.paymentSaved || "भुगतान दर्ज किया गया!");
      setTimeout(() => router.push(`/farmer/${selectedFarmerId}`), 300);
    } catch (err) {
      console.error('Payment failed', err);
      setIsSaving(false);
    }
  };

  const handleDateChange = (days: number) => {
    const d = new Date(paymentDate);
    d.setDate(d.getDate() + days);
    setPaymentDate(d);
  };

  const paymentMethods = [
    { key: 'CASH', label: 'नकद', emoji: '💵', Icon: CircleDollarSign, color: '#16a34a', bg: '#dcfce7' },
    { key: 'UPI', label: 'UPI', emoji: '📱', Icon: Smartphone, color: '#7c3aed', bg: '#ede9fe' },
    { key: 'BANK', label: 'बैंक', emoji: '🏦', Icon: Landmark, color: '#1d4ed8', bg: '#dbeafe' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.payments}</Text>
          <Text style={styles.headerSubtitle}>भुगतान दर्ज करें</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* STEP 1: SELECT FARMER */}
        <View style={styles.card}>
          <Text style={styles.label}>Step 1 — किसान चुनें *</Text>

          {selectedFarmerId && selectedFarmer ? (
            /* Selected farmer chip */
            <View style={styles.selectedFarmerCard}>
              <View style={styles.selectedLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selectedFarmer.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.selectedName}>{selectedFarmer.name}</Text>
                  {outstandingDues > 0 ? (
                    <Text style={styles.duesText}>बकाया: ₹{outstandingDues.toLocaleString('en-IN')}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedFarmerId('')}>
                <Text style={styles.changeBtnText}>बदलें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Farmer search input */
            <View>
              <View style={styles.searchRow}>
                <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.searchFarmer}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView nestedScrollEnabled style={styles.resultsList}>
                {filteredFarmers.length === 0 ? (
                  <Text style={styles.emptyResultsText}>कोई किसान नहीं मिला। पहले किसान जोड़ें।</Text>
                ) : (
                  filteredFarmers.map(f => {
                    const bal = entries.filter(e => e.farmerId === f.id).reduce((s, e) => s + e.remainingAmount, 0);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => { setSelectedFarmerId(f.id); setSearchQuery(''); }}
                        style={styles.farmerSelectBtn}
                      >
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarTextMini}>{f.name.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.farmerName}>{f.name}</Text>
                          <Text style={styles.farmerVillage}>📍 {f.villageName}</Text>
                        </View>
                        {bal > 0 ? (
                          <Text style={styles.farmerDues}>₹{bal.toLocaleString('en-IN')}</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* STEP 2: AMOUNT */}
        <View style={styles.card}>
          <Text style={styles.label}>Step 2 — {t.amountReceived} *</Text>
          <View style={[styles.amountInputWrap, amount > 0 && { borderColor: theme.colors.primary }]}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0"
              style={styles.amountInput}
            />
            {amountStr ? (
              <TouchableOpacity onPress={() => setAmountStr('')}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Full outstanding helper */}
          {outstandingDues > 0 && selectedFarmerId ? (
            <TouchableOpacity
              style={styles.duesPayBtn}
              onPress={() => setAmountStr(outstandingDues.toString())}
            >
              <Text style={styles.duesPayText}>पूरा बकाया भरें</Text>
              <Text style={styles.duesPayText}>₹{outstandingDues.toLocaleString('en-IN')} →</Text>
            </TouchableOpacity>
          ) : null}

          {/* Quick Amounts */}
          <View style={styles.presetsRow}>
            {QUICK_AMOUNTS.map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => setAmountStr(amt.toString())}
                style={[styles.presetChip, parseFloat(amountStr) === amt && styles.presetChipActive]}
              >
                <Text style={[styles.presetChipText, parseFloat(amountStr) === amt && styles.presetChipTextActive]}>
                  ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STEP 3: PAYMENT METHOD */}
        <View style={styles.card}>
          <Text style={styles.label}>Step 3 — {t.paymentMethod}</Text>
          <View style={styles.methodsRow}>
            {paymentMethods.map(pm => {
              const isActive = method === pm.key;
              return (
                <TouchableOpacity
                  key={pm.key}
                  onPress={() => setMethod(pm.key as any)}
                  style={[styles.methodChip, isActive && { borderColor: pm.color, backgroundColor: pm.bg }]}
                >
                  <Text style={styles.methodEmoji}>{pm.emoji}</Text>
                  <Text style={[styles.methodLabel, isActive && { color: pm.color }]}>{pm.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* STEP 4: DATE & NOTES */}
        <View style={styles.card}>
          <Text style={styles.label}>Step 4 — तारीख और नोट</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => handleDateChange(-1)}>
              <Text style={styles.stepBtnText}>-1 दिन</Text>
            </TouchableOpacity>

            <View style={styles.dateWrap}>
              <Text style={styles.dateText}>
                {paymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            <TouchableOpacity style={[styles.stepBtn, styles.todayBtn]} onPress={() => setPaymentDate(new Date())}>
              <Text style={styles.todayBtnText}>आज</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stepBtn} onPress={() => handleDateChange(1)}>
              <Text style={styles.stepBtnText}>+1 दिन</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="भुगतान नोट (वैकल्पिक)"
            style={styles.notesInput}
          />
        </View>
      </ScrollView>

      {/* STICKY SAVE BAR */}
      <View style={styles.saveBar}>
        {amount > 0 ? (
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>भुगतान राशि</Text>
            <Text style={styles.previewVal}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, isValid && styles.saveBtnActive]}
          onPress={handleSavePayment}
          disabled={!isValid || isSaving}
        >
          <Check size={22} color={isValid ? "#ffffff" : "#94a3b8"} />
          <Text style={[styles.saveBtnText, isValid && styles.saveBtnTextActive]}>
            {isSaving ? 'सेव हो रहा है...' : t.recordPayment}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 160,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  selectedFarmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15,118,110,0.2)',
  },
  selectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
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
  selectedName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  duesText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.danger,
    marginTop: 2,
  },
  changeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  changeBtnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  resultsList: {
    maxHeight: 180,
    gap: 6,
  },
  emptyResultsText: {
    textAlign: 'center',
    padding: 20,
    color: '#94a3b8',
    fontSize: 13,
  },
  farmerSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 6,
    gap: 10,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextMini: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  farmerVillage: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  farmerDues: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  rupeePrefix: {
    fontSize: 32,
    fontWeight: '900',
    color: '#94a3b8',
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    paddingVertical: 10,
    marginLeft: 6,
  },
  duesPayBtn: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.colors.dangerLight,
    borderColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duesPayText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.danger,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  presetChip: {
    flex: 1,
    height: 48,
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    gap: 6,
  },
  methodEmoji: {
    fontSize: 24,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepBtn: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateWrap: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  todayBtn: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  todayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  notesInput: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '605',
  },
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  previewVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.success,
  },
  saveBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnActive: {
    backgroundColor: theme.colors.success,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#94a3b8',
  },
  saveBtnTextActive: {
    color: '#ffffff',
  },
});
