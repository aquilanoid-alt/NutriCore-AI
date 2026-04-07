import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { analyzeDailyTracking, type TrackingResult } from '@/services/tracking';
import { loadSharedPatientContext } from '@/services/session';

const COLORS = {
  background: '#F7F4EE',
  card: '#FFFFFF',
  text: '#10233F',
  muted: '#61728A',
  green: '#2FB34A',
  blue: '#1F4E94',
  line: '#DCE5EE',
  input: '#F8FAFC',
};

export default function TrackScreen() {
  const router = useRouter();
  const [foodText, setFoodText] = useState('nasi putih + tempe + telur');
  const [calorieTarget, setCalorieTarget] = useState('1800');
  const [proteinTarget, setProteinTarget] = useState('60');
  const [carbTarget, setCarbTarget] = useState('225');
  const [fatTarget, setFatTarget] = useState('60');
  const [goal, setGoal] = useState('Maintenance');
  const [conditions, setConditions] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [latestLabelSummary, setLatestLabelSummary] = useState('');
  const [latestLabelStatus, setLatestLabelStatus] = useState('');
  const [latestLabelReason, setLatestLabelReason] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const context = loadSharedPatientContext();
      if (!context) return;
      setGoal(context.goal || 'Maintenance');
      setConditions(context.medicalConditions || '');
      if (context.calorieTarget) setCalorieTarget(context.calorieTarget);
      if (context.proteinTarget) setProteinTarget(context.proteinTarget);
      if (context.carbTarget) setCarbTarget(context.carbTarget);
      if (context.fatTarget) setFatTarget(context.fatTarget);
      setLatestLabelSummary(context.latestProductLabelSummary || '');
      setLatestLabelStatus(context.latestProductLabelStatus || '');
      setLatestLabelReason(context.latestProductLabelReason || '');
    }, [])
  );

  async function handleAnalyze() {
    try {
      const response = await analyzeDailyTracking({
        food_text: foodText,
        calorie_target_kcal: Number(calorieTarget || 0),
        protein_g: Number(proteinTarget || 0),
        carbs_g: Number(carbTarget || 0),
        fat_g: Number(fatTarget || 0),
        goal,
      });
      setResult(response);
    } catch (error) {
      Alert.alert('Gagal menganalisis tracking', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Track</Text>
          <Text style={styles.title}>Pencatatan Harian</Text>
          <Text style={styles.subtitle}>
            Anda bisa mengetik makanan secara manual, misalnya `nasi putih + tempe + telur`, lalu melihat total asupan dan persentase terhadap target.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Input makanan / NLP sederhana</Text>
          <TextInput
            value={foodText}
            onChangeText={setFoodText}
            style={[styles.input, styles.multiline]}
            placeholder="Contoh: nasi putih + tempe + telur"
            multiline
          />
          <Text style={styles.label}>Target kalori</Text>
          <TextInput value={calorieTarget} onChangeText={setCalorieTarget} style={styles.input} />
          <Text style={styles.label}>Target protein</Text>
          <TextInput value={proteinTarget} onChangeText={setProteinTarget} style={styles.input} />
          <Text style={styles.label}>Target karbohidrat</Text>
          <TextInput value={carbTarget} onChangeText={setCarbTarget} style={styles.input} />
          <Text style={styles.label}>Target lemak</Text>
          <TextInput value={fatTarget} onChangeText={setFatTarget} style={styles.input} />
          <Text style={styles.label}>Kondisi medis otomatis dari Home</Text>
          <TextInput value={conditions} onChangeText={setConditions} style={[styles.input, styles.multiline]} multiline />
          <Text style={styles.label}>Tujuan awal</Text>
          <TextInput value={goal} onChangeText={setGoal} style={styles.input} placeholder="Weight loss / Weight gain / Maintenance" />
          <TouchableOpacity onPress={() => void handleAnalyze()} style={styles.button}>
            <Text style={styles.buttonText}>Analisis Tracking</Text>
          </TouchableOpacity>
        </View>

        {result ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Item yang dikenali</Text>
              {result.items.map((item, index) => (
                <Text key={index} style={styles.cardText}>
                  • {item.name} {item.matched ? '' : '(belum dikenali)'}
                </Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ringkasan Harian</Text>
              <Text style={styles.cardText}>Kalori: {result.totals.calories} / {result.targets.calories} kkal ({result.adherence_percent.calories}%)</Text>
              <Text style={styles.cardText}>Protein: {result.totals.protein} / {result.targets.protein} g ({result.adherence_percent.protein}%)</Text>
              <Text style={styles.cardText}>Karbohidrat: {result.totals.carbs} / {result.targets.carbs} g ({result.adherence_percent.carbs}%)</Text>
              <Text style={styles.cardText}>Lemak: {result.totals.fat} / {result.targets.fat} g ({result.adherence_percent.fat}%)</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Jadwal Harian & Aktivitas</Text>
              <Text style={styles.note}>{result.exercise_recommendation}</Text>
              {result.daily_schedule.map((item, index) => (
                <Text key={index} style={styles.cardText}>• {item.time} — {item.activity}</Text>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Menu Khusus Label Produk</Text>
          <Text style={styles.note}>
            Analisis label AKG sekarang dipisahkan ke tab <Text style={styles.noteStrong}>Label</Text> agar lebih fokus untuk upload foto, crop area, OCR, dan penilaian otomatis sesuai kondisi individu.
          </Text>
          {latestLabelSummary ? (
            <>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      latestLabelStatus === 'red'
                        ? '#D94F45'
                        : latestLabelStatus === 'yellow'
                          ? '#F5B301'
                          : '#2FB34A',
                  },
                ]}>
                <Text style={styles.statusBadgeText}>
                  {latestLabelStatus === 'red'
                    ? 'Produk terakhir: Merah'
                    : latestLabelStatus === 'yellow'
                      ? 'Produk terakhir: Kuning'
                      : 'Produk terakhir: Hijau'}
                </Text>
              </View>
              <Text style={styles.cardText}>{latestLabelSummary}</Text>
              {latestLabelReason ? <Text style={styles.cardText}>{latestLabelReason}</Text> : null}
            </>
          ) : (
            <Text style={styles.cardText}>
              Belum ada hasil label produk terbaru. Anda bisa membuka tab Label untuk scan foto label atau isi manual, lalu hasilnya akan otomatis ikut tersinkron ke Recipe.
            </Text>
          )}
          <TouchableOpacity onPress={() => router.push('/label-scan')} style={styles.button}>
            <Text style={styles.buttonText}>Buka Menu Label</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, gap: 14 },
  heroCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.line },
  kicker: { color: COLORS.green, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { marginTop: 16, backgroundColor: COLORS.blue, borderRadius: 14, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  cardText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  note: { color: COLORS.blue, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  noteStrong: { fontWeight: '800', color: COLORS.blue },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  statusBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
