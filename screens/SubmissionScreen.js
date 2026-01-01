import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, 
  Alert, ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const THEME = { bg: '#F4F6F8', primary: '#003366', card: '#FFF', text: '#1A1A1A', border: '#E0E0E0' };

// Ensure this IP matches your local computer IP
const API_URL = 'http://192.168.1.93:3000/api'; 

export default function SubmissionScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data Lists
  const [professors, setProfessors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [allInstitutes, setAllInstitutes] = useState([]); 
  const [filteredInstitutes, setFilteredInstitutes] = useState([]); 

  // Form State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [type, setType] = useState('Master'); 
  const [keywords, setKeywords] = useState(''); 
  const [language, setLanguage] = useState('English'); 
  
  // Selections
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedCoSupervisor, setSelectedCoSupervisor] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  // Modal Control
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTarget, setModalTarget] = useState('');

  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, uniRes, instRes] = await Promise.all([
          fetch(`${API_URL}/professors`),
          fetch(`${API_URL}/universities`),
          fetch(`${API_URL}/institutes`) // Fetch all institutes
        ]);
        
        const profs = await profRes.json();
        const unis = await uniRes.json();
        const insts = await instRes.json();
        
        setProfessors(Array.isArray(profs) ? profs : []);
        setUniversities(Array.isArray(unis) ? unis : []);
        setAllInstitutes(Array.isArray(insts) ? insts : []);
      } catch (e) {
        console.error("Error loading form data", e);
        Alert.alert("Connection Error", "Could not load dropdown data.");
      }
    };
    fetchData();
  }, []);

  // 2. Logic: Filter Institutes when University changes
  useEffect(() => {
    if (selectedUniversity) {
      // Filter institutes that match the selected University ID
      // Using loose equality (==) to handle potential string/number mismatch
      const filtered = allInstitutes.filter(
        inst => inst.university_id == selectedUniversity.university_id
      );
      setFilteredInstitutes(filtered);
      
      // Reset institute selection if it doesn't belong to new uni
      if (selectedInstitute && selectedInstitute.university_id != selectedUniversity.university_id) {
        setSelectedInstitute(null);
      }
    } else {
      setFilteredInstitutes([]);
    }
  }, [selectedUniversity, allInstitutes]);


  const handleSubmit = async () => {
    if (!title || !abstract || !selectedSupervisor || !selectedInstitute || !selectedUniversity) {
      return Alert.alert("Missing Fields", "Please fill in all required fields marked *");
    }

    if (selectedSupervisor.professor_id === selectedCoSupervisor?.professor_id) {
        return Alert.alert("Invalid Selection", "Supervisor and Co-Supervisor cannot be the same person.");
    }

    setLoading(true);
    try {
      // DEBUG: Check what user ID we have
      console.log("Submitting with User:", user); 

      const payload = {
        title,
        abstract,
        year: parseInt(year),
        type,
        language,
        keywords,
        
        // --- CRITICAL FIXES ---
        // 1. Send the correct database column name (user_id, not id)
        user_id: user.user_id, 
        // 2. Send author_id if we have it (from updated login)
        author_id: user.author_id, 
        
        supervisor_id: selectedSupervisor.professor_id,
        cosupervisor_id: selectedCoSupervisor ? selectedCoSupervisor.professor_id : null,
        institute_id: selectedInstitute.institute_id
      };

      const response = await fetch(`${API_URL}/theses`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      Alert.alert("Success", "Thesis published successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (e) {
      Alert.alert("Submission Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (target) => {
    if (target === 'INSTITUTE' && !selectedUniversity) {
      return Alert.alert("Select University First", "Please select a university to see its institutes.");
    }
    setModalTarget(target);
    setModalVisible(true);
  };

  const handleSelection = (item) => {
    if (modalTarget === 'SUPERVISOR') setSelectedSupervisor(item);
    if (modalTarget === 'COSUPERVISOR') setSelectedCoSupervisor(item);
    if (modalTarget === 'UNIVERSITY') setSelectedUniversity(item);
    if (modalTarget === 'INSTITUTE') setSelectedInstitute(item);
    setModalVisible(false);
  };

  const getModalData = () => {
    if (modalTarget === 'INSTITUTE') return filteredInstitutes;
    if (modalTarget === 'UNIVERSITY') return universities;
    return professors;
  };

  const renderModalItem = ({ item }) => {
    let label = "";
    if (modalTarget === 'INSTITUTE') label = item.institute_name;
    else if (modalTarget === 'UNIVERSITY') label = item.university_name;
    else label = item.professor_name;

    return (
      <TouchableOpacity style={s.modalItem} onPress={() => handleSelection(item)}>
        <Text style={s.modalItemText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>New Submission</Text>
        <View style={{width: 24}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView contentContainerStyle={s.center}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Thesis Details</Text>

            <Text style={s.label}>Title *</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

            <Text style={s.label}>Abstract *</Text>
            <TextInput style={[s.input, {height: 80}]} value={abstract} onChangeText={setAbstract} multiline placeholder="Enter abstract..." />

            <View style={s.row}>
              <View style={{flex:1}}>
                <Text style={s.label}>Year</Text>
                <TextInput style={s.input} value={year} onChangeText={setYear} keyboardType="numeric" />
              </View>
              <View style={{flex:1}}>
                <Text style={s.label}>Language</Text>
                <TextInput style={s.input} value={language} onChangeText={setLanguage} />
              </View>
            </View>

            <Text style={s.label}>Keywords</Text>
            <TextInput style={s.input} value={keywords} onChangeText={setKeywords} placeholder="AI, SQL, Design" />

            <Text style={s.sectionTitle}>Academic Details</Text>

            {/* SUPERVISOR */}
            <Text style={s.label}>Supervisor *</Text>
            <TouchableOpacity style={s.dropdown} onPress={() => openModal('SUPERVISOR')}>
                <Text style={[s.dropdownText, !selectedSupervisor && {color:'#999'}]}>
                    {selectedSupervisor ? selectedSupervisor.professor_name : "Select Supervisor"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* CO-SUPERVISOR */}
            <Text style={s.label}>Co-Supervisor (Optional)</Text>
            <TouchableOpacity style={s.dropdown} onPress={() => openModal('COSUPERVISOR')}>
                <Text style={[s.dropdownText, !selectedCoSupervisor && {color:'#999'}]}>
                    {selectedCoSupervisor ? selectedCoSupervisor.professor_name : "Select Co-Supervisor"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* UNIVERSITY */}
            <Text style={s.label}>University *</Text>
            <TouchableOpacity style={s.dropdown} onPress={() => openModal('UNIVERSITY')}>
                <Text style={[s.dropdownText, !selectedUniversity && {color:'#999'}]}>
                    {selectedUniversity ? selectedUniversity.university_name : "Select University"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* INSTITUTE */}
            <Text style={s.label}>Institute *</Text>
            <TouchableOpacity style={s.dropdown} onPress={() => openModal('INSTITUTE')}>
                <Text style={[s.dropdownText, !selectedInstitute && {color:'#999'}]}>
                    {selectedInstitute ? selectedInstitute.institute_name : "Select Institute"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF"/> : <Text style={s.btnTxt}>Publish Thesis</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
            <View style={s.modalContent}>
                <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>Select {modalTarget === 'UNIVERSITY' ? 'School' : 'Option'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={s.closeBtn}>
                        <Ionicons name="close" size={20} color="#333" />
                    </TouchableOpacity>
                </View>
                
                {modalTarget === 'COSUPERVISOR' && (
                    <TouchableOpacity style={s.modalItem} onPress={() => handleSelection(null)}>
                        <Text style={[s.modalItemText, {color:'red'}]}>None (Clear)</Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={getModalData()}
                    keyExtractor={(item, idx) => idx.toString()}
                    renderItem={renderModalItem}
                    ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>No data available</Text>}
                />
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  topBar: { backgroundColor: THEME.primary, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  center: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.primary, marginBottom: 12, marginTop: 10, textTransform:'uppercase' },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 },
  dropdown: { 
    backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, 
    padding: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  dropdownText: { fontSize: 15, color: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  btn: { backgroundColor: THEME.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 5, backgroundColor: '#EEE', borderRadius: 20 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { fontSize: 16, color: '#333' }
});