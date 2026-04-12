import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'search-outline',
    title: 'Compare & Save',
    sub: 'Browse 38+ IRDAI-regulated insurers side-by-side and find the best plan for your needs.',
    bg: Colors.primaryLight,
    accent: Colors.primary,
  },
  {
    icon: 'flash-outline',
    title: 'Quick Claims',
    sub: 'File a claim in under 3 minutes. Track status in real-time with live updates.',
    bg: '#ECFDF5',
    accent: Colors.success,
  },
  {
    icon: 'shield-outline',
    title: 'Expert Advice',
    sub: 'Our licensed ASK advisors are available 24/7 to help you choose the right cover.',
    bg: '#F5F3FF',
    accent: '#7C3AED',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * W, animated: true });
    } else {
      router.push('/login');
    }
  };

  const skip = () => router.push('/login');

  const slide = SLIDES[activeIndex];

  return (
    <SafeAreaView style={s.safe}>
      {/* Skip */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={skip} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={s.slider}
      >
        {SLIDES.map((sl, i) => (
          <View key={i} style={[s.slide, { width: W }]}>
            <View style={[s.iconBox, { backgroundColor: sl.bg }]}>
              <Icon name={sl.icon} size={64} color={sl.accent} />
              {/* Decorative rings */}
              <View style={[s.ring, s.ring1, { borderColor: sl.accent + '20' }]} />
              <View style={[s.ring, s.ring2, { borderColor: sl.accent + '10' }]} />
            </View>
            <Text style={[s.slideTitle, { color: sl.accent }]}>{sl.title}</Text>
            <Text style={s.slideSub}>{sl.sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === activeIndex && { width: 22, backgroundColor: slide.accent },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.footer}>
        <TouchableOpacity
          onPress={goNext}
          style={[s.nextBtn, { backgroundColor: slide.accent }]}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>

        {activeIndex === SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.push('/login')} style={s.registerLink}>
            <Text style={s.registerLinkText}>
              New here? <Text style={{ color: slide.accent, fontWeight: '700' }}>Get started free</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },
  topBar: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'flex-end' },
  skipBtn:{ paddingHorizontal: 14, paddingVertical: 7 },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  slider: { flex: 1 },
  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingBottom: 20,
  },
  iconBox: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40, position: 'relative',
  },
  slideIcon: { fontSize: 72 },
  ring: {
    position: 'absolute', borderRadius: 200, borderWidth: 1.5,
  },
  ring1: { width: 220, height: 220 },
  ring2: { width: 250, height: 250 },

  slideTitle: {
    fontSize: 28, fontWeight: '900', letterSpacing: -0.5,
    marginBottom: 14, textAlign: 'center',
  },
  slideSub: {
    fontSize: 15, color: Colors.textMuted, lineHeight: 24,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 7, paddingVertical: 20,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 14 },
  nextBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white, letterSpacing: 0.2 },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: Colors.textMuted },
});
