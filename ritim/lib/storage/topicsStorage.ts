import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TopicMood } from '@/state/topics';

import { TOPICS_KEY } from './storageKeys';

export type TopicsStoragePayload = {
  moods: Record<string, TopicMood>;
};

const DEFAULT_TOPICS_PAYLOAD: TopicsStoragePayload = {
  moods: {},
};

export async function loadTopics(): Promise<TopicsStoragePayload> {
  try {
    const raw = await AsyncStorage.getItem(TOPICS_KEY);
    if (!raw) {
      return DEFAULT_TOPICS_PAYLOAD;
    }
    const parsed = JSON.parse(raw) as TopicsStoragePayload;
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_TOPICS_PAYLOAD;
    }
    const moods = parsed.moods && typeof parsed.moods === 'object' ? parsed.moods : {};
    return { moods };
  } catch (error) {
    console.warn('topicsStorage.loadTopics failed', error);
    return DEFAULT_TOPICS_PAYLOAD;
  }
}

export async function saveTopics(payload: TopicsStoragePayload): Promise<void> {
  try {
    await AsyncStorage.setItem(TOPICS_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('topicsStorage.saveTopics failed', error);
  }
}
