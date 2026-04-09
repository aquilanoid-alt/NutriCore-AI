import { Platform } from 'react-native';

import type { PatientGroup, AssessmentResult } from './assessment';

export type AppMode = 'personal' | 'institution';

export type SharedPatientContext = {
  appMode: AppMode;
  patientName: string;
  patientGroup: PatientGroup;
  institutionName: string;
  institutionAddress: string;
  patientAddress: string;
  visitDate: string;
  visitTime: string;
  goal: string;
  medicalConditions: string;
  calorieTarget: string;
  proteinTarget: string;
  carbTarget: string;
  fatTarget: string;
  sodiumTarget: string;
  fluidTarget: string;
  ingredientFocus: string;
  latestSummary: string;
  latestProductLabelSummary?: string;
  latestProductLabelStatus?: 'green' | 'yellow' | 'red' | '';
  latestProductLabelReason?: string;
  latestProductServingAdvice?: string;
  latestProductName?: string;
  latestProductOcrText?: string;
  latestProductImageDataUrl?: string;
  latestProductServingSize?: string;
  latestProductCalories?: string;
  latestProductCarbs?: string;
  latestProductSugar?: string;
  latestProductSodium?: string;
  latestProductSatFat?: string;
  latestProductProtein?: string;
  latestProductFiber?: string;
  latestAssessment?: AssessmentResult | null;
};

const STORAGE_KEY = 'nutricore-shared-context';
const MODE_STORAGE_KEY = 'nutricore-selected-mode';
let memoryContext: SharedPatientContext | null = null;
let memoryMode: AppMode | null = null;

export function saveSharedPatientContext(context: SharedPatientContext) {
  memoryContext = context;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }
}

export function loadSharedPatientContext(): SharedPatientContext | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryContext;
    try {
      const parsed = JSON.parse(raw) as SharedPatientContext;
      memoryContext = parsed;
      return parsed;
    } catch {
      return memoryContext;
    }
  }
  return memoryContext;
}

export function saveSelectedAppMode(mode: AppMode) {
  memoryMode = mode;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}

export function loadSelectedAppMode(): AppMode | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (raw === 'personal' || raw === 'institution') {
      memoryMode = raw;
      return raw;
    }
    return memoryMode;
  }
  return memoryMode;
}
