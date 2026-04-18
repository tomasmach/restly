import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
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
  isCustom = false,
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

  const descriptor = describe(seconds);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.container,
        isHighlighted && styles.containerActive,
        pressed && styles.containerPressed,
        disabled && styles.disabled,
      ]}
    >
      {/* Hairline top edge — gives the surface a "machined" feel */}
      <View
        pointerEvents="none"
        style={[
          styles.topEdge,
          { backgroundColor: isHighlighted ? colors.accentSoft : colors.hairlineStrong },
        ]}
      />

      <View style={styles.labelRow}>
        <Text
          style={[
            styles.label,
            isHighlighted && { color: colors.accentSoft },
          ]}
          numberOfLines={1}
        >
          {formatSeconds(seconds)}
        </Text>
      </View>

      <Text
        style={[
          styles.descriptor,
          isHighlighted && { color: colors.accent },
        ]}
      >
        {isCustom ? `· ${descriptor} ·` : descriptor}
      </Text>
    </Pressable>
  );
}

function describe(seconds: number): string {
  if (seconds < 60) return `${seconds} SEC`;
  if (seconds % 60 === 0) {
    const m = seconds / 60;
    return `${m} MIN`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} MIN ${s} SEC`;
}

const styles = StyleSheet.create({
  container: {
    height: 104,
    width: '100%',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.accentDeep,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  containerPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 36,
    fontWeight: '400',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tight,
    lineHeight: 42,
  },
  descriptor: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
  },
});
