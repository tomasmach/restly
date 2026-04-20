import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export type TimerStatus = 'idle' | 'running' | 'completed';

export type UseTimerOptions = {
  onStart?: (seconds: number, endsAtMs: number) => Promise<string | null> | string | null;
  onCancel?: (notificationId: string | null) => Promise<void> | void;
  onComplete?: (notificationId: string | null) => Promise<void> | void;
};

export interface UseTimerResult {
  status: TimerStatus;
  totalMs: number;
  remainingMs: number;
  lastUsedSeconds: number | null;
  start: (seconds: number) => Promise<void>;
  cancel: () => Promise<void>;
  adjust: (deltaSeconds: number) => Promise<void>;
  acknowledgeComplete: () => void;
}

const KEEP_AWAKE_TAG = 'repause-timer';
const INTERVAL_MS = 33;

export function useTimer(options?: UseTimerOptions): UseTimerResult {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [totalMs, setTotalMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [lastUsedSeconds, setLastUsedSeconds] = useState<number | null>(null);

  // ── Refs (survive renders without causing re-subscriptions) ────────────────
  // Keep options in a ref so interval/AppState callbacks always see fresh
  // closures without needing to re-subscribe.
  const optionsRef = useRef<UseTimerOptions | undefined>(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // Timer state refs — used inside interval/AppState callbacks to avoid
  // stale closures over the corresponding state variables.
  const statusRef = useRef<TimerStatus>('idle');
  const startTimestampRef = useRef<number>(0);
  const totalMsRef = useRef<number>(0);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Synchronise both the ref and React state for status. */
  function syncStatus(s: TimerStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  /** Synchronise both the ref and React state for totalMs. */
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

  /** Core completion logic. Called from interval or AppState. */
  const fireCompletion = useCallback(async () => {
    if (statusRef.current !== 'running') return;  // re-entry guard
    statusRef.current = 'completed';               // close the window immediately

    clearInterval_();

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
    try {
      await optionsRef.current?.onComplete?.(id);
    } catch {
      // ignore
    }

    // Transition: remainingMs stays 0, totalMs retained for UI ring,
    // status moves to 'completed'.
    setRemainingMs(0);
    syncStatus('completed');
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
        void fireCompletion();
      } else {
        setRemainingMs(remaining);
      }
    }, INTERVAL_MS);
  }, [fireCompletion]);

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
            void fireCompletion();
          } else {
            setRemainingMs(remaining);
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [fireCompletion]);

  // ── Unmount cleanup ────────────────────────────────────────────────────────
  // Does NOT call onCancel — unmount is not user-initiated.

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
      syncTotalMs(ms);
      setRemainingMs(ms);
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

      try {
        const id = (await optionsRef.current?.onStart?.(seconds, now + ms)) ?? null;
        notificationIdRef.current = id;
      } catch {
        notificationIdRef.current = null;
      }

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

    syncStatus('idle');
    syncTotalMs(0);
    setRemainingMs(0);
  }, []);

  const adjust = useCallback(
    async (deltaSeconds: number): Promise<void> => {
      if (statusRef.current !== 'running') return;

      const now = Date.now();
      const elapsed = now - startTimestampRef.current;
      const currentRemaining = totalMsRef.current - elapsed;
      const newRemainingMs = currentRemaining + deltaSeconds * 1000;

      if (newRemainingMs <= 0) {
        // Treat as completion
        setRemainingMs(0);
        void fireCompletion();
        return;
      }

      // Keep totalMs fixed at the original session duration — shift the
      // start timestamp so that remaining = totalMs - (now - startTs).
      // newStartTs = now - (totalMs - newRemaining)
      startTimestampRef.current = now - (totalMsRef.current - newRemainingMs);
      setRemainingMs(newRemainingMs);

      // Cancel old notification, reschedule with new remaining seconds.
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
    },
    [fireCompletion],
  );

  const acknowledgeComplete = useCallback((): void => {
    notificationIdRef.current = null;
    syncStatus('idle');
    syncTotalMs(0);
    setRemainingMs(0);
    // lastUsedSeconds intentionally left unchanged.
  }, []);

  return {
    status,
    totalMs,
    remainingMs,
    lastUsedSeconds,
    start,
    cancel,
    adjust,
    acknowledgeComplete,
  };
}
