import AsyncStorage from '@react-native-async-storage/async-storage';

const GRADE_KEY = 'ritim.grade.v1';

export async function loadGrade(): Promise<'7' | '8' | null> {
  try {
    const raw = await AsyncStorage.getItem(GRADE_KEY);
    if (raw === '7' || raw === '8') {
      return raw;
    }
    return null;
  } catch (error) {
    console.warn('gradeStorage.loadGrade failed', error);
    return null;
  }
}

export async function saveGrade(value: '7' | '8' | null): Promise<void> {
  try {
    if (!value) {
      await AsyncStorage.removeItem(GRADE_KEY);
      return;
    }
    await AsyncStorage.setItem(GRADE_KEY, value);
  } catch (error) {
    console.warn('gradeStorage.saveGrade failed', error);
  }
}
