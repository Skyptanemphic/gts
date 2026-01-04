import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRoute } from '@react-navigation/native';

const THEME = {
  bg: '#F4F6F8',
  primary: '#003366',
  card: '#FFF',
  text: '#1A1A1A',
  border: '#E0E0E0'
};

const API_URL = 'http://192.168.1.93:3000/api';

const THESIS_TYPES = [
  'Master',
  'Doctorate',
  'Specialization in Medicine',
  'Proficiency in Art'
];

const LANGUAGES = ['Turkish', 'English', 'French', 'German', 'Spanish'];

export default function SubmissionScreen({ navigation }) {
  const { user } = useAuth();
  const route = useRoute();

  const thesis = route.params?.thesis || null;
  const mode = route.params?.mode || 'create';
  const readOnly = mode === 'view';

  const [loading, setLoading] = useState(false);

  // ---------- DATA ----------
  const [professors, setProfessors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);

  // ---------- FORM ----------
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [pages, setPages] = useState('');
  const [type, setType] = useState('Master');
  const [language, setLanguage] = useState('English');
  const [keywords, setKeywords] = useState('');

  // ---------- SELECTIONS ----------
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedCoSupervisor, setSelectedCoSupervisor] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  // ---------- MODAL ----------
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTarget, setModalTarget] = useState('');

  // ---------- LOAD ----------
  useEffect(() => {
    const load = async () => {
      try {
        const [p, u, i] = await Promise.all([
          fetch(`${API_URL}/professors`),
          fetch(`${API_URL}/universities`),
          fetch(`${API_URL}/institutes`)
        ]);

        const profs = await p.json();
        const unis = await u.json();
        const insts = await i.json();

        setProfessors(profs);
        setUniversities(unis);
        setAllInstitutes(insts);

        if (thesis) {
          setTitle(thesis.title || '');
          setAbstract(thesis.abstract || '');
          setYear(String(thesis.year || ''));
          setPages(String(thesis.number_of_pages || ''));
          setType(thesis.type || 'Master');
          setLanguage(thesis.language || 'English');
          setKeywords(thesis.keywords || '');

          setSelectedSupervisor(
            profs.find(p => p.professor_id === thesis.supervisor_id) || null
          );

          setSelectedCoSupervisor(
            profs.find(p => p.professor_id === thesis.cosupervisor_id) || null
          );

          const inst = insts.find(i => i.institute_id === thesis.institute_id);
          setSelectedInstitute(inst || null);

          const uni = unis.find(u => u.university_id === inst?.university_id);
          setSelectedUniversity(uni || null);
        }
      } catch {
        Alert.alert('Error', 'Failed to load data');
      }
    };

    load();
  }, [thesis]);

  // ---------- FILTER INSTITUTES ----------
  useEffect(() => {
    if (!selectedUniversity) {
      setFilteredInstitutes([]);
      setSelectedInstitute(null);
      return;
    }

    setFilteredInstitutes(
      allInstitutes.filter(
        i => i.university_id === selectedUniversity.university_id
      )
    );
  }, [selectedUniversity, allInstitutes]);

  // ---------- SUBMIT ----------
  const handleSubmit = async () => {
    if (readOnly) return;

    if (
      !title ||
      !abstract ||
      !selectedSupervisor ||
      !selectedUniversity ||
      !selectedInstitute
    ) {
      return Alert.alert('Missing Fields', 'Please fill required fields');
    }

    setLoading(true);

    try {
      const payload = {
        title,
        abstract,
        year: parseInt(year),
        number_of_pages: parseInt(pages) || 0,
        type,
        language,
        keywords,
        user_id: user.user_id,
        author_id: user.author_id || null,
        supervisor_id: selectedSupervisor.professor_id,
        cosupervisor_id: selectedCoSupervisor?.professor_id || null,
        institute_id: selectedInstitute.institute_id
      };

      const url =
        mode === 'edit'
          ? `${API_URL}/theses/${thesis.thesis_no}`
          : `${API_URL}/theses`;

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      Alert.alert('Success', 'Thesis saved', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- MODAL ----------
  const openModal = target => {
    if (readOnly) return;
    if (target === 'INSTITUTE' && !selectedUniversity)
      return Alert.alert('Select University first');
    setModalTarget(target);
    setModalVisible(true);
  };

  const modalData = () => {
    if (modalTarget === 'UNIVERSITY') return universities;
    if (modalTarget === 'INSTITUTE') return filteredInstitutes;
    if (modalTarget === 'TYPE') return THESIS_TYPES;
    if (modalTarget === 'LANGUAGE') return LANGUAGES;
    return professors;
  };

  const selectItem = item => {
    if (modalTarget === 'SUPERVISOR') setSelectedSupervisor(item);
    if (modalTarget === 'COSUPERVISOR') setSelectedCoSupervisor(item);
    if (modalTarget === 'UNIVERSITY') setSelectedUniversity(item);
    if (modalTarget === 'INSTITUTE') setSelectedInstitute(item);
    if (modalTarget === 'TYPE') setType(item);
    if (modalTarget === 'LANGUAGE') setLanguage(item);
    setModalVisible(false);
  };

  // ---------- UI ----------
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>
          {mode === 'create' ? 'New Submission' : mode === 'edit' ? 'Edit Thesis' : 'View Thesis'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.card}>
          <Text style={s.sectionTitle}>Thesis Details</Text>

          <TextInput style={s.input} editable={!readOnly} value={title} onChangeText={setTitle} placeholder="Title *" />
          <TextInput style={[s.input, { height: 100 }]} editable={!readOnly} value={abstract} onChangeText={setAbstract} multiline placeholder="Abstract *" />

          <View style={s.row}>
            <TextInput style={[s.input, { flex: 1 }]} editable={!readOnly} value={year} onChangeText={setYear} keyboardType="numeric" placeholder="Year *" />
            <TextInput style={[s.input, { flex: 1 }]} editable={!readOnly} value={pages} onChangeText={setPages} keyboardType="numeric" placeholder="Pages *" />
          </View>

          <Text style={s.sectionTitle}>Academic Details</Text>

          <TouchableOpacity style={s.dropdown} onPress={() => openModal('SUPERVISOR')}>
            <Text>{selectedSupervisor?.professor_name || 'Select Supervisor *'}</Text>
            <Ionicons name="chevron-down" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.dropdown}
            onPress={() => openModal('COSUPERVISOR')}
            onLongPress={() => setSelectedCoSupervisor(null)}
          >
            <Text>
              {selectedCoSupervisor
                ? selectedCoSupervisor.professor_name
                : 'Select Co-Supervisor (Optional)'}
            </Text>
            <Ionicons name="chevron-down" size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={s.dropdown} onPress={() => openModal('UNIVERSITY')}>
            <Text>{selectedUniversity?.university_name || 'Select University *'}</Text>
            <Ionicons name="chevron-down" size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={s.dropdown} onPress={() => openModal('INSTITUTE')}>
            <Text>{selectedInstitute?.institute_name || 'Select Institute *'}</Text>
            <Ionicons name="chevron-down" size={18} />
          </TouchableOpacity>

          {!readOnly && (
            <TouchableOpacity style={s.btn} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>Save</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <FlatList
              data={modalData()}
              keyExtractor={(i, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => selectItem(item)}>
                  <Text>
                    {typeof item === 'string'
                      ? item
                      : item.professor_name ||
                        item.university_name ||
                        item.institute_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  topBar: {
    backgroundColor: THEME.primary,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.primary, marginBottom: 12 },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  dropdown: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnTxt: { color: '#FFF', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '70%'
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  }
});
