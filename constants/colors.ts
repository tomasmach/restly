export const colors = {
  // Warm charcoal rather than pure black — gives the app a softer, considered feel
  background: '#0D0B0A',
  surface: '#151311',
  surfaceRaised: '#1C1917',
  surfaceElevated: '#231F1C',

  // Off-white with a warm cast, never pure #FFFFFF
  text: '#F5F1EA',
  textDim: '#8A847B',
  textMuted: '#56514A',

  // Brass / champagne — refined, horological, instantly reads "premium"
  accent: '#D4A86A',
  accentSoft: '#F0CB8F',
  accentDeep: '#A17A3E',

  // Muted brick — still unmistakably destructive but less shouty
  danger: '#C0544A',

  border: '#27221D',
  borderSubtle: '#1B1714',
  hairline: 'rgba(245,241,234,0.06)',
  hairlineStrong: 'rgba(245,241,234,0.10)',
} as const;

export type ColorKey = keyof typeof colors;
