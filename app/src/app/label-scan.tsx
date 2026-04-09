import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { loadSharedPatientContext, saveSharedPatientContext } from '@/services/session';
import { analyzeProductLabel, scanProductLabelImage, type ProductLabelAnalysis, type ProductLabelScanResult } from '@/services/productLabels';

const COLORS = {
  background: '#F7F4EE',
  card: '#FFFFFF',
  text: '#10233F',
  muted: '#61728A',
  green: '#2FB34A',
  blue: '#1F4E94',
  yellow: '#F5B301',
  red: '#D94F45',
  line: '#DCE5EE',
  input: '#F8FAFC',
};

type CropRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const DEFAULT_CROP: CropRect = {
  left: 0.08,
  top: 0.16,
  right: 0.92,
  bottom: 0.9,
};

export default function LabelScanScreen() {
  const [patientGroup, setPatientGroup] = useState('');
  const [conditions, setConditions] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('1800');
  const [sodiumTarget, setSodiumTarget] = useState('');
  const [productName, setProductName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [productCalories, setProductCalories] = useState('');
  const [productCarbs, setProductCarbs] = useState('');
  const [productSugar, setProductSugar] = useState('');
  const [productSodium, setProductSodium] = useState('');
  const [productSatFat, setProductSatFat] = useState('');
  const [productProtein, setProductProtein] = useState('');
  const [productFiber, setProductFiber] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [labelResult, setLabelResult] = useState<ProductLabelAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');

  function numericValueToString(value: number | null | undefined, fallback: string): string {
    if (value != null) {
      return String(value);
    }
    return fallback;
  }

  useFocusEffect(
    React.useCallback(() => {
      const context = loadSharedPatientContext();
      if (!context) return;
      setPatientGroup(context.patientGroup || '');
      setConditions(context.medicalConditions || '');
      if (context.calorieTarget) setCalorieTarget(context.calorieTarget);
      if (context.sodiumTarget) setSodiumTarget(context.sodiumTarget);
      setProductName(context.latestProductName || '');
      setOcrText(context.latestProductOcrText || '');
      setImageDataUrl(context.latestProductImageDataUrl || '');
    }, [])
  );

  function applyParsedLabel(parsed: ProductLabelScanResult) {
    if (parsed.product_name) setProductName(parsed.product_name);
    if (parsed.serving_size_g != null) setServingSize(String(parsed.serving_size_g));
    if (parsed.calories_kcal != null) setProductCalories(String(parsed.calories_kcal));
    if (parsed.carbs_g != null) setProductCarbs(String(parsed.carbs_g));
    if (parsed.sugar_g != null) setProductSugar(String(parsed.sugar_g));
    if (parsed.sodium_mg != null) setProductSodium(String(parsed.sodium_mg));
    if (parsed.saturated_fat_g != null) setProductSatFat(String(parsed.saturated_fat_g));
    if (parsed.protein_g != null) setProductProtein(String(parsed.protein_g));
    if (parsed.fiber_g != null) setProductFiber(String(parsed.fiber_g));
    setOcrText(parsed.ocr_text || '');

    const context = loadSharedPatientContext();
    if (context) {
      saveSharedPatientContext({
        ...context,
        latestProductName: parsed.product_name || productName || '',
        latestProductOcrText: parsed.ocr_text || '',
        latestProductImageDataUrl: imageDataUrl,
        latestProductServingSize: parsed.serving_size_g != null ? String(parsed.serving_size_g) : servingSize,
        latestProductCalories: parsed.calories_kcal != null ? String(parsed.calories_kcal) : productCalories,
        latestProductCarbs: parsed.carbs_g != null ? String(parsed.carbs_g) : productCarbs,
        latestProductSugar: parsed.sugar_g != null ? String(parsed.sugar_g) : productSugar,
        latestProductSodium: parsed.sodium_mg != null ? String(parsed.sodium_mg) : productSodium,
        latestProductSatFat: parsed.saturated_fat_g != null ? String(parsed.saturated_fat_g) : productSatFat,
        latestProductProtein: parsed.protein_g != null ? String(parsed.protein_g) : productProtein,
        latestProductFiber: parsed.fiber_g != null ? String(parsed.fiber_g) : productFiber,
      });
    }
  }

  async function runAnalysis(overrides?: Partial<ProductLabelScanResult>) {
    const response = await analyzeProductLabel({
      product_name: overrides?.product_name ?? productName ?? 'Produk',
      serving_size_g: overrides?.serving_size_g ?? Number(servingSize || 0),
      calories_kcal: overrides?.calories_kcal ?? Number(productCalories || 0),
      carbs_g: overrides?.carbs_g ?? Number(productCarbs || 0),
      sugar_g: overrides?.sugar_g ?? Number(productSugar || 0),
      sodium_mg: overrides?.sodium_mg ?? Number(productSodium || 0),
      saturated_fat_g: overrides?.saturated_fat_g ?? Number(productSatFat || 0),
      protein_g: overrides?.protein_g ?? Number(productProtein || 0),
      fiber_g: overrides?.fiber_g ?? Number(productFiber || 0),
      medical_conditions: conditions,
      calorie_target_kcal: Number(calorieTarget || 0),
    });
    setLabelResult(response);
    const context = loadSharedPatientContext();
    if (context) {
      saveSharedPatientContext({
        ...context,
        latestProductName: overrides?.product_name ?? productName ?? 'Produk',
        latestProductOcrText: overrides?.ocr_text ?? ocrText,
        latestProductImageDataUrl: imageDataUrl,
        latestProductServingSize: numericValueToString(overrides?.serving_size_g, servingSize),
        latestProductCalories: numericValueToString(overrides?.calories_kcal, productCalories),
        latestProductCarbs: numericValueToString(overrides?.carbs_g, productCarbs),
        latestProductSugar: numericValueToString(overrides?.sugar_g, productSugar),
        latestProductSodium: numericValueToString(overrides?.sodium_mg, productSodium),
        latestProductSatFat: numericValueToString(overrides?.saturated_fat_g, productSatFat),
        latestProductProtein: numericValueToString(overrides?.protein_g, productProtein),
        latestProductFiber: numericValueToString(overrides?.fiber_g, productFiber),
        latestProductLabelSummary: response.summary,
        latestProductLabelStatus: response.status,
        latestProductLabelReason: response.reason,
        latestProductServingAdvice: response.recommended_serving,
      });
    }
    return response;
  }

  async function handlePrimaryAction() {
    const hasImage = Boolean(imageDataUrl);
    const hasParsedNutrition =
      Boolean(productCalories) ||
      Boolean(productCarbs) ||
      Boolean(productSugar) ||
      Boolean(productSodium) ||
      Boolean(productSatFat) ||
      Boolean(productProtein) ||
      Boolean(productFiber);

    setIsProcessing(true);
    setStatusTone('info');
    setStatusMessage('Memproses gambar dan membaca label...');
    try {
      if (hasImage && !hasParsedNutrition) {
        const parsed = await scanProductLabelImage({
          image_data_url: imageDataUrl,
          crop_left: crop.left,
          crop_top: crop.top,
          crop_right: crop.right,
          crop_bottom: crop.bottom,
        });
        applyParsedLabel(parsed);
        const extractedCount = [
          parsed.serving_size_g,
          parsed.calories_kcal,
          parsed.carbs_g,
          parsed.sugar_g,
          parsed.sodium_mg,
          parsed.saturated_fat_g,
          parsed.protein_g,
          parsed.fiber_g,
        ].filter((value) => value != null).length;

        if (extractedCount < 2) {
          setStatusTone('error');
          setStatusMessage('Scan hanya membaca sebagian kecil label. Silakan geser crop ke area label gizi atau lengkapi data manual lalu tekan tombol lagi.');
          Alert.alert('Scan selesai sebagian', 'Foto sudah terbaca, tetapi datanya masih sedikit. Periksa dan lengkapi angka di form, lalu tekan tombol ini lagi.');
          return;
        }

        const response = await runAnalysis(parsed);
        setStatusTone('success');
        setStatusMessage(`Scan berhasil. Status produk: ${response.status_label}.`);
        Alert.alert('Scan berhasil', `${response.status_label}. Hasil analisis sudah muncul otomatis.`);
        return;
      }

      const response = await runAnalysis();
      setStatusTone('success');
      setStatusMessage(`Analisis berhasil diperbarui. Status produk: ${response.status_label}.`);
      Alert.alert('Analisis selesai', `${response.status_label}. Hasil analisis sudah diperbarui.`);
    } catch {
      setStatusTone('error');
      setStatusMessage('Scan belum berhasil. Coba pilih foto JPG/PNG atau biarkan sistem mengubah foto iPhone ke PNG terlebih dahulu, lalu ulangi scan.');
      Alert.alert('Belum berhasil', 'Coba lagi setelah foto lebih jelas, crop diarahkan ke area label gizi, atau lengkapi angka secara manual.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleImagePicked(dataUrl: string, name: string) {
    setImageDataUrl(dataUrl);
    setSelectedImageName(name);
    setCrop(DEFAULT_CROP);
    setOcrText('');
    setLabelResult(null);
    setProductName('');
    setServingSize('100');
    setProductCalories('');
    setProductCarbs('');
    setProductSugar('');
    setProductSodium('');
    setProductSatFat('');
    setProductProtein('');
    setProductFiber('');
    setStatusTone('info');
    setStatusMessage('Foto siap. Geser crop ke area label gizi lalu tekan tombol hijau.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Label</Text>
          <Text style={styles.title}>Scan & Analisis Label Gizi</Text>
          <Text style={styles.subtitle}>
            Pilih foto label dari galeri atau kamera, crop langsung di gambar, lalu tekan satu tombol untuk membaca dan menganalisis kecocokannya sesuai kondisi individu.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sinkronisasi dari Data Awal</Text>
          <Text style={styles.cardText}>Kelompok pasien: {patientGroup || '-'}</Text>
          <Text style={styles.cardText}>Kondisi medis: {conditions || '-'}</Text>
          <Text style={styles.cardText}>Target kalori: {calorieTarget || '-'} kkal</Text>
          <Text style={styles.cardText}>Target natrium: {sodiumTarget || '-'} mg</Text>
          <Text style={styles.note}>
            Data ini otomatis terbawa dari Home, jadi hasil analisis produk langsung menyesuaikan kondisi individu dan ikut terbaca oleh Recipe.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Foto Label Produk</Text>
          <Text style={styles.note}>
            `Pilih dari Galeri` cocok untuk foto yang sudah ada. `Buka Kamera` akan mencoba membuka kamera langsung bila browser/perangkat mendukung.
          </Text>
          {Platform.OS === 'web' ? (
            <ImagePickerButtons
              onPicked={handleImagePicked}
              onOpenCamera={() => setCameraOpen(true)}
            />
          ) : null}

          {cameraOpen && Platform.OS === 'web' ? (
            <WebCameraCapture
              onClose={() => setCameraOpen(false)}
              onCapture={(dataUrl) => {
                handleImagePicked(dataUrl, 'Foto Kamera');
                setCameraOpen(false);
              }}
            />
          ) : null}

          {selectedImageName ? <Text style={styles.hint}>{selectedImageName}</Text> : null}
          {statusMessage ? (
            <View
              style={[
                styles.statusPanel,
                statusTone === 'error'
                  ? styles.statusError
                  : statusTone === 'success'
                    ? styles.statusSuccess
                    : styles.statusInfo,
              ]}>
              <Text style={styles.statusPanelText}>{statusMessage}</Text>
            </View>
          ) : null}

          {imageDataUrl ? (
            <>
              <WebCropPreview imageDataUrl={imageDataUrl} crop={crop} onCropChange={setCrop} />
              <Text style={styles.cropHint}>
                Geser kotak hijau ke area `Informasi Nilai Gizi`. Jika perlu, pakai preset di bawah agar lebih cepat.
              </Text>
              <View style={styles.presetRow}>
                <TouchableOpacity onPress={() => setCrop({ left: 0, top: 0, right: 1, bottom: 1 })} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Seluruh Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCrop(DEFAULT_CROP)} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Fokus Label</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCrop({ left: 0.04, top: 0.28, right: 0.96, bottom: 0.96 })} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Bagian Bawah</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          <TouchableOpacity onPress={() => void handlePrimaryAction()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Memproses...' : imageDataUrl && !productCalories && !productCarbs && !productSugar ? 'Scan & Analisis Otomatis' : 'Analisis Sekarang'}
            </Text>
          </TouchableOpacity>

          {ocrText ? (
            <>
              <Text style={styles.label}>Teks hasil OCR</Text>
              <TextInput value={ocrText} onChangeText={setOcrText} style={[styles.input, styles.multiline]} multiline />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nilai Gizi Produk</Text>
          <Text style={styles.note}>
            Setelah scan, kolom akan terisi otomatis semaksimal mungkin. Anda bisa memperbaiki angkanya lalu tekan tombol utama yang sama untuk analisis ulang.
          </Text>
          <Text style={styles.label}>Nama produk</Text>
          <TextInput value={productName} onChangeText={setProductName} style={styles.input} />
          <Text style={styles.label}>Takaran saji</Text>
          <TextInput value={servingSize} onChangeText={setServingSize} style={styles.input} />
          <Text style={styles.label}>Energi (kkal)</Text>
          <TextInput value={productCalories} onChangeText={setProductCalories} style={styles.input} />
          <Text style={styles.label}>Karbohidrat (g)</Text>
          <TextInput value={productCarbs} onChangeText={setProductCarbs} style={styles.input} />
          <Text style={styles.label}>Gula (g)</Text>
          <TextInput value={productSugar} onChangeText={setProductSugar} style={styles.input} />
          <Text style={styles.label}>Natrium (mg)</Text>
          <TextInput value={productSodium} onChangeText={setProductSodium} style={styles.input} />
          <Text style={styles.label}>Lemak jenuh (g)</Text>
          <TextInput value={productSatFat} onChangeText={setProductSatFat} style={styles.input} />
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput value={productProtein} onChangeText={setProductProtein} style={styles.input} />
          <Text style={styles.label}>Serat (g)</Text>
          <TextInput value={productFiber} onChangeText={setProductFiber} style={styles.input} />
        </View>

        {labelResult ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hasil Analisis</Text>
            <View
              style={[
                styles.badge,
                labelResult.status === 'red' ? styles.badgeRed : labelResult.status === 'yellow' ? styles.badgeYellow : styles.badgeGreen,
              ]}>
              <Text style={styles.badgeText}>{labelResult.status_label}</Text>
            </View>
            <Text style={styles.cardText}>{labelResult.reason}</Text>
            <Text style={styles.cardText}>Anjuran: {labelResult.recommended_serving}</Text>
            <Text style={styles.note}>{labelResult.summary}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ImagePickerButtons({
  onPicked,
  onOpenCamera,
}: {
  onPicked: (dataUrl: string, name: string) => void;
  onOpenCamera: () => void;
}) {
  const galleryRef = useRef<HTMLInputElement | null>(null);

  async function readFile(file?: File | null) {
    if (!file) return;
    const normalized = await convertImageFileToPngDataUrl(file);
    onPicked(normalized.dataUrl, normalized.name);
  }

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.pickerRow}>
      <TouchableOpacity onPress={() => galleryRef.current?.click()} style={styles.pickButton}>
        <Text style={styles.pickButtonText}>Pilih dari Galeri</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenCamera} style={styles.pickButtonSecondary}>
        <Text style={styles.pickButtonSecondaryText}>Buka Kamera</Text>
      </TouchableOpacity>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          void readFile(event.currentTarget.files?.[0]);
        }}
      />
    </View>
  );
}

async function convertImageFileToPngDataUrl(file: File): Promise<{ dataUrl: string; name: string }> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(image, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(blobUrl);
        const safeName = file.name.replace(/\.[^.]+$/, '') || 'label-produk';
        resolve({ dataUrl, name: `${safeName}.png` });
      } catch (error) {
        URL.revokeObjectURL(blobUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Image decode failed'));
    };
    image.src = blobUrl;
  });
}

function WebCameraCapture({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Browser ini belum mendukung kamera langsung. Gunakan Pilih dari Galeri.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!isMounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError('Kamera tidak bisa dibuka. Izinkan akses kamera di browser atau gunakan Pilih dari Galeri.');
      }
    }

    startCamera();
    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/png'));
  }

  return (
    <div style={webStyles.cameraShell}>
      {error ? <div style={webStyles.cameraError}>{error}</div> : <video ref={videoRef} style={webStyles.cameraVideo} muted playsInline />}
      <div style={webStyles.cameraActions}>
        <button type="button" onClick={captureFrame} style={webStyles.cameraPrimaryButton}>
          Ambil Foto
        </button>
        <button type="button" onClick={onClose} style={webStyles.cameraSecondaryButton}>
          Tutup Kamera
        </button>
      </div>
    </div>
  );
}

function WebCropPreview({
  imageDataUrl,
  crop,
  onCropChange,
}: {
  imageDataUrl: string;
  crop: CropRect;
  onCropChange: (next: CropRect) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function handleMove(event: MouseEvent) {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container) return;
      const bounds = container.getBoundingClientRect();
      const dx = (event.clientX - drag.startX) / bounds.width;
      const dy = (event.clientY - drag.startY) / bounds.height;
      const minSize = 0.14;
      let next = { ...drag.startCrop };

      if (drag.mode === 'move') {
        const width = drag.startCrop.right - drag.startCrop.left;
        const height = drag.startCrop.bottom - drag.startCrop.top;
        let left = drag.startCrop.left + dx;
        let top = drag.startCrop.top + dy;
        left = Math.max(0, Math.min(1 - width, left));
        top = Math.max(0, Math.min(1 - height, top));
        next = { left, top, right: left + width, bottom: top + height };
      } else {
        if (drag.mode === 'nw' || drag.mode === 'sw') {
          next.left = Math.max(0, Math.min(drag.startCrop.right - minSize, drag.startCrop.left + dx));
        }
        if (drag.mode === 'ne' || drag.mode === 'se') {
          next.right = Math.min(1, Math.max(drag.startCrop.left + minSize, drag.startCrop.right + dx));
        }
        if (drag.mode === 'nw' || drag.mode === 'ne') {
          next.top = Math.max(0, Math.min(drag.startCrop.bottom - minSize, drag.startCrop.top + dy));
        }
        if (drag.mode === 'sw' || drag.mode === 'se') {
          next.bottom = Math.min(1, Math.max(drag.startCrop.top + minSize, drag.startCrop.bottom + dy));
        }
      }

      onCropChange(next);
    }

    function handleEnd() {
      dragRef.current = null;
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [onCropChange]);

  if (Platform.OS !== 'web') {
    return <Image source={{ uri: imageDataUrl }} style={styles.previewImage} contentFit="contain" />;
  }

  function startDrag(mode: 'move' | 'nw' | 'ne' | 'sw' | 'se', clientX: number, clientY: number) {
    dragRef.current = {
      mode,
      startX: clientX,
      startY: clientY,
      startCrop: crop,
    };
  }

  return (
    <div ref={containerRef} style={webStyles.cropShell}>
      <img src={imageDataUrl} alt="Preview label" style={webStyles.image} />
      <div
        style={{
          ...webStyles.cropBox,
          left: `${crop.left * 100}%`,
          top: `${crop.top * 100}%`,
          width: `${(crop.right - crop.left) * 100}%`,
          height: `${(crop.bottom - crop.top) * 100}%`,
        }}
        onMouseDown={(event) => startDrag('move', event.clientX, event.clientY)}>
        <div style={{ ...webStyles.handle, ...webStyles.handleNW }} onMouseDown={(event) => { event.stopPropagation(); startDrag('nw', event.clientX, event.clientY); }} />
        <div style={{ ...webStyles.handle, ...webStyles.handleNE }} onMouseDown={(event) => { event.stopPropagation(); startDrag('ne', event.clientX, event.clientY); }} />
        <div style={{ ...webStyles.handle, ...webStyles.handleSW }} onMouseDown={(event) => { event.stopPropagation(); startDrag('sw', event.clientX, event.clientY); }} />
        <div style={{ ...webStyles.handle, ...webStyles.handleSE }} onMouseDown={(event) => { event.stopPropagation(); startDrag('se', event.clientX, event.clientY); }} />
        <div style={webStyles.cropLabel}>Geser area ini</div>
      </div>
    </div>
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
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
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
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  primaryButton: { marginTop: 12, backgroundColor: COLORS.green, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  note: { color: COLORS.blue, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  hint: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
  statusPanel: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  statusInfo: { backgroundColor: '#EEF4F8', borderWidth: 1, borderColor: COLORS.line },
  statusSuccess: { backgroundColor: '#EAF8ED', borderWidth: 1, borderColor: '#BFE2C7' },
  statusError: { backgroundColor: '#FCEBE9', borderWidth: 1, borderColor: '#E7BBB5' },
  statusPanelText: { color: COLORS.text, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  cropHint: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 8 },
  previewImage: { width: '100%', height: 320, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.line, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  presetChip: {
    backgroundColor: '#EEF4F8',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipText: { color: COLORS.blue, fontSize: 12, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  badgeRed: { backgroundColor: COLORS.red },
  badgeYellow: { backgroundColor: COLORS.yellow },
  badgeGreen: { backgroundColor: COLORS.green },
  cardText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  pickButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  pickButtonSecondary: {
    backgroundColor: '#EEF4F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickButtonSecondaryText: { color: COLORS.blue, fontSize: 13, fontWeight: '800' },
});

const webStyles: Record<string, React.CSSProperties> = {
  cropShell: {
    position: 'relative',
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${COLORS.line}`,
    background: '#F8FAFC',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    userSelect: 'none',
  },
  cropBox: {
    position: 'absolute',
    border: '3px solid #2FB34A',
    borderRadius: 18,
    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
    cursor: 'move',
  },
  handle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    background: '#FFFFFF',
    border: '2px solid #2FB34A',
    boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
  },
  handleNW: { left: -9, top: -9, cursor: 'nwse-resize' },
  handleNE: { right: -9, top: -9, cursor: 'nesw-resize' },
  handleSW: { left: -9, bottom: -9, cursor: 'nesw-resize' },
  handleSE: { right: -9, bottom: -9, cursor: 'nwse-resize' },
  cropLabel: {
    position: 'absolute',
    left: 10,
    top: 10,
    background: 'rgba(15, 23, 42, 0.72)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: 999,
  },
  cameraShell: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 16,
    overflow: 'hidden',
    background: '#0F172A',
    marginBottom: 10,
  },
  cameraVideo: {
    width: '100%',
    maxHeight: 320,
    display: 'block',
    background: '#000000',
  },
  cameraError: {
    color: '#FFFFFF',
    padding: 18,
    fontSize: 14,
    lineHeight: '20px',
  },
  cameraActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    padding: '12px',
    background: '#0F172A',
  },
  cameraPrimaryButton: {
    background: COLORS.green,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  cameraSecondaryButton: {
    background: '#E5EDF5',
    color: COLORS.blue,
    border: 'none',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
