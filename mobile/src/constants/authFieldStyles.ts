import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Colors, moderateScale, fontScale } from '@/constants/theme';

/**
 * Text fields matching the main login screen (`src/app/login.tsx`):
 * primary 2px border, 16px radius, light fill, left prefix strip.
 * primary 2px border, 16px radius, light fill, left prefix strip with responsive scaling.
 */
export const authFieldStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  /** Use when the row has a multiline field */
  inputRowTopAlign: { alignItems: 'flex-start' },
  inputRowError: { borderColor: Colors.error },
  fieldGap: { marginBottom: 20 },
  fieldGap: { marginBottom: moderateScale(20) },

  /** Left column (+91, flag, or icon) — same as login `prefix` */
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minWidth: 48,
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    minWidth: moderateScale(48),
    borderRightWidth: 2,
    borderRightColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  /** Text field body — same as login `phoneInput` */
  input: {
    flex: 1,
    fontSize: 20,
    fontSize: fontScale(18),
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 16,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    letterSpacing: 0.3,
  },
  /** Main login phone field */
  inputPhone: { letterSpacing: 1.5 },
  /** Chat / long-form: slightly smaller but same shell */
  inputComposer: {
    fontSize: 16,
    fontSize: fontScale(15),
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 22,
    lineHeight: fontScale(22),
  },
  inputMultiline: {
    minHeight: 48,
    minHeight: moderateScale(48),
    textAlignVertical: 'top' as 'top',
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    maxHeight: 160,
    paddingTop: Platform.OS === 'ios' ? moderateScale(16) : moderateScale(12),
    maxHeight: moderateScale(160),
  },
});

