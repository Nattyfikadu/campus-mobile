import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ComplaintProvider } from './src/context/ComplaintContext';
import SplashScreen from './src/screens/SplashScreen';
import {
  ComplaintFormScreen,
  DashboardScreen,
  HomeScreen,
  LoginScreen,
  QRScannerScreen,
  RegisterScreen,
  RoleChoiceScreen,
  ThankYouScreen,
  TrackComplaintScreen,
} from './src/screens';

const Stack = createStackNavigator();

function AppNavigator() {
  const { isLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Show animated splash until both the splash animation AND auth check are done
  if (!splashDone || isLoading) {
    return (
      <SplashScreen
        onFinish={() => setSplashDone(true)}
        // Keep showing splash if auth is still loading after animation ends
        freeze={isLoading}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RoleChoice" component={RoleChoiceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'Scan QR Code' }} />
        <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: 'Submit Complaint' }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="TrackComplaint" component={TrackComplaintScreen} options={{ title: 'Track Complaint' }} />
        <Stack.Screen name="ThankYou" component={ThankYouScreen} options={{ title: 'Submission Complete' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ComplaintProvider>
          <AppNavigator />
        </ComplaintProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
