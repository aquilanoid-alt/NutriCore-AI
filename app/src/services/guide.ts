const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

function shouldUseNgrokBypassHeader(url: string): boolean {
  return url.includes('ngrok-free.app') || url.includes('ngrok-free.dev') || url.includes('ngrok.app');
}

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

export function getApiHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    ...(extraHeaders ?? {}),
  };

  // ngrok injects a browser warning page for unknown clients unless this header is sent.
  if (shouldUseNgrokBypassHeader(API_BASE_URL)) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
}

export function getGuideFileUrl(): string {
  return `${API_BASE_URL}/api/v1/resources/guide/file`;
}

export async function getGuideMetadata(): Promise<GuideMetadata> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resources/guide`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load guide metadata');
  }

  return (await response.json()) as GuideMetadata;
}
