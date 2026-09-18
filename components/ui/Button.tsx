'use client';

import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {loading ? (
        <ActivityIndicator size={size === 'sm' ? 'small' : 'large'} color={variant === 'primary' || variant === 'secondary' || variant === 'danger' ? '#fff' : '#007AFF'} />
      ) : (
        <>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>{title}</Text>
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#34C759',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#fff' },
  outlineText: { color: '#007AFF' },
  ghostText: { color: '#007AFF' },
  dangerText: { color: '#fff' },
  smText: { fontSize: 14 },
  mdText: { fontSize: 16 },
  lgText: { fontSize: 18 },
  iconContainer: {
    flex: 0,
  },
});