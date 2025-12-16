// SubmissionScreen.js Concept
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const THEME = {
  bg: '#F2F0E9',
  inputBg: '#FFF',
  text: '#000',
  accent: '#FF5722',
};

export default function SubmissionScreen() {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    author: '', // In a real app, this might come from logged-in user state
    year: new Date().getFullYear().toString(),
    pages: '',
    language: 'English',
    supervisor: '',
    universityId: null, // Needs a picker/modal
    instituteId: null,  // Needs a picker/modal
  });

  const handleSubmit = () => {
    // 1. Validate mandatory fields (Req 2.1)
    if (!formData.title || !formData.abstract || !formData.supervisor) {
      alert("ERROR: MANDATORY_FIELDS_MISSING");
      return;
    }
    // 2. POST to your API
    console.log("Submitting:", formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>THESIS_SUBMISSION_FORM</Text>
      
      {/* TITLE INPUT */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>THESIS TITLE [MAX 500 CHARS]</Text>
        <TextInput 
          style={styles.input} 
          multiline 
          value={formData.title}
          onChangeText={(t) => setFormData({...formData, title: t})}
        />
      </View>

      {/* ABSTRACT INPUT (Req 2.1) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>ABSTRACT [MAX 5000 CHARS]</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          multiline 
          textAlignVertical="top"
          value={formData.abstract}
          onChangeText={(t) => setFormData({...formData, abstract: t})}
        />
      </View>

      {/* SUPERVISOR (Req 2.4) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>SUPERVISOR</Text>
        <TextInput 
          style={styles.input}
          value={formData.supervisor}
          onChangeText={(t) => setFormData({...formData, supervisor: t})}
        />
      </View>
      
      {/* Submit Button */}
      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>UPLOAD_DATA_TO_MAINFRAME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    fontFamily: 'monospace', // Keep the retro font
    textDecorationLine: 'underline',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    fontFamily: 'monospace',
    // Retro shadow
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  btn: {
    backgroundColor: THEME.accent,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 6,
    borderRightWidth: 6,
    marginTop: 20,
    marginBottom: 40,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  }
});