import { getApiBaseUrl } from './guide';

export type RecipeResult = {
  recipes: Array<{
    meal_type: string;
    schedule_time: string;
    title: string;
    ingredients: Array<{ name: string; grams: number; household_measure: string; measure_note: string }>;
    instructions: string[];
    nutrition: { calories: number; protein: number; carbs: number; fat: number };
    personalization_notes: string;
  }>;
  plan_variants: Array<{
    variant_name: string;
    day_plan_notes: string[];
    total_planned_calories: number;
    recipes: Array<{
      meal_type: string;
      schedule_time: string;
      title: string;
      ingredients: Array<{ name: string; grams: number; household_measure: string; measure_note: string }>;
      instructions: string[];
      nutrition: { calories: number; protein: number; carbs: number; fat: number };
      personalization_notes: string;
    }>;
  }>;
  modifier_notes: string[];
  plan_type: string;
  target_calories: number;
  total_planned_calories: number;
  clarification: string;
  measurement_guidance: string;
  measurement_sources: string[];
};

export async function generateRecipes(payload: {
  ingredient: string;
  medical_conditions?: string;
  calorie_target_kcal?: number;
  patient_group?: string;
  product_label_context?: string;
}): Promise<RecipeResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/recipes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to generate recipes');
  }

  return (await response.json()) as RecipeResult;
}

export async function exportRecipePlanPdf(payload: {
  ingredient: string;
  medical_conditions?: string;
  calorie_target_kcal?: number;
  patient_group?: string;
  product_label_context?: string;
  variant_index: number;
}): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/recipes/export-plan-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to export recipe pdf');
  }

  return await response.blob();
}
