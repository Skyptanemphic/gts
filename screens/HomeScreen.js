import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, 
  SafeAreaView, Modal, ActivityIndicator, StatusBar, Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // IMPORT

const THEME = {
  bg: '#F2F0E9',
  card: '#FFFFFF',
  text: '#000000',
  border: '#000000',
  accent: '#FF5722',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth(); // GET USER STATE

  const [searchText, setSearchText] = useState('');
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchTheses = async () => {
    setLoading(true);
    try {
      let url = `http://10.225.126.1:3000/api/theses?`;
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

  const renderThesisItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ThesisDetail', { thesis: item })}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: THEME.accent }]}>
                  <Text style={[styles.badgeText, { color: '#FFF' }]}>{item.type}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#FFF', borderWidth: 2 }]}>
                  <Text style={[styles.badgeText, { color: '#000' }]}>{item.language_name}</Text>
              </View>
          </View>
          <Text style={styles.yearText}>[{item.year}]</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title.toUpperCase()}</Text>
        
        <View style={styles.cardDivider}>
          <Text numberOfLines={1} ellipsizeMode="clip" style={{color: THEME.border, letterSpacing: 3}}>
            - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Ionicons name="person" size={16} color="black" />
            <Text style={styles.metaText}>{item.author_name}</Text>
          </View>
          
          {item.university_name && (
            <View style={styles.metaRow}>
                <Ionicons name="business" size={16} color="black" />
                <Text style={styles.metaText} numberOfLines={1}>{item.university_name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      <View style={styles.container}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>GTS_PORTAL_V1</Text>
            <Text style={styles.headerSubtitle}>
               {user ? `> USER: ${user.name.toUpperCase()}` : '> ACCESSING DATABASE_'}
            </Text>
          </View>
          {/* AVATAR BUTTON -> GOES TO PROFILE */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile')}
          >
             <Ionicons name="person" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* --- SEARCH --- */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={20} color="#000" style={{marginRight: 8}} />
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH QUERY..."
              placeholderTextColor="#555"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.listWrapper}> 
          {loading ? (
            <ActivityIndicator size="large" color="#000" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={theses}
              keyExtractor={(item, index) => item.thesis_no ? item.thesis_no.toString() : index.toString()} 
              renderItem={renderThesisItem}
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent} 
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="folder-open-outline" size={48} color="#000" />
                    <Text style={styles.emptyText}>NO_DATA_FOUND</Text>
                </View>
              }
            />
          )}
        </View>

        {/* --- MODAL CODE REMAINS SAME AS PREVIOUS --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isFilterModalVisible}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>FILTER CONFIG</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>DEGREE LEVEL:</Text>
              <View style={styles.chipsContainer}>
                {['All', 'Master', 'Doctorate', 'Proficiency in Art', 'Medicine'].map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.chip, selectedType === type && styles.chipActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                      {selectedType === type ? `[x] ${type}` : `[ ] ${type}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>LANGUAGE:</Text>
              <View style={styles.chipsContainer}>
                {['All', 'English', 'Turkish', 'French'].map(lang => (
                  <TouchableOpacity 
                    key={lang} 
                    style={[styles.chip, selectedLanguage === lang && styles.chipActive]}
                    onPress={() => setSelectedLanguage(lang)}
                  >
                     <Text style={[styles.chipText, selectedLanguage === lang && styles.chipTextActive]}>
                      {selectedLanguage === lang ? `[x] ${lang}` : `[ ] ${lang}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>PUBLISH YEAR:</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="YYYY"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={selectedYear}
                onChangeText={setSelectedYear}
              />

              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => {
                  fetchTheses(); 
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyButtonText}>EXECUTE FILTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: THEME.bg,
    ...(Platform.OS === 'web' ? { height: '100vh' } : {}) 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20,
    paddingTop: 10,
    overflow: 'hidden',
    height: '100%' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 15,
    borderStyle: 'dashed' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: THEME.text, 
    fontFamily: THEME.font,
    letterSpacing: -1
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.text,
    fontFamily: THEME.font,
    marginTop: 4
  },
  avatarContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF', 
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  searchContainer: { 
    flexDirection: 'row', 
    marginBottom: 20,
    gap: 12
  },
  searchBarWrapper: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF', 
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: THEME.font,
    fontWeight: 'bold'
  },
  filterBtn: {
    width: 50,
    height: 50,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  listWrapper: {
    flex: 1, 
    minHeight: 0, 
  },
  listContent: {
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    maxWidth: '80%'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: THEME.font,
    textTransform: 'uppercase',
  },
  yearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: THEME.font,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
    fontFamily: THEME.font,
    lineHeight: 22
  },
  cardDivider: {
    height: 20,
    overflow: 'hidden',
    marginBottom: 12,
    opacity: 0.5
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 6
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metaText: {
    fontSize: 12,
    color: '#000',
    fontFamily: THEME.font,
    textTransform: 'uppercase'
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    fontFamily: THEME.font
  },
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end', 
  },
  modalContent: {
    backgroundColor: '#FFF', 
    padding: 25,
    minHeight: 450,
    borderTopWidth: 4,
    borderTopColor: '#000'
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#000',
    fontFamily: THEME.font,
    textDecorationLine: 'underline'
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#000'
  },
  label: { 
    fontSize: 14, 
    fontWeight: '900', 
    marginBottom: 10, 
    color: '#000',
    marginTop: 10,
    fontFamily: THEME.font
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  chipActive: {
    backgroundColor: '#000', 
    borderColor: '#000',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    transform: [{translateY: 2}, {translateX: 2}]
  },
  chipText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: THEME.font
  },
  chipTextActive: {
    color: '#FFF'
  },
  modalInput: { 
    borderWidth: 2, 
    borderColor: '#000', 
    backgroundColor: '#FFF',
    padding: 14, 
    fontSize: 16,
    fontFamily: THEME.font,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  applyButton: { 
    backgroundColor: THEME.accent, 
    padding: 16, 
    marginTop: 30, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  applyButtonText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 16,
    fontFamily: THEME.font
  }
});