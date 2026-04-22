export const formatSeconds = (seconds: number): string => {
  const safe = Math.max(0, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatMs = (ms: number): string => formatSeconds(Math.ceil(ms / 1000));

export const formatOverrunMs = (ms: number): string => {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `+${m}:${s.toString().padStart(2, '0')}`;
};
