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
  // Outer hairline sits at r; active arc is inset so its outer edge aligns with the hairline.
  const r = (size - strokeWidth) / 2;
  const arcR = r - strokeWidth / 2;
  const c = 2 * Math.PI * arcR;
  const dashOffset = c * (1 - clampedProgress);
  const center = size / 2;

  return (
    <View>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentSoft} stopOpacity={1} />
            <Stop offset="55%" stopColor={colors.accent} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.accentDeep} stopOpacity={1} />
          </LinearGradient>
        </Defs>

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
          r={arcR}
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
