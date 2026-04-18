import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';
import { formatSeconds } from '../utils/time';

type PresetButtonProps = {
  seconds: number;
  isCustom?: boolean;
  isHighlighted?: boolean;
  disabled?: boolean;
  testID?: string;
  onPress: () => void;
  onLongPress?: () => void;
};

export function PresetButton({
  seconds,
  isCustom: _isCustom,
  isHighlighted = false,
  disabled = false,
  testID,
  onPress,
  onLongPress,
}: PresetButtonProps) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const handleLongPress = async () => {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    } catch {}
    onLongPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.container,
        { borderColor: isHighlighted ? colors.accent : colors.border },
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>{formatSeconds(seconds)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    height: 80,
    width: '100%',
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
