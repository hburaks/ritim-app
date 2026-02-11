import AsyncStorage from '@react-native-async-storage/async-storage';

import { COACH_FAVORITES_KEY } from './storageKeys';

type FavoritesMap = Record<string, true>;

export async function getFavorites(): Promise<FavoritesMap> {
  try {
    const raw = await AsyncStorage.getItem(COACH_FAVORITES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FavoritesMap;
  } catch {
    return {};
  }
}

export async function toggleFavorite(studentId: string): Promise<FavoritesMap> {
  const current = await getFavorites();
  if (current[studentId]) {
    delete current[studentId];
  } else {
    current[studentId] = true;
  }
  await AsyncStorage.setItem(COACH_FAVORITES_KEY, JSON.stringify(current));
  return current;
}
