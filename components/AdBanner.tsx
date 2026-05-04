import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

const AD_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: hidden; }
</style>
</head>
<body>
<script src="https://quge5.com/88/tag.min.js" data-zone="236012" async data-cfasync="false"></script>
</body>
</html>
`;

const INTERSTITIAL_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: hidden; }
</style>
</head>
<body>
<script src="https://quge5.com/88/tag.min.js" data-zone="236012" async data-cfasync="false"></script>
</body>
</html>
`;

// Inline banner ad (shows in screen)
export function AdBanner({ style }: { style?: any }) {
  return (
    <View style={[styles.bannerWrap, style]}>
      <WebView
        source={{ html: AD_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        onError={() => {}}
      />
    </View>
  );
}

// Interstitial ad (full screen modal, appears on action)
export function AdInterstitial({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.interstitialOverlay}>
        <View style={styles.interstitialBox}>
          <View style={styles.interstitialHeader}>
            <Text style={styles.adLabel}>Advertisement</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: INTERSTITIAL_HTML }}
            style={{ width: W - 48, height: 300 }}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowsInlineMediaPlayback
            originWhitelist={['*']}
            onError={() => {}}
          />
          <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    width: '100%',
    height: 60,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  interstitialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interstitialBox: {
    width: W - 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  interstitialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  adLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  continueBtn: {
    backgroundColor: '#1A237E',
    margin: 14,
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
