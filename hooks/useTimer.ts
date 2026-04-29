import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { STORAGE_KEY_ACTIVE_TIMER } from '../constants/storage';

export type TimerStatus = 'idle' | 'running';

export type UseTimerOptions = {
  onStart?: (seconds: number, endsAtMs: number) => Promise<string | null> | string | null;
  onCancel?: (notificationId: string | null) => Promise<void> | void;
  onComplete?: (notificationId: string | null) => Promise<void> | void;
};

export interface UseTimerResult {
  status: TimerStatus;
  totalMs: number;
  remainingMs: number;
  overrunMs: number;
  lastUsedSeconds: number | null;
  start: (seconds: number) => Promise<void>;
  cancel: () => Promise<void>;
  adjust: (deltaSeconds: number) => Promise<void>;
}

const KEEP_AWAKE_TAG = 'pauzer-timer';
const INTERVAL_MS = 33;
// Resume records older than this past their endsAt are treated as abandoned.
const STALE_CUTOFF_MS = 10 * 60 * 1000;

type ActiveTimerRecord = {
  endsAt: number;
  totalMs: number;
  notificationId: string | null;
};

async function persistActive(record: ActiveTimerRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_TIMER, JSON.stringify(record));
  } catch (e) {
    console.warn('[useTimer] Failed to persist active timer', e);
  }
}

async function clearActive(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);
  } catch (e) {
    console.warn('[useTimer] Failed to clear active timer', e);
  }
}

