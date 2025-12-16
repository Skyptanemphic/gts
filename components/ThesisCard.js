import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

export default function ThesisCard({ thesis, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          padding: 15,
          marginBottom: 10,
          backgroundColor: "#eee",
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 18 }}>{thesis.title}</Text>
        <Text style={{ color: "#555" }}>{thesis.author}</Text>
      </View>
    </TouchableOpacity>
  );
}
