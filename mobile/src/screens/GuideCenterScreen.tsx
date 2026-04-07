import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import RNPrint from "react-native-print";

import {
  buildGuideFileUrl,
  fetchGuideResource,
  formatFileSize,
  type GuideResource,
} from "../services/guideService";

const COLORS = {
  background: "#F7F4EE",
  card: "#FFFFFF",
  text: "#0F2443",
  muted: "#61728A",
  green: "#2FB34A",
  blue: "#1F4E94",
  line: "#DCE5EE",
};

export function GuideCenterScreen(): React.JSX.Element {
  const [guide, setGuide] = useState<GuideResource | null>(null);
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const guideFileUrl = buildGuideFileUrl();

  useEffect(() => {
    let isMounted = true;

    async function loadGuide(): Promise<void> {
      try {
        const result = await fetchGuideResource();
        if (isMounted) {
          setGuide(result);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            "Panduan belum tersedia",
            "PDF panduan belum dapat dimuat. Silakan coba lagi beberapa saat lagi.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGuide();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleShare(): Promise<void> {
    try {
      await Share.share({
        title: guide?.name ?? "Panduan NutriCore AI",
        message: `Panduan lengkap NutriCore AI dapat diakses di sini: ${guideFileUrl}`,
        url: guideFileUrl,
      });
    } catch (error) {
      Alert.alert("Gagal membagikan", "Silakan coba lagi.");
    }
  }

  async function handleOpenEmail(): Promise<void> {
    const subject = encodeURIComponent("Panduan Lengkap NutriCore AI");
    const body = encodeURIComponent(
      `Berikut panduan lengkap NutriCore AI yang dapat dibuka atau diunduh:\n${guideFileUrl}`,
    );

    await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  }

  async function handleOpenWhatsApp(): Promise<void> {
    const message = encodeURIComponent(
      `Panduan lengkap NutriCore AI dapat dibuka atau diunduh melalui tautan berikut:\n${guideFileUrl}`,
    );

    const whatsappUrl = `https://wa.me/?text=${message}`;
    await Linking.openURL(whatsappUrl);
  }

  async function handlePrint(): Promise<void> {
    try {
      await RNPrint.print({
        html: `
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Panduan Lengkap NutriCore AI</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  padding: 24px;
                  color: #0F2443;
                }
                h1 {
                  margin-bottom: 8px;
                }
                p {
                  line-height: 1.5;
                }
                a {
                  color: #1F4E94;
                }
              </style>
            </head>
            <body>
              <h1>Panduan Lengkap NutriCore AI</h1>
              <p>Gunakan tautan berikut untuk membuka atau mengunduh PDF panduan resmi NutriCore AI.</p>
              <p><a href="${guideFileUrl}">${guideFileUrl}</a></p>
              <p>Developer: ${guide?.developer ?? "dr Theresia AYH"}</p>
              <p>Dibuat: ${guide?.created_at_label ?? "April 2026"}</p>
            </body>
          </html>
        `,
      });
    } catch (error) {
      Alert.alert("Gagal mencetak", "Fitur print belum tersedia pada perangkat ini.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Pusat Bantuan</Text>
          <Text style={styles.title}>Panduan Lengkap NutriCore AI</Text>
          <Text style={styles.subtitle}>
            Mudah dipahami oleh masyarakat umum, petugas gizi, dokter, perawat, dan tenaga kesehatan lain.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{guide?.developer ?? "dr Theresia AYH"}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{guide?.created_at_label ?? "April 2026"}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {guide ? formatFileSize(guide.file_size_bytes) : "PDF"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton label="Lihat PDF" onPress={() => setIsPdfVisible(true)} />
          <ActionButton label="Bagikan" onPress={() => void handleShare()} />
        </View>

        <View style={styles.actionRow}>
          <ActionButton label="WhatsApp" onPress={() => void handleOpenWhatsApp()} secondary />
          <ActionButton label="Email" onPress={() => void handleOpenEmail()} secondary />
          <ActionButton label="Cetak" onPress={() => void handlePrint()} secondary />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Akses di Dalam Aplikasi</Text>
          <Text style={styles.infoText}>
            Letakkan layar ini di menu <Text style={styles.bold}>Profile</Text> atau{" "}
            <Text style={styles.bold}>Help Center</Text> agar panduan selalu mudah ditemukan.
          </Text>
          <Text style={styles.infoText}>
            Cocok digunakan untuk edukasi pasien di klinik, edukasi keluarga, maupun referensi cepat bagi tenaga kesehatan.
          </Text>
        </View>

        {isPdfVisible ? (
          <View style={styles.pdfCard}>
            <View style={styles.pdfHeader}>
              <Text style={styles.pdfTitle}>Preview PDF</Text>
              <TouchableOpacity onPress={() => setIsPdfVisible(false)}>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pdfFrame}>
              {!isLoading ? (
                <Pdf
                  source={{ uri: guideFileUrl, cache: true }}
                  style={styles.pdf}
                  trustAllCerts={false}
                />
              ) : (
                <Text style={styles.loadingText}>Memuat PDF...</Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
};

function ActionButton({ label, onPress, secondary = false }: ActionButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, secondary ? styles.buttonSecondary : styles.buttonPrimary]}
    >
      <Text style={[styles.buttonText, secondary ? styles.buttonTextSecondary : styles.buttonTextPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  kicker: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  metaPill: {
    backgroundColor: "#EFF6F0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonPrimary: {
    backgroundColor: COLORS.blue,
  },
  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
  },
  buttonTextSecondary: {
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: "#FDFCF9",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  bold: {
    color: COLORS.text,
    fontWeight: "700",
  },
  pdfCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  pdfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pdfTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  closeText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: "700",
  },
  pdfFrame: {
    height: 560,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#EEF3F7",
  },
  pdf: {
    flex: 1,
    width: "100%",
  },
  loadingText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 20,
  },
});
