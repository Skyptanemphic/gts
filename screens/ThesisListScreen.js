import React from "react";
import { View, FlatList } from "react-native";
import ThesisCard from "../components/ThesisCard";

const theses = [
  { id: "1", title: "Deep Learning Optimization", author: "Eren T.", year: 2024 },
  { id: "2", title: "Quantum Computing Models", author: "Can O.", year: 2023 },
  { id: "3", title: "Sustainable Energy Systems", author: "Utkuhan Ö.", year: 2023 },
];

export default function ThesisListScreen({ navigation }) {
  return (
    <View style={{ padding: 20 }}>
      <FlatList
        data={theses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThesisCard
            thesis={item}
            onPress={() =>
              navigation.navigate("ThesisDetail", { thesis: item })
            }
          />
        )}
      />
    </View>
  );
}
