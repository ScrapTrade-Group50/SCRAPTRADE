import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type PickedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:8080/api';

function resolveFileMeta(image: PickedImage) {
  const rawName = image.fileName || image.uri.split('/').pop()?.split('?')[0] || 'photo.jpg';
  const name = rawName.includes('.') ? rawName : `${rawName}.jpg`;
  let type = image.mimeType || 'image/jpeg';
  if (type === 'image/jpg') type = 'image/jpeg';
  return { name, type };
}

/**
 * Uploads a picked image to a listing.
 *
 * React Native and web build multipart bodies differently: native accepts the
 * `{ uri, name, type }` shape, but on web that object is serialized as "[object
 * Object]" and the backend rejects it with 400. On web we must fetch the picked
 * URI into a real Blob first.
 *
 * Uses fetch (not axios) so React Native sends multipart boundaries correctly.
 */
export async function uploadListingImage(
  listingId: number | string,
  image: PickedImage | string
) {
  const picked: PickedImage = typeof image === 'string' ? { uri: image } : image;
  const { name, type } = resolveFileMeta(picked);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(picked.uri);
    const blob = await response.blob();
    formData.append('file', blob, name);
  } else {
    formData.append('file', { uri: picked.uri, name, type } as any);
  }

  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_BASE}/listings/${listingId}/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    let message = 'Image upload failed.';
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore parse errors
    }
    const error = new Error(message) as Error & {
      response?: { status: number; data: { message: string } };
    };
    error.response = { status: response.status, data: { message } };
    throw error;
  }

  return { data: await response.json() };
}

/** User-facing message when Cloudinary is missing or upload fails. */
export function getUploadErrorMessage(error: unknown): string {
  const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
  const serverMessage = axiosError.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (axiosError.response?.status === 400) {
    return 'Cloudinary may not be configured on the server. You can add a photo later via Edit.';
  }
  return 'Check your connection and try again, or add the photo later via Edit.';
}
