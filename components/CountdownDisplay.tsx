import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
import { formatMs } from '../utils/time';

type CountdownDisplayProps = {
  remainingMs: number;
  testID?: string;
};

export function CountdownDisplay({ remainingMs, testID }: CountdownDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.caption}>REMAINING</Text>
      <Text style={styles.text} testID={testID}>
        {formatMs(remainingMs)}
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
  text: {
    fontFamily: fonts.display,
    fontSize: 92,
    fontWeight: '300',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tighter,
    lineHeight: 96,
  },
});
