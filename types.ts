export type TimerStatus = 'idle' | 'running' | 'completed';

export type TimerState = {
  status: TimerStatus;
  totalMs: number;
  startTimestamp: number;
  remainingMs: number;
};

export type PersistedState = {
  lastUsedPresetSeconds: number | null;
  customPresets: number[];
};
