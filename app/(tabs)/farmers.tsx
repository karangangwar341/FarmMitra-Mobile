import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import VoiceInput from '../../components/VoiceInput';
import { Plus, Search, MapPin, Phone as PhoneIcon, X, Check, Mic } from 'lucide-react-native';

export default function FarmersList() {
  const router = useRouter();
  const { farmers, entries, payments, villages, addFarmer, language } = useLedgerStore();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // New Farmer Form inputs
  const [newName, setNewName] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeVillages = Array.from(new Set([
    ...villages.map(v => v.name),
    ...farmers.map(f => f.villageName).filter(Boolean) as string[]
  ]));

  const farmersWithBalances = farmers.map(farmer => {
    const farmerEntries = entries.filter(e => e.farmerId === farmer.id);
    const farmerPayments = payments.filter(p => p.farmerId === farmer.id);
    const totalDue = farmerEntries.reduce((sum, e) => sum + e.remainingAmount, 0);
    const totalUnallocated = farmerPayments.reduce((sum, p) => sum + p.remainingAmount, 0);
    return { ...farmer, balance: totalDue - totalUnallocated };
  });

  const filteredFarmers = farmersWithBalances.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.phone && f.phone.includes(searchQuery)) ||
      (f.villageName && f.villageName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVillage = selectedVillageFilter === 'ALL' || f.villageName === selectedVillageFilter;
    return matchesSearch && matchesVillage;
  }).sort((a, b) => b.balance - a.balance);

  const handleAddFarmerSubmit = async () => {
    if (!newName.trim()) { setFormError('किसान का नाम दर्ज करें'); return; }
    if (!newVillage.trim()) { setFormError('गांव का नाम दर्ज करें'); return; }
    setFormError('');
    setIsSaving(true);
    try {
      await addFarmer(newName, newVillage, newPhone, newNotes);
      setNewName(''); 
      setNewVillage(''); 
      setNewPhone(''); 
      setNewNotes('');
      setShowAddForm(false);
    } catch {
      setFormError('सेव करने में त्रुटि। फिर कोशिश करें।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceParsed = (result: any) => {
    if (result.farmerName) setNewName(result.farmerName);
    if (result.villageName) setNewVillage(result.villageName);
    setShowVoiceAssistant(false);
    setShowAddForm(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return { text: theme.colors.success, bg: theme.colors.successLight };
    if (balance < 1000) return { text: theme.colors.warning, bg: theme.colors.warningLight };
    if (balance < 5000) return { text: theme.colors.danger, bg: theme.colors.dangerLight };
    return { text: theme.colors.dangerDark, bg: theme.colors.dangerLight };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.farmers}</Text>
          <Text style={styles.subtitle}>{farmers.length} किसान दर्ज हैं</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.voiceBtn, showVoiceAssistant && styles.voiceBtnActive]}
            onPress={() => setShowVoiceAssistant(!showVoiceAssistant)}
          >
            <Mic size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>{language === 'english' ? 'Add' : 'जोड़ें'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Voice Assistant */}
        {showVoiceAssistant ? (
          <VoiceInput onParsedResult={handleVoiceParsed} />
        ) : null}

        {/* Add Farmer Form */}
        {showAddForm ? (
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAddForm(false)}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.formTitle}>{t.addFarmer}</Text>

            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.farmerName} *</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="जैसे: रामवीर सिंह"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.village} *</Text>
              <TextInput
                value={newVillage}
                onChangeText={setNewVillage}
                placeholder="जैसे: रामपुर"
                style={styles.input}
              />
              {activeVillages.length > 0 ? (
                <View style={styles.villagesRow}>
                  <Text style={styles.recentLabel}>{t.recentVillages}:</Text>
                  <View style={styles.chipsWrap}>
                    {activeVillages.map(v => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.miniChip, newVillage === v && styles.miniChipActive]}
                        onPress={() => setNewVillage(v)}
                      >
                        <Text style={[styles.miniChipText, newVillage === v && styles.miniChipTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.mobileOptional}</Text>
              <TextInput
                keyboardType="numeric"
                maxLength={10}
                value={newPhone}
                onChangeText={val => setNewPhone(val.replace(/\D/g, ''))}
                placeholder="जैसे: 9876543210"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.notesOptional}</Text>
              <TextInput
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="जैसे: नलकूप के पास"
                style={styles.input}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowAddForm(false)}>
                <Text style={styles.formCancelText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.formSaveBtn} onPress={handleAddFarmerSubmit} disabled={isSaving}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.formSaveText}>{isSaving ? t.saving : t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Search */}
        <View style={styles.searchRow}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.searchFarmer}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Village Filters */}
        {activeVillages.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedVillageFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setSelectedVillageFilter('ALL')}
            >
              <Text style={[styles.filterChipText, selectedVillageFilter === 'ALL' && styles.filterChipTextActive]}>
                {t.allVillages}
              </Text>
            </TouchableOpacity>
            {activeVillages.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.filterChip, selectedVillageFilter === v && styles.filterChipActive]}
                onPress={() => setSelectedVillageFilter(v)}
              >
                <Text style={[styles.filterChipText, selectedVillageFilter === v && styles.filterChipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* Farmers Cards List */}
        <View style={styles.farmersList}>
          {filteredFarmers.length === 0 ? (
            <View style={styles.emptyView}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>कोई किसान नहीं मिला</Text>
              <Text style={styles.emptyDesc}>ऊपर "+" बटन से किसान जोड़ें</Text>
            </View>
          ) : (
            filteredFarmers.map((farmer) => {
              const colors = getBalanceColor(farmer.balance);
              return (
                <TouchableOpacity
                  key={farmer.id}
                  style={styles.farmerCard}
                  onPress={() => router.push(`/farmer/${farmer.id}`)}
                >
                  <View style={styles.farmerLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{farmer.name.charAt(0)}</Text>
                    </View>

                    <View style={styles.farmerInfo}>
                      <Text style={styles.farmerName}>{farmer.name}</Text>
                      <View style={styles.farmerMetaRow}>
                        <View style={styles.metaLabelWrap}>
                          <MapPin size={10} color="#94a3b8" />
                          <Text style={styles.metaLabel}>{farmer.villageName || 'अज्ञात'}</Text>
                        </View>
                        {farmer.phone ? (
                          <View style={styles.metaLabelWrap}>
                            <PhoneIcon size={10} color="#94a3b8" />
                            <Text style={styles.metaLabel}>{farmer.phone}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.farmerRight}>
                    {farmer.balance > 0 ? (
                      <View>
                        <Text style={[styles.balLabel, { color: colors.text }]}>बाकी</Text>
                        <Text style={[styles.balVal, { color: colors.text }]}>₹{farmer.balance.toLocaleString('en-IN')}</Text>
                      </View>
                    ) : farmer.balance < 0 ? (
                      <View>
                        <Text style={[styles.balLabel, { color: theme.colors.success }]}>अग्रिम</Text>
                        <Text style={[styles.balVal, { color: theme.colors.success }]}>₹{Math.abs(farmer.balance).toLocaleString('en-IN')}</Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={[styles.balLabel, { color: theme.colors.success }]}>क्लियर ✓</Text>
                        <Text style={[styles.balVal, { color: theme.colors.success }]}>₹0</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: theme.colors.dangerLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '605',
    color: '#0f172a',
  },
  villagesRow: {
    marginTop: 8,
  },
  recentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  miniChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  miniChipTextActive: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  formCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  formCancelText: {
    fontWeight: 'bold',
    color: '#475569',
  },
  formSaveBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  formSaveText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginVertical: 12,
    position: 'relative',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  searchClear: {
    padding: 6,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 38,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  farmersList: {
    gap: 10,
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  farmerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  farmerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  metaLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  farmerRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  balLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  balVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
});
