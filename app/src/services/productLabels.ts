import { getApiBaseUrl } from './guide';

export type ProductLabelAnalysis = {
  status: 'green' | 'yellow' | 'red';
  status_label: string;
  status_color: string;
  reason: string;
  recommended_serving: string;
  summary: string;
};

export type ProductLabelScanResult = {
  ocr_text: string;
  product_name: string;
  serving_size_g?: number | null;
  calories_kcal?: number | null;
  carbs_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  saturated_fat_g?: number | null;
  protein_g?: number | null;
  fiber_g?: number | null;
  confidence_label: string;
};

export async function analyzeProductLabel(payload: {
  product_name: string;
  serving_size_g: number;
  calories_kcal: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
  protein_g: number;
  fiber_g: number;
  medical_conditions?: string;
  calorie_target_kcal?: number;
}): Promise<ProductLabelAnalysis> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/product-labels/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze product label');
  }

  return (await response.json()) as ProductLabelAnalysis;
}

export async function scanProductLabelImage(payload: {
  image_data_url: string;
  crop_left?: number;
  crop_top?: number;
  crop_right?: number;
  crop_bottom?: number;
}): Promise<ProductLabelScanResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/product-labels/scan-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to scan product label');
  }

  return (await response.json()) as ProductLabelScanResult;
}
