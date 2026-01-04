import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, 
  SafeAreaView, Modal, ActivityIndicator, StatusBar, Platform, Keyboard
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; 

const THEME = {
  bg: '#F4F6F8',
  primary: '#003366',
  accent: '#0056b3',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth(); 

  const [searchText, setSearchText] = useState('');
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter States
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchTheses = async () => {
    setLoading(true);
    try {
      let url = `http://192.168.1.93:3000/api/theses?`;
      if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
      if (selectedType !== 'All') url += `type=${encodeURIComponent(selectedType)}&`;
      if (selectedLanguage !== 'All') url += `language=${encodeURIComponent(selectedLanguage)}&`;
      if (selectedYear) url += `year=${encodeURIComponent(selectedYear)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setTheses(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTheses();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchText, selectedType, selectedLanguage, selectedYear]);

  // --- RENDER COMPONENT: HEADER (Search is inside the list) ---
  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={THEME.textSecondary} style={{marginRight: 8}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search theses..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.resultsLabel}>
        {loading ? 'Searching...' : `Found ${theses.length} results`}
      </Text>
    </View>
  );

  const renderThesisItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ThesisDetail', { thesis: item })}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>{item.type}</Text>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{item.year}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={14} color={THEME.textSecondary} />
            <Text style={styles.metaText}>{item.author_name}</Text>
          </View>
          {item.university_name && (
            <View style={styles.metaRow}>
                <Ionicons name="school-outline" size={14} color={THEME.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>{item.university_name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      {/* FIXED TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>GTS Project</Text>
          <Text style={styles.headerSubtitle}>
             {user ? `Welcome, ${user.name}` : 'Thesis Database'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
           <Ionicons name="person-circle-outline" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* MAIN LIST */}
      <FlatList
        data={theses}
        keyExtractor={(item, index) => item.thesis_no ? item.thesis_no.toString() : index.toString()} 
        renderItem={renderThesisItem}
        ListHeaderComponent={renderHeader}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss} 
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
                <Ionicons name="library-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No theses found.</Text>
            </View>
          )
        }
        ListFooterComponent={loading && <ActivityIndicator size="large" color={THEME.primary} style={{marginTop: 20}} />}
      />

      {/* --- MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={THEME.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Degree Level</Text>
            <View style={styles.chipsContainer}>
              {['All', 'Master', 'Doctorate', 'Medicine'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.chip, selectedType === type && styles.chipActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Language</Text>
            <View style={styles.chipsContainer}>
              {['All', 'English', 'Turkish', 'French'].map(lang => (
                <TouchableOpacity 
                  key={lang} 
                  style={[styles.chip, selectedLanguage === lang && styles.chipActive]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                    <Text style={[styles.chipText, selectedLanguage === lang && styles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Publication Year</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. 2023"
              placeholderTextColor="#CCC"
              keyboardType="numeric"
              value={selectedYear}
              onChangeText={setSelectedYear}
            />

            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => { fetchTheses(); setFilterModalVisible(false); }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- WEB SCROLL FIX IS HERE ---
  safeArea: { 
    flex: 1, 
    backgroundColor: THEME.bg,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}) 
  },
  
  topBar: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#E0E0E0' },
  
  flatList: { flex: 1, backgroundColor: THEME.bg },
  flatListContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  
  listHeaderContainer: { marginBottom: 16 },
  resultsLabel: { fontSize: 12, color: THEME.textSecondary, marginTop: 8, marginLeft: 4 },
  
  searchSection: { flexDirection: 'row', gap: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: '#E0E0E0',
  },
  searchInput: { flex: 1, fontSize: 15, color: THEME.text },
  filterBtn: {
    width: 50, height: 50, backgroundColor: THEME.accent, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  
  cardContainer: { marginBottom: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardType: { fontSize: 11, fontWeight: '700', color: THEME.primary, textTransform: 'uppercase' },
  yearBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  yearText: { fontSize: 12, color: '#666', fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 12 },
  cardMeta: { flexDirection: 'column', gap: 6, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: THEME.textSecondary },
  
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { fontSize: 16, color: THEME.textSecondary, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.text },
  closeBtn: { padding: 4, backgroundColor: '#F5F5F5', borderRadius: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: THEME.text, marginTop: 8 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20 },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { fontSize: 13, color: THEME.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  modalInput: { borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, fontSize: 16 },
  applyButton: { backgroundColor: THEME.primary, padding: 16, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  applyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 }
});