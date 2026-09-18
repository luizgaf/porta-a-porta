'use client';

import { View, StyleSheet, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  border?: boolean;
  borderRadius?: number;
}

export function Card({
  children,
  style,
  onPress,
  padding = 'md',
  shadow = true,
  border = true,
  borderRadius = 16,
}: CardProps) {
  const Component = onPress ? Pressable : View;

  const paddingKey = `padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles;

  return (
    <Component
      onPress={onPress}
      style={[
        styles.base,
        styles[paddingKey],
        shadow && styles.shadow,
        border && styles.border,
        { borderRadius },
        style,
      ]}
      android_ripple={onPress ? { color: 'rgba(0,0,0,0.05)' } : undefined}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#fff',
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: 12,
  },
  paddingMd: {
    padding: 16,
  },
  paddingLg: {
    padding: 24,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  border: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});