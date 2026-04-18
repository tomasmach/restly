import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { TimerScreen } from './screens/TimerScreen';
import { colors } from './constants/colors';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <TimerScreen />
    </SafeAreaView>
  );
}
