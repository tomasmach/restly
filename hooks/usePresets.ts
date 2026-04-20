import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_PRESETS,
  MAX_PRESETS,
  MAX_PRESET_SECONDS,
  MIN_PRESET_SECONDS,
} from '../constants/presets';

const STORAGE_KEY_PRESETS = 'pauzer.presets';
const STORAGE_KEY_LEGACY_CUSTOM = 'pauzer.customPresets';
const STORAGE_KEY_LAST_USED = 'pauzer.lastUsedPresetSeconds';

export type AddPresetResult = 'ok' | 'duplicate' | 'invalid' | 'full';

export interface UsePresetsResult {
  hydrated: boolean;
  presets: number[];
  lastUsed: number | null;
  addPreset: (seconds: number) => Promise<AddPresetResult>;
  removePreset: (seconds: number) => Promise<void>;
  setLastUsed: (seconds: number) => Promise<void>;
}

function sortUnique(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function parseStoredList(raw: string | null): number[] | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
      return parsed as number[];
    }
  } catch {
    console.warn('[usePresets] Failed to parse stored list');
  }
  return null;
}

export function usePresets(): UsePresetsResult {
  const [hydrated, setHydrated] = useState(false);
  const [presets, setPresets] = useState<number[]>([]);
  const [lastUsed, setLastUsedState] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [presetsRaw, legacyRaw, lastUsedRaw] = await AsyncStorage.multiGet([
          STORAGE_KEY_PRESETS,
          STORAGE_KEY_LEGACY_CUSTOM,
          STORAGE_KEY_LAST_USED,
        ]);

        if (cancelled) return;

        const stored = parseStoredList(presetsRaw[1]);
        const legacy = parseStoredList(legacyRaw[1]);

        let initial: number[];
        if (stored !== null) {
          initial = sortUnique(stored);
        } else if (legacy !== null) {
          initial = sortUnique([...DEFAULT_PRESETS, ...legacy]);
          try {
            await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(initial));
            await AsyncStorage.removeItem(STORAGE_KEY_LEGACY_CUSTOM);
          } catch (e) {
            console.warn('[usePresets] Failed to migrate legacy presets', e);
          }
        } else {
          initial = [...DEFAULT_PRESETS];
          try {
            await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(initial));
          } catch (e) {
            console.warn('[usePresets] Failed to seed default presets', e);
          }
        }

        if (cancelled) return;
        setPresets(initial);

        const lastUsedJson = lastUsedRaw[1];
        if (lastUsedJson !== null) {
          try {
            const parsed = JSON.parse(lastUsedJson) as unknown;
            if (parsed === null || typeof parsed === 'number') {
              setLastUsedState(parsed as number | null);
            }
          } catch {
            console.warn('[usePresets] Failed to parse lastUsedPresetSeconds from storage');
          }
        }
      } catch (e) {
        console.warn('[usePresets] Failed to read from AsyncStorage during hydration', e);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const addPreset = useCallback(
    async (seconds: number): Promise<AddPresetResult> => {
      const coerced = Math.round(seconds);

      if (!Number.isFinite(coerced)) {
        return 'invalid';
      }

      if (coerced < MIN_PRESET_SECONDS || coerced > MAX_PRESET_SECONDS) {
        return 'invalid';
      }

      if (presets.includes(coerced)) {
        return 'duplicate';
      }

      if (presets.length >= MAX_PRESETS) {
        return 'full';
      }

      const updated = sortUnique([...presets, coerced]);
      setPresets(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
      } catch (e) {
        console.warn('[usePresets] Failed to persist presets', e);
      }

      return 'ok';
    },
    [presets],
  );

  const removePreset = useCallback(
    async (seconds: number): Promise<void> => {
      const updated = presets.filter((s) => s !== seconds);

      if (updated.length === presets.length) {
        return;
      }

      setPresets(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
      } catch (e) {
        console.warn('[usePresets] Failed to persist presets after remove', e);
      }
    },
    [presets],
  );

  const setLastUsed = useCallback(async (seconds: number): Promise<void> => {
    setLastUsedState(seconds);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_USED, JSON.stringify(seconds));
    } catch (e) {
      console.warn('[usePresets] Failed to persist lastUsedPresetSeconds', e);
    }
  }, []);

  return {
    hydrated,
    presets,
    lastUsed,
    addPreset,
    removePreset,
    setLastUsed,
  };
}
