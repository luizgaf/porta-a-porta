import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/design';

interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      style,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[
            styles.label,
            { fontFamily: typography.labelMedium.fontFamily, fontWeight: typography.labelMedium.fontWeight, fontSize: typography.labelMedium.fontSize },
            hasError && styles.labelError
          ]}>
            {label}
          </Text>
        )}
        <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { fontFamily: typography.bodyMedium.fontFamily, fontSize: typography.bodyMedium.fontSize, color: colors.textPrimary },
              inputStyle,
              style,
            ]}
            {...props}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {hasError && <Text style={styles.errorText}>{error}</Text>}
        {!hasError && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
  },
  labelError: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  inputWrapperError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.error,
  },
  helperText: {
    fontSize: typography.bodySmall.fontSize,
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.textMuted,
  },
});

export default Input;