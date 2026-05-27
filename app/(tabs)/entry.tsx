import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { ArrowLeft, Check, Search, MapPin, NotebookPen, X, Droplet, Tractor, ShieldAlert, Wheat, Users } from 'lucide-react-native';

const SERVICES = [
  { key: "water", label: "पानी", emoji: "💧", Icon: Droplet, color: "#1d4ed8", bg: "#dbeafe" },
  { key: "tractor", label: "ट्रैक्टर", emoji: "🚜", Icon: Tractor, color: "#b45309", bg: "#fef3c7" },
  { key: "spray", label: "स्प्रे", emoji: "🌿", Icon: ShieldAlert, color: "#15803d", bg: "#dcfce7" },
  { key: "seeds", label: "बीज", emoji: "🌾", Icon: Wheat, color: "#7c3aed", bg: "#ede9fe" },
  { key: "labor", label: "मज़दूरी", emoji: "👷", Icon: Users, color: "#0f766e", bg: "#ccfbf1" },
];

const CROPS = [
  { key: "wheat", label: "गेहूं", emoji: "🌾" },
  { key: "paddy", label: "धान", emoji: "🌿" },
  { key: "potato", label: "आलू", emoji: "🥔" },
  { key: "sugarcane", label: "गन्ना", emoji: "🎋" },
  { key: "mustard", label: "सरसों", emoji: "🌻" },
];

