/**
 * Flat single-color icon using Ionicons from @expo/vector-icons.
 * Works identically on iOS, Android, and web.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IoniconsName;
  size?: number;
  color: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
