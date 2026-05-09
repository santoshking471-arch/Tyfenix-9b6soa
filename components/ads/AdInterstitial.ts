// Interstitial Ad — no-op stub
// Real AdMob interstitial requires a custom EAS native build
// with react-native-google-mobile-ads plugin in app.json

export function preloadInterstitialAd() {
  // No-op: native module not available in standard build
}

export function showInterstitialAd(): boolean {
  // No-op: returns false so callers can handle gracefully
  return false;
}

export function isInterstitialAdReady(): boolean {
  return false;
}
