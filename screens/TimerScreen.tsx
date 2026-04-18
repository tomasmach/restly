import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

  // ── acknowledgeComplete after 1500 ms ──────────────────────────────────────
  // We only want this effect to fire once when status becomes 'completed', not
  // re-fire on unrelated renders. Depend only on timer.status.
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

  // ── Highlight logic ────────────────────────────────────────────────────────
  // While running/completed we use timer.lastUsedSeconds (persists through
  // acknowledgeComplete). After ack it falls back to the persisted lastUsed.
  const highlightedSeconds = useMemo(
    () => timer.lastUsedSeconds ?? lastUsed,
    [timer.lastUsedSeconds, lastUsed],
  );

  // ── handleStart ────────────────────────────────────────────────────────────
  const handleStart = useCallback(
    async (seconds: number) => {
      await ensurePermission(); // don't block on denial
      await setLastUsed(seconds);
      await timer.start(seconds);
    },
    [ensurePermission, setLastUsed, timer],
  );

  // ── handleDeleteCustom ─────────────────────────────────────────────────────
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

  // ── handleAddPreset ────────────────────────────────────────────────────────
  const handleAddPreset = useCallback(
    async (seconds: number) => {
      await addPreset(seconds);
    },
    [addPreset],
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!hydrated) {
    return <View style={styles.loadingContainer} />;
  }

  // ── Running / Completed view ───────────────────────────────────────────────
  if (timer.status === 'running' || timer.status === 'completed') {
    const progress =
      timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;

    return (
      <View style={styles.runningContainer}>
        <View style={styles.progressWrapper}>
          <CircularProgress
            progress={progress}
            size={280}
            strokeWidth={16}
          />
          {/* CountdownDisplay absolutely centered inside the ring */}
          <View style={styles.countdownOverlay}>
            <CountdownDisplay remainingMs={timer.remainingMs} />
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
        <View style={styles.grid}>
          {/* Fixed presets */}
          {FIXED_PRESETS.map((seconds) => (
            <View key={`fixed-${seconds}`} style={styles.tile}>
              <PresetButton
                seconds={seconds}
                isCustom={false}
                isHighlighted={seconds === highlightedSeconds}
                onPress={() => handleStart(seconds)}
              />
            </View>
          ))}

          {/* Custom presets */}
          {customPresets.map((seconds) => (
            <View key={`custom-${seconds}`} style={styles.tile}>
              <PresetButton
                seconds={seconds}
                isCustom={true}
                isHighlighted={seconds === highlightedSeconds}
                onPress={() => handleStart(seconds)}
                onLongPress={() => handleDeleteCustom(seconds)}
              />
            </View>
          ))}

          {/* Add preset tile */}
          {customPresets.length < MAX_CUSTOM_PRESETS && (
            <View style={styles.tile}>
              <AddTileButton onPress={() => setModalVisible(true)} />
            </View>
          )}
        </View>
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
};

function AddTileButton({ onPress }: AddTileButtonProps) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable style={styles.addTile} onPress={handlePress}>
      <Text style={styles.addTileText}>+</Text>
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
    justifyContent: 'center',
  },
  progressWrapper: {
    position: 'relative',
    width: 280,
    height: 280,
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
    marginTop: 48,
    width: '100%',
    paddingHorizontal: 20,
  },

  // Idle / grid view
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '48%',
  },

  // Add tile button
  addTile: {
    borderRadius: 16,
    height: 80,
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: {
    fontSize: 32,
    color: colors.textDim,
    lineHeight: 36,
  },
});
