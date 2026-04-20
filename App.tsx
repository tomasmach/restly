import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TimerScreen } from './screens/TimerScreen';
import { colors } from './constants/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="light" />
        <TimerScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
