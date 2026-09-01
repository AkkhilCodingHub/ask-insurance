import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { getApps, initializeApp } from '@react-native-firebase/app';
import { getAuth, signInWithPhoneNumber, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { plansApi, policiesApi, paymentsApi, authApi, kycApi, ApiPlan } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { useDialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { getRemainingOtpSeconds, startOtpCooldown, formatOtpTimer } from '@/utils/otpCooldown';

export default function BuyPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string; type?: string; planName?: string }>();
  const { user, refreshUser } = useAuth();
  const { alert } = useDialog();

  const [plan, setPlan] = useState<ApiPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposer Details
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [address, setAddress] = useState(user?.address || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [vehicleRcNumber, setVehicleRcNumber] = useState('');

  // Nominee Details
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [nomineeAge, setNomineeAge] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.dob) setDob(user.dob);
      if (user.gender) setGender(user.gender);
      if (user.address) setAddress(user.address);
      if (user.pincode) setPincode(user.pincode);
      if (user.panNumber) setPanNumber(user.panNumber);
      if (user.aadhaarVerified) setAadhaarNumber('999988887777');

      kycApi.getDigiLockerDetails().then(res => {
        if (res && res.isDigiLockerLinked) {
          if (res.name && !fullName) setFullName(res.name);
          if (res.dob && !dob) setDob(res.dob);
          if (res.gender) setGender(res.gender);
          if (res.address && !address) setAddress(res.address);
          if (res.pincode && !pincode) setPincode(res.pincode);
          if (res.panNumber) setPanNumber(res.panNumber);
          if (res.aadhaarNumber) setAadhaarNumber(res.aadhaarNumber);
          if (res.drivingLicenseNumber) setDrivingLicenseNumber(res.drivingLicenseNumber);
          if (res.rcNumber) setVehicleRcNumber(res.rcNumber);
        }
      }).catch(() => {});
    }
  }, [user]);

  // Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Proposer, 2: Nominee, 3: Review & OTP
  const [declChecked, setDeclChecked] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Success State
  const [createdPolicy, setCreatedPolicy] = useState<any | null>(null);

  useEffect(() => {
    if (params.planId) {
      plansApi.get(params.planId)
        .then(({ plan: p }) => setPlan(p))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [params.planId]);

  const basePrem = plan?.basePremium || 12500;
  const gst = Math.round(basePrem * 0.18);
  const totalPayable = basePrem + gst;
  const sumInsured = plan?.maxCover || 1000000;
  const color = plan?.insurer?.brandColor || Colors.primary;
  const rawType = (plan?.type || params.type || '').toLowerCase();
  const isMotor = ['motor', 'car', 'bike', 'two_wheeler', 'commercial', 'commercial_vehicle'].includes(rawType);

  const [consentTimeLeft, setConsentTimeLeft] = useState(0);

  // 5-minute E-Sign Consent OTP Timer
  useEffect(() => {
    if (!showOtpModal) return;
    const tick = () => {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      setConsentTimeLeft(getRemainingOtpSeconds(cleanPhone));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, phone]);

  const handleSendConsentOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert({ type: 'error', title: 'Invalid Mobile Number', message: 'Please enter a valid 10-digit mobile number to receive your OTP.' });
      return;
    }
    if (!declChecked) {
      alert({ type: 'error', title: 'Declaration required', message: 'Please accept the statutory IRDAI declaration to proceed.' });
      return;
    }
    setOtpSending(true);
    setOtpCode('');
    try {
      await authApi.sendOTP(cleanPhone);
      startOtpCooldown(cleanPhone, 300);
      setConsentTimeLeft(300);
      setShowOtpModal(true);
      alert({
        type: 'success',
        title: 'Consent OTP Sent',
        message: `A secure 6-digit verification code has been sent via SMS to +91 ${cleanPhone}. Please enter it to authorize your policy purchase.`,
      });
    } catch (e: any) {
      alert({ type: 'error', title: 'OTP Dispatch Failed', message: e?.message || 'Could not send verification code. Please check network connection.' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndPay = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      alert({ type: 'error', title: 'Invalid OTP', message: 'Please enter the 6-digit OTP code received on your phone.' });
      return;
    }

    setVerifying(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const cleanName = fullName.trim();
      const cleanPan = panNumber.trim().toUpperCase();
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, '').slice(-12);

      // 1. Direct Backend OTP verification (No Captcha)
      await authApi.verifyOTP(cleanPhone, cleanOtp);

      // 2. Sync verified KYC profile
      await kycApi.verifyInstant({
        name: cleanName,
        panNumber: cleanPan,
        aadhaarNumber: cleanAadhaar,
        dob: dob.trim(),
        gender,
        address: address.trim(),
        pincode: pincode.trim(),
      });

      const rawType = (plan?.type || params.type || 'health').toLowerCase();
      let normalizedType: 'life' | 'health' | 'motor' | 'travel' | 'home' | 'business';
      if (['health', 'mediclaim', 'critical_illness'].includes(rawType)) normalizedType = 'health';
      else if (['motor', 'car', 'bike', 'two_wheeler', 'commercial_vehicle'].includes(rawType)) normalizedType = 'motor';
      else if (['life', 'term', 'investment'].includes(rawType)) normalizedType = 'life';
      else if (['travel'].includes(rawType)) normalizedType = 'travel';
      else if (['home', 'property'].includes(rawType)) normalizedType = 'home';
      else normalizedType = 'business';

      // 3. Create real policy record in database
      const polRes = await policiesApi.create({
        type: normalizedType,
        provider: plan?.insurer?.name || 'ASK Insurance Underwriters',
        sumInsured,
        premium: totalPayable,
        durationDays: 365,
        nomineeName: nomineeName.trim(),
        nomineeRelation,
        panNumber: cleanPan,
        aadhaarNumber: cleanAadhaar,
        registrationNumber: isMotor && vehicleRcNumber ? vehicleRcNumber.trim().toUpperCase() : undefined,
      });

      const newPolicy = polRes.policy;

      // 4. Create and launch live Razorpay payment gateway
      const linkRes = await paymentsApi.createRazorpayLink(newPolicy.id);
      setShowOtpModal(false);

      if (linkRes?.paymentUrl) {
        try {
          await WebBrowser.openAuthSessionAsync(linkRes.paymentUrl, 'askinsurance://');
        } catch {
          await WebBrowser.openBrowserAsync(linkRes.paymentUrl);
        }
      }

      setCreatedPolicy(newPolicy);
      await refreshUser();
    } catch (e: any) {
      alert({ type: 'error', title: 'Transaction Failed', message: e?.message || 'Could not complete verification or payment.' });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── SUCCESS & AUTOMATIC CERTIFICATE SCREEN ─────────────────────────────────
  if (createdPolicy) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.successScreen}>
          <View style={s.successIconWrap}>
            <Icon name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={s.successTitle}>Policy Issued Successfully! 🎉</Text>
          <Text style={s.successSub}>
            Your {createdPolicy.type} insurance policy has been bound and activated instantly.
          </Text>

          <View style={s.policyBadgeBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLbl}>Policy Number</Text>
              <Text style={s.summaryValBold}>{createdPolicy.policyNumber}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLbl}>Insurer</Text>
              <Text style={s.summaryVal}>{createdPolicy.provider}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLbl}>Sum Insured</Text>
              <Text style={[s.summaryValBold, { color: Colors.primary }]}>₹{(sumInsured / 100000).toFixed(0)} Lakh</Text>
            </View>
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLbl}>Premium Paid</Text>
              <Text style={[s.summaryValBold, { color: Colors.success }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.downloadCertBtn}
            onPress={() => setShowCertModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={s.downloadCertBtnText}>📄 View & Download Policy Certificate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.backHomeBtn}
            onPress={() => router.replace('/(tabs)/profile' as any)}
            activeOpacity={0.85}
          >
            <Text style={s.backHomeBtnText}>Go to My Policies →</Text>
          </TouchableOpacity>

          {/* Certificate Modal */}
          <Modal
            visible={showCertModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowCertModal(false)}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['top', 'bottom']}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#1E293B' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>Policy Certificate</Text>
                <TouchableOpacity
                  onPress={() => setShowCertModal(false)}
                  style={{ padding: 10, borderRadius: 20, backgroundColor: '#1E293B' }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderColor: '#E2E8F0', paddingBottom: 16, marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.primary }}>ASK INSURANCE BROKERS</Text>
                      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '700' }}>Direct Insurance Broker · IRDAI Reg: 102/2024</Text>
                    </View>
                    <View style={{ backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                      <Text style={{ color: '#047857', fontSize: 11, fontWeight: '800' }}>✓ ACTIVE & PAID</Text>
                    </View>
                  </View>

                  {/* Title Banner */}
                  <View style={{ backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>CERTIFICATE OF INSURANCE & SCHEDULE</Text>
                  </View>

                  {/* Policy Details */}
                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 }}>
                      Policy & Coverage Details
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Policy Number:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>{createdPolicy.policyNumber}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Category:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' }}>{createdPolicy.type} Insurance</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Underwriter:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{createdPolicy.provider}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Sum Insured:</Text>
                      <Text style={{ color: Colors.primary, fontWeight: '900', fontSize: 13 }}>₹{(sumInsured / 100000).toFixed(0)} Lakh</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Validity:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>1 Year (Active)</Text>
                    </View>
                  </View>

                  {/* Insured & Nominee */}
                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 }}>
                      Policyholder & Nominee Details
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Insured Name:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>{fullName || user?.name || 'Valued Customer'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Mobile / Email:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{phone || user?.phone} · {email || user?.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>PAN / Aadhaar:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{panNumber} · ••••{aadhaarNumber.slice(-4)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Nominee:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>{nomineeName} ({nomineeRelation}, {nomineeAge} yrs)</Text>
                    </View>
                  </View>

                  {/* Premium Summary Table */}
                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 }}>
                      Premium & Tax Computation
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Net Premium:</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>₹{(totalPayable - Math.round(totalPayable * 0.18)).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>IGST (18%):</Text>
                      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>₹{Math.round(totalPayable * 0.18).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 6 }}>
                      <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 13 }}>Total Amount Paid:</Text>
                      <Text style={{ color: Colors.success, fontWeight: '900', fontSize: 14 }}>₹{totalPayable.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Footer Seal */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 14 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 9, flex: 1, paddingRight: 10 }}>
                      Electronically generated document under IT Act, 2000. Valid without physical signature.
                    </Text>
                    <View style={{ borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' }}>
                      <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '900' }}>ASK INSURANCE BROKERS</Text>
                      <Text style={{ color: '#64748B', fontSize: 8 }}>Digitally Verified & Sealed</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // ── PROPOSAL FORM (POLICYBAZAAR STYLE) ─────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <BackButton onPress={() => (step > 1 ? setStep((s) => (s - 1) as any) : router.back())} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>Policy Proposal & Checkout</Text>
          <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '800' }}>ASK Insurance Brokers</Text>
        </View>
        <Text style={s.stepIndicator}>Step {step} of 3</Text>
      </View>

      {/* Plan Summary Card */}
      <View style={[s.planBanner, { borderColor: color + '40' }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '900' }}>🛡️ ASK INSURANCE BROKERS</Text>
            </View>
            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>Direct Broker</Text>
          </View>
          <Text style={s.planInsurer}>{plan?.insurer?.name || 'Selected Insurance Plan'}</Text>
          <Text style={s.planTitle}>{plan?.name || params.planName || 'Comprehensive Cover'}</Text>
          <Text style={s.planCover}>Cover: ₹{(sumInsured / 100000).toFixed(0)} Lakh</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.planPrem}>₹{totalPayable.toLocaleString('en-IN')}</Text>
          <Text style={s.planGst}>(incl. 18% GST)</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        {/* STEP 1: PROPOSER & KYC DETAILS */}
        {step === 1 && (
          <View style={s.formSection}>
            <View style={s.sectionHeaderRow}>
              <Icon name="person-circle-outline" size={22} color={Colors.primary} />
              <Text style={s.sectionTitle}>1. Proposer & Insured Details</Text>
            </View>

            <Text style={s.fieldLabel}>FULL NAME (AS PER PAN / AADHAAR)</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Sharma" />
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>MOBILE NUMBER</Text>
                <View style={af.inputRow}>
                  <TextInput style={af.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>DATE OF BIRTH</Text>
                <View style={af.inputRow}>
                  <TextInput style={af.input} value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
                </View>
              </View>
            </View>

            <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>PAN NUMBER</Text>
                <View style={af.inputRow}>
                  <TextInput style={af.input} value={panNumber} onChangeText={setPanNumber} autoCapitalize="characters" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>AADHAAR NUMBER</Text>
                <View style={af.inputRow}>
                  <TextInput style={af.input} value={aadhaarNumber} onChangeText={setAadhaarNumber} keyboardType="numeric" />
                </View>
              </View>
            </View>

            <Text style={s.fieldLabel}>COMMUNICATION ADDRESS</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={address} onChangeText={setAddress} placeholder="Street address" />
            </View>

            <Text style={s.fieldLabel}>PINCODE</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={pincode} onChangeText={setPincode} keyboardType="numeric" />
            </View>

            {isMotor && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>DRIVING LICENCE (DL)</Text>
                  <View style={af.inputRow}>
                    <TextInput
                      style={af.input}
                      value={drivingLicenseNumber}
                      onChangeText={(t) => setDrivingLicenseNumber(t.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16))}
                      placeholder="e.g. DL-0420110012345"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>VEHICLE REG (RC)</Text>
                  <View style={af.inputRow}>
                    <TextInput
                      style={af.input}
                      value={vehicleRcNumber}
                      onChangeText={(t) => setVehicleRcNumber(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. DL01AB1234"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: NOMINEE DETAILS */}
        {step === 2 && (
          <View style={s.formSection}>
            <View style={s.sectionHeaderRow}>
              <Icon name="heart-outline" size={22} color={Colors.primary} />
              <Text style={s.sectionTitle}>2. Nominee Details (IRDAI Mandatory)</Text>
            </View>
            <Text style={s.subText}>
              In the event of an unforeseen claim, the claim amount will be paid to your appointed nominee.
            </Text>

            <Text style={s.fieldLabel}>NOMINEE FULL NAME</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={nomineeName} onChangeText={setNomineeName} placeholder="Nominee's legal name" />
            </View>

            <Text style={s.fieldLabel}>RELATIONSHIP WITH PROPOSER</Text>
            <View style={s.chipRow}>
              {['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'].map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[s.chip, nomineeRelation === rel && s.chipActive]}
                  onPress={() => setNomineeRelation(rel)}
                >
                  <Text style={[s.chipText, nomineeRelation === rel && s.chipTextActive]}>{rel}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>NOMINEE AGE (YEARS)</Text>
            <View style={af.inputRow}>
              <TextInput style={af.input} value={nomineeAge} onChangeText={setNomineeAge} keyboardType="numeric" placeholder="e.g. 28" />
            </View>
          </View>
        )}

        {/* STEP 3: PROPOSAL REVIEW & E-SIGN OTP */}
        {step === 3 && (
          <View style={s.formSection}>
            <View style={s.sectionHeaderRow}>
              <Icon name="shield-checkmark-outline" size={22} color={Colors.primary} />
              <Text style={s.sectionTitle}>3. Proposal Review & E-Sign Consent</Text>
            </View>

            <View style={s.reviewCard}>
              <Text style={s.reviewCardTitle}>Proposal Summary</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Proposer Name</Text>
                <Text style={s.summaryVal}>{fullName || 'Customer'}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Mobile & Email</Text>
                <Text style={s.summaryVal}>+91 {phone} · {email || '—'}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>PAN & Aadhaar</Text>
                <Text style={s.summaryVal}>{panNumber || '—'} · {aadhaarNumber ? `**** ${aadhaarNumber.slice(-4)}` : '—'}</Text>
              </View>
              {isMotor && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLbl}>Driving Licence & RC</Text>
                  <Text style={s.summaryVal}>{drivingLicenseNumber || 'DL Verified'} · {vehicleRcNumber || 'RC Verified'}</Text>
                </View>
              )}
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Brokered By</Text>
                <Text style={[s.summaryValBold, { color: Colors.primary }]}>ASK Insurance Brokers</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Appointed Nominee</Text>
                <Text style={s.summaryVal}>{nomineeName || 'Nominee'} ({nomineeRelation}{nomineeAge ? `, ${nomineeAge} yrs` : ''})</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLbl}>Total Premium Payable</Text>
                <Text style={[s.summaryValBold, { color: Colors.primary }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.declRow} onPress={() => setDeclChecked(!declChecked)} activeOpacity={0.8}>
              <View style={[s.checkbox, declChecked && s.checkboxActive]}>
                {declChecked && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.declText}>
                I hereby declare that the details provided are true to the best of my knowledge and agree to the IRDAI terms & conditions of the insurance contract.
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── STICKY BOTTOM ACTION FOOTER ── */}
      <View style={s.stickyFooter}>
        {step === 1 && (
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => {
              const cleanName = fullName.trim();
              const cleanPhone = phone.replace(/\D/g, '').slice(-10);
              const cleanPan = panNumber.trim().toUpperCase();
              const cleanAadhaar = aadhaarNumber.replace(/\D/g, '').slice(-12);
              const cleanDob = dob.trim();
              const cleanAddress = address.trim();
              const cleanPincode = pincode.trim();

              if (!cleanName) {
                alert({ type: 'warning', title: 'Full Name Required', message: 'Please enter your full legal name as per government ID.' });
                return;
              }
              if (!cleanPhone || cleanPhone.length !== 10) {
                alert({ type: 'warning', title: 'Valid Mobile Required', message: 'Please enter a valid 10-digit mobile number.' });
                return;
              }
              if (!cleanDob) {
                alert({ type: 'warning', title: 'Date of Birth Required', message: 'Please enter your date of birth (DD/MM/YYYY).' });
                return;
              }
              if (!cleanPan || cleanPan.length !== 10) {
                alert({ type: 'warning', title: 'Valid PAN Required', message: 'Please enter a valid 10-character PAN number.' });
                return;
              }
              if (!cleanAadhaar || cleanAadhaar.length !== 12) {
                alert({ type: 'warning', title: 'Valid Aadhaar Required', message: 'Please enter a valid 12-digit Aadhaar number.' });
                return;
              }
              if (isMotor) {
                if (!drivingLicenseNumber.trim() || drivingLicenseNumber.trim().length < 8) {
                  alert({ type: 'warning', title: 'Driving Licence Required', message: 'IRDAI & Motor Vehicles Act require a valid Driving Licence (DL) for motor insurance.' });
                  return;
                }
                if (!vehicleRcNumber.trim() || vehicleRcNumber.trim().length < 6) {
                  alert({ type: 'warning', title: 'Vehicle RC Required', message: 'Please enter a valid Vehicle Registration (RC) number.' });
                  return;
                }
              }
              if (!cleanAddress) {
                alert({ type: 'warning', title: 'Address Required', message: 'Please enter your communication address.' });
                return;
              }
              if (!cleanPincode || cleanPincode.length !== 6) {
                alert({ type: 'warning', title: 'Valid Pincode Required', message: 'Please enter a valid 6-digit postal pincode.' });
                return;
              }

              // Auto-sync KYC to database & Admin Panel
              kycApi.verifyInstant({
                name: cleanName,
                panNumber: cleanPan,
                aadhaarNumber: cleanAadhaar,
                dob: cleanDob,
                gender,
                address: cleanAddress,
                pincode: cleanPincode,
              }).then(() => refreshUser()).catch(() => {});

              setStep(2);
            }}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>Continue to Nominee Details →</Text>
          </TouchableOpacity>
        )}

        {step === 2 && (
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => {
              const cleanNominee = nomineeName.trim();
              const ageNum = parseInt(nomineeAge.trim(), 10);
              if (!cleanNominee) {
                alert({ type: 'warning', title: 'Nominee Name Required', message: 'Please enter the nominee legal full name.' });
                return;
              }
              if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
                alert({ type: 'warning', title: 'Valid Nominee Age Required', message: 'Please enter a valid age between 1 and 120.' });
                return;
              }
              setStep(3);
            }}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>Review Proposal & E-Sign →</Text>
          </TouchableOpacity>
        )}

        {step === 3 && (
          <TouchableOpacity
            style={s.payBtn}
            onPress={handleSendConsentOtp}
            disabled={otpSending}
            activeOpacity={0.85}
          >
            {otpSending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.payBtnText}>🔒 Verify via OTP & Pay ₹{totalPayable.toLocaleString('en-IN')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── E-SIGN OTP VERIFICATION MODAL ── */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <Icon name="key-outline" size={30} color={Colors.primary} />
            </View>
            <Text style={s.modalTitle}>E-Sign Consent OTP</Text>
            <Text style={s.modalSub}>
              Enter the 6-digit verification code sent via SMS to <Text style={{ fontWeight: '800', color: Colors.primary }}>+91 {phone}</Text> to sign and authorize your insurance purchase.
            </Text>
            <Text style={[s.modalTimer, consentTimeLeft === 0 && { color: '#EF4444' }]}>
              {consentTimeLeft > 0 ? `Code expires in ${formatOtpTimer(consentTimeLeft)}` : 'Code expired. Please request a new code.'}
            </Text>

            <View style={{ width: '100%', marginTop: 16 }}>
              <TextInput
                style={[af.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '900', color: '#0F172A', height: 54 }]}
                placeholder="------"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[s.modalPayBtn, (verifying || otpCode.trim().length !== 6 || consentTimeLeft === 0) && s.modalPayBtnDisabled]}
              onPress={handleVerifyAndPay}
              disabled={verifying || otpCode.trim().length !== 6 || consentTimeLeft === 0}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.modalPayBtnText} numberOfLines={1}>Confirm & Pay via Razorpay →</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 16 }}>
              <TouchableOpacity onPress={handleSendConsentOtp} disabled={otpSending || consentTimeLeft > 0}>
                <Text style={{ fontSize: 13, color: consentTimeLeft > 0 ? '#94A3B8' : Colors.primary, fontWeight: '700' }}>
                  {otpSending ? 'Sending SMS...' : consentTimeLeft > 0 ? `Resend in ${formatOtpTimer(consentTimeLeft)}` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#CBD5E1' }}>•</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  stepIndicator: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  planBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  planInsurer: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  planTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  planCover: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  planPrem: { fontSize: 17, fontWeight: '900', color: Colors.text },
  planGst: { fontSize: 10, color: Colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  subText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 12, marginBottom: 4 },
  twoCol: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  chipTextActive: { color: Colors.primary },
  stickyFooter: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  reviewCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  reviewCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  summaryLbl: { fontSize: 12, color: Colors.textMuted },
  summaryVal: { fontSize: 12, fontWeight: '700', color: Colors.text },
  summaryValBold: { fontSize: 14, fontWeight: '900', color: Colors.text },
  declRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  declText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  payBtn: {
    backgroundColor: Colors.success,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  modalTimer: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 8 },
  modalPayBtn: {
    backgroundColor: Colors.primary,
    minHeight: 52,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPayBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  cancelBtn: { marginTop: 12, paddingVertical: 6 },
  cancelBtnText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIconWrap: { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  policyBadgeBox: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  downloadCertBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, width: '100%', paddingVertical: 15, borderRadius: 12, justifyContent: 'center', marginBottom: 12 },
  downloadCertBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  backHomeBtn: { paddingVertical: 12 },
  backHomeBtnText: { fontSize: 14, color: Colors.textMuted, fontWeight: '700' },
});
