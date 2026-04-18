import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';

type CircularProgressProps = {
  progress: number;
  size: number;
  strokeWidth: number;
};

export function CircularProgress({
  progress,
  size,
  strokeWidth,
}: CircularProgressProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - clampedProgress);
  const center = size / 2;

  // A soft "glow" halo ring sits just outside the main track — it's subtle
  // at all times but meaningfully lifts the active arc off the background.
  const glowInset = strokeWidth * 1.8;
  const glowR = r + glowInset / 2;
  const glowStrokeWidth = glowInset;

  return (
    <View>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentSoft} stopOpacity={1} />
            <Stop offset="55%" stopColor={colors.accent} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.accentDeep} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentSoft} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Ambient halo — visible as the arc sweeps past */}
        <Circle
          cx={center}
          cy={center}
          r={glowR}
          stroke="url(#glowGradient)"
          strokeWidth={glowStrokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />

        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.border}
          strokeWidth={1}
          fill="none"
        />

        {/* Inner hairline — lifts the dial off the ground */}
        <Circle
          cx={center}
          cy={center}
          r={r - strokeWidth / 2 - 6}
          stroke={colors.borderSubtle}
          strokeWidth={1}
          fill="none"
        />

        {/* Active arc */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke="url(#arcGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
    </View>
  );
}
