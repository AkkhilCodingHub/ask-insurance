import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Linking, AppState, AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { systemApi } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, moderateScale, fontScale, scale, verticalScale } from '@/constants/theme';

interface MaintenanceState {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: string;
}

interface MaintenanceContextValue {
  isMaintenance: boolean;
  maintenanceState: MaintenanceState | null;
  checkStatus: () => Promise<boolean>;
}

const MaintenanceContext = createContext<MaintenanceContextValue>({
  isMaintenance: false,
  maintenanceState: null,
  checkStatus: async () => false,
});

export const useMaintenance = () => useContext(MaintenanceContext);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      setChecking(true);
      const res = await systemApi.getStatus();
      if (res?.maintenance) {
        setMaintenanceState(res.maintenance);
        return res.maintenance.maintenanceMode;
      }
      return false;
    } catch {
      // In case network is offline, don't arbitrarily block unless previously in maintenance
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Re-check when app comes to foreground
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkStatus();
      }
    });

    return () => sub.remove();
  }, [checkStatus]);

  const isMaintenance = Boolean(maintenanceState?.maintenanceMode);

  if (isMaintenance) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.container}>
          {/* Decorative background circles */}
          <View style={s.circle1} />
          <View style={s.circle2} />

          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Icon name="construct" size={moderateScale(42)} color={Colors.primary} />
            </View>
          </View>

          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusBadgeText}>SYSTEM UPGRADE IN PROGRESS</Text>
          </View>

          <Text style={s.title}>Under Scheduled Maintenance</Text>
          <Text style={s.message}>
            {maintenanceState?.maintenanceMessage ||
              'We are currently upgrading our core quote and claim settlement engine to serve you better. We will be back online shortly!'}
          </Text>

          <View style={s.actionCard}>
            <TouchableOpacity
              style={s.refreshBtn}
              onPress={() => checkStatus()}
              disabled={checking}
              activeOpacity={0.85}
            >
              {checking ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Icon name="refresh" size={moderateScale(18)} color={Colors.white} />
                  <Text style={s.refreshBtnText}>Check Status & Retry</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.sosBtn}
              onPress={() => Linking.openURL('tel:18002099999').catch(() => {})}
              activeOpacity={0.85}
            >
              <Icon name="call" size={moderateScale(16)} color="#DC2626" />
              <Text style={s.sosBtnText}>Emergency Claim SOS: 1800-209-9999</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footerNote}>
            ASK Insurance Brokers Pvt. Ltd. · IRDAI Direct Broker
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenance, maintenanceState, checkStatus }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(28),
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -verticalScale(60),
    right: -scale(60),
    width: scale(240),
    height: scale(240),
    borderRadius: scale(120),
    backgroundColor: 'rgba(21, 128, 255, 0.15)',
  },
  circle2: {
    position: 'absolute',
    bottom: -verticalScale(80),
    left: -scale(60),
    width: scale(260),
    height: scale(260),
    borderRadius: scale(130),
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  iconWrap: {
    marginBottom: moderateScale(20),
  },
  iconCircle: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(26),
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(21, 128, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1580FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: moderateScale(100),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    marginBottom: moderateScale(14),
  },
  statusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: '#FBBF24',
  },
  statusBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: moderateScale(10),
  },
  message: {
    fontSize: fontScale(14),
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: fontScale(22),
    marginBottom: moderateScale(28),
  },
  actionCard: {
    width: '100%',
    gap: moderateScale(12),
    marginBottom: moderateScale(24),
  },
  refreshBtn: {
    height: moderateScale(52),
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  refreshBtnText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: Colors.white,
  },
  sosBtn: {
    height: moderateScale(48),
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  sosBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FCA5A5',
  },
  footerNote: {
    fontSize: fontScale(11),
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

