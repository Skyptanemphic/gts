import React from "react";
import { View, Text } from "react-native";

export default function ThesisDetailScreen({ route }) {
  const { thesis } = route.params;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22 }}>{thesis.title}</Text>
      <Text style={{ marginTop: 10 }}>Author: {thesis.author}</Text>
      <Text>Year: {thesis.year}</Text>
    </View>
  );
}