function parseActiveRecord(raw: string | null): ActiveTimerRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as ActiveTimerRecord).endsAt === 'number' &&
      typeof (parsed as ActiveTimerRecord).totalMs === 'number'
    ) {
      const record = parsed as ActiveTimerRecord;
      return {
        endsAt: record.endsAt,
        totalMs: record.totalMs,
        notificationId:
          typeof record.notificationId === 'string' ? record.notificationId : null,
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export function useTimer(options?: UseTimerOptions): UseTimerResult {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [totalMs, setTotalMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [overrunMs, setOverrunMs] = useState(0);
  const [lastUsedSeconds, setLastUsedSeconds] = useState<number | null>(null);

  // ── Refs (survive renders without causing re-subscriptions) ────────────────
  const optionsRef = useRef<UseTimerOptions | undefined>(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const statusRef = useRef<TimerStatus>('idle');
  const startTimestampRef = useRef<number>(0);
  const totalMsRef = useRef<number>(0);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guards the one-shot side effects (haptic, notification cancel, keep-awake
  // deactivate) that fire the moment we cross zero into overrun.
  const overrunEnteredRef = useRef<boolean>(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function syncStatus(s: TimerStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  function syncTotalMs(ms: number) {
    totalMsRef.current = ms;
    setTotalMs(ms);
  }

  function clearInterval_() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  /**
   * Fires the one-shot side effects when the countdown first crosses zero.
   * Status stays 'running' — the timer continues ticking into overrun.
   */
  const fireOverrunEntry = useCallback(async () => {
    if (overrunEnteredRef.current) return;
    overrunEnteredRef.current = true;

    try {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    } catch {
      // ignore
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }

    const id = notificationIdRef.current;
    notificationIdRef.current = null;
    try {
      await optionsRef.current?.onComplete?.(id);
    } catch {
      // ignore
    }
  }, []);

  // ── Interval tick ──────────────────────────────────────────────────────────

  const startInterval = useCallback(() => {
    clearInterval_();
    intervalRef.current = setInterval(() => {
      if (statusRef.current !== 'running') {
        clearInterval_();
        return;
      }

      const elapsed = Date.now() - startTimestampRef.current;
      const remaining = totalMsRef.current - elapsed;

      if (remaining <= 0) {
        setRemainingMs(0);
        setOverrunMs(-remaining);
        if (!overrunEnteredRef.current) {
          void fireOverrunEntry();
        }
      } else {
        setRemainingMs(remaining);
      }
    }, INTERVAL_MS);
  }, [fireOverrunEntry]);

  // ── AppState listener ──────────────────────────────────────────────────────

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active' && statusRef.current === 'running') {
          const elapsed = Date.now() - startTimestampRef.current;
          const remaining = totalMsRef.current - elapsed;

          if (remaining <= 0) {
            setRemainingMs(0);
            setOverrunMs(-remaining);
            if (!overrunEnteredRef.current) {
              void fireOverrunEntry();
            }
          } else {
            setRemainingMs(remaining);
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [fireOverrunEntry]);

  // ── Hydration: resume across app kill ──────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
        if (cancelled) return;
        const record = parseActiveRecord(raw);
        if (!record) {
          if (raw !== null) await clearActive();
          return;
        }

        const now = Date.now();
        const remaining = record.endsAt - now;
        const overshoot = -remaining;

        if (remaining > 0) {
          startTimestampRef.current = record.endsAt - record.totalMs;
          notificationIdRef.current = record.notificationId;
          overrunEnteredRef.current = false;
          syncTotalMs(record.totalMs);
          setRemainingMs(remaining);
          setOverrunMs(0);
          setLastUsedSeconds(Math.round(record.totalMs / 1000));
          syncStatus('running');
          try {
            await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
          } catch {
            // ignore
          }
          startInterval();
        } else if (overshoot < STALE_CUTOFF_MS) {
          // Resume directly into overrun. The scheduled notification already
          // fired while the app was closed, so skip the haptic and don't
          // reactivate keep-awake — treat as if we just crossed zero.
          startTimestampRef.current = record.endsAt - record.totalMs;
          notificationIdRef.current = null;
          overrunEnteredRef.current = true;
          syncTotalMs(record.totalMs);
          setRemainingMs(0);
          setOverrunMs(overshoot);
          setLastUsedSeconds(Math.round(record.totalMs / 1000));
          syncStatus('running');
          startInterval();
        } else {
          await clearActive();
        }
      } catch (e) {
        console.warn('[useTimer] Failed to hydrate active timer', e);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [startInterval]);

  // ── Unmount cleanup ────────────────────────────────────────────────────────
  // Does NOT call onCancel and does NOT clear persisted state — unmount is
  // not user-initiated, and we want to resume on next launch.

  useEffect(() => {
    return () => {
      clearInterval_();
      try {
        deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch {
        // ignore
      }
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = useCallback(
    async (seconds: number): Promise<void> => {
      if (statusRef.current === 'running') return;

      const ms = seconds * 1000;
      const now = Date.now();

      startTimestampRef.current = now;
      overrunEnteredRef.current = false;
      syncTotalMs(ms);
      setRemainingMs(ms);
      setOverrunMs(0);
      setLastUsedSeconds(seconds);
      syncStatus('running');

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }

      try {
        await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      } catch {
        // ignore
      }

      const endsAt = now + ms;

      try {
        const id = (await optionsRef.current?.onStart?.(seconds, endsAt)) ?? null;
        notificationIdRef.current = id;
      } catch {
        notificationIdRef.current = null;
      }

      await persistActive({
        endsAt,
        totalMs: ms,
        notificationId: notificationIdRef.current,
      });

      startInterval();
    },
    [startInterval],
  );

  const cancel = useCallback(async (): Promise<void> => {
    if (statusRef.current !== 'running') return;

    clearInterval_();

    try {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    } catch {
      // ignore
    }

    const id = notificationIdRef.current;
    notificationIdRef.current = null;

    try {
      await optionsRef.current?.onCancel?.(id);
    } catch {
      // ignore
    }

    await clearActive();

    overrunEnteredRef.current = false;
    syncStatus('idle');
    syncTotalMs(0);
    setRemainingMs(0);
    setOverrunMs(0);
  }, []);

  const adjust = useCallback(
    async (deltaSeconds: number): Promise<void> => {
      if (statusRef.current !== 'running') return;

      const now = Date.now();
      const wasOverrun = overrunEnteredRef.current;

      // -N is a no-op during overrun — can't shrink a negative remaining.
      if (wasOverrun && deltaSeconds <= 0) return;

      let newRemainingMs: number;
      let newTotalMs: number;

      if (wasOverrun) {
        // Rescue: fresh delta-second countdown. Reset ring + state cleanly.
        newRemainingMs = deltaSeconds * 1000;
        newTotalMs = newRemainingMs;
        overrunEnteredRef.current = false;
        try {
          await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
        } catch {
          // ignore
        }
      } else {
        const elapsed = now - startTimestampRef.current;
        const currentRemaining = totalMsRef.current - elapsed;
        newRemainingMs = currentRemaining + deltaSeconds * 1000;
        newTotalMs = totalMsRef.current;

        if (newRemainingMs <= 0) {
          // Shrunk past zero — slide into overrun instead of completing.
          startTimestampRef.current = now - (newTotalMs - newRemainingMs);
          setRemainingMs(0);
          setOverrunMs(-newRemainingMs);

          const oldId = notificationIdRef.current;
          notificationIdRef.current = null;
          try {
            await optionsRef.current?.onCancel?.(oldId);
          } catch {
            // ignore
          }

          void fireOverrunEntry();

          await persistActive({
            endsAt: startTimestampRef.current + newTotalMs,
            totalMs: newTotalMs,
            notificationId: null,
          });
          return;
        }
      }

      startTimestampRef.current = now - (newTotalMs - newRemainingMs);
      syncTotalMs(newTotalMs);
      setRemainingMs(newRemainingMs);
      setOverrunMs(0);

      const oldId = notificationIdRef.current;
      notificationIdRef.current = null;
      try {
        await optionsRef.current?.onCancel?.(oldId);
      } catch {
        // ignore
      }

      const newEndsAtMs = now + newRemainingMs;
      const newSeconds = Math.ceil(newRemainingMs / 1000);

      try {
        const newId =
          (await optionsRef.current?.onStart?.(newSeconds, newEndsAtMs)) ?? null;
        notificationIdRef.current = newId;
      } catch {
        notificationIdRef.current = null;
      }

      await persistActive({
        endsAt: newEndsAtMs,
        totalMs: newTotalMs,
        notificationId: notificationIdRef.current,
      });
    },
    [fireOverrunEntry],
  );

  return {
    status,
    totalMs,
    remainingMs,
    overrunMs,
    lastUsedSeconds,
    start,
    cancel,
    adjust,
  };
}
