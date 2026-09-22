import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/design';

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: {
    bg: colors.primary,
    text: colors.textOnPrimary,
    border: 'transparent',
    activeBg: colors.primaryLight,
  },
  secondary: {
    bg: colors.morningFog,
    text: colors.primary,
    border: 'transparent',
    activeBg: colors.borderStrong,
  },
  outline: {
    bg: 'transparent',
    text: colors.primary,
    border: colors.primary,
    activeBg: colors.morningFog,
  },
  danger: {
    bg: colors.error,
    text: colors.textOnPrimary,
    border: 'transparent',
    activeBg: '#C82333',
  },
  ghost: {
    bg: 'transparent',
    text: colors.primary,
    border: 'transparent',
    activeBg: colors.morningFog,
  },
};

const sizes = {
  sm: { px: spacing.md, py: spacing.xs, fontSize: typography.labelMedium.fontSize, borderRadius: borderRadius.md },
  md: { px: spacing.xl, py: spacing.sm, fontSize: typography.labelLarge.fontSize, borderRadius: borderRadius.lg },
  lg: { px: spacing.xxl, py: spacing.md, fontSize: typography.bodyLarge.fontSize, borderRadius: borderRadius.xl },
};

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { bg, text: textColor, border, activeBg } = variants[variant];
    const { px, py, fontSize, borderRadius: btnBorderRadius } = sizes[size];

    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        disabled={isDisabled}
        style={[
          styles.container,
          { backgroundColor: bg, borderColor: border, borderWidth: variant === 'outline' ? 2 : 0, borderRadius: btnBorderRadius },
          { paddingHorizontal: px, paddingVertical: py },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
        activeOpacity={isDisabled ? 1 : 0.9}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            {children ? (
              children
            ) : (
              <Text
                style={[
                  styles.text,
                  { color: textColor, fontSize, fontFamily: typography.labelLarge.fontFamily, fontWeight: typography.labelLarge.fontWeight },
                ]}
              >
                {title}
              </Text>
            )}
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});

export default Button;