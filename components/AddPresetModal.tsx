import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
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
          <View pointerEvents="none" style={styles.cardTopEdge} />

          <Text style={styles.kicker}>NEW PRESET</Text>
          <Text style={styles.title}>Compose a duration</Text>

          {/* Picker row */}
          <View style={styles.pickerRow}>
            <Column
              value={minutes}
              label="MIN"
              onIncrement={() => changeMinutes(1)}
              onDecrement={() => changeMinutes(-1)}
              incTestID="add-preset-minutes-plus"
              decTestID="add-preset-minutes-minus"
              incLabel="Increase minutes"
              decLabel="Decrease minutes"
            />

            <Text style={styles.colon}>·</Text>

            <Column
              value={secondsField}
              label="SEC"
              onIncrement={() => changeSeconds(5)}
              onDecrement={() => changeSeconds(-5)}
              incTestID="add-preset-seconds-plus"
              decTestID="add-preset-seconds-minus"
              incLabel="Increase seconds"
              decLabel="Decrease seconds"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonsRow}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              testID="add-preset-cancel"
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={({ pressed }) => [
                styles.saveButton,
                !isValid && styles.saveButtonDisabled,
                pressed && isValid && styles.saveButtonPressed,
              ]}
              testID="add-preset-save"
            >
              <Text style={styles.saveText}>SAVE PRESET</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ColumnProps = {
  value: number;
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  incTestID: string;
  decTestID: string;
  incLabel: string;
  decLabel: string;
};

function Column({
  value,
  label,
  onIncrement,
  onDecrement,
  incTestID,
  decTestID,
  incLabel,
  decLabel,
}: ColumnProps) {
  return (
    <View style={styles.column}>
      <Pressable
        style={({ pressed }) => [styles.stepper, pressed && styles.pressed]}
        onPress={onIncrement}
        accessibilityLabel={incLabel}
        testID={incTestID}
      >
        <Text style={styles.stepperGlyph}>+</Text>
      </Pressable>

      <View style={styles.valueWrap}>
        <Text style={styles.numberDisplay}>{String(value).padStart(2, '0')}</Text>
        <Text style={styles.columnLabel}>{label}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.stepper, pressed && styles.pressed]}
        onPress={onDecrement}
        accessibilityLabel={decLabel}
        testID={decTestID}
      >
        <Text style={styles.stepperGlyph}>−</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,6,5,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 20 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardTopEdge: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: colors.hairlineStrong,
  },
  kicker: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: tracking.chrome,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: tracking.tight,
    marginBottom: 28,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  column: {
    alignItems: 'center',
    gap: 10,
  },
  valueWrap: {
    alignItems: 'center',
  },
  columnLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
    marginTop: 4,
  },
  numberDisplay: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: '300',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tight,
    lineHeight: 60,
  },
  colon: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.accentDeep,
    marginHorizontal: 4,
  },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.55,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
    marginHorizontal: -24,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: tracking.chrome,
  },
  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  saveButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  saveButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
  },
  saveText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1410',
    letterSpacing: tracking.chrome,
  },
});
