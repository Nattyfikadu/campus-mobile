import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ComplaintProvider } from './src/context/ComplaintContext';
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FB' }}>
        <ActivityIndicator size="large" color="#0F6CBD" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Campus Complaints' }} />
        <Stack.Screen name="RoleChoice" component={RoleChoiceScreen} options={{ title: 'Choose How To Continue' }} />
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
    <AuthProvider>
      <ComplaintProvider>
        <AppNavigator />
      </ComplaintProvider>
    </AuthProvider>
  );
}
