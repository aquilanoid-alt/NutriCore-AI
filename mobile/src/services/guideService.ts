import { APP_CONFIG } from "../config/appConfig";

export type GuideResource = {
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

export function buildGuideFileUrl(): string {
  return `${APP_CONFIG.apiBaseUrl}${APP_CONFIG.guideFileEndpoint}`;
}

export async function fetchGuideResource(): Promise<GuideResource> {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${APP_CONFIG.guideEndpoint}`);

  if (!response.ok) {
    throw new Error("Failed to load guide resource");
  }

  return (await response.json()) as GuideResource;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
