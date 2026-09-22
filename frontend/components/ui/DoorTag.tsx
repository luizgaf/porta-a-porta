import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, doorTag } from '../../constants/design';

interface DoorTagProps {
  unit: string; // e.g., "Apto 101", "Bloco B - 203"
  variant?: 'default' | 'seller' | 'buyer';
  size?: 'sm' | 'md';
}

const variants = {
  default: {
    bg: colors.warmTerracotta,
    text: colors.textOnAccent,
  },
  seller: {
    bg: colors.portaNavy,
    text: colors.textOnPrimary,
  },
  buyer: {
    bg: colors.success,
    text: colors.textOnPrimary,
  },
};

const sizes = {
  sm: {
    height: 14,
    borderRadius: 3,
    fontSize: 9,
    paddingHorizontal: 5,
  },
  md: {
    height: doorTag.height,
    borderRadius: doorTag.borderRadius,
    fontSize: doorTag.fontSize,
    paddingHorizontal: doorTag.paddingHorizontal,
  },
};

export const DoorTag = React.forwardRef<View, DoorTagProps>(
  ({ unit, variant = 'default', size = 'md' }, ref) => {
    const { bg, text: textColor } = variants[variant];
    const { height, borderRadius: tagBorderRadius, fontSize, paddingHorizontal } = sizes[size];

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          { backgroundColor: bg, borderRadius: tagBorderRadius, height, paddingHorizontal },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize,
              lineHeight: height,
              fontFamily: typography.labelSmall.fontFamily,
              fontWeight: typography.labelSmall.fontWeight,
            },
          ]}
        >
          {unit}
        </Text>
      </View>
    );
  }
);

DoorTag.displayName = 'DoorTag';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default DoorTag;