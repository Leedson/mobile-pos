import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { setEmpName } from '../../features/inventory/InventorySlice';
import { useDispatch } from 'react-redux';
import { ThermalPrinter } from '@finan-me/react-native-thermal-printer';

// Define the type for navigation (adjust screen names as needed)
type RootStackParamList = {
  SweetShopPOS: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
    const dispatch = useDispatch();
  const setName = (name: string) => {
    dispatch(setEmpName(name as any));
    navigation.navigate('SweetShopPOS');
  };

  useEffect(() => { 
    (async () => {
        const hasPermission = await requestBluetoothPermissions()
        if (hasPermission) {
            await ThermalPrinter.scanDevices();
        }
        const success = (await ThermalPrinter.testConnection('bt:66:32:3D:B4:93:FC')).success;
        Alert.alert('Bluetooth Printer Connection', success ? 'Printer connected successfully.' : 'Failed to connect to printer.');
    })();
    }, []);

  async function requestBluetoothPermissions() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted'
      )
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      return granted === 'granted'
    }
  }

  return true // iOS handles automatically
}

  return (
    <View style={styles.container}>
      <Button
        title="Jensi"
        onPress={() => setName('Jensi')}
      />
      <Button
        title="Stains"
        onPress={() => setName('Stains')}
      />
      <Button
        title="Muthu"
        onPress={() => setName('Muthu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20, // adds spacing between buttons (React Native 0.71+)
  },
});