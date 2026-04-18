import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { formatMs } from '../utils/time';

type CountdownDisplayProps = {
  remainingMs: number;
};

export function CountdownDisplay({ remainingMs }: CountdownDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{formatMs(remainingMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    fontSize: 96,
    fontWeight: '200',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
