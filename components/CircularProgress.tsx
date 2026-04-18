import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';

type CircularProgressProps = {
  progress: number;
  size: number;
  strokeWidth: number;
  color?: string;
  trackColor?: string;
};

export function CircularProgress({
  progress,
  size,
  strokeWidth,
  color = colors.accent,
  trackColor = colors.border,
}: CircularProgressProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - clampedProgress);
  const center = size / 2;

  return (
    <View>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
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
