import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { loadSettings, saveSettings } from '@/lib/storage/settingsStorage';

export type AppSettings = {
  remindersEnabled: boolean;
  reminderTime: string; // HH:mm
  scheduledNotificationId: string | null;
  coachConnected: boolean;
  coachNote: string | null;
  coachName: string | null;
  displayName: string | null;
  accountEmail: string | null;
};

type SettingsState = {
  settings: AppSettings;
  hydrated: boolean;
};

type SettingsAction =
  | { type: 'hydrate'; payload: AppSettings }
  | { type: 'set-settings'; payload: AppSettings }
  | { type: 'update-settings'; payload: Partial<AppSettings> };

type SettingsContextValue = {
  settings: AppSettings;
  setSettings: (next: AppSettings) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  hydrated: boolean;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const DEFAULT_REMINDER_TIME = '20:30';

const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: false,
  reminderTime: DEFAULT_REMINDER_TIME,
  scheduledNotificationId: null,
  coachConnected: false,
  coachNote: null,
  coachName: null,
  displayName: null,
  accountEmail: null,
};

const INITIAL_STATE: SettingsState = {
  settings: DEFAULT_SETTINGS,
  hydrated: false,
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'hydrate':
      return {
        settings: action.payload,
        hydrated: true,
      };
    case 'set-settings':
      return {
        ...state,
        settings: action.payload,
      };
    case 'update-settings':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    default:
      return state;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, INITIAL_STATE);

  useEffect(() => {
    let active = true;
    loadSettings()
      .then((loaded) => {
        if (!active) {
          return;
        }
        dispatch({ type: 'hydrate', payload: loaded });
      })
      .catch((error) => {
        console.warn('settings hydrate failed', error);
        if (active) {
          dispatch({ type: 'hydrate', payload: DEFAULT_SETTINGS });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }
    const handle = setTimeout(() => {
      saveSettings(state.settings);
    }, 400);
    return () => clearTimeout(handle);
  }, [state.settings, state.hydrated]);

  const setSettings = useCallback((next: AppSettings) => {
    dispatch({ type: 'set-settings', payload: next });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    dispatch({ type: 'update-settings', payload: partial });
  }, []);

  const value = useMemo(
    () => ({
      settings: state.settings,
      setSettings,
      updateSettings,
      hydrated: state.hydrated,
    }),
    [state.settings, setSettings, updateSettings, state.hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

const TIME_REGEX = /^([01]\\d|2[0-3]):([0-5]\\d)$/;

export function normalizeReminderTime(value?: string) {
  if (typeof value === 'string' && TIME_REGEX.test(value)) {
    return value;
  }
  return DEFAULT_REMINDER_TIME;
}

export function parseReminderTime(value?: string) {
  const normalized = normalizeReminderTime(value);
  const [hourStr, minuteStr] = normalized.split(':');
  return {
    hour: Number(hourStr),
    minute: Number(minuteStr),
  };
}

export function formatReminderTime(hour: number, minute: number) {
  const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
  return `${String(safeHour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`;
}
