import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Text fields matching the main login screen (`src/app/login.tsx`):
 * primary 2px border, 16px radius, light fill, left prefix strip.
 */
export const authFieldStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  /** Use when the row has a multiline field */
  inputRowTopAlign: { alignItems: 'flex-start' },
  inputRowError: { borderColor: Colors.error },
  fieldGap: { marginBottom: 20 },

  /** Left column (+91, flag, or icon) — same as login `prefix` */
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minWidth: 48,
    borderRightWidth: 2,
    borderRightColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  /** Text field body — same as login `phoneInput` */
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 16,
    letterSpacing: 0.3,
  },
  /** Main login phone field */
  inputPhone: { letterSpacing: 1.5 },
  /** Chat / long-form: slightly smaller but same shell */
  inputComposer: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  inputMultiline: {
    minHeight: 48,
    textAlignVertical: 'top' as 'top',
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    maxHeight: 160,
  },
});
