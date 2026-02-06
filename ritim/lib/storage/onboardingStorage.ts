import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'ritim.onboardingDone.v1';

export async function loadOnboardingCompleted(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!raw) {
      return false;
    }
    return raw === 'true';
  } catch (error) {
    console.warn('onboardingStorage.loadOnboardingCompleted failed', error);
    return false;
  }
}

export async function saveOnboardingCompleted(completed: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch (error) {
    console.warn('onboardingStorage.saveOnboardingCompleted failed', error);
  }
}
