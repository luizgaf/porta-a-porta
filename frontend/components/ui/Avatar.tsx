import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/design';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle | ImageStyle;
}

const sizes = {
  xs: { width: 24, height: 24, fontSize: typography.labelSmall.fontSize },
  sm: { width: 32, height: 32, fontSize: typography.labelMedium.fontSize },
  md: { width: 40, height: 40, fontSize: typography.labelLarge.fontSize },
  lg: { width: 56, height: 56, fontSize: typography.bodyLarge.fontSize },
  xl: { width: 80, height: 80, fontSize: typography.displaySmall.fontSize },
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string) => {
  const colorPalette = [
    colors.portaNavy,
    '#2A6B8F',
    '#3D8FC1',
    '#5BA3D6',
    colors.warmTerracotta,
    '#D97A5C',
    '#E89A7A',
    '#F0B89A',
    colors.mutedSlate,
    '#8A9BAA',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
};

export const Avatar = React.forwardRef<View, AvatarProps>(
  ({ source, name, size = 'md', style, ...props }, ref) => {
    const { width, height, fontSize } = sizes[size];

    const containerStyle: ViewStyle = {
      ...styles.container,
      width,
      height,
      borderRadius: width / 2,
      ...(style as ViewStyle),
    };

    const imageStyle: ImageStyle = {
      ...styles.image,
      width,
      height,
      borderRadius: width / 2,
      ...(style as ImageStyle),
    };

    if (source) {
      return (
        <Image
          ref={ref as React.RefObject<Image>}
          source={source}
          style={imageStyle}
          {...props}
        />
      );
    }

    const bgColor = name ? getColorFromName(name) : colors.morningFog;
    const initials = name ? getInitials(name) : '?';
    const textColor = name ? colors.textOnPrimary : colors.mutedSlate;

    return (
      <View
        ref={ref}
        style={[containerStyle, { backgroundColor: bgColor }]}
        {...props}
      >
        <Text style={{ ...styles.initials, fontSize, color: textColor }}>{initials}</Text>
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 999,
  },
  initials: {
    fontFamily: typography.labelLarge.fontFamily,
    fontWeight: typography.labelLarge.fontWeight,
  },
});

export default Avatar;