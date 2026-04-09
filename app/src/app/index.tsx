import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { analyzeAssessment, type AssessmentResult, type PatientGroup } from '@/services/assessment';
import { exportSummary } from '@/services/exports';
import { saveSharedPatientContext, type AppMode } from '@/services/session';

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

type Goal = 'Weight loss' | 'Weight gain' | 'Maintenance' | 'Metabolic improvement';
type ReportType = 'personal' | 'nutritionist' | 'medical';
type Sex = 'male' | 'female';
type ExportHistoryItem = {
  format: 'pdf' | 'csv' | 'doc' | 'xlsx';
  reportType: ReportType;
  createdAt: string;
};

function formatMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    bmi: 'IMT',
    bmi_classification: 'Klasifikasi IMT',
    muac_cm: 'MUAC / LILA (cm)',
    waist_cm: 'Lingkar perut (cm)',
    bmr_kcal: 'BMR (kkal/hari)',
    estimated_energy_kcal: 'Estimasi energi (kkal/hari)',
    gestational_weight_gain_kg: 'Kenaikan BB kehamilan (kg)',
    head_circumference_cm: 'Lingkar kepala (cm)',
    stature_cm: 'Panjang/Tinggi badan (cm)',
    age_months_resolved: 'Usia terpakai (bulan)',
    age_years_approx: 'Usia perkiraan (tahun)',
    weight_for_age_zscore: 'Z-score BB/U',
    weight_for_age_status: 'Status BB/U',
    height_for_age_zscore: 'Z-score TB/U',
    height_for_age_status: 'Status TB/U',
    weight_for_height_zscore: 'Z-score BB/TB atau BB/PB',
    weight_for_height_status: 'Status BB/TB atau BB/PB',
    bmi_for_age_zscore: 'Z-score IMT/U',
    bmi_for_age_status: 'Status IMT/U',
    head_circumference_for_age_zscore: 'Z-score lingkar kepala/U',
    head_circumference_status: 'Status lingkar kepala/U',
    calorie_target_kcal: 'Kalori target (kkal)',
    protein_g: 'Protein (g)',
    carbs_g: 'Karbohidrat (g)',
    fat_g: 'Lemak (g)',
    sodium_mg: 'Natrium (mg)',
    fluid_ml: 'Cairan (mL)',
  };

  return labels[key] ?? key.replaceAll('_', ' ');
}

