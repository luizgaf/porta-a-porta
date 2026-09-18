'use client';

import { Image, View, Text, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle | ImageStyle;
  textStyle?: TextStyle;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function Avatar({ source, name, size = 'md', style, textStyle }: AvatarProps) {
  const sizeValue = typeof size === 'number' ? size : SIZE_MAP[size];
  const fontSize = sizeValue * 0.35;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.image,
          { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          style,
        ] as ImageStyle[]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
        { backgroundColor: name ? getColor(name) : '#E5E5EA' },
        style,
      ] as ViewStyle[]}
    >
      {name && <Text style={[styles.text, { fontSize }, textStyle]}>{getInitials(name)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 9999,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});