export default function AddServiceEntryPage() {
  const router = useRouter();
  const { farmers, activeRates, addEntry, language } = useLedgerStore();
  const t = translations[language];

  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("wheat");
  const [area, setArea] = useState(1);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entryMode, setEntryMode] = useState<"service" | "remark">("service");
  const [manualAmount, setManualAmount] = useState("");

  useEffect(() => {
    if (activeRates.length > 0 && !selectedService) {
      setSelectedService(activeRates[0].name);
    }
  }, [activeRates, selectedService]);

  const selectedFarmer = useMemo(() => farmers.find(f => f.id === selectedFarmerId), [farmers, selectedFarmerId]);

  const filteredFarmers = useMemo(() =>
    farmers.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.villageName || "").toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [farmers, searchQuery]
  );

  const currentRate = activeRates.find(r => r.name === selectedService);
  const rate = customRate ?? currentRate?.rate ?? 100;
  const totalAmount = entryMode === "service" ? Number((area * rate).toFixed(2)) : (Number(manualAmount) || 0);

  const handleAreaChange = (delta: number) =>
    setArea(prev => Math.max(0.5, Number((prev + delta).toFixed(1))));

  const handleDateChange = (days: number) => {
    const d = new Date(entryDate);
    d.setDate(d.getDate() + days);
    setEntryDate(d);
  };

  const handleSave = async () => {
    if (!selectedFarmerId) return;
    if (entryMode === "remark" && !notes.trim()) {
      Alert.alert("रिमार्क", "कृपया रिमार्क/विवरण दर्ज करें");
      return;
    }
    if (entryMode === "remark" && (!manualAmount || Number(manualAmount) <= 0)) {
      Alert.alert("रिमार्क", "कृपया सही राशि दर्ज करें");
      return;
    }
    try {
      setIsSaving(true);
      if (entryMode === "remark") {
        const amt = Number(manualAmount);
        await addEntry(
          selectedFarmerId,
          "मैनुअल (Manual)",
          "अन्य (N/A)",
          1,
          amt,
          entryDate.toISOString(),
          notes.trim(),
          amt
        );
      } else {
        await addEntry(selectedFarmerId, selectedService, selectedCrop, area, rate, entryDate.toISOString(), notes);
      }
      router.push(`/farmer/${selectedFarmerId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.addEntry}</Text>
          <Text style={styles.headerSubtitle}>
            {entryMode === "service" ? "नया सेवा रिकॉर्ड" : "सीधा हिसाब / रिमार्क एंट्री"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* MODE TOGGLE */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, entryMode === 'service' && styles.toggleBtnActive]}
            onPress={() => setEntryMode('service')}
          >
            <Text style={[styles.toggleText, entryMode === 'service' && styles.toggleTextActive]}>
              🚜 सेवा एंट्री (Service)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, entryMode === 'remark' && styles.toggleBtnActive]}
            onPress={() => setEntryMode('remark')}
          >
            <Text style={[styles.toggleText, entryMode === 'remark' && styles.toggleTextActive]}>
              📝 रिमार्क एंट्री (Remark)
            </Text>
          </TouchableOpacity>
        </View>

        {/* FARMER SEARCH */}
        {!selectedFarmer ? (
          <View style={styles.searchCard}>
            <View style={styles.searchHeader}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t.searchFarmer}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView nestedScrollEnabled style={styles.resultsList}>
              {filteredFarmers.length === 0 ? (
                <Text style={styles.emptyResultsText}>कोई किसान नहीं मिला</Text>
              ) : (
                filteredFarmers.map((farmer) => (
                  <TouchableOpacity
                    key={farmer.id}
                    onPress={() => setSelectedFarmerId(farmer.id)}
                    style={styles.farmerSelectBtn}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{farmer.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.farmerName}>{farmer.name}</Text>
                      <Text style={styles.farmerVillage}>📍 {farmer.villageName}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        ) : (
          /* SELECTED FARMER CHIP */
          <View style={styles.selectedFarmerCard}>
            <View style={styles.selectedLeft}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{selectedFarmer.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.selectedName}>{selectedFarmer.name}</Text>
                <Text style={styles.selectedVillage}>📍 {selectedFarmer.villageName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedFarmerId("")}>
              <Text style={styles.changeBtnText}>बदलें</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MANUAL AMOUNT FOR REMARK ONLY */}
        {selectedFarmer && entryMode === "remark" ? (
          <View style={styles.card}>
            <Text style={styles.label}>राशि (Amount)</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                keyboardType="numeric"
                value={manualAmount}
                onChangeText={setManualAmount}
                placeholder="0"
                style={styles.amountInput}
              />
            </View>
          </View>
        ) : null}

        {/* SERVICE SELECTION */}
        {selectedFarmer && activeRates.length > 0 && entryMode === "service" ? (
          <View style={styles.serviceSection}>
            <Text style={styles.label}>सेवा चुनें</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceRow}>
              {activeRates.map(service => {
                const info = SERVICES.find(s => s.key === service.name) || SERVICES[0];
                const isActive = selectedService === service.name;
                return (
                  <TouchableOpacity
                    key={service.name}
                    style={[styles.serviceChip, isActive && { borderColor: info.color, backgroundColor: info.bg }]}
                    onPress={() => { setSelectedService(service.name); setCustomRate(null); }}
                  >
                    <Text style={styles.serviceEmoji}>{info.emoji}</Text>
                    <Text style={[styles.serviceChipLabel, isActive && { color: info.color }]}>{info.label}</Text>
                    <Text style={[styles.serviceChipRate, isActive && { color: info.color }]}>₹{service.rate}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* AREA STEPPER */}
        {selectedFarmer && entryMode === "service" ? (
          <View style={styles.card}>
            <Text style={styles.labelCenter}>कितना बीघा?</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => handleAreaChange(-1)}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>

              <View style={styles.valWrap}>
                <Text style={styles.stepperVal}>{area}</Text>
                <Text style={styles.stepperSub}>बीघा</Text>
                
                {/* Rate edit */}
                <View style={styles.rateEditRow}>
                  <Text style={styles.rateEditText}>दर: ₹</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={rate.toString()}
                    onChangeText={val => setCustomRate(Math.max(0, parseFloat(val) || 0))}
                    style={styles.rateEditInput}
                  />
                  <Text style={styles.rateEditText}>/बीघा</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnActive]} onPress={() => handleAreaChange(1)}>
                <Text style={[styles.stepBtnText, { color: '#ffffff' }]}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick area chips */}
            <View style={styles.presetsRow}>
              {[0.5, 1, 2, 3, 5].map(val => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setArea(val)}
                  style={[styles.presetChip, area === val && styles.presetChipActive]}
                >
                  <Text style={[styles.presetChipText, area === val && styles.presetChipTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* CROP SELECTION */}
        {selectedFarmer && entryMode === "service" ? (
          <View style={styles.serviceSection}>
            <Text style={styles.label}>फसल</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceRow}>
              {CROPS.map(crop => {
                const isActive = selectedCrop === crop.key;
                return (
                  <TouchableOpacity
                    key={crop.key}
                    onPress={() => setSelectedCrop(crop.key)}
                    style={[styles.cropChip, isActive && styles.cropChipActive]}
                  >
                    <Text style={styles.cropEmoji}>{crop.emoji}</Text>
                    <Text style={[styles.cropLabel, isActive && styles.cropLabelActive]}>{crop.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* DATE PICKER */}
        {selectedFarmer ? (
          <View style={styles.card}>
            <Text style={styles.label}>एंट्री तारीख</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => handleDateChange(-1)}>
                <Text style={styles.stepBtnText}>←</Text>
              </TouchableOpacity>

              <View style={styles.valWrap}>
                <Text style={styles.dateValText}>
                  {entryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Text>
                <Text style={styles.dateSubText}>
                  {entryDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}
                </Text>
              </View>

              <TouchableOpacity style={styles.stepBtn} onPress={() => handleDateChange(1)}>
                <Text style={styles.stepBtnText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* NOTES */}
        {selectedFarmer ? (
          <View style={styles.notesSection}>
            {entryMode === "service" && !showNotes ? (
              <TouchableOpacity style={styles.addNotesBtn} onPress={() => setShowNotes(true)}>
                <NotebookPen size={16} color="#94a3b8" />
                <Text style={styles.addNotesText}>नोट जोड़ें</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.label}>रिमार्क / नोट {entryMode === "remark" && <Text style={{ color: theme.colors.danger }}>*</Text>}</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={entryMode === "remark" ? "रिमार्क / कारण लिखें (उदा. पुराना भाड़ा, खाद, आदि)..." : "वैकल्पिक नोट..."}
                  style={styles.notesArea}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>
        ) : null}

      </ScrollView>

      {/* STICKY SAVE BAR */}
      {selectedFarmerId ? (
        <View style={styles.saveBarContainer}>
          <View style={styles.saveBar}>
            <View>
              <Text style={styles.saveBarLabel}>कुल राशि</Text>
              <Text style={styles.saveBarVal}>₹{totalAmount.toLocaleString("en-IN")}</Text>
              <Text style={styles.saveBarSub} numberOfLines={1}>
                {entryMode === "service" ? `${area} बीघा × ₹${rate}` : (notes || "रिमार्क एंट्री")}
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              <Check size={20} color={theme.colors.primary} />
              <Text style={styles.saveBtnText}>{isSaving ? "सेव..." : "सेव करें"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  resultsList: {
    maxHeight: 220,
    padding: 8,
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
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  farmerVillage: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  selectedFarmerCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLarge: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  selectedVillage: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  changeBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  changeBtnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  rupeePrefix: {
    fontSize: 24,
    fontWeight: '900',
    color: '#475569',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    paddingVertical: 12,
  },
  serviceSection: {
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
  },
  serviceChip: {
    minWidth: 84,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1.5,
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  serviceEmoji: {
    fontSize: 22,
  },
  serviceChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  serviceChipRate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  labelCenter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  valWrap: {
    alignItems: 'center',
  },
  stepperVal: {
    fontSize: 56,
    fontWeight: '900',
    color: '#0f172a',
  },
  stepperSub: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 4,
  },
  rateEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rateEditText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  rateEditInput: {
    width: 64,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  presetChip: {
    flex: 1,
    height: 38,
    marginHorizontal: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 8,
  },
  cropChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cropEmoji: {
    fontSize: 16,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  cropLabelActive: {
    color: '#ffffff',
  },
  dateValText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dateSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  notesSection: {
    marginBottom: 16,
  },
  addNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    gap: 8,
  },
  addNotesText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
  },
  notesArea: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    fontWeight: '550',
    color: '#0f172a',
    marginTop: 6,
    textAlignVertical: 'top',
  },
  saveBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  saveBarLabel: {
    fontSize: 10,
    fontWeight: '850',
    color: 'rgba(204,251,241,0.8)',
    textTransform: 'uppercase',
  },
  saveBarVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  saveBarSub: {
    fontSize: 10,
    color: 'rgba(204,251,241,0.6)',
    marginTop: 2,
    maxWidth: 160,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
