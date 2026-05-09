import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

// ==========================================
// Ad Banner Component
// Currently shows placeholder — AdMob requires
// a custom native build with the plugin configured.
// To enable real ads, you need to use EAS Build with:
//   "react-native-google-mobile-ads" plugin in app.json
// ==========================================

interface AdBannerProps {
  size?: 'banner' | 'large' | 'medium';
  style?: any;
}

export function AdBanner({ size = 'banner', style }: AdBannerProps) {
  const { colors } = useTheme();

  const height = size === 'large' ? 100 : size === 'medium' ? 250 : 52;

  return (
    <View style={[styles.container, { borderColor: colors.border, height }, style]}>
      <View style={[styles.inner, { backgroundColor: colors.surface }]}>
        <MaterialIcons name="campaign" size={16} color={colors.textMuted} />
        <Text style={[styles.text, { color: colors.textMuted }]}>Advertisement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
