import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider>;
}
