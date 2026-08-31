import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent,
  Animated, Image, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Icon } from '@/components/Icon';

const SEEN_KEY = 'seen_welcome_v1';
const FULL_TEXT = 'ASK INSURANCE';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'search-outline',
    title: 'Compare & Save',
    sub: 'Browse 38+ IRDAI-regulated insurers side-by-side and find the best plan for your needs.',
    bg: '#EFF6FF',
    accent: '#2563EB',
  },
  {
    icon: 'flash-outline',
    title: 'Instant Quotes & Claims',
    sub: 'Fast, paperless quotes in seconds. File and track claims with live status updates.',
    bg: '#ECFDF5',
    accent: '#10B981',
  },
  {
    icon: 'shield-outline',
    title: 'Licensed POSP Advisors',
    sub: 'Certified insurance advisors available 24/7 to help you secure the ideal coverage.',
    bg: '#F5F3FF',
    accent: '#7C3AED',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [introFinished, setIntroFinished] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Animated values for Apple "hello" sequence
  // 1. Text container vertical translation (from center of screen down to top header position)
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(1.3)).current;
  
  // 2. Logo appear above text
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoTranslateY = useRef(new Animated.Value(-20)).current;

  // 3. Carousel and footer content fade-in
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Initial center offset calculation (center of screen to top header)
    textTranslateY.setValue(H * 0.28);

    // Blinking cursor
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 380);

    // Typewriter effect (Apple "hello" style writing)
    let charIdx = 0;
    const typingInterval = setInterval(() => {
      if (charIdx <= FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typingInterval);
        
        // Pause briefly after writing completes (Apple style pause)
        setTimeout(() => {
          triggerTransitionToHeader();
        }, 600);
      }
    }, 85);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(typingInterval);
    };
  }, []);

  const triggerTransitionToHeader = () => {
    // Text glides down to top position, Logo appears above, Carousel fades in
    Animated.sequence([
      // A. Text glides down smoothly while scaling from hero to header size
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1.0,
          duration: 900,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: true,
        }),
      ]),
      // B. 3D Logo pops in above the text + content rises
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIntroFinished(true);
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(idx);
  };

  const finish = () => {
    SecureStore.setItemAsync(SEEN_KEY, '1');
    router.replace('/login');
  const finish = (route: '/(tabs)' | '/login' = '/login') => {
    SecureStore.setItemAsync(SEEN_KEY, '1').catch(() => {});
    if (route === '/(tabs)') {
      router.replace('/(tabs)');
    } else {
      router.push(route);
    }
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * W, animated: true });
    } else {
      finish();
      finish('/login');
    }
  };

  const skip = () => finish();
  const skip = () => finish('/(tabs)');
  const slide = SLIDES[activeIndex];

  return (
    <SafeAreaView style={s.safe}>
      {/* Background ambient glow aura */}
      <View style={s.ambientBg}>
        <View style={s.glowCircleTop} />
      </View>

      {/* Top / Animated Header Branding */}
      <View style={s.headerBranding}>
        {/* Skip button appears top right */}
        <Animated.View style={[s.skipContainer, { opacity: contentOpacity }]}>
          <TouchableOpacity onPress={skip} style={s.skipBtn} activeOpacity={0.7}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 3D ASK Logo that appears above text */}
        <Animated.View
          style={[
            s.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
        >
          <View style={s.logoShadowWrapper}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={s.appLogo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Animated "ASK INSURANCE" Text (Apple hello style transition) */}
        <Animated.View
          style={[
            s.typewriterWrapper,
            {
              transform: [
                { translateY: textTranslateY },
                { scale: textScale },
              ],
            },
          ]}
        >
          <View style={s.typewriterRow}>
            <Text style={s.typewriterText}>
              {typedText}
            </Text>
            {!introFinished && (
              <Text style={[s.cursorText, { opacity: cursorVisible ? 1 : 0 }]}>
                |
              </Text>
            )}
          </View>
          <Animated.Text
            style={[
              s.brokerSubtitle,
              { opacity: logoOpacity },
            ]}
          >
            IRDAI LICENSED DIRECT BROKER
          </Animated.Text>
          <Animated.Text
            style={[
              s.creditText,
              { opacity: logoOpacity },
            ]}
          >
            made by NEOTA PRIVATE LIMITED
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Carousel & Footer Content (Fades in after intro) */}
      <Animated.View
        style={[
          s.mainContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
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
                <Icon name={sl.icon} size={54} color={sl.accent} />
                {/* Decorative rings */}
                <View style={[s.ring, s.ring1, { borderColor: sl.accent + '25' }]} />
                <View style={[s.ring, s.ring2, { borderColor: sl.accent + '12' }]} />
              </View>
              <Text style={[s.slideTitle, { color: '#0F172A' }]}>{sl.title}</Text>
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
                i === activeIndex && { width: 24, backgroundColor: slide.accent },
              ]}
            />
          ))}
        </View>

        {/* Footer Navigation Buttons */}
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
            <TouchableOpacity onPress={() => finish('/login')} style={s.registerLink}>
              <Text style={s.registerLinkText}>
                Already have an account? <Text style={{ color: slide.accent, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  ambientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowCircleTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  headerBranding: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    minHeight: 180,
    justifyContent: 'center',
    zIndex: 10,
  },
  skipContainer: {
    position: 'absolute',
    right: 20,
    top: 16,
    zIndex: 20,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  skipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShadowWrapper: {
    width: '100%',
    height: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  appLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  typewriterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  typewriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typewriterText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  cursorText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2563EB',
    marginLeft: 3,
  },
  brokerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.8,
    marginTop: 4,
    textAlign: 'center',
  },
  creditText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 3,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  slider: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 10,
  },
  iconBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1.5,
  },
  ring1: { width: 170, height: 170 },
  ring2: { width: 195, height: 195 },

  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  slideSub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 12,
  },
  nextBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#64748B',
  },
});

