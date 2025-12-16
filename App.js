import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, Platform } from "react-native";

// Import your screens
import HomeScreen from "./screens/HomeScreen"; 
import ThesisDetailScreen from "./screens/ThesisDetailScreen"; 
// Note: If you moved your previous search code to "ThesisListScreen", import that instead.
// For now, I assume HomeScreen is your Search/List screen.

const Stack = createStackNavigator();

const THEME = {
  bg: '#F2F0E9',
  headerBorder: '#000',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <Stack.Navigator 
        screenOptions={{
          headerTitleAlign: "center",
          // Retro Header Styling
          headerStyle: {
            backgroundColor: THEME.bg,
            borderBottomWidth: 2,
            borderBottomColor: THEME.headerBorder,
            elevation: 0, // Remove default Android shadow
            shadowOpacity: 0, // Remove default iOS shadow
          },
          headerTitleStyle: {
            fontFamily: THEME.font,
            fontWeight: '900',
            fontSize: 18,
          },
          headerTintColor: '#000', // Back button color
          headerBackTitleVisible: false, // Hide "Back" text on iOS
        }}
      >
        {/* If your previous code was the Search List, keep it as HomeScreen */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}