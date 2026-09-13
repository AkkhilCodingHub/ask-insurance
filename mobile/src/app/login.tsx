import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useDialog } from '@/components/Dialog';

export default function LoginScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, directLogin } = useAuth();
  const { agent, login: agentLogin } = useAgent();
  const { alert, confirm } = useDialog();

  // If already authenticated (or restored after force-close), route into app only when focused on /login
  useEffect(() => {
    if (pathname !== '/login') return;
    if (user) {
      router.replace('/(tabs)');
    } else if (agent) {
      router.replace('/(agent)/quotes' as any);
    }
  }, [user, agent, router, pathname]);

  const [mode, setMode] = useState<'customer' | 'agent'>('customer');
  const [customerInputType, setCustomerInputType] = useState<'phone' | 'customerId'>('phone');
  const [phone, setPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneInputRef = useRef<TextInput>(null);
  const customerIdInputRef = useRef<TextInput>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const isValidCustomerPhone = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  const isValidCustomerId = customerId.trim().length >= 4;
  const isValidCustomer = customerInputType === 'phone' ? isValidCustomerPhone : isValidCustomerId;
  const isValidAgent = email.trim().length > 0 && password.trim().length >= 6;

  const handleCustomerLogin = async () => {
    if (!isValidCustomer) return;
    Keyboard.dismiss();
    setLoading(true);
    const identifier = customerInputType === 'phone' ? cleanPhone : customerId.trim().toUpperCase();

    try {
      await directLogin(identifier);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed. Please try again.';
      const isNotFound = msg.toLowerCase().includes('register') ||
                         msg.toLowerCase().includes('not found') ||
                         msg.toLowerCase().includes('incomplete') ||
                         msg.toLowerCase().includes('404');
      if (isNotFound) {
        const wantsRegister = await confirm({
          title: 'Account Not Found',
          message: 'No registered account was found with this ' + (customerInputType === 'phone' ? 'Phone Number' : 'Customer ID') + '.\n\nNew users must complete registration first.',
          confirmText: 'Register Now',
          cancelText: 'Try Again',
        });
        if (wantsRegister) {
          router.push('/register' as any);
        }
      } else {
        alert({ type: 'error', title: 'Sign In Failed', message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgentLogin = async () => {
    if (!isValidAgent) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await agentLogin(email.trim().toLowerCase(), password);
      router.replace('/(agent)/quotes' as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid credentials. Please try again.';
      alert({ type: 'error', title: 'Login Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Blue hero ─────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroBg1} />
            <View style={s.heroBg2} />

            <BackButton color="rgba(255,255,255,0.9)" style={s.backBtn} />

            <View style={s.logoRow}>
              <View style={s.logoCircle}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={{ width: 68, height: 68, borderRadius: 16 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={s.heroTitle}>Welcome to ASK</Text>
            <Text style={s.heroSub}>India's trusted insurance broker</Text>

            {/* ── Mode switcher inside hero ── */}
            <View style={s.segWrap}>
              <TouchableOpacity
                style={[s.segBtn, mode === 'customer' && s.segBtnActive]}
                onPress={() => setMode('customer')}
                activeOpacity={0.8}
              >
                <Icon
                  name="person-outline"
                  size={14}
                  color={mode === 'customer' ? Colors.primary : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[s.segText, mode === 'customer' && s.segTextActive]}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.segBtn, mode === 'agent' && s.segBtnActive]}
                onPress={() => router.push('/agent-login' as any)}
                activeOpacity={0.8}
              >
                <Icon
                  name="shield-checkmark-outline"
                  size={14}
                  color={mode === 'agent' ? Colors.primary : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[s.segText, mode === 'agent' && s.segTextActive]}>POSP (Agent)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Card ──────────────────────────────────── */}
          <View style={s.card}>
            {mode === 'customer' ? (
              <>
                <Text style={s.cardTitle}>Sign In to your account</Text>
                <Text style={s.cardSub}>
                  Registered users can log in directly without OTP.
                </Text>

                {/* Sub-tab: Phone Number vs Customer ID */}
                <View style={s.customerSubToggle}>
                  <TouchableOpacity
                    style={[s.subToggleBtn, customerInputType === 'phone' && s.subToggleBtnActive]}
                    onPress={() => setCustomerInputType('phone')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="phone-portrait-outline"
                      size={14}
                      color={customerInputType === 'phone' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[s.subToggleText, customerInputType === 'phone' && s.subToggleTextActive]}>
                      Phone Number
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.subToggleBtn, customerInputType === 'customerId' && s.subToggleBtnActive]}
                    onPress={() => setCustomerInputType('customerId')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="card-outline"
                      size={14}
                      color={customerInputType === 'customerId' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[s.subToggleText, customerInputType === 'customerId' && s.subToggleTextActive]}>
                      Customer ID (CU...)
                    </Text>
                  </TouchableOpacity>
                </View>

                {customerInputType === 'phone' ? (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => phoneInputRef.current?.focus()}
                    style={[af.inputRow, af.fieldGap]}
                  >
                    <View style={af.prefix}>
                      <Text style={s.flag}>🇮🇳</Text>
                      <Text style={s.prefixText}>+91</Text>
                    </View>
                    <TextInput
                      ref={phoneInputRef}
                      style={[af.input, af.inputPhone]}
                      value={phone}
                      onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={handleCustomerLogin}
                      autoFocus
                    />
                    {isValidCustomerPhone && (
                      <View style={s.checkCircle}>
                        <Icon name="checkmark" size={14} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => customerIdInputRef.current?.focus()}
                    style={[af.inputRow, af.fieldGap]}
                  >
                    <View style={af.prefix}>
                      <Icon name="card-outline" size={18} color={Colors.primary} />
                    </View>
                    <TextInput
                      ref={customerIdInputRef}
                      style={af.input}
                      value={customerId}
                      onChangeText={t => setCustomerId(t.toUpperCase())}
                      placeholder="e.g. CU849201"
                      placeholderTextColor={Colors.textLight}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleCustomerLogin}
                      autoFocus
                    />
                    {isValidCustomerId && (
                      <View style={s.checkCircle}>
                        <Icon name="checkmark" size={14} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[s.continueBtn, !isValidCustomer && s.continueBtnDisabled]}
                  onPress={handleCustomerLogin}
                  activeOpacity={0.85}
                  disabled={!isValidCustomer || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={s.continueBtnText}>Sign In Directly</Text>
                      <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>

                {/* ── New User Prompt ── */}
                <View style={s.registerPromptBox}>
                  <View style={s.registerPromptIcon}>
                    <Icon name="person-add-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.registerPromptTitle}>New to ASK Insurance?</Text>
                    <Text style={s.registerPromptDesc}>
                      Register your details and verify via OTP
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.registerActionBtn}
                    onPress={() => router.push('/register' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.registerActionText}>Register</Text>
                    <Icon name="chevron-forward-outline" size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                <Text style={s.consent}>
                  By continuing, you agree to our{' '}
                  <Text style={s.consentLink}>Terms</Text> &amp;{' '}
                  <Text style={s.consentLink}>Privacy Policy</Text>
                </Text>
              </>
            ) : (
              <>
                <Text style={s.cardTitle}>POSP Advisor Login</Text>
                <Text style={s.cardSub}>Sign in with your registered email &amp; password</Text>

                <View style={[af.inputRow, af.fieldGap]}>
                  <View style={af.prefix}>
                    <Icon name="mail-outline" size={18} color={Colors.primary} />
                  </View>
                  <TextInput
                    style={af.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="advisor@example.com"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  {email.includes('@') && email.includes('.') && (
                    <View style={s.checkCircle}>
                      <Icon name="checkmark" size={14} color={Colors.white} />
                    </View>
                  )}
                </View>

                <View style={[af.inputRow, { marginBottom: 20 }]}>
                  <View style={af.prefix}>
                    <Icon name="lock-closed-outline" size={18} color={Colors.primary} />
                  </View>
                  <TextInput
                    style={af.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={Colors.textLight}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleAgentLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                    <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[s.continueBtn, !isValidAgent && s.continueBtnDisabled]}
                  onPress={handleAgentLogin}
                  activeOpacity={0.85}
                  disabled={!isValidAgent || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={s.continueBtnText}>Sign In</Text>
                      <Icon name="arrow-forward-outline" size={18} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
                <Text style={s.consent}>Licensed POSP advisors only</Text>
              </>
            )}
          </View>

          {/* ── Footer ────────────────────────────────── */}
          <View style={s.footer}>
            <Icon name="shield-checkmark-outline" size={14} color={Colors.success} />
            <Text style={s.footerText}>Your data is encrypted &amp; secure</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // ── Hero ──────────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    overflow: 'hidden',
  },
  heroBg1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -60,
  },
  heroBg2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Mode segmented switcher ────────────────
  segWrap: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  segBtnActive: { backgroundColor: Colors.white },
  segText:      { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  segTextActive:{ color: Colors.primary },

  // ── Card ──────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },

  // Sub toggle for Phone vs Customer ID
  customerSubToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  subToggleBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  subToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  subToggleTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  flag:       { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 18,
  },
  continueBtnDisabled: { backgroundColor: Colors.textLight },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  // Register Callout Box
  registerPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  registerPromptIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerPromptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 2,
  },
  registerPromptDesc: {
    fontSize: 11,
    color: '#0284C7',
    lineHeight: 15,
  },
  registerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  registerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },

  consent:     { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  consentLink: { color: Colors.primary, fontWeight: '600' },

  eyeBtn: { paddingHorizontal: 14, paddingVertical: 16 },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  footerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
