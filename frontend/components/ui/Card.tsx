import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

const paddings = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const elevations = {
  none: shadows.none,
  sm: shadows.sm,
  md: shadows.md,
  lg: shadows.lg,
};

export const Card = React.forwardRef<View, CardProps>(
  ({ children, style, padding = 'md', elevation = 'sm', bordered = true, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.container,
          { padding: paddings[padding] },
          { borderRadius: borderRadius.lg },
          elevations[elevation],
          bordered && styles.bordered,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Card;