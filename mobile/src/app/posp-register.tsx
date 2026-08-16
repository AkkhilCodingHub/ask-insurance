import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { pospExamApi } from '@/lib/api';
import { examStore } from '@/lib/examStore';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { useAuth } from '@/context/auth';
import { generatePospCertificateHtml } from '@/lib/certificateGenerator';
import * as WebBrowser from 'expo-web-browser';

export default function PospRegisterScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.phone && !phone) setPhone(user.phone);
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  // KYC Upload States
  const [passedExamId, setPassedExamId] = useState<string | null>(() => {
    const res = examStore.getResults();
    return res && res.passed && res.attemptId ? res.attemptId : null;
  });
  const [passedScore, setPassedScore] = useState<number | null>(() => {
    const res = examStore.getResults();
    return res && res.passed && res.score ? res.score : null;
  });
  const [aadhaarNum, setAadhaarNum] = useState('');
  const [panNum, setPanNum] = useState('');

  useEffect(() => {
    const res = examStore.getResults();
    if (res && res.passed && res.attemptId) {
      setPassedExamId(res.attemptId);
      setPassedScore(res.score);
    }
  }, []);

  useEffect(() => {
    if (phone.trim() || email.trim()) {
      checkStatus();
    }
  }, [phone, email]);

  const [aadhaarDoc, setAadhaarDoc] = useState<{ uri: string; name: string } | null>(null);
  const [panDoc, setPanDoc] = useState<{ uri: string; name: string } | null>(null);

  // Status & Eligibility
  const [startingExam, setStartingExam] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    status?: string;
    attemptsToday?: number;
    attemptsLeft?: number;
    nextEligibleAt?: string;
    remainingSeconds?: number;
  } | null>(null);
  
  const [applicationStatus, setApplicationStatus] = useState<any | null>(null);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [err, setErr] = useState('');

  const checkStatus = async () => {
    if (!phone.trim() && !email.trim()) return;
    try {
      const res = await pospExamApi.checkEligibility(phone.trim(), email.trim());
      setEligibility(res);
      if ((res as any).passedAttempt) {
        setPassedExamId((res as any).passedAttempt.attemptId);
        setPassedScore((res as any).passedAttempt.score);
      }

      const appRes = await pospExamApi.getApplicationStatus(phone.trim(), email.trim());
      if (appRes.hasApplication) {
        setApplicationStatus(appRes.application);
      } else {
        setApplicationStatus(null);
      }
    } catch {
      // ignore
    }
  };

  const handleStartExam = async () => {
    const candidateName = name.trim();
    const candidatePhone = phone.trim();
    const candidateEmail = email.trim();

    if (!candidateName || candidateName.length < 2) {
      setErr('Please enter your full name as per Aadhaar.');
      return;
    }
    if (!candidatePhone || candidatePhone.length < 10) {
      setErr('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!candidateEmail || !candidateEmail.includes('@')) {
      setErr('Please enter a valid email address.');
      return;
    }

    setErr('');
    setStartingExam(true);
    try {
      const res = await pospExamApi.startExam({
        name: candidateName,
        phone: candidatePhone,
        email: candidateEmail,
      });
      examStore.setSession({
        attemptId: res.attemptId,
        candidateName,
        candidatePhone,
        candidateEmail,
        durationMinutes: res.durationMinutes,
        totalQuestions: res.totalQuestions,
        passingScore: res.passingScore,
        questions: res.questions,
      });
      router.push('/posp-exam' as any);
    } catch (e: any) {
      setErr(e?.message || 'Failed to start exam. Check eligibility or cooldown time.');
    } finally {
      setStartingExam(false);
    }
  };

  const pickAadhaar = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const file = res.assets[0];
        setAadhaarDoc({ uri: file.uri, name: file.name });
      }
    } catch {}
  };

  const pickPan = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const file = res.assets[0];
        setPanDoc({ uri: file.uri, name: file.name });
      }
    } catch {}
  };

  const handleSubmitApplication = async () => {
    if (!aadhaarNum.trim() || aadhaarNum.trim().length < 12) {
      setErr('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!panNum.trim() || panNum.trim().length < 10) {
      setErr('Please enter a valid 10-character PAN number.');
      return;
    }
    if (!aadhaarDoc) {
      setErr('Please upload your Aadhaar document/photo.');
      return;
    }
    if (!panDoc) {
      setErr('Please upload your PAN card document/photo.');
      return;
    }
    if (!passedExamId) {
      setErr('No verified passed exam score found. Please take the test.');
      return;
    }

    setSubmittingApp(true);
    setErr('');
    try {
      // In mobile app, we send document data URI / public CDN link
      const res = await pospExamApi.applyPosp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        examAttemptId: passedExamId,
        aadhaarNumber: aadhaarNum.trim(),
        aadhaarDocUrl: aadhaarDoc.uri,
        panNumber: panNum.trim(),
        panDocUrl: panDoc.uri,
      });

      Alert.alert(
        '🎉 Application Submitted!',
        `Your POSP request (${res.applicationNumber}) has been submitted to the Admin Panel for approval.`,
        [{ text: 'OK', onPress: () => checkStatus() }]
      );
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit POSP application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleDownloadSyllabus = async () => {
    const pdfUrl = 'https://raw.githubusercontent.com/AkkhilCodingHub/ask-insurance/main/docs/IC-38-General-Syllabus.pdf';
    try {
      await Linking.openURL(pdfUrl);
    } catch {
      setShowSyllabusModal(true);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Top bar */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.badge}>
            <Icon name="ribbon-outline" size={16} color={Colors.primary} />
            <Text style={s.badgeText}>IRDAI Certified POSP Portal</Text>
          </View>
          <Text style={s.title}>Become a Licensed POSP Advisor</Text>
          <Text style={s.sub}>
            Take the IC-38 General Insurance exam online (50 Questions, 40 Mins). Score &gt; 15 to pass and submit your KYC for Admin approval!
          </Text>

          {/* Syllabus Download Button */}
          <TouchableOpacity style={s.syllabusBtn} onPress={handleDownloadSyllabus} activeOpacity={0.85}>
            <Icon name="cloud-download-outline" size={18} color="#FFFFFF" />
            <Text style={s.syllabusBtnText}>📥 Download IC-38 Syllabus PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Application Status Card */}
        {applicationStatus && (
          <View style={[s.card, applicationStatus.status === 'approved' ? s.cardSuccess : applicationStatus.status === 'rejected' ? s.cardError : s.cardPending]}>
            <Icon
              name={applicationStatus.status === 'approved' ? 'checkmark-circle' : applicationStatus.status === 'rejected' ? 'close-circle' : 'time'}
              size={28}
              color={applicationStatus.status === 'approved' ? Colors.success : applicationStatus.status === 'rejected' ? Colors.error : Colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>
                {applicationStatus.status === 'approved' ? 'POSP Advisor Approved! 🎉' : applicationStatus.status === 'rejected' ? 'Application Rejected' : 'Application Under Review ⏳'}
              </Text>
              <Text style={s.cardSub}>Application Ref: {applicationStatus.applicationNumber}</Text>

              {applicationStatus.assignedAgentCode && (
                <View style={s.pospCodeBadge}>
                  <Text style={s.pospCodeText}>Your POSP ID: {applicationStatus.assignedAgentCode}</Text>
                </View>
              )}

              {applicationStatus.status === 'approved' && (
                <TouchableOpacity
                  style={[s.syllabusBtn, { marginTop: 12, backgroundColor: Colors.success }]}
                  onPress={async () => {
                    try {
                      const html = generatePospCertificateHtml({
                        applicationNumber: applicationStatus.applicationNumber,
                        name: applicationStatus.name || name || 'Authorized POSP Advisor',
                        phone: applicationStatus.phone || phone || '—',
                        email: applicationStatus.email || email || '—',
                        panNumber: applicationStatus.panNumber || panNum || '—',
                        aadhaarNumber: applicationStatus.aadhaarNumber || aadhaarNum || '—',
                        examScore: applicationStatus.examScore || 50,
                        examPassedAt: applicationStatus.examPassedAt || applicationStatus.createdAt || new Date(),
                        agentCode: applicationStatus.assignedAgentCode || applicationStatus.applicationNumber,
                        approvedAt: applicationStatus.updatedAt || new Date(),
                      });
                      const certDataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
                      await WebBrowser.openBrowserAsync(certDataUri);
                    } catch {
                      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ask-api.bitopayments.com';
                      const certUrl = `${baseUrl}/api/posp/certificate/${applicationStatus.applicationNumber}`;
                      Linking.openURL(certUrl);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Icon name="ribbon-outline" size={18} color="#FFFFFF" />
                  <Text style={s.syllabusBtnText}>🎓 View & Download POSP Certificate</Text>
                </TouchableOpacity>
              )}

              {applicationStatus.rejectionReason && (
                <Text style={[s.cardSub, { color: Colors.error, marginTop: 4 }]}>Reason: {applicationStatus.rejectionReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Candidate Registration Details Form */}
        <View style={s.card}>
          <Text style={s.sectionHeader}>1. Candidate Information</Text>

          <Text style={s.label}>FULL NAME (AS PER AADHAAR)</Text>
          <View style={af.inputRow}>
            <TextInput
              style={af.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>MOBILE NUMBER</Text>
          <View style={af.inputRow}>
            <TextInput
              style={af.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={v => { setPhone(v); checkStatus(); }}
            />
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>EMAIL ADDRESS</Text>
          <View style={af.inputRow}>
            <TextInput
              style={af.input}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={v => { setEmail(v); checkStatus(); }}
            />
          </View>

          {/* Eligibility Info Box */}
          {eligibility && !eligibility.eligible && (
            <View style={s.warnBox}>
              <Icon name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={s.warnText}>{eligibility.reason}</Text>
            </View>
          )}

          {/* Start Exam Button */}
          <TouchableOpacity
            style={[s.primaryBtn, startingExam && { opacity: 0.6 }]}
            onPress={handleStartExam}
            disabled={startingExam}
            activeOpacity={0.85}
          >
            {startingExam ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="school-outline" size={20} color="#fff" />
                <Text style={s.primaryBtnText}>Start IC-38 Online Exam (50 Qs)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 2: Passed Exam Verification & KYC Upload (Unlocked when passed) */}
        <View style={[s.card, !passedExamId && { opacity: 0.5 }]}>
          <Text style={s.sectionHeader}>2. Aadhaar & PAN KYC Upload (Post-Passing)</Text>

          {passedExamId ? (
            <View style={s.passNotice}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={s.passNoticeText}>IC-38 Exam Passed! Score: {passedScore}/50 (&gt; 15)</Text>
            </View>
          ) : (
            <Text style={s.lockNotice}>🔒 Complete and pass the IC-38 Online Exam (&gt; 15/50) to unlock document submission.</Text>
          )}

          <Text style={[s.label, { marginTop: 12 }]}>12-DIGIT AADHAAR NUMBER</Text>
          <View style={af.inputRow}>
            <TextInput
              style={af.input}
              placeholder="e.g. 9849 1029 3847"
              placeholderTextColor={Colors.textLight}
              keyboardType="number-pad"
              value={aadhaarNum}
              onChangeText={setAadhaarNum}
              editable={Boolean(passedExamId)}
            />
          </View>

          <TouchableOpacity
            style={[s.uploadBtn, aadhaarDoc && s.uploadBtnDone]}
            onPress={pickAadhaar}
            disabled={!passedExamId}
          >
            <Icon name={aadhaarDoc ? 'document-attach' : 'cloud-upload-outline'} size={18} color={aadhaarDoc ? Colors.success : Colors.primary} />
            <Text style={[s.uploadBtnText, aadhaarDoc && { color: Colors.success }]}>
              {aadhaarDoc ? `Aadhaar Uploaded: ${aadhaarDoc.name}` : 'Upload Aadhaar Card (Image/PDF)'}
            </Text>
          </TouchableOpacity>

          <Text style={[s.label, { marginTop: 14 }]}>10-CHARACTER PAN NUMBER</Text>
          <View style={af.inputRow}>
            <TextInput
              style={af.input}
              placeholder="e.g. ABCDE1234F"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="characters"
              value={panNum}
              onChangeText={setPanNum}
              editable={Boolean(passedExamId)}
            />
          </View>

          <TouchableOpacity
            style={[s.uploadBtn, panDoc && s.uploadBtnDone]}
            onPress={pickPan}
            disabled={!passedExamId}
          >
            <Icon name={panDoc ? 'document-attach' : 'cloud-upload-outline'} size={18} color={panDoc ? Colors.success : Colors.primary} />
            <Text style={[s.uploadBtnText, panDoc && { color: Colors.success }]}>
              {panDoc ? `PAN Uploaded: ${panDoc.name}` : 'Upload PAN Card (Image/PDF)'}
            </Text>
          </TouchableOpacity>

          {!!err && (
            <View style={s.errBox}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={s.errText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.submitBtn, (!passedExamId || submittingApp) && { opacity: 0.6 }]}
            onPress={handleSubmitApplication}
            disabled={!passedExamId || submittingApp}
            activeOpacity={0.85}
          >
            {submittingApp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitBtnText}>Submit Application to Admin Panel</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Syllabus Modal Fallback */}
      <Modal visible={showSyllabusModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>IC-38 Syllabus Structure</Text>
              <TouchableOpacity onPress={() => setShowSyllabusModal(false)}>
                <Icon name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={s.modalSub}>
                • Section 1: Common Insurance Chapters (Ch 1 - 5){'\n'}
                • Section 2: Health Insurance & Documentation (Ch 6 - 10){'\n'}
                • Section 3: General, Motor & Claims Regulations (Ch 11 - 16){'\n'}
                • Exam Format: 50 MCQs | 40 Mins | Pass Score &gt; 15/50
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  
  hero: { marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.4, marginBottom: 6 },
  sub: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 14 },

  syllabusBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0284C7', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  syllabusBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 18 },
  cardSuccess: { borderColor: Colors.success, backgroundColor: '#F0FDF4' },
  cardPending: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  cardError: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  cardSub: { fontSize: 12, color: Colors.textMuted },
  pospCodeBadge: { marginTop: 8, padding: 6, borderRadius: 8, backgroundColor: Colors.primary + '20', alignSelf: 'flex-start' },
  pospCodeText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  sectionHeader: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  warnBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, borderColor: Colors.error, borderWidth: 1, marginTop: 12 },
  warnText: { fontSize: 12, color: Colors.error, flex: 1 },

  passNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 10, marginBottom: 12 },
  passNoticeText: { fontSize: 13, fontWeight: '800', color: Colors.success },
  lockNotice: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', marginTop: 8, backgroundColor: Colors.bg },
  uploadBtnDone: { borderColor: Colors.success, backgroundColor: '#F0FDF4', borderStyle: 'solid' },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  errText: { fontSize: 12, color: Colors.error, flex: 1 },

  submitBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 22 },
});
