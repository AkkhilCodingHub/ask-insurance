import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, AppState, AppStateStatus, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { pospExamApi } from '@/lib/api';
import { examStore, ExamQuestion } from '@/lib/examStore';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

export default function PospExamScreen() {
  const router = useRouter();
  const session = examStore.getSession();

  const attemptId = session?.attemptId || '';
  const questions: ExamQuestion[] = session?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(session?.durationMinutes ? session.durationMinutes * 60 : 40 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(false);

  const appState = useRef(AppState.currentState);

  // ── 1. Anti-Cheating Focus Lock: Detect App Exit / Backgrounding ───────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // Candidate minimized or left the app during active test => Auto Fail
        triggerAutoFail('Exam terminated: Candidate exited or minimized the application during active exam session.');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ── 2. 40-Minute Countdown Timer ───────────────────────────────────────────
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const triggerAutoFail = async (reason: string) => {
    if (submitting || terminated) return;
    setTerminated(true);
    setSubmitting(true);

    try {
      const res = await pospExamApi.submitExam({
        attemptId,
        userAnswers,
        terminatedEarly: true,
        terminationReason: reason,
      });

      examStore.setResults(res);
      router.replace('/posp-results' as any);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionIndex,
    }));
  };

  const handleFinalSubmit = async (manual = true) => {
    if (submitting) return;

    if (manual) {
      const answeredCount = Object.keys(userAnswers).length;
      const unAnswered = questions.length - answeredCount;
      let confirmMsg = `You have answered ${answeredCount} out of ${questions.length} questions.`;
      if (unAnswered > 0) confirmMsg += ` (${unAnswered} unanswered).`;

      Alert.alert(
        'Submit IC-38 Examination?',
        confirmMsg,
        [
          { text: 'Continue Exam', style: 'cancel' },
          { text: 'Submit Test', onPress: () => processSubmission() },
        ]
      );
    } else {
      processSubmission();
    }
  };

  const processSubmission = async () => {
    setSubmitting(true);
    try {
      const res = await pospExamApi.submitExam({
        attemptId,
        userAnswers,
        terminatedEarly: false,
      });

      examStore.setResults(res);
      router.replace('/posp-results' as any);
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!currentQ) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Top Lock Bar */}
      <View style={s.topBar}>
        <View style={s.lockIndicator}>
          <Icon name="lock-closed" size={14} color="#DC2626" />
          <Text style={s.lockText}>Focus Lock Active (Do NOT exit app)</Text>
        </View>

        <View style={s.timerBadge}>
          <Icon name="timer-outline" size={16} color={secondsRemaining < 300 ? '#DC2626' : Colors.primary} />
          <Text style={[s.timerText, secondsRemaining < 300 && { color: '#DC2626' }]}>
            {formatTimer(secondsRemaining)}
          </Text>
        </View>
      </View>

      {/* Progress & Chapter Header */}
      <View style={s.progressCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={s.qIndexText}>Question {currentIndex + 1} of {questions.length}</Text>
          <Text style={s.answeredText}>{answeredCount} Answered</Text>
        </View>

        {/* Progress Bar */}
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
        </View>

        <Text style={s.chapterText}>{currentQ.chapter}</Text>
      </View>

      {/* Question Card */}
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.qCard}>
          <Text style={s.qText}>{currentQ.question}</Text>

          <View style={s.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const selected = userAnswers[String(currentQ.id)] === idx;
              const optionLetters = ['A', 'B', 'C', 'D'];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.optionItem, selected && s.optionSelected]}
                  onPress={() => handleSelectOption(currentQ.id, idx)}
                  activeOpacity={0.8}
                >
                  <View style={[s.radioCircle, selected && s.radioSelected]}>
                    <Text style={[s.radioLetter, selected && { color: '#fff' }]}>{optionLetters[idx]}</Text>
                  </View>
                  <Text style={[s.optionLabel, selected && s.optionLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav Controls */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.navBtn, currentIndex === 0 && { opacity: 0.4 }]}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Icon name="chevron-back" size={18} color={Colors.text} />
          <Text style={s.navBtnText}>Previous</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[s.finishBtn, submitting && { opacity: 0.7 }]}
            onPress={() => handleFinalSubmit(true)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.finishBtnText}>Submit Exam</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.nextBtn}
            onPress={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
          >
            <Text style={s.nextBtnText}>Next</Text>
            <Icon name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lockIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  lockText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  timerText: { fontSize: 13, fontWeight: '900', color: Colors.primary, fontFamily: 'monospace' },

  progressCard: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  qIndexText: { fontSize: 12, fontWeight: '800', color: Colors.text },
  answeredText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  barTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  barFill: { height: '100%', backgroundColor: Colors.primary },
  chapterText: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: 2 },

  scroll: { padding: 16 },
  qCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  qText: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 24, marginBottom: 18 },

  optionsList: { gap: 10 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  radioCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioLetter: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  optionLabel: { fontSize: 14, color: Colors.text, flex: 1, fontWeight: '600' },
  optionLabelSelected: { color: Colors.primary, fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  navBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  nextBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  finishBtn: { backgroundColor: Colors.success, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  finishBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
