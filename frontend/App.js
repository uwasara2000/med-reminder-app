import './src/polyfills';
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, LogBox } from 'react-native';

LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'SafeAreaView has been deprecated',
  'Notice: Push notifications limited in Expo Go',
  'Notice: Local notifications limited in Expo Go'
]);
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MedicationProvider } from './src/context/MedicationContext';
import { colors } from './src/theme/colors';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import AdherenceHistoryScreen from './src/screens/AdherenceHistoryScreen';
import CaregiverScreen from './src/screens/CaregiverScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AlarmModal from './src/components/AlarmModal';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { isSeniorMode, isCaregiver } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: Platform.OS === 'android' ? (isSeniorMode ? 86 : 74) : (isSeniorMode ? 78 : 66),
          paddingBottom: Platform.OS === 'android' ? (isSeniorMode ? 20 : 16) : (isSeniorMode ? 14 : 10),
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: isSeniorMode ? 13 : 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const iconSize = isSeniorMode ? 28 : 24;

          if (route.name === 'TodayTab') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          } else if (route.name === 'MedicationsTab') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'AdherenceTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'CaregiverTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="TodayTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Today's Doses" }}
      />
      <Tab.Screen
        name="MedicationsTab"
        component={MedicationsScreen}
        options={{ tabBarLabel: 'Prescriptions' }}
      />
      <Tab.Screen
        name="AdherenceTab"
        component={AdherenceHistoryScreen}
        options={{ tabBarLabel: 'Adherence' }}
      />
      <Tab.Screen
        name="CaregiverTab"
        component={CaregiverScreen}
        options={{ tabBarLabel: isCaregiver ? 'Caregiver' : 'Family/Help' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const NavigationRoot = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AddMedication"
              component={AddMedicationScreen}
              options={{
                presentation: 'modal',
                headerShown: false
              }}
            />
          </>
        )}
      </Stack.Navigator>
      {/* Global Accessibility Alarm Modal */}
      <AlarmModal />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MedicationProvider>
        <NavigationRoot />
      </MedicationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
