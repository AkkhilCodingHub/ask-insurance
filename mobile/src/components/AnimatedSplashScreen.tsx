import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, Dimensions, Easing,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const FULL_TEXT = 'ASK INSURANCE BROKERS';

interface AnimatedSplashScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
  children: React.ReactNode;
}

export function AnimatedSplashScreen({ isReady = true, onFinish, children }: AnimatedSplashScreenProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Animation drivers
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.8)).current;
  const ringScale2 = useRef(new Animated.Value(0.6)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale1, { toValue: 1.25, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringScale1, { toValue: 0.85, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale2, { toValue: 1.35, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringScale2, { toValue: 0.65, duration: 1800, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ),
    ]).start();

    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setAnimationDone(true);
      }
    }, 55);

    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 380);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  // Smoothly exit when both typing animation and app resources are ready
  useEffect(() => {
    if (animationDone && isReady) {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 1.15,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setAppReady(true);
          if (onFinish) onFinish();
        });
      }, 400);
    }
  }, [animationDone, isReady]);

  return (
    <View style={s.root}>
      {children}

      {!appReady && (
        <Animated.View
          style={[
            s.splashContainer,
            {
              opacity: containerOpacity,
              transform: [{ scale: containerScale }],
            },
          ]}
          pointerEvents="none"
        >
          {/* Pulsing halo rings */}
          <Animated.View
            style={[
              s.haloRing,
              s.haloRing1,
              { transform: [{ scale: ringScale1 }] },
            ]}
          />
          <Animated.View
            style={[
              s.haloRing,
              s.haloRing2,
              { transform: [{ scale: ringScale2 }] },
            ]}
          />

          {/* Logo container */}
          <Animated.View
            style={[
              s.logoBox,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/logo-glow.png')}
              style={s.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Typewriter branding text */}
          <View style={s.typewriterRow}>
            <Text style={s.typewriterText}>{typedText}</Text>
            <Text style={[s.cursor, { opacity: cursorVisible ? 1 : 0 }]}>|</Text>
          </View>
          <Text style={s.subText}>DIRECT INSURANCE BROKER · IRDAI LICENSED</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  haloRing: {
    position: 'absolute',
    borderRadius: 300,
    borderWidth: 1.5,
    borderColor: 'rgba(21, 128, 255, 0.25)',
  },
  haloRing1: {
    width: 220,
    height: 220,
  },
  haloRing2: {
    width: 280,
    height: 280,
  },
  logoBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  typewriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    marginBottom: 6,
  },
  typewriterText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cursor: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1580FF',
    marginLeft: 3,
  },
  subText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C9DB0',
    letterSpacing: 1.8,
    marginTop: 4,
  },
});
