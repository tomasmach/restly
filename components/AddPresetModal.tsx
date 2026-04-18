import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';
import { MIN_CUSTOM_SECONDS, MAX_CUSTOM_SECONDS } from '../constants/presets';

type AddPresetModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (seconds: number) => void;
  existingPresets: number[];
};

function haptic() {
  try {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  } catch {}
}

export function AddPresetModal({
  visible,
  onClose,
  onSave,
  existingPresets,
}: AddPresetModalProps) {
  const [minutes, setMinutes] = useState(1);
  const [secondsField, setSecondsField] = useState(30);

  // Reset when modal becomes visible
  useEffect(() => {
    if (visible) {
      setMinutes(1);
      setSecondsField(30);
    }
  }, [visible]);

  const total = minutes * 60 + secondsField;
  const isValid =
    total >= MIN_CUSTOM_SECONDS &&
    total <= MAX_CUSTOM_SECONDS &&
    !existingPresets.includes(total);

  const changeMinutes = (delta: number) => {
    haptic();
    setMinutes((m) => Math.max(0, Math.min(59, m + delta)));
  };

  const changeSeconds = (delta: number) => {
    haptic();
    setSecondsField((s) => {
      const next = s + delta;
      if (next < 0) return 0;
      if (next > 55) return 55;
      return next;
    });
  };

  const handleSave = () => {
    if (!isValid) return;
    haptic();
    onSave(total);
    onClose();
  };

  const handleCancel = () => {
    haptic();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Add preset</Text>

          {/* Picker row */}
          <View style={styles.pickerRow}>
            {/* Minutes column */}
            <View style={styles.column}>
              <Pressable
                style={styles.stepper}
                onPress={() => changeMinutes(1)}
                accessibilityLabel="Increase minutes"
                testID="add-preset-minutes-plus"
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
              <Text style={styles.numberDisplay}>
                {String(minutes).padStart(2, '0')}
              </Text>
              <Text style={styles.columnLabel}>min</Text>
              <Pressable
                style={styles.stepper}
                onPress={() => changeMinutes(-1)}
                accessibilityLabel="Decrease minutes"
                testID="add-preset-minutes-minus"
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
            </View>

            {/* Separator */}
            <Text style={styles.colon}>:</Text>

            {/* Seconds column */}
            <View style={styles.column}>
              <Pressable
                style={styles.stepper}
                onPress={() => changeSeconds(5)}
                accessibilityLabel="Increase seconds"
                testID="add-preset-seconds-plus"
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
              <Text style={styles.numberDisplay}>
                {String(secondsField).padStart(2, '0')}
              </Text>
              <Text style={styles.columnLabel}>sec</Text>
              <Pressable
                style={styles.stepper}
                onPress={() => changeSeconds(-5)}
                accessibilityLabel="Decrease seconds"
                testID="add-preset-seconds-minus"
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <Pressable onPress={handleCancel} style={styles.cancelButton} testID="add-preset-cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              testID="add-preset-save"
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  column: {
    alignItems: 'center',
    gap: 6,
  },
  columnLabel: {
    fontSize: 14,
    color: colors.textDim,
  },
  numberDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  colon: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 28,
  },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 24,
    color: colors.text,
    lineHeight: 28,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textDim,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.3,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
