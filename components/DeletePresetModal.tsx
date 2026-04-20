import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
import { formatSeconds } from '../utils/time';

type DeletePresetModalProps = {
  visible: boolean;
  seconds: number | null;
  onClose: () => void;
  onConfirm: () => void;
};

function lightHaptic() {
  try {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  } catch {}
}

function warningHaptic() {
  try {
    Haptics.notificationAsync(NotificationFeedbackType.Warning);
  } catch {}
}

export function DeletePresetModal({
  visible,
  seconds,
  onClose,
  onConfirm,
}: DeletePresetModalProps) {
  const handleCancel = () => {
    lightHaptic();
    onClose();
  };

  const handleConfirm = () => {
    warningHaptic();
    onConfirm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View pointerEvents="none" style={styles.cardTopEdge} />

          <Text style={styles.kicker}>REMOVE PRESET</Text>
          <Text style={styles.duration}>
            {seconds !== null ? formatSeconds(seconds) : ''}
          </Text>

          <View style={styles.divider} />

          <View style={styles.buttonsRow}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
              testID="delete-preset-cancel"
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deletePressed,
              ]}
              testID="delete-preset-confirm"
            >
              <Text style={styles.deleteText}>REMOVE</Text>
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
    alignItems: 'center',
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
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
    textAlign: 'center',
    marginBottom: 12,
  },
  duration: {
    fontFamily: fonts.display,
    fontSize: 44,
    fontWeight: '300',
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tight,
    lineHeight: 50,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginHorizontal: -24,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
    alignSelf: 'stretch',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelPressed: {
    opacity: 0.55,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: tracking.chrome,
  },
  deleteButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    backgroundColor: 'rgba(192,84,74,0.12)',
  },
  deleteText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: tracking.chrome,
  },
});
