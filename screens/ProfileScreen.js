import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  Alert, FlatList, ActivityIndicator, SafeAreaView, StatusBar,
  KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const THEME = {
  bg: '#F4F6F8',
  primary: '#003366',
  accent: '#0056b3',
  card: '#FFF',
  text: '#1A1A1A',
  border: '#E0E0E0',
  error: '#D32F2F',
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
};

const API_URL = 'http://192.168.1.93:3000/api';

export default function ProfileScreen({ navigation }) {
  const { user, login, logout } = useAuth();
  const [isReg, setIsReg] = useState(false);

  const [form, setForm] = useState({
    email: '', pass: '', name: '', role: 'AUTHOR', university_id: null, institute_id: null, title: ''
  });

  const [universities, setUniversities] = useState([]);
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // ---------- LOAD DROPDOWNS ----------
  useEffect(() => {
    if (!isReg) return;
    Promise.all([
      fetch(`${API_URL}/universities`),
      fetch(`${API_URL}/institutes`)
    ])
      .then(async ([u, i]) => {
        setUniversities(await u.json());
        setAllInstitutes(await i.json());
      })
      .catch(console.error);
  }, [isReg]);

  // ---------- FILTER INSTITUTES ----------
  useEffect(() => {
    if (!form.university_id) {
      setFilteredInstitutes([]);
      return;
    }
    setFilteredInstitutes(allInstitutes.filter(i => i.university_id == form.university_id));
  }, [form.university_id, allInstitutes]);

  // ---------- LOAD HISTORY ----------
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      
      const endpoint = user.role === 'AUTHOR' 
        ? `${API_URL}/my-theses?author_name=${encodeURIComponent(user.name)}`
        : `${API_URL}/professors/${user.professor_id}/theses`;

      fetch(endpoint)
        .then(r => r.json())
        .then(data => {
          setHistory(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }, [user])
  );

  const handleAuth = async () => {
    if (!form.email || !form.pass) {
      Alert.alert('Error', 'Missing email or password');
      return;
    }
    setLoading(true);
    try {
      if (isReg) {
        // Registration logic remains same...
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.pass,
            full_name: form.name,
            role: form.role,
            university_id: form.university_id,
            institute_id: form.role === 'PROFESSOR' ? form.institute_id : null,
            professor_title: form.role === 'PROFESSOR' ? form.title : null
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        Alert.alert('Success', 'Account created. Please log in.');
        setIsReg(false);
      } else {
        await login(form.email, form.pass);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- SHARED HEADER COMPONENT ----------
  const ScreenHeader = ({ title }) => (
    <View style={s.topNav}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={24} color={THEME.primary} />
      </TouchableOpacity>
      <Text style={s.navTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ---------- GUEST VIEW ----------
  if (!user) {
    return (
      <SafeAreaView style={s.safe}>
        <ScreenHeader title={isReg ? "Sign Up" : "Login"} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.center}>
            <View style={[s.card, THEME.shadow]}>
              <View style={s.authIconCircle}>
                 <Ionicons name="person-circle-outline" size={60} color={THEME.primary} />
              </View>
              <Text style={s.title}>{isReg ? 'Create Account' : 'Welcome Back'}</Text>

              {isReg && (
                <TextInput
                  style={s.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={form.name}
                  onChangeText={t => setForm({ ...form, name: t })}
                />
              )}

              <TextInput
                style={s.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={form.email}
                onChangeText={t => setForm({ ...form, email: t })}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={form.pass}
                onChangeText={t => setForm({ ...form, pass: t })}
                secureTextEntry
              />

              <TouchableOpacity style={s.btn} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>{isReg ? 'Sign Up' : 'Log In'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsReg(!isReg)}>
                <Text style={s.switch}>{isReg ? 'Already have an account? Login' : "Don't have an account? Create one"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- LOGGED IN VIEW ----------
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Profile" />

      <FlatList
        data={history}
        keyExtractor={i => i.thesis_no.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={[s.headerCard, THEME.shadow]}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{user.name?.[0]}</Text>
            </View>
            <Text style={s.name}>{user.name}</Text>
            <View style={s.badge}><Text style={s.badgeTxt}>{user.role}</Text></View>

            <TouchableOpacity style={s.logout} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color={THEME.error} />
              <Text style={s.logoutTxt}>Log Out</Text>
            </TouchableOpacity>

            <View style={s.divider} />
            <Text style={s.sectionTitle}>
                {user.role === 'AUTHOR' ? 'My Research Submissions' : 'Theses Under Supervision'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const canEdit = user.role === 'AUTHOR';
          return (
            <TouchableOpacity
              style={[s.item, THEME.shadow]}
              onPress={() => navigation.navigate('Submission', { thesis: item, mode: canEdit ? 'edit' : 'view' })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.itemMeta}>{item.type} • {item.year}</Text>
                {user.role === 'PROFESSOR' && <Text style={s.authorTag}>Author: {item.author_name}</Text>}
              </View>
              <Ionicons name={canEdit ? 'chevron-forward' : 'eye-outline'} size={20} color="#CCC" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
            !loading && <Text style={s.emptyTxt}>No records found yet.</Text>
        }
        ListFooterComponent={
            user.role === 'AUTHOR' && (
                <TouchableOpacity
                  style={[s.addBtn, THEME.shadow]}
                  onPress={() => navigation.navigate('Submission', { mode: 'create' })}
                >
                  <Ionicons name="add-circle" size={24} color="#FFF" />
                  <Text style={s.addTxt}>Add New Thesis</Text>
                </TouchableOpacity>
            )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  topNav: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: { padding: 10 },
  navTitle: { fontSize: 18, fontWeight: '700', color: THEME.primary },
  center: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 20 },
  authIconCircle: { alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: THEME.primary, marginBottom: 25, textAlign: 'center' },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E1E8EE',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    color: THEME.text
  },
  btn: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  btnTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  switch: { color: THEME.accent, textAlign: 'center', marginTop: 20, fontWeight: '500' },
  headerCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#E3F2FD'
  },
  avatarTxt: { color: '#FFF', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: THEME.text, marginBottom: 6 },
  badge: { 
    backgroundColor: '#E3F2FD', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 8,
    marginBottom: 15
  },
  badgeTxt: { color: THEME.primary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
  },
  logoutTxt: { color: THEME.error, fontWeight: '700', marginLeft: 6 },
  divider: { height: 1, backgroundColor: THEME.border, width: '100%', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#444', alignSelf: 'flex-start' },
  item: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary
  },
  itemTitle: { fontSize: 15, fontWeight: '700', color: THEME.text, marginBottom: 4 },
  itemMeta: { fontSize: 13, color: '#777' },
  authorTag: { fontSize: 12, color: THEME.primary, marginTop: 4, fontWeight: '500' },
  emptyTxt: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
  },
  addTxt: { color: '#FFF', fontWeight: '700', fontSize: 16, marginLeft: 10 }
});