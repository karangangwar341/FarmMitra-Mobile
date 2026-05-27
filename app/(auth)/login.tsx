import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { BACKEND_URL } from '../../lib/store';
import { Phone, Lock, HelpCircle, User, Briefcase, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react-native';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name? (आपकी माता का शादी से पहले का नाम क्या है?)",
  "What was your first school name? (आपके पहले स्कूल का नाम क्या था?)",
  "What is your birth city? (आपका जन्म किस शहर में हुआ था?)",
  "What was your first pet name? (आपके पहले पालतू जानवर का नाम क्या था?)",
  "What is your favorite food? (आपका पसंदीदा खाना क्या है?)"
];

export default function Login() {
  const router = useRouter();
  const { 
    currentUser, 
    setCurrentUser, 
    language, 
    isOnboarded,
    isOffline
  } = useLedgerStore();

  const t = translations[language];

  // Router guard
  useEffect(() => {
    if (!isOnboarded) {
      router.replace('/(onboarding)');
    }
  }, [isOnboarded]);

  const [step, setStep] = useState<
    'phone' | 'create-pin' | 'confirm-pin' | 'setup-recovery' | 'enter-pin' | 'forgot-pin-verify'
  >('phone');

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  
  // Registration metadata
  const [operatorName, setOperatorName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Recover state
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Check if we already have a user with a PIN setup in the store
  useEffect(() => {
    if (currentUser) {
      setSavedPin(currentUser.pinHash);
      setPhone(currentUser.phone);
      setStep('enter-pin');
    }
  }, [currentUser]);

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit number');
      return;
    }
    setErrorMsg('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.exists) {
          setSecurityQuestion(data.securityQuestion || SECURITY_QUESTIONS[0]);
          setStep('enter-pin');
        } else {
          setStep('create-pin');
        }
      } else {
        setErrorMsg(data.error || 'Failed to check phone number');
      }
    } catch (err) {
      setErrorMsg('Network error. Try again.');
    }
  };

  const handleCreatePin = (value: string) => {
    setPin(value);
    setErrorMsg('');
    if (value.length === 4) {
      setStep('confirm-pin');
    }
  };

  const handleConfirmPin = (value: string) => {
    setConfirmPin(value);
    setErrorMsg('');
    if (value.length === 4) {
      if (value !== pin) {
        setErrorMsg('PINs do not match. Try again.');
        setConfirmPin('');
        return;
      }
      setStep('setup-recovery');
    }
  };

  const handleSetupRecoverySubmit = async () => {
    if (!securityAnswer.trim()) {
      setErrorMsg('Please answer your security question.');
      return;
    }
    setErrorMsg('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/setup-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          pin,
          name: operatorName || 'Mitra Operator',
          businessName: businessName || 'Agri Services Ledger',
          securityQuestion,
          securityAnswer
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await setCurrentUser(data.user);
        router.replace('/(tabs)');
      } else {
        setErrorMsg(data.error || 'Failed to complete registration');
      }
    } catch (err) {
      setErrorMsg('Network error. Try again.');
    }
  };

  const handleEnterPin = async (value: string) => {
    setPin(value);
    if (value.length === 4) {
      setErrorMsg('');

      // Offline guard
      if (isOffline) {
        if (value === '0000') {
          router.replace('/(tabs)');
        } else {
          setErrorMsg('Incorrect PIN (Offline Mode)');
          setPin('');
        }
        return;
      }

      // Online verification
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin: value }),
        });
        const data = await response.json();
        if (response.ok) {
          await setCurrentUser(data.user);
          router.replace('/(tabs)');
        } else {
          setErrorMsg(data.error || 'Incorrect PIN');
          setPin('');
        }
      } catch (err) {
        if (value === '0000') {
          router.replace('/(tabs)');
        } else {
          setErrorMsg('Incorrect PIN or Connection Error');
          setPin('');
        }
      }
    }
  };

  const handleForgotPinSubmit = async () => {
    if (!forgotAnswer.trim()) {
      setErrorMsg('Please enter answer to security question');
      return;
    }
    if (forgotNewPin.length !== 4) {
      setErrorMsg('PIN must be 4 digits');
      return;
    }
    if (forgotNewPin !== forgotConfirmPin) {
      setErrorMsg('New PINs do not match');
      return;
    }
    setErrorMsg('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          securityAnswer: forgotAnswer,
          newPin: forgotNewPin
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await setCurrentUser(data.user);
        Alert.alert('PIN Reset Successful!');
        router.replace('/(tabs)');
      } else {
        setErrorMsg(data.error || 'Failed to reset PIN. Check answer.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Try again.');
    }
  };

  const renderPinPad = (onPress: (val: string) => void, currentVal: string) => {
    const handleNumberClick = (num: string) => {
      if (currentVal.length < 4) {
        onPress(currentVal + num);
      }
    };

    const handleClear = () => {
      onPress(currentVal.slice(0, -1));
    };

    return (
      <View style={styles.pinPadContainer}>
        {/* Visual dots */}
        <View style={styles.dotsRow}>
          {[...Array(4)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i < currentVal.length && styles.dotActive
              ]}
            />
          ))}
        </View>

        {/* Numeric grid */}
        <View style={styles.grid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => handleNumberClick(num)}
              style={styles.keyBtn}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.keyBtn, styles.clearBtn]}
          >
            <Text style={styles.clearText}>CLEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNumberClick('0')}
            style={styles.keyBtn}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <View style={styles.emptyKey} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>🌾 FarmMitra</Text>
          <Text style={styles.brandSubtitle}>SECURITY LOGIN BOOK</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* STEP 1: Phone input */}
          {step === 'phone' && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Phone size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>{t.enterMobile}</Text>
              </View>
              <Text style={styles.sectionSub}>
                Log in to access your ledger book. Verification is done securely via PIN.
              </Text>

              <View style={styles.phoneInputWrap}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  style={styles.phoneInput}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handlePhoneSubmit}>
                <Text style={styles.submitBtnText}>Continue</Text>
                <ArrowRight size={18} color="#ffffff" style={styles.iconMargin} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Create PIN */}
          {step === 'create-pin' && (
            <View style={styles.centerStep}>
              <View style={styles.sectionHeaderCenter}>
                <Lock size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitleCenter}>{t.createPin}</Text>
              </View>
              <Text style={styles.sectionSubCenter}>Set a 4-digit security PIN.</Text>
              {renderPinPad(handleCreatePin, pin)}
            </View>
          )}

          {/* STEP 3: Confirm PIN */}
          {step === 'confirm-pin' && (
            <View style={styles.centerStep}>
              <View style={styles.sectionHeaderCenter}>
                <Lock size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitleCenter}>{t.confirmPin}</Text>
              </View>
              <Text style={styles.sectionSubCenter}>Confirm your 4-digit security PIN.</Text>
              {renderPinPad(handleConfirmPin, confirmPin)}
            </View>
          )}

          {/* STEP 4: Setup Recovery */}
          {step === 'setup-recovery' && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <HelpCircle size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Security Setup</Text>
              </View>
              <Text style={styles.sectionSub}>
                Setup security questions to easily recover your PIN if you forget it.
              </Text>

              <View style={styles.inputWrap}>
                <User size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  value={operatorName}
                  onChangeText={setOperatorName}
                  placeholder="Your Name (आपका नाम)"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputWrap}>
                <Briefcase size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Business Name (व्यवसाय का नाम)"
                  style={styles.textInput}
                />
              </View>

              <Text style={styles.dropLabel}>Select Security Question:</Text>
              {SECURITY_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.questionPill, securityQuestion === q && styles.questionPillActive]}
                  onPress={() => setSecurityQuestion(q)}
                >
                  <Text style={[styles.questionText, securityQuestion === q && styles.questionTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                placeholder="Your Answer (आपका उत्तर)"
                style={[styles.phoneInput, styles.ansInput]}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSetupRecoverySubmit}>
                <Text style={styles.submitBtnText}>Complete Registration</Text>
                <ArrowRight size={18} color="#ffffff" style={styles.iconMargin} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: Enter PIN (Returning User) */}
          {step === 'enter-pin' && (
            <View style={styles.centerStep}>
              <View style={styles.sectionHeaderCenter}>
                <Lock size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitleCenter}>{t.enterPin}</Text>
              </View>
              <Text style={styles.sectionSubCenter}>Enter security PIN to access the ledger.</Text>
              {renderPinPad(handleEnterPin, pin)}

              <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('forgot-pin-verify')}>
                <Text style={styles.linkBtnText}>Forgot PIN? (पिन भूल गए?)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkBtn} 
                onPress={() => {
                  setCurrentUser(null);
                  setPhone('');
                  setStep('phone');
                }}
              >
                <Text style={styles.linkResetText}>Reset / Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: PIN Recovery */}
          {step === 'forgot-pin-verify' && (
            <View style={styles.formSection}>
              <View style={styles.backHeader}>
                <TouchableOpacity onPress={() => setStep('enter-pin')} style={styles.backTouch}>
                  <ArrowLeft size={20} color="#475569" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.sectionTitle}>Recover security PIN</Text>
                  <Text style={styles.sectionSub}>Answer the question below to set a new 4-digit PIN.</Text>
                </View>
              </View>

              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>Security Question:</Text>
                <Text style={styles.questionDesc}>{securityQuestion}</Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputTitle}>Your Answer (उत्तर):</Text>
                <TextInput
                  value={forgotAnswer}
                  onChangeText={setForgotAnswer}
                  placeholder="Type answer here..."
                  style={styles.ansInputBox}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputTitle}>New PIN (नया पिन):</Text>
                  <TextInput
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={forgotNewPin}
                    onChangeText={(val) => setForgotNewPin(val.replace(/\D/g, ''))}
                    placeholder="••••"
                    style={styles.centerCodeInput}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputTitle}>Confirm (पुष्टि करें):</Text>
                  <TextInput
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={forgotConfirmPin}
                    onChangeText={(val) => setForgotConfirmPin(val.replace(/\D/g, ''))}
                    placeholder="••••"
                    style={styles.centerCodeInput}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleForgotPinSubmit}>
                <Text style={styles.submitBtnText}>Reset PIN & Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomLock}>
          <ShieldCheck size={14} color="#64748b" />
          <Text style={styles.bottomLockText}>Secure Offline Encryption Lock</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
    minHeight: '100%',
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 2,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 16,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  prefix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    paddingVertical: 14,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  iconMargin: {
    marginLeft: 6,
  },
  centerStep: {
    alignItems: 'center',
    width: '100%',
  },
  sectionHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 6,
  },
  sectionTitleCenter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  sectionSubCenter: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  pinPadContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginTop: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#334155',
  },
  clearBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  clearText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  emptyKey: {
    width: 68,
    height: 68,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  dropLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 6,
  },
  questionPill: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  questionPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0fdf4',
  },
  questionText: {
    fontSize: 12,
    color: '#475569',
  },
  questionTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  ansInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginVertical: 10,
  },
  linkBtn: {
    marginTop: 15,
  },
  linkBtnText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  linkResetText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 15,
  },
  backTouch: {
    padding: 4,
    marginTop: 2,
  },
  questionCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionDesc: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 14,
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
  },
  ansInputBox: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  centerCodeInput: {
    width: '100%',
    textAlign: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  bottomLock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
  },
  bottomLockText: {
    fontSize: 12,
    color: '#64748b',
  },
});
