import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/design';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const CategoryChip = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, CategoryChipProps>(
  ({ label, selected = false, onPress, disabled = false }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.8}
        style={[
          styles.container,
          selected && styles.selected,
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.text,
            { fontFamily: typography.labelMedium.fontFamily, fontWeight: typography.labelMedium.fontWeight, fontSize: typography.labelMedium.fontSize },
            selected ? styles.textSelected : styles.textDefault,
            disabled && styles.textDisabled,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);

CategoryChip.displayName = 'CategoryChip';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.warmTerracotta,
    borderColor: colors.warmTerracotta,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
  textDefault: {
    color: colors.textSecondary,
    borderColor: colors.border,
  },
  textSelected: {
    color: colors.textOnAccent,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});

export default CategoryChip;