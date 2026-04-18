import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';

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
    <View style={styles.wrapper}>
      <View style={styles.adjustRow}>
        <Pressable
          style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}
          onPress={handleMinus}
          accessibilityLabel="Subtract 15 seconds"
          testID="running-adjust-minus"
        >
          <Text style={styles.adjustGlyph}>−</Text>
          <Text style={styles.adjustCaption}>15s</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}
          onPress={handlePlus}
          accessibilityLabel="Add 15 seconds"
          testID="running-adjust-plus"
        >
          <Text style={styles.adjustGlyph}>+</Text>
          <Text style={styles.adjustCaption}>15s</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
        onPress={handleCancel}
        accessibilityLabel="Cancel timer"
        testID="running-cancel"
      >
        <Text style={styles.cancelText}>END SESSION</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 4,
    height: 56,
  },
  adjustButton: {
    width: 92,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adjustGlyph: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  adjustCaption: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    letterSpacing: tracking.label,
    lineHeight: 14,
    includeFontPadding: false,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.55,
  },
  cancelButton: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: tracking.chrome,
  },
});
