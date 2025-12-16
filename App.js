import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./screens/HomeScreen";
import ThesisListScreen from "./screens/ThesisListScreen";
import ThesisDetailScreen from "./screens/ThesisDetailScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ThesisList" component={ThesisListScreen} />
        <Stack.Screen name="ThesisDetail" component={ThesisDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
