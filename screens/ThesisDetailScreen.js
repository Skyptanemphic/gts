import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, SafeAreaView, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  bg: '#F4F6F8',
  primary: '#003366',
  accent: '#0056b3',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
};

export default function ThesisDetailScreen({ navigation, route }) {
  // Safety check: ensure thesis exists to prevent crashes
  const thesis = route.params?.thesis || {}; 

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={THEME.primary} /></View>
      <View style={{flex: 1}}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Thesis Details</Text>
        <View style={{width: 24}} />
      </View>

      {/* FIX APPLIED:
         1. style={{ flex: 1 }} -> Ensures ScrollView takes available space.
         2. contentContainerStyle={{ flexGrow: 1 }} -> Ensures content fills height even if short.
         3. alwaysBounceVertical -> Forces scroll simulation on iOS even if content is short.
      */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true} 
        overScrollMode="always" // Android bounce effect
      >
        <View style={styles.headerCard}>
          <View style={styles.badges}>
            <View style={styles.typeBadge}><Text style={styles.badgeText}>{thesis.type || 'THESIS'}</Text></View>
            <View style={styles.langBadge}><Text style={styles.langText}>{thesis.language_name || 'English'}</Text></View>
          </View>
          <Text style={styles.title}>{thesis.title || 'Untitled Thesis'}</Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}><Ionicons name="calendar-outline" size={14} color={THEME.textSecondary} /><Text style={styles.metaText}>{thesis.year || 'N/A'}</Text></View>
            <View style={styles.metaItem}><Ionicons name="document-text-outline" size={14} color={THEME.textSecondary} /><Text style={styles.metaText}>{thesis.num_pages ? `${thesis.num_pages} Pages` : 'Pages N/A'}</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <InfoRow icon="person-outline" label="Author" value={thesis.author_name} />
          <View style={styles.divider} />
          <InfoRow icon="school-outline" label="University" value={thesis.university_name} />
          <View style={styles.divider} />
          <InfoRow icon="business-outline" label="Institute" value={thesis.institute_name} />
          <View style={styles.divider} />
          <InfoRow icon="people-outline" label="Supervisor" value={thesis.supervisor_name} />
          <View style={styles.divider} />
          <InfoRow icon="people-outline" label="Co-Supervisor" value={thesis.cosupervisor_name} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Abstract</Text>
          <Text style={styles.abstractText}>{thesis.abstract || "No abstract available."}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // FIX: On Android, SafeAreaView is just a View. We ensure it fills the screen.
  safeArea: { 
    flex: 1, 
    backgroundColor: THEME.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  
  topBar: {
    backgroundColor: THEME.primary,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  // FIX: Explicit style for ScrollView to take remaining space
  scrollView: {
    flex: 1, 
    width: '100%',
  },
  // FIX: Increased paddingBottom to 100 to clear any Bottom Tab Bars
  scrollContent: { 
    padding: 16, 
    paddingBottom: 100, 
    flexGrow: 1 
  },

  headerCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: THEME.primary, fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  langBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  langText: { color: THEME.textSecondary, fontWeight: '600', fontSize: 11 },
  title: { fontSize: 20, fontWeight: '700', color: THEME.text, marginBottom: 12, lineHeight: 28 },
  metaContainer: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: THEME.textSecondary },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F6F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 11, color: THEME.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 15, color: THEME.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12, marginLeft: 48 },
  abstractText: { fontSize: 15, lineHeight: 24, color: '#444', textAlign: 'justify' },
});