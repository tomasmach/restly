import { Platform } from 'react-native';

export const fonts = {
  display: Platform.select({
    ios: 'New York',
    android: 'serif',
    default: 'serif',
  }) as string,
  body: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
    default: 'System',
  }) as string,
};

export const tracking = {
  chrome: 2.4,
  label: 1.6,
  tight: -1.5,
  tighter: -2.5,
};
