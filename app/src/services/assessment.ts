import { getApiBaseUrl } from './guide';

export type PatientGroup =
  | 'infant'
  | 'toddler'
  | 'child_adolescent'
  | 'adult'
  | 'elderly'
  | 'pregnant'
  | 'lactating';

export type AssessmentPayload = {
  patient_group: PatientGroup;
  sex: 'male' | 'female';
  goal?: string;
  age_months?: number;
  age_years?: number;
  weight_kg?: number;
  height_cm?: number;
  length_cm?: number;
  head_circumference_cm?: number;
  muac_cm?: number;
  waist_cm?: number;
  edema: boolean;
  recent_weight_loss: boolean;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  pregnancy_trimester?: 'first' | 'second' | 'third';
  gestational_age_weeks?: number;
  pre_pregnancy_weight_kg?: number;
  breastfeeding_exclusive?: boolean;
  breastfeeding_child_age_months?: number;
  clinical_context?: string;
  medical_conditions?: string;
};

export type AssessmentResult = {
  patient_group: PatientGroup;
  metrics: Record<string, string | number | boolean>;
  nutrition_targets: Record<string, string | number | boolean | null>;
  disease_diet_rules: string[];
  growth_charts: Array<{
    title: string;
    x_label: string;
    y_label: string;
    patient_point: { x: number; y: number };
    reference_points: Array<{
      x: number;
      sd_minus_3?: number;
      sd_minus_2?: number;
      median?: number;
      sd_plus_2?: number;
      sd_plus_3?: number;
    }>;
  }>;
  soap_note: Record<string, string>;
  icd10_codes: Array<{ code: string; label: string; reason: string }>;
  report_profile: { title: string; focus: string[]; summary: string };
  status_summary: string;
  risk_flags: string[];
  recommendations: string[];
  monitoring_plan: string[];
  guideline_notes: string[];
};

export async function analyzeAssessment(payload: AssessmentPayload): Promise<AssessmentResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/assessment/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze assessment');
  }

  return (await response.json()) as AssessmentResult;
}
