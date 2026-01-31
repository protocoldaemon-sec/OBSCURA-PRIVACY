import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { WalletProvider } from './src/context/WalletContext';
import HomeScreen from './src/screens/HomeScreen';
import TransferScreen from './src/screens/TransferScreen';
import SwapScreen from './src/screens/SwapScreen';
import WalletButton from './src/components/WalletButton';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <WalletProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0A0A0F',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#0A0A0F',
            },
            headerRight: () => <WalletButton />,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Transfer" 
            component={TransferScreen}
            options={{ title: 'Private Transfer' }}
          />
          <Stack.Screen 
            name="Swap" 
            component={SwapScreen}
            options={{ title: 'Private Swap' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </WalletProvider>
  );
}
