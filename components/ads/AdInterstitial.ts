import { Platform } from 'react-native';

// ==========================================
// Interstitial Ad (Full Screen) Setup
// Replace with your real Interstitial Ad Unit ID from AdMob
// ==========================================

const ADMOB_INTERSTITIAL_ID = Platform.select({
  android: 'ca-app-pub-3940256099942544/1033173712', // TEST ID
  ios: 'ca-app-pub-3940256099942544/4411468910',     // TEST ID
  default: 'ca-app-pub-3940256099942544/1033173712',
});

// Try to import AdMob
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
  TestIds = admob.TestIds;
} catch (e) {
  // Not available
}

let interstitialAd: any = null;
let isLoaded = false;
let isLoading = false;

export function preloadInterstitialAd() {
  if (!InterstitialAd || isLoading) return;
  try {
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : (ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL);
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    isLoading = true;

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
      isLoading = false;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      isLoading = false;
      // Preload next ad
      setTimeout(() => preloadInterstitialAd(), 2000);
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      isLoaded = false;
      isLoading = false;
    });

    interstitialAd.load();
  } catch (e) {
    console.log('Interstitial Ad preload error:', e);
  }
}

export function showInterstitialAd(): boolean {
  if (!InterstitialAd || !interstitialAd || !isLoaded) {
    console.log('Interstitial ad not ready');
    return false;
  }
  try {
    interstitialAd.show();
    return true;
  } catch (e) {
    console.log('Failed to show interstitial:', e);
    return false;
  }
}

export function isInterstitialAdReady(): boolean {
  return isLoaded;
}
