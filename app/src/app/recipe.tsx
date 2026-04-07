import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { exportRecipePlanPdf, generateRecipes, type RecipeResult } from '@/services/recipes';
import { loadSharedPatientContext } from '@/services/session';

const COLORS = {
  background: '#F7F4EE',
  card: '#FFFFFF',
  text: '#10233F',
  muted: '#61728A',
  blue: '#1F4E94',
  green: '#2FB34A',
  line: '#DCE5EE',
  input: '#F8FAFC',
};

export default function RecipeScreen() {
  const [ingredient, setIngredient] = useState('tempe');
  const [conditions, setConditions] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('1800');
  const [patientGroup, setPatientGroup] = useState('adult');
  const [productLabelSummary, setProductLabelSummary] = useState('');
  const [productLabelStatus, setProductLabelStatus] = useState('');
  const [productServingAdvice, setProductServingAdvice] = useState('');
  const [recipes, setRecipes] = useState<RecipeResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const context = loadSharedPatientContext();
      if (!context) return;
      setConditions(context.medicalConditions || '');
      setPatientGroup(context.patientGroup || 'adult');
      if (context.calorieTarget) setCalorieTarget(context.calorieTarget);
      if (context.ingredientFocus) setIngredient(context.ingredientFocus);
      setProductLabelSummary(context.latestProductLabelSummary || '');
      setProductLabelStatus(context.latestProductLabelStatus || '');
      setProductServingAdvice(context.latestProductServingAdvice || '');
    }, [])
  );

  async function handleGenerate() {
    try {
      const result = await generateRecipes({
        ingredient,
        medical_conditions: [conditions, productLabelSummary].filter(Boolean).join('. '),
        calorie_target_kcal: calorieTarget ? Number(calorieTarget) : undefined,
        patient_group: patientGroup,
        product_label_context: productLabelSummary,
      });
      setRecipes(result);
      setSelectedVariant(0);
    } catch (error) {
      Alert.alert('Gagal membuat resep', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  function buildRecipeSummary(): string {
    if (!recipes?.plan_variants?.[selectedVariant]) return '';
    const variant = recipes.plan_variants[selectedVariant];
    const lines = [
      `NutriCore AI Recipe`,
      `Varian: ${variant.variant_name}`,
      `Target harian: ${recipes.target_calories} kkal`,
      `Total menu: ${variant.total_planned_calories} kkal`,
      `Kondisi: ${conditions || '-'}`,
      '',
    ];
    variant.recipes.forEach((meal) => {
      lines.push(`${meal.schedule_time} - ${meal.title}`);
      lines.push(`• ${meal.nutrition.calories} kkal`);
    });
    return lines.join('\n');
  }

  async function handleShareWhatsapp() {
    const text = encodeURIComponent(buildRecipeSummary());
    const url = `https://wa.me/?text=${text}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
      return;
    }
    await Linking.openURL(url);
  }

  async function handleShareEmail() {
    const body = encodeURIComponent(buildRecipeSummary());
    await Linking.openURL(`mailto:?subject=NutriCore AI Recipe&body=${body}`);
  }

  async function handleExportPdf() {
    try {
      const blob = await exportRecipePlanPdf({
        ingredient,
        medical_conditions: conditions,
        calorie_target_kcal: calorieTarget ? Number(calorieTarget) : undefined,
        patient_group: patientGroup,
        product_label_context: productLabelSummary,
        variant_index: selectedVariant,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = 'nutricore-recipe.pdf';
        anchor.click();
        return;
      }
      await Share.share({ message: 'Recipe plan siap disimpan sebagai PDF.' });
    } catch {
      Alert.alert('Gagal ekspor', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  async function handlePrintPdf() {
    try {
      const blob = await exportRecipePlanPdf({
        ingredient,
        medical_conditions: conditions,
        calorie_target_kcal: calorieTarget ? Number(calorieTarget) : undefined,
        patient_group: patientGroup,
        product_label_context: productLabelSummary,
        variant_index: selectedVariant,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        return;
      }
      await Share.share({ message: 'Buka PDF recipe lalu cetak dari perangkat Anda.' });
    } catch {
      Alert.alert('Gagal membuka PDF', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Recipe</Text>
          <Text style={styles.title}>Rekomendasi Resep AI</Text>
          <Text style={styles.subtitle}>
            Masukkan bahan utama lalu sistem akan membuat rencana makan harian. Jadi target 1800 kkal berarti total seluruh slot makan dalam satu hari, bukan satu menu saja.
          </Text>
        </View>

        {productLabelSummary ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sinkronisasi dari Analisis Produk</Text>
            <View style={[styles.productBadge, productLabelStatus === 'red' ? styles.badgeRed : productLabelStatus === 'yellow' ? styles.badgeYellow : styles.badgeGreen]}>
              <Text style={styles.productBadgeText}>{productLabelStatus === 'red' ? 'Merah' : productLabelStatus === 'yellow' ? 'Kuning' : 'Hijau'}</Text>
            </View>
            <Text style={styles.cardText}>{productLabelSummary}</Text>
            {productServingAdvice ? <Text style={styles.note}>Anjuran: {productServingAdvice}</Text> : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Bahan utama</Text>
          <TextInput value={ingredient} onChangeText={setIngredient} style={styles.input} placeholder="Contoh: tempe" />
          <Text style={styles.label}>Kondisi medis</Text>
          <TextInput
            value={conditions}
            onChangeText={setConditions}
            style={[styles.input, styles.multiline]}
            placeholder="Contoh: diabetes, hipertensi, CKD stage 3"
            multiline
          />
          <Text style={styles.label}>Kelompok pasien otomatis dari Home</Text>
          <TextInput value={patientGroup} onChangeText={setPatientGroup} style={styles.input} placeholder="adult / elderly / pregnant ..." />
          <Text style={styles.label}>Target kalori harian</Text>
          <TextInput
            value={calorieTarget}
            onChangeText={setCalorieTarget}
            style={styles.input}
            placeholder="Contoh: 1800"
          />
          <TouchableOpacity onPress={() => void handleGenerate()} style={styles.button}>
            <Text style={styles.buttonText}>Buat Resep</Text>
          </TouchableOpacity>
        </View>

        {recipes?.modifier_notes?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Penyesuaian Kondisi</Text>
            {recipes.modifier_notes.map((item, index) => (
              <Text key={index} style={styles.cardText}>• {item}</Text>
            ))}
          </View>
        ) : null}

        {recipes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Penjelasan Target Harian</Text>
            <Text style={styles.cardText}>Target harian: {recipes.target_calories} kkal</Text>
            <Text style={styles.cardText}>
              Total rencana menu: {recipes.plan_variants[selectedVariant]?.total_planned_calories ?? recipes.total_planned_calories} kkal
            </Text>
            <Text style={styles.note}>{recipes.clarification}</Text>
            <Text style={styles.measurementNote}>{recipes.measurement_guidance}</Text>
            {recipes.measurement_sources?.map((item, index) => (
              <Text key={index} style={styles.measurementSource}>• {item}</Text>
            ))}
          </View>
        ) : null}

        {recipes?.plan_variants?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pilih Varian Menu Harian</Text>
            {recipes.plan_variants.map((variant, index) => (
              <TouchableOpacity
                key={variant.variant_name}
                onPress={() => setSelectedVariant(index)}
                style={[styles.variantChip, selectedVariant === index ? styles.variantChipActive : null]}>
                <Text style={[styles.variantChipText, selectedVariant === index ? styles.variantChipTextActive : null]}>
                  {variant.variant_name}
                </Text>
              </TouchableOpacity>
            ))}
            {recipes.plan_variants[selectedVariant]?.day_plan_notes?.map((item, index) => (
              <Text key={index} style={styles.cardText}>• {item}</Text>
            ))}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => void handleShareWhatsapp()} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleShareEmail()} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleExportPdf()} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handlePrintPdf()} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Print PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {(recipes?.plan_variants?.[selectedVariant]?.recipes ?? recipes?.recipes)?.map((recipe, index) => (
          <View key={`${recipe.title}-${index}`} style={styles.card}>
            <Text style={styles.mealTime}>{recipe.schedule_time} • {recipe.meal_type.replaceAll('_', ' ')}</Text>
            <Text style={styles.cardTitle}>{recipe.title}</Text>
            <Text style={styles.note}>Penyesuaian: {recipe.personalization_notes}</Text>
            <Text style={styles.section}>Bahan</Text>
            {recipe.ingredients.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.cardText}>
                • {item.name} {item.grams} g
                {'  '}({item.household_measure})
              </Text>
            ))}
            {recipe.ingredients[0]?.measure_note ? <Text style={styles.measurementNote}>{recipe.ingredients[0].measure_note}</Text> : null}
            <Text style={styles.section}>Cara memasak</Text>
            {recipe.instructions.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.cardText}>{itemIndex + 1}. {item}</Text>
            ))}
            <Text style={styles.section}>Estimasi nutrisi</Text>
            <Text style={styles.cardText}>
              {recipe.nutrition.calories} kkal | Protein {recipe.nutrition.protein} g | Karbohidrat {recipe.nutrition.carbs} g | Lemak {recipe.nutrition.fat} g
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, gap: 14 },
  heroCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.line },
  kicker: { color: COLORS.blue, fontSize: 13, fontWeight: '700', marginBottom: 8 },
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
  button: { marginTop: 16, backgroundColor: COLORS.green, borderRadius: 14, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  cardText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  section: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  note: { color: COLORS.blue, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  measurementNote: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 8 },
  measurementSource: { color: COLORS.text, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  mealTime: { color: COLORS.green, fontSize: 12, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  variantChip: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#F7FAFD',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  variantChipActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  variantChipText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  variantChipTextActive: { color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: {
    backgroundColor: '#EEF4F8',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonText: { color: COLORS.blue, fontSize: 13, fontWeight: '800' },
  productBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeRed: { backgroundColor: '#D94F45' },
  badgeYellow: { backgroundColor: '#F5B301' },
  badgeGreen: { backgroundColor: '#2FB34A' },
  productBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
