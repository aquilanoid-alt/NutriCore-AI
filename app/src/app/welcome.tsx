import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchGuidePdfBlob, getGuideFileUrl } from '@/services/guide';

async function openGuide() {
  const guideUrl = getGuideFileUrl();
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = await fetchGuidePdfBlob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      return;
    }
    await Linking.openURL(guideUrl);
  } catch {
    Alert.alert('Gagal membuka panduan', 'Pastikan backend aktif lalu coba lagi.');
  }
}

function enterApp(mode: 'personal' | 'institution') {
  router.replace(mode === 'personal' ? '/?mode=personal' : '/?mode=institution');
}

export default function WelcomeScreen() {
  const [openingGuide, setOpeningGuide] = React.useState(false);

  async function handleOpenGuide() {
    try {
      setOpeningGuide(true);
      await openGuide();
    } finally {
      setOpeningGuide(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
          <Image
            source={require('@/assets/images/nutricore-welcome-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.titleTop}>Welcome to</Text>
          <Text style={styles.titleBottom}>
            Nutri<Text style={styles.titleAccent}>Core</Text> AI
          </Text>
          <Text style={styles.subtitle}>Your Personal Health & Nutrition Assistant</Text>

          <TouchableOpacity onPress={() => enterApp('personal')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Mulai Mode Pribadi</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => enterApp('institution')} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Masuk Mode Profesional</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => void handleOpenGuide()} style={styles.ghostButton} disabled={openingGuide}>
            <Text style={styles.ghostText}>{openingGuide ? 'Memuat Panduan...' : 'Lihat Panduan'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#06142D' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06142D',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    backgroundColor: '#0C2148',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#00112A',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  glowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(47,179,74,0.18)',
    top: -110,
    right: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(31,78,148,0.24)',
    bottom: -150,
    left: -120,
  },
  logo: { width: 178, height: 188, marginBottom: 4 },
  titleTop: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleBottom: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleAccent: { color: '#88D84C' },
  subtitle: {
    color: '#D6E1F0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 300,
  },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#5CCF46',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#1E4F97',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ghostButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
