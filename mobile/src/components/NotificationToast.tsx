/**
 * NotificationToast
 *
 * Handles foreground push notifications and renders a beautiful in-app banner.
 * Wrap the app with <NotificationProvider> — it self-manages everything.
 */
import React, {
  createContext, useContext, useCallback, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import {
  Animated, Dimensions, PanResponder, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { supportChatFocusedRef } from '@/lib/supportChatFocused';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

const { width: W } = Dimensions.get('window');

const AUTO_DISMISS_MS = 4500;

// ── Toast payload ─────────────────────────────────────────────────────────────

export interface ToastPayload {
  title: string;
  body?: string;
  /** 'payment' | 'policy' | 'quote' | 'info' | 'warning' | 'error' */
  category?: string;
}

// ── Derive icon + accent colour from category ─────────────────────────────────

function resolveStyle(category?: string): { icon: IconName; accent: string } {
  switch (category) {
    case 'payment':
      return { icon: 'checkmark-circle',        accent: '#059669' };
    case 'policy':
      return { icon: 'shield-checkmark',         accent: '#1580FF' };
    case 'quote':
      return { icon: 'document-text',            accent: '#7C3AED' };
    case 'chat':
      return { icon: 'chatbubbles',              accent: '#1580FF' };
    case 'warning':
      return { icon: 'warning',                  accent: '#D97706' };
    case 'error':
      return { icon: 'close-circle',             accent: '#DC2626' };
    default:
      return { icon: 'notifications',            accent: '#1580FF' };
  }
}

function guessCategory(title: string, body?: string): string {
  const t = (title + ' ' + (body ?? '')).toLowerCase();
  if (t.includes('payment') || t.includes('premium') || t.includes('paid')) return 'payment';
  if (t.includes('policy') || t.includes('active'))                         return 'policy';
  if (t.includes('quote'))                                                   return 'quote';
  if (t.includes('support') || t.includes('message from'))                   return 'chat';
  if (t.includes('expired') || t.includes('failed') || t.includes('error')) return 'error';
  if (t.includes('warning') || t.includes('pending'))                        return 'warning';
  return 'info';
}

// ── Context ───────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  showToast: (payload: ToastPayload) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  showToast: () => {},
});

export function useNotificationToast() {
  return useContext(NotificationContext);
}

// ── Toast component ───────────────────────────────────────────────────────────

interface ToastState {
  payload: ToastPayload;
  id: number;
}

function Toast({
  payload, onDismiss,
}: {
  payload: ToastPayload;
  onDismiss: () => void;
}) {
  const insets    = useSafeAreaInsets();
  const slideY    = useRef(new Animated.Value(-160)).current;
  const opacity   = useRef(new Animated.Value(0)).current;
  const progress  = useRef(new Animated.Value(1)).current;
  const dismissing = useRef(false);

  const category = payload.category ?? guessCategory(payload.title, payload.body);
  const { icon, accent } = resolveStyle(category);

  const dismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;
    Animated.parallel([
      Animated.timing(slideY,  { toValue: -160, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 280, useNativeDriver: true }),
    ]).start(onDismiss);
  }, [onDismiss]);

  // Swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && g.dy < 0,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) slideY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) {
          dismiss();
        } else {
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 260, mass: 0.8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Progress bar drains over AUTO_DISMISS_MS
    Animated.timing(progress, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    }).start();

    // Auto-dismiss
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const topOffset = insets.top + (Platform.OS === 'android' ? 8 : 6);

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset, transform: [{ translateY: slideY }], opacity },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Main card */}
      <View style={styles.card}>
        {/* Left accent strip */}
        <View style={[styles.strip, { backgroundColor: accent }]} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
          <Icon name={icon} size={20} color={accent} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{payload.title}</Text>
          {payload.body ? (
            <Text style={styles.body} numberOfLines={2}>{payload.body}</Text>
          ) : null}
        </View>

        {/* Dismiss button */}
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="close" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: accent }]} />
      </View>
    </Animated.View>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counterRef = useRef(0);

  const showToast = useCallback((payload: ToastPayload) => {
    counterRef.current += 1;
    setToast({ payload, id: counterRef.current });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  // ── Register foreground notification handler + listener ─────────────────────
  useEffect(() => {
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');

        // Expo Go (SDK 53+) removed Android remote push APIs; don't crash the app.
        if (typeof (Notifications as any).setNotificationHandler !== 'function') {
          console.warn('[NotificationToast] expo-notifications handler not available (likely Expo Go). Use a dev/preview build for remote push.');
          return;
        }

        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            const data = notification.request.content.data as Record<string, unknown> | undefined;
            const isChat = data?.type === 'chat';
            const onSupportTab = isChat && supportChatFocusedRef.current;
            return {
              shouldShowAlert: false,
              shouldPlaySound: !onSupportTab,
              shouldSetBadge: false,
            };
          },
        });

        receivedSub = Notifications.addNotificationReceivedListener(notification => {
          const { title, body } = notification.request.content;
          if (!title) return;
          const data = notification.request.content.data as Record<string, unknown> | undefined;
          if (data?.type === 'chat' && supportChatFocusedRef.current) {
            return;
          }
          const category = (data?.category as string | undefined) ??
            guessCategory(title, body ?? undefined);
          showToast({ title, body: body ?? undefined, category });
        });

        if (typeof (Notifications as any).addNotificationResponseReceivedListener !== 'function') {
          return;
        }

        responseSub = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data as Record<string, unknown> | undefined;
          if (data?.type === 'chat') {
            router.push('/(tabs)/chat');
          }
        });

        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) {
          const data = last.notification.request.content.data as Record<string, unknown> | undefined;
          if (data?.type === 'chat') {
            const tappedAt = new Date(last.notification.date).getTime();
            if (Date.now() - tappedAt < 10 * 60 * 1000) {
              router.push('/(tabs)/chat');
            }
          }
        }
      } catch (e) {
        console.warn('[NotificationToast] setup error:', e);
      }
    })();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          payload={toast.payload}
          onDismiss={dismiss}
        />
      )}
    </NotificationContext.Provider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1E35',   // deep navy — premium feel
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 13,
    paddingRight: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 14,
    // Subtle inner border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  strip: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    flexShrink: 0,
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  textWrap: {
    flex: 1,
    gap: 3,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  body: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 17,
  },

  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    marginTop: 2,
  },

  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
