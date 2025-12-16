import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  bg: '#F2F0E9',
  card: '#FFF',
  text: '#000',
  accent: '#FF5722',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function ThesisDetailScreen({ route }) {
  // Get the thesis object passed from navigation
  const { thesis } = route.params; 

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* HEADER SECTION */}
      <View style={styles.section}>
        <View style={styles.typeTag}>
          <Text style={styles.tagText}>{thesis.type}</Text>
        </View>
        <Text style={styles.title}>{thesis.title.toUpperCase()}</Text>
        
        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={16} color="#000" />
          <Text style={styles.metaText}>YEAR: {thesis.year}</Text>
          <Text style={styles.metaText}> | </Text>
          <Ionicons name="language" size={16} color="#000" />
          <Text style={styles.metaText}>{thesis.language_name}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* AUTHOR & UNIVERSITY INFO */}
      <View style={styles.infoBox}>
        <View style={styles.row}>
            <Text style={styles.label}>AUTHOR:</Text>
            <Text style={styles.value}>{thesis.author_name}</Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>SUPERVISOR:</Text>
            {/* Handle missing supervisor just in case */}
            <Text style={styles.value}>{thesis.supervisor_name || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>UNIVERSITY:</Text>
            <Text style={styles.value}>{thesis.university_name}</Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>INSTITUTE:</Text>
            <Text style={styles.value}>{thesis.institute_name}</Text>
        </View>
      </View>

      {/* ABSTRACT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>// ABSTRACT_SUMMARY</Text>
        <View style={styles.abstractCard}>
            <Text style={styles.abstractText}>
                {thesis.abstract || "NO ABSTRACT DATA AVAILABLE."}
            </Text>
        </View>
      </View>

      {/* FOOTER METADATA */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>THESIS_NO: {thesis.thesis_no}</Text>
        <Text style={styles.footerText}>PAGES: {thesis.num_pages || 'Unknown'}</Text>
        <Text style={styles.footerText}>SUBMITTED: {new Date(thesis.submission_date).toLocaleDateString()}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  
  // TITLE STYLES
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 10,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  tagText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: THEME.font,
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.text,
    fontFamily: THEME.font,
    lineHeight: 28,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: THEME.font,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // DIVIDER
  divider: {
    height: 2,
    backgroundColor: '#000',
    marginBottom: 20,
    borderStyle: 'dashed', // Note: borderStyle only works well with borderWidth
  },

  // INFO BOX
  infoBox: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    padding: 15,
    marginBottom: 25,
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontFamily: THEME.font,
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  value: {
    fontFamily: THEME.font,
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },

  // ABSTRACT
  sectionHeader: {
    fontFamily: THEME.font,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    color: THEME.accent,
  },
  abstractCard: {
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  abstractText: {
    fontFamily: THEME.font,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },

  // FOOTER
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontFamily: THEME.font,
    fontSize: 12,
    color: '#555',
  }
});