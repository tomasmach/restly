import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';

type RunningControlsProps = {
  onCancel: () => void;
  onAdjust: (deltaSeconds: number) => void;
};

function haptic() {
  try {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  } catch {}
}

export function RunningControls({ onCancel, onAdjust }: RunningControlsProps) {
  const handleMinus = () => {
    haptic();
    onAdjust(-15);
  };

  const handlePlus = () => {
    haptic();
    onAdjust(15);
  };

  const handleCancel = () => {
    haptic();
    onCancel();
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.adjustButton}
        onPress={handleMinus}
        accessibilityLabel="Subtract 15 seconds"
        testID="running-adjust-minus"
      >
        <Text style={styles.adjustText}>−15s</Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={handleCancel}
        accessibilityLabel="Cancel timer"
        testID="running-cancel"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      <Pressable
        style={styles.adjustButton}
        onPress={handlePlus}
        accessibilityLabel="Add 15 seconds"
        testID="running-adjust-plus"
      >
        <Text style={styles.adjustText}>+15s</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adjustButton: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
