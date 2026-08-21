import { Platform } from 'react-native';

let notificationsInitialized = false;

/**
 * Initialize Expo system notifications & Android notification channels
 */
export async function initSystemNotifications() {
  if (notificationsInitialized) return;
  try {
    const Notifications = await import('expo-notifications');

    // Configure foreground notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });

      await Notifications.setNotificationChannelAsync('policy_expiry', {
        name: 'Policy Expiry & Renewals',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#DC2626',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('policy_updates', {
        name: 'Policy Releases & Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#059669',
      });
    }

    // Request permissions if not granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    notificationsInitialized = true;
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notifications] Failed to initialize system notifications:', err);
    return false;
  }
}

/**
 * Dispatch an immediate Android/iOS system notification directly to the phone's notification tray
 */
export async function sendSystemNotification({
  title,
  body,
  data = {},
  channelId = 'default',
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
}) {
  try {
    await initSystemNotifications();
    const Notifications = await import('expo-notifications');

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: null, // trigger immediately
    });
  } catch (err) {
    console.warn('[notifications] Failed to send system notification:', err);
  }
}

let alertsSentThisSession = false;

/**
 * Dispatch policy & renewal notifications into the phone's notification shade
 */
export async function dispatchSystemPolicyAlerts() {
  if (alertsSentThisSession) return;
  alertsSentThisSession = true;

  try {
    await initSystemNotifications();

    // 1. Policy Expiry Alert
    await sendSystemNotification({
      title: '⚠️ POLICY EXPIRING SOON - Maruti Swift (DL01AB1234)',
      body: 'Motor insurance expires in 5 days (Aug 20). Renew today to preserve your 50% NCB discount!',
      data: { route: '/quote?category=motor' },
      channelId: 'policy_expiry',
    });

    // 2. Renewal Pending Alert
    await sendSystemNotification({
      title: '⏳ RENEWAL PENDING - HDFC ERGO Optima Secure',
      body: 'Policy #POL-88219 renewal invoice ready. Tap to review and complete instant premium payment.',
      data: { route: '/my-policies' },
      channelId: 'policy_expiry',
    });

    // 3. New Policy Release Alert
    await sendSystemNotification({
      title: '🆕 NEW POLICY RELEASED - Star Health 2026 Family Floater',
      body: 'Zero waiting period for pre-existing diseases with ₹1 Cr restore cover.',
      data: { route: '/plans' },
      channelId: 'policy_updates',
    });
  } catch (err) {
    console.warn('[notifications] Error dispatching system policy alerts:', err);
  }
}
