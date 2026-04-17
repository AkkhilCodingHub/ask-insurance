import React, {
  createContext, useContext, useState, useCallback, useRef,
} from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Icon } from '@/components/Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── Types ──────────────────────────────────────────────────────────────────────

type DialogType = 'info' | 'error' | 'success' | 'warning';

interface AlertConfig {
  type?: DialogType;
  title: string;
  message?: string;
  /** Override the dismiss button label (default: "OK") */
  okText?: string;
}

interface ConfirmConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Makes the confirm button red */
  destructive?: boolean;
}

// Internal shape stored in state
type DialogState =
  | { kind: 'alert';   config: AlertConfig;   resolve: () => void }
  | { kind: 'confirm'; config: ConfirmConfig; resolve: (v: boolean) => void }
  | null;

// ── Context ────────────────────────────────────────────────────────────────────

interface DialogContextValue {
  /** Show a simple dismissable dialog. Returns a Promise that resolves when dismissed. */
  alert: (config: AlertConfig) => Promise<void>;
  /** Show a confirm dialog. Returns true if confirmed, false if cancelled. */
  confirm: (config: ConfirmConfig) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  // Keep the resolve callback outside of state to avoid stale closures
  const resolveRef = useRef<((v: boolean | void) => void) | null>(null);

  const alert = useCallback((config: AlertConfig): Promise<void> => {
    return new Promise<void>(resolve => {
      resolveRef.current = resolve as (v: boolean | void) => void;
      setDialog({ kind: 'alert', config, resolve });
    });
  }, []);

  const confirm = useCallback((config: ConfirmConfig): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve as (v: boolean | void) => void;
      setDialog({ kind: 'confirm', config, resolve });
    });
  }, []);

  const dismiss = useCallback((value: boolean | void = undefined) => {
    if (dialog) {
      if (dialog.kind === 'alert') dialog.resolve();
      else if (dialog.kind === 'confirm') dialog.resolve(value as boolean ?? false);
    }
    setDialog(null);
    resolveRef.current = null;
  }, [dialog]);

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      <DialogModal dialog={dialog} onDismiss={dismiss} />
    </DialogContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}

// ── Icon config ────────────────────────────────────────────────────────────────

const TYPE_META: Record<DialogType, { icon: IoniconsName; bg: string; color: string }> = {
  info:    { icon: 'information-circle', bg: Colors.primaryLight, color: Colors.primary },
  error:   { icon: 'close-circle',       bg: '#FEE2E2',           color: Colors.error   },
  success: { icon: 'checkmark-circle',   bg: Colors.successLight, color: Colors.success },
  warning: { icon: 'warning',            bg: '#FEF3C7',           color: '#D97706'      },
};

// ── Modal renderer ─────────────────────────────────────────────────────────────

function DialogModal({
  dialog,
  onDismiss,
}: {
  dialog: DialogState;
  onDismiss: (v?: boolean) => void;
}) {
  if (!dialog) return null;

  if (dialog.kind === 'alert') {
    const { title, message, type = 'info', okText = 'OK' } = dialog.config;
    const meta = TYPE_META[type];
    return (
      <Modal transparent animationType="fade" visible statusBarTranslucent>
        <View style={d.overlay}>
          <View style={d.card}>
            <View style={[d.iconCircle, { backgroundColor: meta.bg }]}>
              <Icon name={meta.icon} size={32} color={meta.color} />
            </View>
            <Text style={d.title}>{title}</Text>
            {!!message && <Text style={d.message}>{message}</Text>}
            <TouchableOpacity
              style={[d.btn, d.btnPrimary]}
              onPress={() => onDismiss()}
              activeOpacity={0.85}
            >
              <Text style={d.btnPrimaryText}>{okText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // confirm
  const {
    title, message,
    confirmText = 'Confirm', cancelText = 'Cancel',
    destructive = false,
  } = dialog.config;
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={d.overlay}>
        <View style={d.card}>
          <View style={[d.iconCircle, { backgroundColor: destructive ? '#FEE2E2' : Colors.primaryLight }]}>
            <Icon
              name={destructive ? 'trash-outline' : 'help-circle-outline'}
              size={32}
              color={destructive ? Colors.error : Colors.primary}
            />
          </View>
          <Text style={d.title}>{title}</Text>
          {!!message && <Text style={d.message}>{message}</Text>}
          <View style={d.btnRow}>
            <TouchableOpacity
              style={[d.btn, d.btnOutline, { flex: 1 }]}
              onPress={() => onDismiss(false)}
              activeOpacity={0.8}
            >
              <Text style={d.btnOutlineText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[d.btn, destructive ? d.btnDestructive : d.btnPrimary, { flex: 1 }]}
              onPress={() => onDismiss(true)}
              activeOpacity={0.85}
            >
              <Text style={d.btnPrimaryText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const d = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18, fontWeight: '800', color: Colors.text,
    textAlign: 'center', letterSpacing: -0.3,
  },
  message: {
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 21,
  },
  btnRow: {
    flexDirection: 'row', gap: 10,
    marginTop: 6, width: '100%',
  },
  btn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    marginTop: 6,
  },
  btnPrimary:     { backgroundColor: Colors.primary,          width: '100%' },
  btnDestructive: { backgroundColor: Colors.error,            width: '100%' },
  btnOutline:     { borderWidth: 1.5, borderColor: Colors.border },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  btnOutlineText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
});
