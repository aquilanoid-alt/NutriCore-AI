import { getApiBaseUrl } from './guide';

export type SummaryExportPayload = {
  app_mode: 'personal' | 'institution';
  patient_name: string;
  patient_group: string;
  institution_name: string;
  institution_address: string;
  patient_address: string;
  medical_record_number: string;
  visit_number: string;
  payment_type: string;
  guarantor_name: string;
  national_id: string;
  bpjs_number: string;
  referral_source: string;
  birth_date: string;
  visit_date: string;
  visit_time: string;
  printed_at: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  activity_level: string;
  goal: string;
  medical_conditions: string;
  summary: string;
  recommendations: string[];
  notes: string;
  report_type: 'personal' | 'nutritionist' | 'medical';
  clinician_name: string;
  nutritionist_name: string;
  follow_up_plan: string;
  calorie_target_kcal: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  sodium_mg: string;
  fluid_ml: string;
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
  icd10_summary: string;
  report_profile_title: string;
  report_profile_focus: string;
};

export async function exportSummary(payload: SummaryExportPayload, format: 'pdf' | 'csv' | 'doc' | 'xlsx'): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/exports/summary?format=${format}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to export summary');
  }

  return await response.blob();
}
