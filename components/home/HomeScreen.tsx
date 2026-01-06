import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Platform, PermissionsAndroid, Alert, TextInput, TouchableOpacity, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { fetchInventory, setEmpName, setMac } from '../../features/inventory/InventorySlice';
import { useDispatch, useSelector } from 'react-redux';
import { ThermalPrinter } from '@finan-me/react-native-thermal-printer';
import { useMMKV } from 'react-native-mmkv';
import { addRowToSheet, BillingDetails, retryAsync } from '../../features/inventory/InventoryAPI';

// Define the type for navigation (adjust screen names as needed)
type RootStackParamList = {
  SweetShopPOS: undefined;
  ListDetails: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const storage = useMMKV();
  const [printerMac, setPrinterMac] = React.useState('bt:66:32:3D:B4:93:FC');
  const [printerLabel, setPrinterLabel] = React.useState('Set Printer');
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [loader, setLoader] = React.useState(false);
    const dispatch = useDispatch();
  const setName = (name: string) => {
    dispatch(setEmpName(name as any));
    navigation.navigate('SweetShopPOS');
  };

  const inventory = useSelector((state: any) => state.inventory.items);

  const syncInventory = () => { 
    setLoader(true);
    dispatch(fetchInventory() as any);
  };

  const synBills = (mac: string) => {
    const bs = storage.getString('bills');

    if(bs){
      const parsedBills = JSON.parse(bs);
      if(parsedBills.length > 0) {
        setLoader(true);
        retryAsync(() => addRowToSheet(parsedBills as unknown as BillingDetails[]), 3, 1500).then(() => {
          Alert.alert('Synced sucessfully...');
          setLoader(false);
          storage.remove('bills');
            // setLastEditedRowId(prev => prev + 1);
        }).catch(() => {
          // Alert.alert("Error", "Failed to make the network.");
        });
      } else {
        Alert.alert('No items to sync...');
      }
    } else {
      Alert.alert('No items to sync...');
    }
    //console.log(bills)
  };

  useEffect(() => {   
    console.log('Inventory items count:', inventory.length);
    if(inventory.length > 0) {
      Alert.alert('Inventory Sync', `Inventory synced successfully. Total items: ${inventory.length}`);
      storage.set('inventory', JSON.stringify(inventory));
      setLoader(false);
    }
  }, [inventory]);

  useEffect(() => {
    (async () => {
      const hasPermission = await requestBluetoothPermissions()
      if (hasPermission) {
          const {paired, found} = await ThermalPrinter.scanDevices();
          // console.log('Paired Devices:', paired.length);
          // console.log('Found Devices:', found);
      }
    })();
  }, []);

  async function setPrinter(mac: string) {
    setLoader(true);
    setPrinterLabel('Connecting...');
    const success = (await ThermalPrinter.testConnection(mac)).success;
    Alert.alert('Bluetooth Printer Connection', success ? 'Printer connected successfully.' : 'Failed to connect to printer.');
    setPrinterLabel('Set Printer');
    setLoader(false);
    if (success) {
      dispatch(setMac(mac as any));
    } else {
      dispatch(setMac('' as any));
    }
  }

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

const mac = useSelector((state: any) => state.inventory.mac);

  return (
    <View style={styles.container}> 
      <Text style={{fontSize: 20, fontWeight: 'bold', color: 'green'}}>Thaya's Sweet & Cakes POS</Text>
      <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
        <TouchableOpacity
          style={{...styles.itemBtn, ...(loader ? styles.disabledBtn : {})}}
          onPress={() => syncInventory()}
          disabled={loader}
        >
          <Text style={styles.addText}>Sync Invetory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{...styles.itemBtn, ...(loader ? styles.disabledBtn : {})}}
          onPress={() => synBills(printerMac)}
          disabled={loader}
        >
          <Text style={styles.addText}>Sync Bills</Text>
        </TouchableOpacity>
      </View>
      <Text style={{fontSize: 24, marginBottom: 20}}>
        {
          mac ? `Printer MAC: ${printerMac}` : 'No Printer Set'
        }
      </Text>
      <TextInput style={styles.input} placeholder="Mac Address" value={printerMac} onChangeText={(text) => setPrinterMac(text)} />
      <TouchableOpacity
        style={{...styles.itemBtn, ...(loader ? styles.disabledBtn : {})}}
        onPress={() => setPrinter(printerMac)}
        disabled={loader}
      >
        <Text style={styles.addText}>{printerLabel}</Text>
      </TouchableOpacity>
      <Text style={styles.salesPersonText}> Select sales person</Text>
      <Button
        title="Demo"
        onPress={() => setName('Demo')}
        disabled={loader}
        color="#de0a3cff"
      />
      <Button
        title="Jensi"
        onPress={() => setName('Jensi')}
        disabled={loader}
      />
      <Button
        title="Stains"
        onPress={() => setName('Stains')}
        disabled={loader}
      />
      <Button
        title="Muthu"
        onPress={() => setName('Muthu')}
        disabled={loader}
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
  input: {
    height: 40,
    borderColor: 'gray',  
    borderWidth: 1,
    width: '80%',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  itemBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,  
    borderRadius: 5,
    marginBottom: 20,
  },
  addText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  salesPersonText: {
    fontSize: 20,
    marginBottom: 10,
  },
  disabledBtn: {
    backgroundColor: 'grey',
    color: 'grey'
  }
});