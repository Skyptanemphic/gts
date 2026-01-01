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

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#003366" />
        
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            animationEnabled: true,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ThesisDetail" 
            component={ThesisDetailScreen} 
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Submission" 
            component={SubmissionScreen} 
            options={{ headerShown: false }} 
          />

        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}