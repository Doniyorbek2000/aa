import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export async function shareImage(uri: string, dialogTitle: string): Promise<void> {
  const mimeType = uri.endsWith('.png') ? 'image/png' : uri.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

/** Saves into the phone gallery; resolves false when the user refuses photo access. */
export async function saveToPhotos(uri: string): Promise<boolean> {
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) return false;
  await Asset.create(uri);
  return true;
}
