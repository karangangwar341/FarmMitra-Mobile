import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { ArrowLeft, MapPin, Phone as PhoneIcon, MessageSquare, Share2, Check, Clock, X } from 'lucide-react-native';

export default function FarmerLedger() {
  const router = useRouter();
  const { id: farmerId } = useLocalSearchParams<{ id: string }>();
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const { 
    farmers, 
    entries, 
    payments, 
    language 
  } = useLedgerStore();

  const t = translations[language];

  // Retrieve farmer details
  const farmer = farmers.find(f => f.id === farmerId);

  // If farmer not found
  if (!farmer) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Kisan record nahi mila</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/farmers')}
          style={styles.errorBtn}
        >
          <Text style={styles.errorBtnText}>Go to Farmers list</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const farmerEntries = entries.filter(e => e.farmerId === farmerId);
  const farmerPayments = payments.filter(p => p.farmerId === farmerId);

  const combinedTimeline = [
    ...farmerEntries.map(e => ({ ...e, type: 'ENTRY' as const })),
    ...farmerPayments.map(p => ({ ...p, type: 'PAYMENT' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics
  const totalCharge = farmerEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalPaid = farmerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = farmerEntries.reduce((sum, e) => sum + e.remainingAmount, 0);
  const totalUnallocated = farmerPayments.reduce((sum, p) => sum + p.remainingAmount, 0);
  const netBalance = totalPending - totalUnallocated;
  const pendingAmount = netBalance > 0 ? netBalance : 0;
  const advanceAmount = netBalance < 0 ? Math.abs(netBalance) : 0;
  
  const lastPayment = farmerPayments.length > 0 
    ? new Date([...farmerPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-IN') 
    : 'N/A';

  const handleSendReminder = (type: 'reminder' | 'ledger') => {
    let messageText = '';
    
    if (type === 'reminder') {
      messageText = t.whatsappRemindText
        .replace('{farmer}', farmer.name)
        .replace('{amount}', pendingAmount.toString());
    } else {
      messageText = t.whatsappLedgerText
        .replace('{farmer}', farmer.name)
        .replace('{pending}', pendingAmount.toString())
        .replace('{paid}', totalPaid.toString())
        .replace('{date}', lastPayment);
    }

    const phoneStr = farmer.phone ? farmer.phone.trim() : '';
    const cleanPhone = phoneStr.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert("Error", "Cannot open WhatsApp link on this device.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onClick={() => router.push('/(tabs)/farmers')}
            onPress={() => router.push('/(tabs)/farmers')}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color="#475569" />
          </TouchableOpacity>
          
          <View>
            <Text style={styles.farmerName}>{farmer.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <MapPin size={10} color="#94a3b8" />
                <Text style={styles.metaText}>{farmer.villageName}</Text>
              </View>
              {farmer.phone ? (
                <View style={styles.metaCol}>
                  <PhoneIcon size={10} color="#94a3b8" />
                  <Text style={styles.metaText}>{farmer.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {farmer.notes ? (
          <Text style={styles.notesText}>📝 {farmer.notes}</Text>
        ) : null}
      </View>

      {/* Timeline entries list */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>
          {language === 'english' ? 'Diary Timeline' : 'Bahi Khata Diary'}
        </Text>
        
        {combinedTimeline.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIconText}>📝</Text>
            <Text style={styles.emptyTitle}>Koi entry nahi hai.</Text>
            <Text style={styles.emptyDesc}>Pehli entry jodne ke liye bottom navigation par add entry click karein.</Text>
          </View>
        ) : (
          combinedTimeline.map((item) => {
            const isEntry = item.type === 'ENTRY';
            const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <TouchableOpacity 
                key={item.id}
                onPress={() => setSelectedTx(item)}
                style={[
                  styles.timelineCard, 
                  isEntry ? styles.timelineCardEntry : styles.timelineCardPayment
                ]}
              >
                {/* Left side indicator bar */}
                <View style={[styles.indicatorBar, { backgroundColor: isEntry ? theme.colors.danger : theme.colors.success }]} />

                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineDate}>{formattedDate}</Text>
                  
                  {isEntry ? (
                    <>
                      <Text style={styles.timelineTitle}>
                        {t[item.serviceName as keyof typeof t] || item.serviceName}
                      </Text>
                      
                      <View style={styles.timelineMeta}>
                        <Text style={styles.timelineMetaText}>Fasal: {t[item.cropName as keyof typeof t] || item.cropName}</Text>
                        <Text style={styles.timelineMetaDivider}>•</Text>
                        <Text style={styles.timelineMetaText}>Area: {item.area} Bigha</Text>
                      </View>

                      {item.notes ? (
                        <Text style={styles.timelineNotes}>&ldquo;{item.notes}&rdquo;</Text>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Text style={styles.timelineTitlePayment}>{t.receivePayment}</Text>
                      <View style={styles.timelineMeta}>
                        <Text style={styles.timelineMetaText}>
                          Type: {t[item.method?.toLowerCase() as keyof typeof t] || item.method}
                        </Text>
                      </View>
                      {item.notes ? (
                        <Text style={styles.timelineNotes}>&ldquo;{item.notes}&rdquo;</Text>
                      ) : null}
                    </>
                  )}
                </View>

                <View style={styles.timelineRight}>
                  {isEntry ? (
                    <View style={styles.alignEnd}>
                      <Text style={styles.amountTextEntry}>₹{item.totalAmount}</Text>
                      <View style={[
                        styles.badge, 
                        item.status === 'PAID' ? styles.badgePaid : item.status === 'PARTIAL' ? styles.badgePartial : styles.badgePending
                      ]}>
                        {item.status === 'PAID' ? <Check size={8} color="#16a34a" /> : null}
                        {item.status === 'PARTIAL' ? <Clock size={8} color="#d97706" /> : null}
                        <Text style={[
                          styles.badgeText, 
                          item.status === 'PAID' ? styles.badgeTextPaid : item.status === 'PARTIAL' ? styles.badgeTextPartial : styles.badgeTextPending
                        ]}>
                          {item.status || 'PENDING'}
                        </Text>
                      </View>
                      {item.status !== 'PAID' && item.remainingAmount < item.totalAmount ? (
                        <Text style={styles.baakiText}>Baaki: ₹{item.remainingAmount}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.alignEnd}>
                      <Text style={styles.amountTextPayment}>+ ₹{item.amount}</Text>
                      <View style={styles.badgePaid}>
                        <Text style={[styles.badgeText, styles.badgeTextPaid]}>Jama (Mila)</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Sticky Bottom Summary and WhatsApp Reminders */}
      <View style={styles.stickyBottom}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Ab tak Kaam</Text>
            <Text style={styles.metricVal}>₹{totalCharge}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorder]}>
            <Text style={styles.metricLabel}>{t.totalPaid}</Text>
            <Text style={[styles.metricVal, { color: theme.colors.success }]}>₹{totalPaid}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.outstandingBalance}</Text>
            <Text style={[styles.metricVal, { color: advanceAmount > 0 ? theme.colors.success : theme.colors.danger }]}>
              ₹{pendingAmount}
            </Text>
          </View>
        </View>

        {/* WhatsApp Button Layout */}
        {advanceAmount > 0 ? (
          <View style={styles.clearCard}>
            <View style={styles.clearHeader}>
              <Check size={16} color="#16a34a" />
              <Text style={styles.clearTextHeading}>Sabhi payment clear hain!</Text>
            </View>
            <Text style={styles.advanceLabel}>किसान का अग्रिम (Advance): ₹{advanceAmount}</Text>
          </View>
        ) : pendingAmount > 0 ? (
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.reminderBtn} onPress={() => handleSendReminder('reminder')}>
              <MessageSquare size={16} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.reminderBtnText}>{t.whatsappReminder}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statementBtn} onPress={() => handleSendReminder('ledger')}>
              <Share2 size={16} color={theme.colors.success} style={styles.btnIcon} />
              <Text style={styles.statementText}>Share Statement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.clearCard}>
            <View style={styles.clearHeader}>
              <Check size={16} color="#16a34a" />
              <Text style={styles.clearTextHeading}>Sabhi payment clear hain! No outstanding dues.</Text>
            </View>
          </View>
        )}
      </View>

      {/* Transaction Details Modal */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalBg}>
          {selectedTx ? (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedTx.type === 'ENTRY' ? 'Service Entry Details' : 'Payment Details'}
                </Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedTx(null)}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDisplayPanel}>
                <Text style={styles.modalAmtLabel}>Amount</Text>
                <Text style={[
                  styles.modalAmtVal, 
                  selectedTx.type === 'ENTRY' ? { color: theme.colors.danger } : { color: theme.colors.success }
                ]}>
                  ₹{selectedTx.type === 'ENTRY' ? selectedTx.totalAmount : selectedTx.amount}
                </Text>
                <View style={[
                  styles.badge, 
                  selectedTx.type === 'ENTRY' && selectedTx.status === 'PAID' ? styles.badgePaid : styles.badgePartial,
                  { paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    selectedTx.type === 'ENTRY' && selectedTx.status === 'PAID' ? styles.badgeTextPaid : styles.badgeTextPartial
                  ]}>
                    {selectedTx.type === 'ENTRY' ? selectedTx.status || 'PENDING' : 'RECEIVED'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Farmer (Kisan)</Text>
                  <Text style={styles.detailVal}>{farmer.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date (Taareekh)</Text>
                  <Text style={styles.detailVal}>
                    {new Date(selectedTx.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                {selectedTx.type === 'ENTRY' ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Service (Kaam)</Text>
                      <Text style={styles.detailVal}>{t[selectedTx.serviceName as keyof typeof t] || selectedTx.serviceName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Crop (Fasal)</Text>
                      <Text style={styles.detailVal}>{t[selectedTx.cropName as keyof typeof t] || selectedTx.cropName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Area (Zameen)</Text>
                      <Text style={styles.detailVal}>{selectedTx.area} Bigha</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rate per Bigha</Text>
                      <Text style={styles.detailVal}>₹{selectedTx.ratePerBigha}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method (Kaise Mila)</Text>
                      <Text style={styles.detailVal}>{t[selectedTx.method?.toLowerCase() as keyof typeof t] || selectedTx.method}</Text>
                    </View>
                  </>
                )}

                <View style={styles.notesBlock}>
                  <Text style={styles.notesBlockTitle}>Notes / Khaas baat</Text>
                  <Text style={styles.notesBlockDesc}>
                    {selectedTx.notes ? `"${selectedTx.notes}"` : 'No notes written.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedTx(null)}>
                <Text style={styles.closeModalText}>Wapas</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  errorBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  errorBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  notesText: {
    marginTop: 10,
    fontSize: 12,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    color: '#64748b',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 220,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 30,
    alignItems: 'center',
  },
  emptyIconText: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  timelineCardEntry: {
    borderColor: '#fee2e2',
  },
  timelineCardPayment: {
    borderColor: '#dcfce7',
  },
  indicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  timelineLeft: {
    flex: 1,
    paddingLeft: 10,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  timelineTitlePayment: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.successDark,
    marginTop: 4,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timelineMetaText: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  timelineMetaDivider: {
    fontSize: 11,
    color: '#94a3b8',
  },
  timelineNotes: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  timelineRight: {
    alignItems: 'flex-end',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  amountTextEntry: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.danger,
  },
  amountTextPayment: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.success,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  badgePaid: {
    backgroundColor: '#dcfce7',
  },
  badgePartial: {
    backgroundColor: '#fef3c7',
  },
  badgePending: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeTextPaid: {
    color: '#16a34a',
  },
  badgeTextPartial: {
    color: '#d97706',
  },
  badgeTextPending: {
    color: '#ef4444',
  },
  baakiText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginTop: 4,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#334155',
    marginTop: 2,
  },
  clearCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  clearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearTextHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.successDark,
  },
  advanceLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.successDark,
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statementBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statementText: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnIcon: {
    marginRight: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDisplayPanel: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAmtLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  modalAmtVal: {
    fontSize: 32,
    fontWeight: '950',
    marginTop: 4,
  },
  detailsBlock: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'capitalize',
  },
  notesBlock: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 4,
  },
  notesBlockTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesBlockDesc: {
    fontSize: 13,
    fontWeight: '550',
    color: '#475569',
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    borderRadius: 8,
  },
  closeModalBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalText: {
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 13,
  },
});
