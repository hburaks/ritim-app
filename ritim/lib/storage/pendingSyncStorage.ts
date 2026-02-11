import AsyncStorage from '@react-native-async-storage/async-storage';

import { PENDING_INITIAL_SYNC_KEY } from './storageKeys';

export async function getPendingInitialSync(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PENDING_INITIAL_SYNC_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setPendingInitialSync(pending: boolean): Promise<void> {
  try {
    if (pending) {
      await AsyncStorage.setItem(PENDING_INITIAL_SYNC_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(PENDING_INITIAL_SYNC_KEY);
    }
  } catch {
    // silent
  }
}
