import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, Platform } from "react-native";
import { AuthProvider } from './context/AuthContext';

import HomeScreen from "./screens/HomeScreen"; 
import ThesisDetailScreen from "./screens/ThesisDetailScreen"; 
import SubmissionScreen from "./screens/SubmissionScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createStackNavigator();

const THEME = {
  bg: '#F2F0E9',
  headerBorder: '#000',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <Stack.Navigator 
          screenOptions={{
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: THEME.bg,
              borderBottomWidth: 2,
              borderBottomColor: THEME.headerBorder,
              elevation: 0, 
              shadowOpacity: 0, 
            },
            headerTitleStyle: {
              fontFamily: THEME.font,
              fontWeight: '900',
              fontSize: 18,
            },
            headerTintColor: '#000',
            headerBackTitleVisible: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: "GTS_TERMINAL_V1" }}
          />
          <Stack.Screen 
            name="ThesisDetail" 
            component={ThesisDetailScreen} 
            options={{ title: "FILE_DETAILS" }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: "USER_PROFILE" }}
          />
          <Stack.Screen 
            name="Submission" 
            component={SubmissionScreen} 
            options={{ title: "NEW_ENTRY" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}