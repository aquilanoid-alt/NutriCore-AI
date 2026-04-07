import { getApiBaseUrl } from './guide';

export type TrackingResult = {
  items: Array<{ name: string; matched: boolean; calories?: number; protein?: number; carbs?: number; fat?: number }>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
  adherence_percent: { calories: number; protein: number; carbs: number; fat: number };
  exercise_recommendation: string;
  daily_schedule: Array<{ time: string; activity: string }>;
};

export async function analyzeDailyTracking(payload: {
  food_text: string;
  calorie_target_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  goal?: string;
}): Promise<TrackingResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/tracking/analyze-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze daily tracking');
  }

  return (await response.json()) as TrackingResult;
}
