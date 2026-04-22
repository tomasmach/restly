import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
import { formatMs, formatOverrunMs } from '../utils/time';

type CountdownDisplayProps = {
  remainingMs: number;
  overrunMs?: number;
  testID?: string;
};

export function CountdownDisplay({ remainingMs, overrunMs = 0, testID }: CountdownDisplayProps) {
  const isOverrun = overrunMs > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.caption, isOverrun && styles.captionOverrun]}>
        {isOverrun ? 'OVERRUN' : 'REMAINING'}
      </Text>
      <Text style={[styles.text, isOverrun && styles.textOverrun]} testID={testID}>
        {isOverrun ? formatOverrunMs(overrunMs) : formatMs(remainingMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
    marginBottom: 6,
  },
  captionOverrun: {
    color: colors.danger,
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 92,
    fontWeight: '300',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tighter,
    lineHeight: 96,
  },
  textOverrun: {
    color: colors.danger,
  },
});
