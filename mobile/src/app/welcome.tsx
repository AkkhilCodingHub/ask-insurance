import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';

const SEEN_KEY = 'seen_welcome_v1';
const FULL_TEXT = 'ASK INSURANCE BROKERS';

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
  const [typedText, setTypedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // 1. Typewriter Effect
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, 65);

    // Blinking cursor
    const cursorInterval = setInterval(() => {
      cursorOpacity.setValue(cursorOpacity._value === 1 ? 0 : 1);
    }, 400);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  // 2. Logo Reveal when typing completes or during animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(idx);
  };

  const finish = () => {
    SecureStore.setItemAsync(SEEN_KEY, '1');
    router.replace('/login');
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * W, animated: true });
    } else {
      finish();
    }
  };

  const skip = () => finish();
  const slide = SLIDES[activeIndex];

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Header with Animated Typewriter Branding */}
      <View style={s.headerBranding}>
        <Animated.View style={[s.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Image
            source={require('../../assets/images/logo-glow.png')}
            style={s.appLogo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <View style={s.typewriterRow}>
          <Text style={s.typewriterText}>{typedText}</Text>
          <Animated.Text style={[s.cursorText, { opacity: cursorOpacity }]}>|</Animated.Text>
        </View>

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
              <Icon name={sl.icon} size={60} color={sl.accent} />
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
              Already have an account? <Text style={{ color: slide.accent, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  
  headerBranding: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    position: 'relative',
  },
  logoContainer: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  appLogo: {
    width: '100%',
    height: '100%',
  },
  typewriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    height: 24,
  },
  typewriterText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  cursorText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    marginLeft: 2,
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    top: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  slider: { flex: 1 },
  slide: {
    alignItems: 'center',
    justify: 'center',
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  iconBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justify: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1.5,
  },
  ring1: { width: 200, height: 200 },
  ring2: { width: 225, height: 225 },

  slideTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  slideSub: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    justify: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 28, gap: 12 },
  nextBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white, letterSpacing: 0.2 },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: Colors.textMuted },
});
