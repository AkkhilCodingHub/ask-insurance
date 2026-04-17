import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { Colors } from '@/constants/theme';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export function BackButton({ onPress, color = Colors.text, style }: BackButtonProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress ?? (() => router.back())}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon name="arrow-back-outline" size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
