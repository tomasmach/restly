import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  FIXED_PRESETS,
  MAX_CUSTOM_PRESETS,
  MAX_CUSTOM_SECONDS,
  MIN_CUSTOM_SECONDS,
} from '../constants/presets';

const STORAGE_KEY_CUSTOM = 'restly.customPresets';
const STORAGE_KEY_LAST_USED = 'restly.lastUsedPresetSeconds';

export type AddPresetResult = 'ok' | 'duplicate' | 'invalid' | 'full';

export interface UsePresetsResult {
  hydrated: boolean;
  customPresets: number[];
  lastUsed: number | null;
  addPreset: (seconds: number) => Promise<AddPresetResult>;
  removePreset: (seconds: number) => Promise<void>;
  setLastUsed: (seconds: number) => Promise<void>;
}

export function usePresets(): UsePresetsResult {
  const [hydrated, setHydrated] = useState(false);
  const [customPresets, setCustomPresets] = useState<number[]>([]);
  const [lastUsed, setLastUsedState] = useState<number | null>(null);

  // Hydrate from storage on mount only — never write on this path.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [presetsRaw, lastUsedRaw] = await AsyncStorage.multiGet([
          STORAGE_KEY_CUSTOM,
          STORAGE_KEY_LAST_USED,
        ]);

        if (cancelled) return;

        const presetsJson = presetsRaw[1];
        const lastUsedJson = lastUsedRaw[1];

        if (presetsJson !== null) {
          try {
            const parsed = JSON.parse(presetsJson) as unknown;
            if (
              Array.isArray(parsed) &&
              parsed.every((v) => typeof v === 'number')
            ) {
              setCustomPresets((parsed as number[]).slice().sort((a, b) => a - b));
            }
          } catch {
            console.warn('[usePresets] Failed to parse customPresets from storage');
          }
        }

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

      if (coerced < MIN_CUSTOM_SECONDS || coerced > MAX_CUSTOM_SECONDS) {
        return 'invalid';
      }

      // Check against fixed presets
      if ((FIXED_PRESETS as readonly number[]).includes(coerced)) {
        return 'duplicate';
      }

      // Check against existing custom presets (captured via closure from state)
      // We use the functional updater form below to always operate on the
      // latest state; but we need the current value here for the checks.
      // Reading `customPresets` directly is safe because addPreset is
      // recreated whenever customPresets changes (listed in deps).
      if (customPresets.includes(coerced)) {
        return 'duplicate';
      }

      if (customPresets.length >= MAX_CUSTOM_PRESETS) {
        return 'full';
      }

      const updated = [...customPresets, coerced].sort((a, b) => a - b);
      setCustomPresets(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
      } catch (e) {
        console.warn('[usePresets] Failed to persist customPresets', e);
      }

      return 'ok';
    },
    [customPresets],
  );

  const removePreset = useCallback(
    async (seconds: number): Promise<void> => {
      const updated = customPresets.filter((s) => s !== seconds);

      // No-op if not present (array length unchanged means it wasn't there)
      if (updated.length === customPresets.length) {
        return;
      }

      setCustomPresets(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
      } catch (e) {
        console.warn('[usePresets] Failed to persist customPresets after remove', e);
      }
    },
    [customPresets],
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
    customPresets,
    lastUsed,
    addPreset,
    removePreset,
    setLastUsed,
  };
}
