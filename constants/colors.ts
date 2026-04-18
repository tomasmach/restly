export const colors = {
  background: '#000000',
  surface: '#111111',
  surfaceRaised: '#1C1C1E',
  text: '#FFFFFF',
  textDim: '#888888',
  accent: '#FF6B00',
  danger: '#FF3B30',
  border: '#2A2A2A',
} as const;

export type ColorKey = keyof typeof colors;
