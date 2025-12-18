/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import SweetShopPOSScreen from './components/SweetshopPOSScreen';
import { Provider } from 'react-redux';
import { store } from './reducers/store';


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Provider store={store}>
        <SweetShopPOSScreen /> 
      </Provider>
      
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>
        Welcome to SweetShop
      </Text>

      <Text
        onPress={() => console.log('Get started pressed')}
        accessibilityRole="button"
        style={{
          backgroundColor: '#007AFF',
          color: '#fff',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          overflow: 'hidden',
          textAlign: 'center',
          minWidth: 140,
        }}
      >
        Get started
      </Text>

      <Text style={{ marginTop: 12, color: '#666' }}>
        A simple starter button — replace onPress with your action.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
