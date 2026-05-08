import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

// ==========================================
// AdMob SETUP INSTRUCTIONS:
// 1. Create account at https://apps.admob.com
// 2. Add your Android app → get App ID (ca-app-pub-xxx~xxx)
// 3. Create Banner Ad Unit → get Ad Unit ID
// 4. Replace ADMOB_BANNER_ID below with your real Ad Unit ID
// 5. In app.json plugins, add:
//    ["react-native-google-mobile-ads", {
//      "androidAppId": "ca-app-pub-xxx~xxx",
//      "iosAppId": "ca-app-pub-xxx~xxx"
//    }]
// ==========================================

// TEST IDs (replace with real IDs after AdMob approval)
const ADMOB_BANNER_ID = Platform.select({
  android: 'ca-app-pub-3940256099942544/6300978111', // TEST ID
  ios: 'ca-app-pub-3940256099942544/2934735716',     // TEST ID
  default: 'ca-app-pub-3940256099942544/6300978111',
});

// Try to import AdMob (only available in custom builds/APK, not Expo Go)
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
} catch (e) {
  // AdMob not available in this environment
}

interface AdBannerProps {
  size?: 'banner' | 'large' | 'medium';
  style?: any;
}

export function AdBanner({ size = 'banner', style }: AdBannerProps) {
  const { colors } = useTheme();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // If AdMob package not available (Expo Go / preview)
  if (!BannerAd || !BannerAdSize) {
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: colors.background, borderColor: colors.border }, style]}>
        <View style={[styles.placeholderInner, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="campaign" size={18} color={colors.textMuted} />
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Ad Space</Text>
          <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>AdMob</Text>
        </View>
      </View>
    );
  }

  const adSize = size === 'large' ? BannerAdSize.LARGE_BANNER
    : size === 'medium' ? BannerAdSize.MEDIUM_RECTANGLE
    : BannerAdSize.BANNER;

  const adUnitId = __DEV__ ? TestIds.BANNER : (ADMOB_BANNER_ID || TestIds.BANNER);

  if (adError) {
    return null; // Hide if ad fails to load
  }

  return (
    <View style={[styles.adContainer, style]}>
      <BannerAd
        unitId={adUnitId}
        size={adSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(error: any) => {
          console.log('Ad failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 8,
  },
  placeholderContainer: {
    height: 52,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  placeholderInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  placeholderSub: {
    fontSize: 10,
  },
});
