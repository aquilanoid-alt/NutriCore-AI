import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchGuidePdfBlob, getApiBaseUrl, getGuideFileUrl, getGuideMetadata, type GuideMetadata } from '@/services/guide';

const COLORS = {
  background: '#F7F4EE',
  card: '#FFFFFF',
  text: '#10233F',
  muted: '#61728A',
  green: '#2FB34A',
  blue: '#1F4E94',
  line: '#DCE5EE',
};

export default function ProfileScreen() {
  const [guide, setGuide] = useState<GuideMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPdf, setOpeningPdf] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await getGuideMetadata();
        if (mounted) {
          setGuide(result);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert(
            'Panduan belum terhubung',
            'Pastikan backend FastAPI sudah berjalan. Jika memakai HP fisik, ganti base URL API ke IP laptop Anda.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const guideFileUrl = getGuideFileUrl();

  function openInNewTab(url: string) {
    const webWindow = globalThis as typeof globalThis & {
      open?: (target: string, features?: string, noopener?: string) => void;
    };
    webWindow.open?.(url, '_blank', 'noopener,noreferrer');
  }

  async function openPdf() {
    try {
      setOpeningPdf(true);
      if (Platform.OS === 'web') {
        const blob = await fetchGuidePdfBlob();
        const objectUrl = URL.createObjectURL(blob);
        openInNewTab(objectUrl);
        return;
      }

      await WebBrowser.openBrowserAsync(guideFileUrl);
    } finally {
      setOpeningPdf(false);
    }
  }

  async function sharePdf() {
    try {
      await Share.share({
        title: guide?.name ?? 'Panduan Lengkap NutriCore AI',
        message: `Panduan lengkap NutriCore AI: ${guideFileUrl}`,
        url: guideFileUrl,
      });
    } catch (error) {
      Alert.alert('Gagal membagikan', 'Silakan coba lagi.');
    }
  }

  async function openWhatsApp() {
    const text = encodeURIComponent(`Panduan lengkap NutriCore AI dapat dibuka di: ${guideFileUrl}`);
    await Linking.openURL(`https://wa.me/?text=${text}`);
  }

  async function openEmail() {
    const subject = encodeURIComponent('Panduan Lengkap NutriCore AI');
    const body = encodeURIComponent(`Berikut panduan lengkap NutriCore AI:\n${guideFileUrl}`);
    await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  }

  async function printGuide() {
    if (Platform.OS === 'web') {
      const blob = await fetchGuidePdfBlob();
      const objectUrl = URL.createObjectURL(blob);
      openInNewTab(objectUrl);
      return;
    }

    Alert.alert(
      'Cetak PDF',
      'File PDF akan dibuka terlebih dahulu. Dari viewer atau browser, gunakan menu share/print pada perangkat Anda.',
    );
    await WebBrowser.openBrowserAsync(guideFileUrl);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Profile & Help Center</Text>
          <Text style={styles.title}>Panduan Lengkap NutriCore AI</Text>
          <Text style={styles.subtitle}>
            Akses PDF panduan resmi, bagikan ke WhatsApp atau email, lalu buka untuk cetak.
          </Text>

          <View style={styles.metaBox}>
            <Text style={styles.metaText}>Developer: {guide?.developer ?? 'dr Theresia AYH'}</Text>
            <Text style={styles.metaText}>Dibuat: {guide?.created_at_label ?? 'April 2026'}</Text>
            <Text style={styles.metaText}>API: {getApiBaseUrl()}</Text>
            <Text style={styles.metaText}>{loading ? 'Memuat metadata...' : guide ? `File: ${guide.file_name}` : 'Panduan offline belum tersambung'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton label={openingPdf ? 'Memuat PDF...' : 'Lihat PDF'} onPress={() => void openPdf()} />
          <ActionButton label="Bagikan" onPress={() => void sharePdf()} />
        </View>
        <View style={styles.actionRow}>
          <ActionButton label="WhatsApp" onPress={() => void openWhatsApp()} secondary />
          <ActionButton label="Email" onPress={() => void openEmail()} secondary />
          <ActionButton label="Cetak" onPress={() => void printGuide()} secondary />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Jika Anda menjalankan dari HP fisik</Text>
          <Text style={styles.cardText}>
            Ganti base URL API dari <Text style={styles.bold}>localhost</Text> menjadi IP laptop Anda di file konfigurasi aplikasi.
          </Text>
          <Text style={styles.cardText}>
            Contoh: <Text style={styles.bold}>http://192.168.1.10:8000</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alur uji paling cepat</Text>
          <Text style={styles.cardText}>1. Jalankan backend FastAPI di port 8000.</Text>
          <Text style={styles.cardText}>2. Jalankan Expo app.</Text>
          <Text style={styles.cardText}>3. Buka tab Profile.</Text>
          <Text style={styles.cardText}>4. Tekan “Lihat PDF” untuk membuka panduan langsung di tab browser baru.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, secondary ? styles.buttonSecondary : styles.buttonPrimary]}>
      <Text style={[styles.buttonText, secondary ? styles.buttonTextSecondary : styles.buttonTextPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, gap: 14 },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  kicker: { color: COLORS.green, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  metaBox: {
    marginTop: 16,
    backgroundColor: '#F8FBF8',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  metaText: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonPrimary: { backgroundColor: COLORS.blue },
  buttonSecondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line },
  buttonText: { fontSize: 14, fontWeight: '700' },
  buttonTextPrimary: { color: '#FFFFFF' },
  buttonTextSecondary: { color: COLORS.text },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  cardText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  bold: { color: COLORS.text, fontWeight: '700' },
});