export default function HomeScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const now = useMemo(() => new Date(), []);
  const [appMode, setAppMode] = useState<AppMode>('personal');
  const [patientName, setPatientName] = useState('Pengguna NutriCore AI');
  const [institutionName, setInstitutionName] = useState('NutriCore AI Clinic');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [medicalRecordNumber, setMedicalRecordNumber] = useState('');
  const [visitNumber, setVisitNumber] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [bpjsNumber, setBpjsNumber] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [visitDate, setVisitDate] = useState(now.toISOString().slice(0, 10));
  const [visitTime, setVisitTime] = useState(
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [patientGroup, setPatientGroup] = useState<PatientGroup>('adult');
  const [sex, setSex] = useState<Sex>('female');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [muac, setMuac] = useState('');
  const [waist, setWaist] = useState('');
  const [activity, setActivity] = useState('sedentary');
  const [goal, setGoal] = useState<Goal>('Maintenance');
  const [conditions, setConditions] = useState('');
  const [edema, setEdema] = useState(false);
  const [recentWeightLoss, setRecentWeightLoss] = useState(false);
  const [pregnancyTrimester, setPregnancyTrimester] = useState<'first' | 'second' | 'third'>('first');
  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [prePregnancyWeight, setPrePregnancyWeight] = useState('');
  const [breastfeedingExclusive, setBreastfeedingExclusive] = useState(true);
  const [breastfeedingChildAgeMonths, setBreastfeedingChildAgeMonths] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  const [reportType, setReportType] = useState<ReportType>('personal');
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [nutritionistName, setNutritionistName] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('Evaluasi ulang dalam 1-2 minggu sesuai perkembangan pasien.');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [carbTarget, setCarbTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');
  const [sodiumTarget, setSodiumTarget] = useState('');
  const [fluidTarget, setFluidTarget] = useState('');
  const isInstitutionMode = appMode === 'institution';

  const summary = useMemo(() => {
    if (assessment?.status_summary) {
      return assessment.status_summary;
    }
    return 'Isi data dasar sesuai kondisi pasien, lalu tekan Analisis Status Gizi.';
  }, [assessment]);

  const recommendations = useMemo(() => {
    if (assessment?.recommendations?.length) {
      return assessment.recommendations;
    }
    return [
      `Tujuan utama saat ini: ${goal}.`,
      conditions ? `Pertimbangkan kondisi medis: ${conditions}.` : 'Tambahkan kondisi medis bila ada agar rekomendasi lebih spesifik.',
    ];
  }, [assessment, goal, conditions]);

  const groupInputHint = useMemo(() => {
    return {
      infant: 'Bayi: isi usia dalam bulan, berat, panjang badan, lingkar kepala, dan MUAC bila tersedia.',
      toddler: 'Balita: isi usia dalam bulan, berat, panjang/tinggi badan, MUAC, dan lingkar kepala bila dipantau.',
      child_adolescent: 'Anak/remaja: isi usia dalam tahun, berat, tinggi badan, dan MUAC bila tersedia.',
      adult: 'Dewasa: isi usia, berat, tinggi, lingkar perut, aktivitas, dan riwayat penurunan berat badan bila ada.',
      elderly: 'Lansia: tambahkan perhatian pada riwayat penurunan berat badan, LILA, fungsi makan, dan aktivitas.',
      pregnant: 'Ibu hamil: isi trimester, usia kehamilan, berat pra-hamil, LILA, dan kondisi klinis terkait.',
      lactating: 'Ibu menyusui: isi status ASI eksklusif, usia anak, berat/tinggi ibu, dan kebutuhan cairan.',
    }[patientGroup];
  }, [patientGroup]);

  const derivedAge = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const totalMonths = Math.max(0, years * 12 + months);
    return { years: Math.max(0, years), months: totalMonths };
  }, [birthDate]);

  function reportTypeLabel(value: ReportType): string {
    if (value === 'nutritionist') return 'Petugas Gizi';
    if (value === 'medical') return 'Petugas Medis';
    return 'Pribadi';
  }

  useEffect(() => {
    if (appMode === 'personal') {
      setReportType('personal');
    }
  }, [appMode]);

  useEffect(() => {
    if (params.mode === 'institution' || params.mode === 'personal') {
      setAppMode(params.mode);
    }
  }, [params.mode]);

  useEffect(() => {
    if (!params.mode) {
      router.replace('/welcome');
    }
  }, [params.mode]);

  useEffect(() => {
    saveSharedPatientContext({
      appMode,
      patientName,
      patientGroup,
      institutionName,
      institutionAddress,
      patientAddress,
      visitDate,
      visitTime,
      goal,
      medicalConditions: conditions,
      calorieTarget,
      proteinTarget,
      carbTarget,
      fatTarget,
      sodiumTarget,
      fluidTarget,
      ingredientFocus: patientGroup === 'infant' || patientGroup === 'toddler' ? 'ayam' : 'tempe',
      latestSummary: summary,
      latestAssessment: assessment,
    });
  }, [
    appMode,
    patientName,
    patientGroup,
    institutionName,
    institutionAddress,
    patientAddress,
    visitDate,
    visitTime,
    goal,
    conditions,
    calorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
    sodiumTarget,
    fluidTarget,
    summary,
    assessment,
  ]);

  function patientGroupLabel(value: PatientGroup): string {
    return {
      infant: 'Bayi',
      toddler: 'Balita',
      child_adolescent: 'Anak / Remaja',
      adult: 'Dewasa',
      elderly: 'Lansia',
      pregnant: 'Ibu Hamil',
      lactating: 'Ibu Menyusui',
    }[value];
  }

  async function handleAnalyze() {
    try {
      const result = await analyzeAssessment({
        patient_group: patientGroup,
        sex,
        goal,
        age_years: derivedAge ? derivedAge.years : ageYears ? Number(ageYears) : undefined,
        age_months:
          ['infant', 'toddler'].includes(patientGroup)
            ? derivedAge
              ? derivedAge.months
              : ageMonths
                ? Number(ageMonths)
                : undefined
            : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        height_cm: height ? Number(height) : undefined,
        length_cm: length ? Number(length) : undefined,
        head_circumference_cm: headCircumference ? Number(headCircumference) : undefined,
        muac_cm: muac ? Number(muac) : undefined,
        waist_cm: waist ? Number(waist) : undefined,
        edema,
        recent_weight_loss: recentWeightLoss,
        activity_level: patientGroup === 'adult' || patientGroup === 'elderly' ? (activity as any) : undefined,
        pregnancy_trimester: patientGroup === 'pregnant' ? pregnancyTrimester : undefined,
        gestational_age_weeks: patientGroup === 'pregnant' && gestationalWeeks ? Number(gestationalWeeks) : undefined,
        pre_pregnancy_weight_kg: patientGroup === 'pregnant' && prePregnancyWeight ? Number(prePregnancyWeight) : undefined,
        breastfeeding_exclusive: patientGroup === 'lactating' ? breastfeedingExclusive : undefined,
        breastfeeding_child_age_months:
          patientGroup === 'lactating' && breastfeedingChildAgeMonths ? Number(breastfeedingChildAgeMonths) : undefined,
        clinical_context: clinicalContext || undefined,
        medical_conditions: conditions || undefined,
      });

      setAssessment(result);

      if (result.nutrition_targets.calorie_target_kcal && !calorieTarget) {
        setCalorieTarget(String(result.nutrition_targets.calorie_target_kcal));
      }
      if (result.nutrition_targets.protein_g && !proteinTarget) {
        setProteinTarget(String(result.nutrition_targets.protein_g));
      }
      if (result.nutrition_targets.carbs_g && !carbTarget) {
        setCarbTarget(String(result.nutrition_targets.carbs_g));
      }
      if (result.nutrition_targets.fat_g && !fatTarget) {
        setFatTarget(String(result.nutrition_targets.fat_g));
      }
      if (result.nutrition_targets.sodium_mg && !sodiumTarget) {
        setSodiumTarget(String(result.nutrition_targets.sodium_mg));
      }
      if (result.nutrition_targets.fluid_ml && !fluidTarget) {
        setFluidTarget(String(result.nutrition_targets.fluid_ml));
      }
    } catch (error) {
      Alert.alert('Gagal analisis', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  function applySuggestedTargets() {
    if (!assessment?.nutrition_targets) {
      Alert.alert('Belum ada target otomatis', 'Jalankan analisis status gizi terlebih dahulu.');
      return;
    }
    const targets = assessment.nutrition_targets;
    setCalorieTarget(targets.calorie_target_kcal ? String(targets.calorie_target_kcal) : '');
    setProteinTarget(targets.protein_g ? String(targets.protein_g) : '');
    setCarbTarget(targets.carbs_g ? String(targets.carbs_g) : '');
    setFatTarget(targets.fat_g ? String(targets.fat_g) : '');
    setSodiumTarget(targets.sodium_mg ? String(targets.sodium_mg) : '');
    setFluidTarget(targets.fluid_ml ? String(targets.fluid_ml) : '');
  }

  async function handleExport(format: 'pdf' | 'csv' | 'doc' | 'xlsx') {
    try {
      const blob = await exportSummary(
        {
          app_mode: appMode,
          patient_name: patientName || 'Pengguna NutriCore AI',
          patient_group: patientGroupLabel(patientGroup),
          institution_name: isInstitutionMode ? institutionName || '-' : 'Catatan Pribadi',
          institution_address: isInstitutionMode ? institutionAddress || '-' : '-',
          patient_address: patientAddress || '-',
          medical_record_number: isInstitutionMode ? medicalRecordNumber || '-' : '-',
          visit_number: isInstitutionMode ? visitNumber || '-' : '-',
          payment_type: isInstitutionMode ? paymentType || '-' : '-',
          guarantor_name: isInstitutionMode ? guarantorName || '-' : '-',
          national_id: isInstitutionMode ? nationalId || '-' : '-',
          bpjs_number: isInstitutionMode ? bpjsNumber || '-' : '-',
          referral_source: isInstitutionMode ? referralSource || '-' : '-',
          birth_date: birthDate || '-',
          visit_date: visitDate || '-',
          visit_time: visitTime || '-',
          printed_at: new Date().toLocaleString('id-ID'),
          age:
            patientGroup === 'infant' || patientGroup === 'toddler'
              ? `${derivedAge?.months ?? ageMonths ?? '-'} bulan`
              : `${derivedAge?.years ?? ageYears ?? '-'} tahun`,
          weight_kg: weight,
          height_cm: height || length,
          activity_level: activity,
          goal,
          medical_conditions: conditions,
          summary,
          recommendations,
          notes:
            'Dokumen ini dapat dipakai sebagai catatan tracking pribadi, bahan konseling gizi, maupun catatan pendamping untuk petugas medis.',
          report_type: reportType,
          clinician_name: clinicianName,
          nutritionist_name: nutritionistName,
          follow_up_plan: followUpPlan,
          calorie_target_kcal: calorieTarget,
          protein_g: proteinTarget,
          carbs_g: carbTarget,
          fat_g: fatTarget,
          sodium_mg: sodiumTarget,
          fluid_ml: fluidTarget,
          soap_subjective: assessment?.soap_note?.subjective ?? '-',
          soap_objective: assessment?.soap_note?.objective ?? '-',
          soap_assessment: assessment?.soap_note?.assessment ?? '-',
          soap_plan: assessment?.soap_note?.plan ?? '-',
          icd10_summary:
            assessment?.icd10_codes?.map((item) => `${item.code} ${item.label}`).join('; ') ?? '-',
          report_profile_title: assessment?.report_profile?.title ?? '-',
          report_profile_focus: assessment?.report_profile?.focus?.join(', ') ?? '-',
        },
        format,
      );

      if (Platform.OS === 'web') {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `nutricore-summary.${format}`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
        setExportHistory((current) => [
          { format, reportType, createdAt: new Date().toLocaleString() },
          ...current,
        ]);
        return;
      }

      Alert.alert('Ekspor siap', `File ${format.toUpperCase()} berhasil dibuat.`);
    } catch (error) {
      Alert.alert('Gagal ekspor', 'Pastikan backend sudah direstart lalu coba lagi.');
    }
  }

  const showMonthBasedAgeField = ['infant', 'toddler'].includes(patientGroup);
  const showInfantFields = ['infant', 'toddler'].includes(patientGroup);
  const showAdultFields = ['adult', 'elderly', 'pregnant', 'lactating'].includes(patientGroup);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backToWelcomeButton}>
            <Text style={styles.backToWelcomeText}>Kembali ke Halaman Depan</Text>
          </TouchableOpacity>
          <Image source={require('@/assets/images/nutricore-brand.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.kicker}>Personal Metabolic Intelligence System</Text>
          <Text style={styles.subtitle}>
            Tampilan input disesuaikan dengan kondisi pasien: bayi, balita, anak, dewasa, lansia, ibu hamil, dan ibu menyusui.
          </Text>
          <Text style={styles.helperText}>
            Mode aktif saat ini: {isInstitutionMode ? 'Profesional' : 'Pribadi'}.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Dasar Pasien</Text>
          <Text style={styles.helperText}>{groupInputHint}</Text>
          <Text style={styles.helperText}>
            {isInstitutionMode
              ? 'Mode profesional menampilkan data resmi yang lebih lengkap untuk kebutuhan klinik, puskesmas, rumah sakit, atau institusi.'
              : 'Mode pribadi dibuat lebih ringkas. Waktu kunjungan tetap ada untuk catatan dan tracking pribadi.'}
          </Text>
          {isInstitutionMode ? (
            <>
              <Field label="Nama instansi / fasilitas" value={institutionName} onChangeText={setInstitutionName} placeholder="Contoh: Klinik / Puskesmas / Rumah Sakit / Instansi" />
              <Field
                label="Alamat instansi"
                value={institutionAddress}
                onChangeText={setInstitutionAddress}
                placeholder="Contoh: Jl. Contoh No. 1, Kota ..."
                multiline
              />
              <View style={styles.inlineFieldsRow}>
                <View style={styles.inlineField}>
                  <Field label="No. rekam medis" value={medicalRecordNumber} onChangeText={setMedicalRecordNumber} placeholder="Contoh: RM-00123" />
                </View>
                <View style={styles.inlineField}>
                  <Field label="No. kunjungan" value={visitNumber} onChangeText={setVisitNumber} placeholder="Contoh: KJ-2026-001" />
                </View>
              </View>
              <View style={styles.inlineFieldsRow}>
                <View style={styles.inlineField}>
                  <Field label="Jenis pembayaran / penjamin" value={paymentType} onChangeText={setPaymentType} placeholder="Contoh: Umum / BPJS / Asuransi / Instansi" />
                </View>
                <View style={styles.inlineField}>
                  <Field label="Nama penjamin" value={guarantorName} onChangeText={setGuarantorName} placeholder="Contoh: BPJS Kesehatan / Asuransi ..." />
                </View>
              </View>
              <View style={styles.inlineFieldsRow}>
                <View style={styles.inlineField}>
                  <Field label="NIK" value={nationalId} onChangeText={setNationalId} placeholder="Contoh: 7371..." />
                </View>
                <View style={styles.inlineField}>
                  <Field label="No. BPJS" value={bpjsNumber} onChangeText={setBpjsNumber} placeholder="Contoh: 0001..." />
                </View>
              </View>
              <Field
                label="Rujukan / konsulan dari unit / klaster"
                value={referralSource}
                onChangeText={setReferralSource}
                placeholder="Contoh: Poliklinik Penyakit Dalam / Klaster Ibu dan Anak"
              />
            </>
          ) : null}
          <View style={styles.inlineFieldsRow}>
            <View style={styles.inlineField}>
              <DateField label="Tanggal kunjungan" value={visitDate} onChangeText={setVisitDate} />
            </View>
            <View style={styles.inlineField}>
              <Field label="Waktu kunjungan" value={visitTime} onChangeText={setVisitTime} placeholder="HH:MM" />
            </View>
          </View>
          <View style={styles.inlineFieldsRow}>
            <View style={styles.inlineField}>
              <DateField label="Tanggal lahir" value={birthDate} onChangeText={setBirthDate} />
            </View>
            <View style={styles.inlineField}>
              <ReadOnlyField
                label="Umur otomatis"
                value={
                  derivedAge
                    ? patientGroup === 'infant' || patientGroup === 'toddler'
                      ? `${derivedAge.months} bulan`
                      : `${derivedAge.years} tahun`
                    : 'Akan dihitung otomatis dari tanggal lahir'
                }
              />
            </View>
          </View>
          <Field label="Nama pasien / pengguna" value={patientName} onChangeText={setPatientName} placeholder="Contoh: Ny. Siti / Bpk. Andi / An. Budi" />
          <Field
            label="Alamat pasien / pengguna"
            value={patientAddress}
            onChangeText={setPatientAddress}
            placeholder="Contoh: Jl. Melati No. 2, Makassar"
            multiline
          />
          <Text style={styles.fieldLabel}>Kategori pasien</Text>
          <View style={styles.goalRow}>
            {(['infant', 'toddler', 'child_adolescent', 'adult', 'elderly', 'pregnant', 'lactating'] as PatientGroup[]).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setPatientGroup(item);
                  if (item === 'pregnant' || item === 'lactating') {
                    setSex('female');
                  }
                }}
                style={[styles.goalChip, patientGroup === item ? styles.goalChipActive : null]}>
                <Text style={[styles.goalChipText, patientGroup === item ? styles.goalChipTextActive : null]}>
                  {patientGroupLabel(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Jenis kelamin</Text>
          <View style={styles.goalRow}>
            {(['male', 'female'] as Sex[]).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setSex(item)}
                style={[styles.goalChip, sex === item ? styles.goalChipActive : null]}>
                <Text style={[styles.goalChipText, sex === item ? styles.goalChipTextActive : null]}>
                  {item === 'male' ? 'Laki-laki' : 'Perempuan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showMonthBasedAgeField && !birthDate ? (
            <Field label="Usia (bulan)" value={ageMonths} onChangeText={setAgeMonths} placeholder="Contoh: 18" />
          ) : !birthDate ? (
            <Field
              label={patientGroup === 'child_adolescent' ? 'Usia (tahun)' : 'Usia (tahun)'}
              value={ageYears}
              onChangeText={setAgeYears}
              placeholder={patientGroup === 'child_adolescent' ? 'Contoh: 8' : 'Contoh: 35'}
            />
          ) : null}

          <Field label="Berat badan (kg)" value={weight} onChangeText={setWeight} placeholder="Contoh: 68" />
          {showInfantFields ? (
            <Field label="Panjang badan (cm)" value={length} onChangeText={setLength} placeholder="Contoh: 72" />
          ) : (
            <Field label="Tinggi badan (cm)" value={height} onChangeText={setHeight} placeholder="Contoh: 165" />
          )}
          {showInfantFields ? (
            <Field
              label="Lingkar kepala (cm)"
              value={headCircumference}
              onChangeText={setHeadCircumference}
              placeholder="Contoh: 45"
            />
          ) : null}
          <Field label="MUAC / LILA (cm)" value={muac} onChangeText={setMuac} placeholder="Contoh: 23.5" />
          {showAdultFields ? (
            <Field label="Lingkar perut (cm)" value={waist} onChangeText={setWaist} placeholder="Contoh: 88" />
          ) : null}

          {patientGroup === 'adult' || patientGroup === 'elderly' ? (
            <Field
              label="Aktivitas fisik"
              value={activity}
              onChangeText={setActivity}
              placeholder="sedentary, light, moderate, active, very_active"
            />
          ) : null}

          {patientGroup === 'pregnant' ? (
            <>
              <Text style={styles.fieldLabel}>Trimester</Text>
              <View style={styles.goalRow}>
                {(['first', 'second', 'third'] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setPregnancyTrimester(item)}
                    style={[styles.goalChip, pregnancyTrimester === item ? styles.goalChipActive : null]}>
                    <Text style={[styles.goalChipText, pregnancyTrimester === item ? styles.goalChipTextActive : null]}>
                      {item === 'first' ? 'Trimester 1' : item === 'second' ? 'Trimester 2' : 'Trimester 3'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Usia kehamilan (minggu)" value={gestationalWeeks} onChangeText={setGestationalWeeks} placeholder="Contoh: 24" />
              <Field
                label="Berat badan pra-hamil (kg)"
                value={prePregnancyWeight}
                onChangeText={setPrePregnancyWeight}
                placeholder="Contoh: 54"
              />
            </>
          ) : null}

          {patientGroup === 'lactating' ? (
            <>
              <SwitchRow
                label="ASI eksklusif"
                value={breastfeedingExclusive}
                onValueChange={setBreastfeedingExclusive}
              />
              <Field
                label="Usia anak yang disusui (bulan)"
                value={breastfeedingChildAgeMonths}
                onChangeText={setBreastfeedingChildAgeMonths}
                placeholder="Contoh: 4"
              />
            </>
          ) : null}

          <SwitchRow label="Edema" value={edema} onValueChange={setEdema} />
          <SwitchRow label="Riwayat penurunan BB" value={recentWeightLoss} onValueChange={setRecentWeightLoss} />

          <Field
            label="Kondisi medis / diagnosis"
            value={conditions}
            onChangeText={setConditions}
            placeholder="Contoh: Diabetes, hipertensi, CKD stage 2"
            multiline
          />
          <Field
            label="Konteks klinis tambahan"
            value={clinicalContext}
            onChangeText={setClinicalContext}
            placeholder="Contoh: demam, nafsu makan turun, pasca rawat inap, infeksi berulang."
            multiline
          />
          <Text style={styles.fieldLabel}>Tujuan</Text>
          <View style={styles.goalRow}>
            {(['Weight loss', 'Weight gain', 'Maintenance', 'Metabolic improvement'] as Goal[]).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setGoal(item)}
                style={[styles.goalChip, goal === item ? styles.goalChipActive : null]}>
                <Text style={[styles.goalChipText, goal === item ? styles.goalChipTextActive : null]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => void handleAnalyze()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Analisis Status Gizi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Interpretasi Otomatis</Text>
          <Text style={styles.summaryText}>{summary}</Text>
          {assessment?.risk_flags?.length ? (
            <>
              <Text style={styles.subsectionTitle}>Risk Flags</Text>
              {assessment.risk_flags.map((item, index) => (
                <Text key={index} style={styles.bulletText}>• {item}</Text>
              ))}
            </>
          ) : null}
          {assessment?.metrics ? (
            <>
              <Text style={styles.subsectionTitle}>Parameter</Text>
              {Object.entries(assessment.metrics).map(([key, value]) => (
                <Text key={key} style={styles.metricText}>
                  {formatMetricLabel(key)}: {String(value)}
                </Text>
              ))}
            </>
          ) : null}
          {assessment?.nutrition_targets ? (
            <>
              <Text style={styles.subsectionTitle}>Target Nutrisi Otomatis</Text>
              {Object.entries(assessment.nutrition_targets).map(([key, value]) => (
                <Text key={key} style={styles.metricText}>
                  {formatMetricLabel(key)}: {value == null ? '-' : String(value)}
                </Text>
              ))}
            </>
          ) : null}
          {assessment?.disease_diet_rules?.length ? (
            <>
              <Text style={styles.subsectionTitle}>Aturan Diet Penyakit</Text>
              {assessment.disease_diet_rules.map((item, index) => (
                <Text key={index} style={styles.bulletText}>• {item}</Text>
              ))}
            </>
          ) : null}
          {assessment?.recommendations?.length ? (
            <>
              <Text style={styles.subsectionTitle}>Rekomendasi</Text>
              {assessment.recommendations.map((item, index) => (
                <Text key={index} style={styles.bulletText}>• {item}</Text>
              ))}
            </>
          ) : null}
          {assessment?.monitoring_plan?.length ? (
            <>
              <Text style={styles.subsectionTitle}>Monitoring</Text>
              {assessment.monitoring_plan.map((item, index) => (
                <Text key={index} style={styles.bulletText}>• {item}</Text>
              ))}
            </>
          ) : null}
          {assessment?.guideline_notes?.length ? (
            <>
              <Text style={styles.subsectionTitle}>Catatan Guideline</Text>
              {assessment.guideline_notes.map((item, index) => (
                <Text key={index} style={styles.guidelineText}>• {item}</Text>
              ))}
            </>
          ) : null}
        </View>

        {assessment?.growth_charts?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Growth Chart Otomatis</Text>
            <Text style={styles.helperText}>
              Grafik ini membantu melihat posisi pengukuran pasien terhadap band referensi WHO pada indikator yang tersedia.
            </Text>
            {assessment.growth_charts.map((chart, index) => (
              <GrowthChartCard key={`${chart.title}-${index}`} chart={chart} />
            ))}
          </View>
        ) : null}

        {assessment?.soap_note ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SOAP Klinis</Text>
            <Text style={styles.soapLine}><Text style={styles.soapLabel}>S:</Text> {assessment.soap_note.subjective}</Text>
            <Text style={styles.soapLine}><Text style={styles.soapLabel}>O:</Text> {assessment.soap_note.objective}</Text>
            <Text style={styles.soapLine}><Text style={styles.soapLabel}>A:</Text> {assessment.soap_note.assessment}</Text>
            <Text style={styles.soapLine}><Text style={styles.soapLabel}>P:</Text> {assessment.soap_note.plan}</Text>
          </View>
        ) : null}

        {assessment?.icd10_codes?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ICD-10 Pendamping</Text>
            <Text style={styles.helperText}>
              Kode di bawah ini adalah pendamping awal dari aplikasi dan tetap perlu finalisasi klinis oleh tenaga kesehatan.
            </Text>
            {assessment.icd10_codes.map((item) => (
              <View key={item.code} style={styles.icdCard}>
                <Text style={styles.icdCode}>{item.code}</Text>
                <Text style={styles.icdTitle}>{item.label}</Text>
                <Text style={styles.icdReason}>{item.reason}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {assessment?.report_profile ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profil Laporan Klinis</Text>
            <Text style={styles.summaryText}>{assessment.report_profile.title}</Text>
            {assessment.report_profile.focus.map((item, index) => (
              <Text key={index} style={styles.bulletText}>• {item}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Target Nutrisi & Catatan Profesional</Text>
          <Text style={styles.helperText}>
            Bagian ini otomatis terisi setelah analisis pertama sesuai kondisi individu, tetapi tetap bisa Anda edit manual bila perlu.
          </Text>
          <TouchableOpacity onPress={applySuggestedTargets} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionText}>Gunakan Ulang Target Otomatis</Text>
          </TouchableOpacity>
          <Field label="Kalori target (kcal)" value={calorieTarget} onChangeText={setCalorieTarget} placeholder="Contoh: 1800" />
          <Field label="Protein (g)" value={proteinTarget} onChangeText={setProteinTarget} placeholder="Contoh: 65" />
          <Field label="Karbohidrat (g)" value={carbTarget} onChangeText={setCarbTarget} placeholder="Contoh: 220" />
          <Field label="Lemak (g)" value={fatTarget} onChangeText={setFatTarget} placeholder="Contoh: 55" />
          <Field label="Natrium (mg)" value={sodiumTarget} onChangeText={setSodiumTarget} placeholder="Contoh: 1500" />
          <Field label="Cairan (mL)" value={fluidTarget} onChangeText={setFluidTarget} placeholder="Contoh: 2000" />
          <Field label="Nama petugas gizi" value={nutritionistName} onChangeText={setNutritionistName} placeholder="Contoh: S.Gz. ..." />
          <Field label="Nama petugas medis" value={clinicianName} onChangeText={setClinicianName} placeholder="Contoh: dr. ..." />
          <Field
            label="Rencana tindak lanjut"
            value={followUpPlan}
            onChangeText={setFollowUpPlan}
            placeholder="Contoh: Monitoring 1 minggu, review diet, evaluasi tekanan darah."
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ekspor Dokumen</Text>
          <Text style={styles.helperText}>
            Unduh ringkasan hasil, rekomendasi, dan data menjadi laporan formal untuk pribadi, petugas gizi, atau petugas medis.
          </Text>
          <Text style={styles.fieldLabel}>Template laporan</Text>
          <View style={styles.goalRow}>
            {(isInstitutionMode
              ? (['personal', 'nutritionist', 'medical'] as ReportType[])
              : (['personal'] as ReportType[])
            ).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setReportType(item)}
                style={[styles.goalChip, reportType === item ? styles.goalChipActive : null]}>
                <Text style={[styles.goalChipText, reportType === item ? styles.goalChipTextActive : null]}>
                  {reportTypeLabel(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.exportRow}>
            <TouchableOpacity onPress={() => void handleExport('pdf')} style={styles.exportButton}>
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void handleExport('doc')} style={styles.exportButtonSecondary}>
              <Text style={styles.exportButtonTextSecondary}>Export DOC</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void handleExport('csv')} style={styles.exportButtonSecondary}>
              <Text style={styles.exportButtonTextSecondary}>Spreadsheet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void handleExport('xlsx')} style={styles.exportButtonSecondary}>
              <Text style={styles.exportButtonTextSecondary}>Excel (.xlsx)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Riwayat Ekspor</Text>
          {exportHistory.length === 0 ? (
            <Text style={styles.summaryText}>Belum ada file yang diekspor pada sesi ini.</Text>
          ) : (
            exportHistory.map((item, index) => (
              <View key={`${item.createdAt}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyTitle}>
                  {item.format.toUpperCase()} • {reportTypeLabel(item.reportType)}
                </Text>
                <Text style={styles.historyTime}>{item.createdAt}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#95A2B3"
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        multiline={multiline}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {/* react-native-web renders standard DOM input for calendar picking */}
        <input
          type="date"
          value={value}
          onChange={(event) => onChangeText(event.currentTarget.value)}
          style={{
            backgroundColor: COLORS.input,
            borderRadius: 14,
            border: `1px solid ${COLORS.line}`,
            padding: '12px 14px',
            fontSize: 14,
            color: COLORS.text,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  return <Field label={label} value={value} onChangeText={onChangeText} placeholder="YYYY-MM-DD" />;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{value}</Text>
      </View>
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: COLORS.blue }} />
    </View>
  );
}

function GrowthChartCard({
  chart,
}: {
  chart: AssessmentResult['growth_charts'][number];
}) {
  const chartWidth = 320;
  const chartHeight = 180;
  const yValues = chart.reference_points.flatMap((point) => [
    point.sd_minus_3 ?? 0,
    point.sd_minus_2 ?? 0,
    point.median ?? 0,
    point.sd_plus_2 ?? 0,
    point.sd_plus_3 ?? 0,
  ]);
  yValues.push(chart.patient_point.y);
  const validYValues = yValues.filter((value) => Number.isFinite(value));
  const minY = Math.min(...validYValues);
  const maxY = Math.max(...validYValues);
  const xValues = chart.reference_points.map((point) => point.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  function yPercent(value?: number) {
    if (value == null || maxY === minY) return chartHeight / 2;
    const ratio = (value - minY) / (maxY - minY);
    return chartHeight - ratio * chartHeight;
  }

  function xPercent(value: number) {
    if (maxX === minX) return chartWidth / 2;
    const ratio = (value - minX) / (maxX - minX);
    return ratio * chartWidth;
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{chart.title}</Text>
      <View style={styles.chartFrame}>
        {chart.reference_points.map((point, index) => (
          <View
            key={`${chart.title}-${index}`}
            style={[
              styles.chartBand,
              {
                left: xPercent(point.x),
                top: yPercent(point.sd_plus_2),
                height:
                  maxY === minY || point.sd_plus_2 == null || point.sd_minus_2 == null
                    ? 0
                    : ((point.sd_plus_2 - point.sd_minus_2) / (maxY - minY)) * chartHeight,
              },
            ]}
          />
        ))}
        {chart.reference_points.map((point, index) => (
          <View
            key={`${chart.title}-median-${index}`}
            style={[
              styles.chartMedianDot,
              {
                left: xPercent(point.x),
                top: yPercent(point.median),
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.chartPatientDot,
            {
              left: xPercent(chart.patient_point.x),
              top: yPercent(chart.patient_point.y),
            },
          ]}
        />
      </View>
      <View style={styles.chartLegendRow}>
        <Text style={styles.chartLegendText}>Band hijau: kisaran -2 s/d +2 SD</Text>
        <Text style={styles.chartLegendText}>Titik biru: median WHO</Text>
        <Text style={styles.chartLegendText}>Titik merah: pasien</Text>
      </View>
      <Text style={styles.chartAxisText}>
        {chart.x_label}: {minX} - {maxX} | {chart.y_label}: {minY.toFixed(1)} - {maxY.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, gap: 16 },
  welcomeSafeArea: { flex: 1, backgroundColor: '#06142D' },
  welcomeContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06142D',
  },
  welcomeCard: {
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
  welcomeGlowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(47,179,74,0.18)',
    top: -110,
    right: -90,
  },
  welcomeGlowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(31,78,148,0.24)',
    bottom: -150,
    left: -120,
  },
  welcomeLogoPlate: {
    width: 170,
    height: 170,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  welcomeLogo: { width: 134, height: 134 },
  welcomeTitleTop: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeTitleBottom: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeTitleAccent: { color: '#88D84C' },
  welcomeSubtitle: {
    color: '#D6E1F0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 300,
  },
  welcomePrimaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#5CCF46',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomePrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  welcomeSecondaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#1E4F97',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeSecondaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  welcomeGhostButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeGhostText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  welcomeModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  welcomeModeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  welcomeModeChipText: { color: '#DCE9F7', fontSize: 12, fontWeight: '700' },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  backToWelcomeButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#EEF4F8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  backToWelcomeText: { color: COLORS.blue, fontSize: 13, fontWeight: '800' },
  logo: { width: 240, height: 116, marginBottom: 12 },
  kicker: {
    color: COLORS.green,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  subsectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  helperText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  field: { marginTop: 10 },
  inlineFieldsRow: { flexDirection: 'row', gap: 10 },
  inlineField: { flex: 1 },
  fieldLabel: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  readOnlyBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  readOnlyText: { color: COLORS.text, fontSize: 14 },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  goalChipActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  goalChipText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  goalChipTextActive: { color: '#FFFFFF' },
  primaryButton: {
    marginTop: 16,
    backgroundColor: COLORS.blue,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryActionButton: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF4F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  secondaryActionText: { color: COLORS.blue, fontSize: 13, fontWeight: '800' },
  summaryText: { color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  metricText: { color: COLORS.text, fontSize: 13, lineHeight: 20, marginBottom: 3 },
  bulletText: { color: COLORS.text, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  guidelineText: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  chartCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#FAFCFF',
  },
  chartTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  chartFrame: {
    position: 'relative',
    height: 180,
    width: 320,
    maxWidth: '100%',
    borderRadius: 12,
    backgroundColor: '#F5F9FD',
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
  },
  chartBand: {
    position: 'absolute',
    width: 14,
    marginLeft: -7,
    backgroundColor: '#D8F1DF',
    borderRadius: 999,
    opacity: 0.95,
  },
  chartMedianDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 999,
    backgroundColor: COLORS.blue,
  },
  chartPatientDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 999,
    backgroundColor: '#D94F45',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartLegendRow: { marginTop: 8, gap: 2 },
  chartLegendText: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  chartAxisText: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  soapLine: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginBottom: 6 },
  soapLabel: { fontWeight: '800' },
  icdCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#FAFCFF',
  },
  icdCode: { color: COLORS.blue, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  icdTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  icdReason: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  exportButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonSecondary: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  exportButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  exportButtonTextSecondary: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  historyRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  historyTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  historyTime: { color: COLORS.muted, fontSize: 12 },
});
