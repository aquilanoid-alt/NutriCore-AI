const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export type GuideMetadata = {
  name: string;
  tagline: string;
  developer: string;
  created_at_label: string;
  language: string;
  file_name: string;
  file_size_bytes: number;
  download_url: string;
  share_channels: string[];
};

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getGuideFileUrl(): string {
  return `${API_BASE_URL}/api/v1/resources/guide/file`;
}

export async function getGuideMetadata(): Promise<GuideMetadata> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resources/guide`);

  if (!response.ok) {
    throw new Error('Failed to load guide metadata');
  }

  return (await response.json()) as GuideMetadata;
}
