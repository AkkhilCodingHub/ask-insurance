import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { examStore } from '@/lib/examStore';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

interface QuestionReview {
  id: string;
  chapter: string;
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  isCorrect: boolean;
  explanation?: string;
}

export default function PospResultsScreen() {
  const router = useRouter();
  const results = examStore.getResults();

  const [activeTab, setActiveTab] = useState<'summary' | 'review'>('summary');

  if (!results) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={{ padding: 20, textAlign: 'center', color: Colors.textMuted }}>No test results available.</Text>
      </SafeAreaView>
    );
  }

  const {
    score, totalQuestions, correctAnswers, wrongAnswers, passed,
    terminatedEarly, terminationReason, candidateName, questionsReview,
  } = results;

  const handleProceedRegistration = () => {
    router.replace('/posp-register' as any);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Top Banner */}
      <View style={[s.headerBanner, passed ? s.bannerPass : s.bannerFail]}>
        <Icon
          name={passed ? 'trophy' : 'alert-circle'}
          size={48}
          color="#FFF"
        />
        <Text style={s.resultTitle}>{passed ? 'PASSED IC-38 EXAM!' : 'EXAM NOT CLEARED'}</Text>
        <Text style={s.resultScoreText}>Your Score: {score} / {totalQuestions}</Text>
        <Text style={s.resultSub}>Passing Score Required: &gt; 15 (16 / 50)</Text>

        {terminatedEarly && (
          <View style={s.termTag}>
            <Text style={s.termTagText}>⚠️ Terminated: {terminationReason}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabItem, activeTab === 'summary' && s.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[s.tabText, activeTab === 'summary' && s.tabTextActive]}>Score Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabItem, activeTab === 'review' && s.tabActive]}
          onPress={() => setActiveTab('review')}
        >
          <Text style={[s.tabText, activeTab === 'review' && s.tabTextActive]}>Questions Review ({questionsReview?.length || 0})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {activeTab === 'summary' ? (
          <View style={{ gap: 16 }}>
            {/* Candidate & Metric Stats */}
            <View style={s.card}>
              <Text style={s.cardHeader}>Candidate Details</Text>
              <Text style={s.detailRow}>Name: <Text style={s.bold}>{candidateName}</Text></Text>
              <Text style={s.detailRow}>Test Date: <Text style={s.bold}>{new Date().toLocaleDateString('en-IN')}</Text></Text>
            </View>

            {/* Metrics Grid */}
            <View style={s.grid}>
              <View style={[s.statCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={[s.statVal, { color: Colors.success }]}>{correctAnswers}</Text>
                <Text style={s.statLbl}>Correct Answers</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={[s.statVal, { color: Colors.error }]}>{wrongAnswers}</Text>
                <Text style={s.statLbl}>Wrong / Unanswered</Text>
              </View>
            </View>

            {/* Pass Next Steps */}
            {passed ? (
              <View style={s.actionCardPass}>
                <Icon name="checkmark-done-circle" size={32} color={Colors.success} />
                <Text style={s.actionPassTitle}>Congratulations!</Text>
                <Text style={s.actionPassSub}>
                  You have successfully passed the IC-38 exam. Now proceed to upload your Aadhaar and PAN documents to send your POSP registration request to the Admin Panel.
                </Text>
                <TouchableOpacity style={s.proceedBtn} onPress={handleProceedRegistration} activeOpacity={0.85}>
                  <Text style={s.proceedBtnText}>Proceed to Document Upload ➔</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.actionCardFail}>
                <Icon name="refresh-circle" size={32} color={Colors.error} />
                <Text style={s.actionFailTitle}>Didn't Pass This Time</Text>
                <Text style={s.actionFailSub}>
                  You need a score of at least 16 out of 50 to pass. You can retake the test up to 4 times per day (with a 3-hour cooldown between attempts).
                </Text>
                <TouchableOpacity style={s.retakeBtn} onPress={() => router.replace('/posp-register' as any)} activeOpacity={0.85}>
                  <Text style={s.retakeBtnText}>Back to POSP Portal & Retake</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Question Review Tab */
          <View style={{ gap: 14 }}>
            {questionsReview?.map((q: QuestionReview, idx: number) => {
              const optionLetters = ['A', 'B', 'C', 'D'];
              return (
                <View key={q.id || idx} style={[s.qReviewCard, q.isCorrect ? s.qReviewCorrect : s.qReviewWrong]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={s.qNumText}>Q{idx + 1}. {q.chapter}</Text>
                    <Text style={[s.statusBadge, { color: q.isCorrect ? Colors.success : Colors.error }]}>
                      {q.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                    </Text>
                  </View>

                  <Text style={s.qBodyText}>{q.question}</Text>

                  <View style={s.optionsReview}>
                    {q.options.map((opt, optIdx) => {
                      const isUserChoice = q.selectedAnswer === optIdx;
                      const isCorrectChoice = q.correctAnswer === optIdx;
                      return (
                        <View
                          key={optIdx}
                          style={[
                            s.optRevItem,
                            isCorrectChoice && s.optRevCorrect,
                            isUserChoice && !isCorrectChoice && s.optRevWrong,
                          ]}
                        >
                          <Text style={s.optLetter}>{optionLetters[optIdx]}.</Text>
                          <Text style={[s.optText, isCorrectChoice && { fontWeight: '800', color: Colors.success }]}>
                            {opt} {isCorrectChoice && ' (Correct)'} {isUserChoice && !isCorrectChoice && ' (Your Choice)'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={s.expBox}>
                    <Text style={s.expTitle}>Explanation:</Text>
                    <Text style={s.expText}>{q.explanation}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerBanner: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  bannerPass: { backgroundColor: '#059669' },
  bannerFail: { backgroundColor: '#DC2626' },
  resultTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 8 },
  resultScoreText: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 4 },
  resultSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  termTag: { marginTop: 10, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  termTagText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  scroll: { padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  detailRow: { fontSize: 13, color: Colors.text, marginBottom: 4 },
  bold: { fontWeight: '800' },

  grid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },

  actionCardPass: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center' },
  actionPassTitle: { fontSize: 18, fontWeight: '900', color: Colors.success, marginTop: 6 },
  actionPassSub: { fontSize: 13, color: Colors.text, textAlign: 'center', lineHeight: 19, marginVertical: 10 },
  proceedBtn: { backgroundColor: Colors.success, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', alignItems: 'center' },
  proceedBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  actionCardFail: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  actionFailTitle: { fontSize: 18, fontWeight: '900', color: Colors.error, marginTop: 6 },
  actionFailSub: { fontSize: 13, color: Colors.text, textAlign: 'center', lineHeight: 19, marginVertical: 10 },
  retakeBtn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', alignItems: 'center' },
  retakeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  qReviewCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  qReviewCorrect: { borderLeftWidth: 4, borderLeftColor: Colors.success },
  qReviewWrong: { borderLeftWidth: 4, borderLeftColor: Colors.error },
  qNumText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  statusBadge: { fontSize: 11, fontWeight: '800' },
  qBodyText: { fontSize: 14, fontWeight: '800', color: Colors.text, marginVertical: 8 },

  optionsReview: { gap: 6 },
  optRevItem: { flexDirection: 'row', gap: 6, padding: 8, borderRadius: 8, backgroundColor: Colors.bg },
  optRevCorrect: { backgroundColor: '#DCFCE7' },
  optRevWrong: { backgroundColor: '#FEE2E2' },
  optLetter: { fontSize: 12, fontWeight: '800' },
  optText: { fontSize: 12, color: Colors.text, flex: 1 },

  expBox: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: Colors.primary + '10' },
  expTitle: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  expText: { fontSize: 12, color: Colors.text, marginTop: 2 },
});
