import React, { useState } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const THEME = {
  bg: '#F2F0E9',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function SubmissionScreen({ navigation }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    author: user ? user.name : 'Unknown Author', // Fallback to prevent crash
    year: new Date().getFullYear().toString(),
    type: 'Master',
    language: 'English'
  });

  const handleSubmit = async () => {
    // 1. Validation
    if (!formData.title || !formData.abstract) {
      Alert.alert("VALIDATION ERROR", "Title and Abstract are required.");
      return;
    }

    setSubmitting(true);

    try {
      console.log("Attempting to submit to: http://10.225.126.1:3000/api/theses"); // DEBUG LOG

      // --- CHECK YOUR IP ADDRESS HERE ---
      const response = await fetch('http://10.225.126.1:3000/api/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          abstract: formData.abstract,
          year: formData.year,
          type: formData.type,
          language: formData.language,
          author_name: formData.author 
        }),
      });

      // 2. Handle Non-JSON Responses (like 404 or 500 HTML errors)
      const text = await response.text(); 
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }

      if (data.success) {
        Alert.alert("SUCCESS", "Thesis uploaded successfully!");
        navigation.goBack();
      } else {
        Alert.alert("SERVER ERROR", data.message || "Unknown server error");
      }

    } catch (error) {
      // 3. Show the EXACT network error
      console.error(error);
      Alert.alert("CONNECTION FAILED", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>// NEW_ENTRY_FORM</Text>
      
      <View style={styles.group}>
        <Text style={styles.label}>THESIS TITLE *</Text>
        <TextInput 
          style={styles.input} 
          value={formData.title}
          onChangeText={(t) => setFormData({...formData, title: t})}
          placeholder="ENTER TITLE..."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>AUTHOR (LOCKED)</Text>
        <TextInput 
          style={[styles.input, {backgroundColor: '#DDD'}]} 
          value={formData.author}
          editable={false}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.group, {flex: 1, marginRight: 10}]}>
          <Text style={styles.label}>YEAR</Text>
          <TextInput 
            style={styles.input} 
            value={formData.year}
            keyboardType="numeric"
            onChangeText={(t) => setFormData({...formData, year: t})}
          />
        </View>
        <View style={[styles.group, {flex: 1}]}>
          <Text style={styles.label}>LANGUAGE</Text>
          <TextInput 
            style={styles.input} 
            value={formData.language}
            onChangeText={(t) => setFormData({...formData, language: t})}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>ABSTRACT *</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={formData.abstract}
          onChangeText={(t) => setFormData({...formData, abstract: t})}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.submitBtnText}>EXECUTE_UPLOAD</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, padding: 20 },
  headerTitle: { fontFamily: THEME.font, fontSize: 18, fontWeight: '900', marginBottom: 25, textDecorationLine: 'underline' },
  group: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 0 },
  label: { fontFamily: THEME.font, fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', padding: 12, fontFamily: THEME.font, borderBottomWidth: 4, borderRightWidth: 4 },
  textArea: { height: 120 },
  submitBtn: { flexDirection: 'row', backgroundColor: '#000', padding: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontFamily: THEME.font, fontWeight: 'bold', fontSize: 16 }
});