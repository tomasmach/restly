import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { CircularProgress } from '../components/CircularProgress';
import { CountdownDisplay } from '../components/CountdownDisplay';
import { RunningControls } from '../components/RunningControls';
import { PresetButton } from '../components/PresetButton';
import { AddPresetModal } from '../components/AddPresetModal';

import { useTimer } from '../hooks/useTimer';
import { usePresets } from '../hooks/usePresets';
import { useNotifications } from '../hooks/useNotifications';

import { colors } from '../constants/colors';
import { fonts, tracking } from '../constants/typography';
import { FIXED_PRESETS, MAX_CUSTOM_PRESETS } from '../constants/presets';
import { formatSeconds } from '../utils/time';

export function TimerScreen() {
  const { hydrated, customPresets, lastUsed, addPreset, removePreset, setLastUsed } =
    usePresets();

  const { ensurePermission, schedule, cancel } = useNotifications();

  const timer = useTimer({
    onStart: useCallback(
      async (seconds: number) => {
        return schedule(seconds);
      },
      [schedule],
    ),
    onCancel: useCallback(
      async (id: string | null) => {
        await cancel(id);
      },
      [cancel],
    ),
    onComplete: useCallback(
      async (id: string | null) => {
        await cancel(id);
      },
      [cancel],
    ),
  });

  const [modalVisible, setModalVisible] = useState(false);

  // Compute tile width so two columns always fit cleanly with a 12px gap.
  const { width: screenWidth } = useWindowDimensions();
  const GRID_HPAD = 20;
  const GRID_GAP = 12;
  const tileWidth = (screenWidth - GRID_HPAD * 2 - GRID_GAP) / 2;

  // ── acknowledgeComplete after 1500 ms ──────────────────────────────────────
  const acknowledgeRef = useRef(timer.acknowledgeComplete);
  useEffect(() => {
    acknowledgeRef.current = timer.acknowledgeComplete;
  });

  useEffect(() => {
    if (timer.status !== 'completed') return;
    const timeout = setTimeout(() => {
      acknowledgeRef.current();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [timer.status]);

  const highlightedSeconds = useMemo(
    () => timer.lastUsedSeconds ?? lastUsed,
    [timer.lastUsedSeconds, lastUsed],
  );

  const handleStart = useCallback(
    async (seconds: number) => {
      await ensurePermission();
      await setLastUsed(seconds);
      await timer.start(seconds);
    },
    [ensurePermission, setLastUsed, timer],
  );

  const handleDeleteCustom = useCallback(
    (seconds: number) => {
      Alert.alert(
        'Delete preset',
        formatSeconds(seconds),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removePreset(seconds),
          },
        ],
      );
    },
    [removePreset],
  );

  const handleAddPreset = useCallback(
    async (seconds: number) => {
      await addPreset(seconds);
    },
    [addPreset],
  );

  if (!hydrated) {
    return <View style={styles.loadingContainer} />;
  }

  // ── Running / Completed view ───────────────────────────────────────────────
  if (timer.status === 'running' || timer.status === 'completed') {
    const progress =
      timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;
    const totalSeconds = Math.round(timer.totalMs / 1000);

    return (
      <View style={styles.runningContainer}>
        <View style={styles.runningHeader}>
          <Text style={styles.runningKicker}>SESSION IN PROGRESS</Text>
          <Text style={styles.runningDuration}>{formatSeconds(totalSeconds)}</Text>
        </View>

        <View style={styles.progressWrapper}>
          <CircularProgress progress={progress} size={300} strokeWidth={6} />
          <View style={styles.countdownOverlay}>
            <CountdownDisplay remainingMs={timer.remainingMs} testID="countdown-display" />
          </View>
        </View>

        <View style={styles.controlsWrapper}>
          <RunningControls
            onCancel={() => timer.cancel()}
            onAdjust={(d) => timer.adjust(d)}
          />
        </View>
      </View>
    );
  }

  // ── Idle view (preset grid) ────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.gridContent}
        style={styles.gridScroll}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Restly</Text>
          <View style={styles.headerRule} />
          <Text style={styles.tagline}>A QUIET TIMER · REST WELL</Text>
        </View>

        <Text style={styles.sectionLabel}>CHOOSE A PRESET</Text>

        <View style={styles.grid}>
          {FIXED_PRESETS.map((seconds) => (
            <View key={`fixed-${seconds}`} style={[styles.tile, { width: tileWidth }]}>
              <PresetButton
                seconds={seconds}
                isCustom={false}
                isHighlighted={seconds === highlightedSeconds}
                testID={`preset-${seconds}`}
                onPress={() => handleStart(seconds)}
              />
            </View>
          ))}

          {customPresets.map((seconds) => (
            <View key={`custom-${seconds}`} style={[styles.tile, { width: tileWidth }]}>
              <PresetButton
                seconds={seconds}
                isCustom={true}
                isHighlighted={seconds === highlightedSeconds}
                testID={`preset-${seconds}`}
                onPress={() => handleStart(seconds)}
                onLongPress={() => handleDeleteCustom(seconds)}
              />
            </View>
          ))}

          {customPresets.length < MAX_CUSTOM_PRESETS && (
            <View style={[styles.tile, { width: tileWidth }]}>
              <AddTileButton onPress={() => setModalVisible(true)} testID="add-preset-tile" />
            </View>
          )}
        </View>

        {customPresets.length > 0 && (
          <Text style={styles.footnote}>HOLD A CUSTOM PRESET TO REMOVE</Text>
        )}
      </ScrollView>

      <AddPresetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddPreset}
        existingPresets={[...FIXED_PRESETS, ...customPresets]}
      />
    </>
  );
}

// ── AddTileButton ─────────────────────────────────────────────────────────────

type AddTileButtonProps = {
  onPress: () => void;
  testID?: string;
};

function AddTileButton({ onPress, testID }: AddTileButtonProps) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]}
      onPress={handlePress}
      testID={testID}
    >
      <Text style={styles.addTileGlyph}>+</Text>
      <Text style={styles.addTileLabel}>NEW PRESET</Text>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Running view
  runningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 56,
  },
  runningHeader: {
    alignItems: 'center',
  },
  runningKicker: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
    marginBottom: 8,
  },
  runningDuration: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '400',
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.tight,
  },
  progressWrapper: {
    position: 'relative',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Idle / grid view
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 42,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: tracking.tight,
    lineHeight: 46,
  },
  headerRule: {
    width: 36,
    height: 1,
    backgroundColor: colors.accentDeep,
    marginTop: 12,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
    marginBottom: 16,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    // Actual width is injected inline (screen-width dependent) to guarantee
    // two columns without wrap from rounding errors.
  },

  footnote: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
  },

  // Add tile
  addTile: {
    height: 104,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTilePressed: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.surface,
  },
  addTileGlyph: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '300',
    color: colors.textDim,
    lineHeight: 30,
  },
  addTileLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: tracking.chrome,
  },
});
