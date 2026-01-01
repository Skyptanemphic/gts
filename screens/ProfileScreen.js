import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, 
  Alert, FlatList, ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const THEME = { bg: '#F4F6F8', primary: '#003366', accent: '#0056b3', card: '#FFF', text: '#1A1A1A', border: '#E0E0E0', error: '#D32F2F' };

export default function ProfileScreen({ navigation }) {
  const { user, login, register, logout } = useAuth();
  const [isReg, setIsReg] = useState(false);
  
  // ADDED: 'title' to state to support the Professor table in your DB
  const [form, setForm] = useState({ email: '', pass: '', name: '', role: 'AUTHOR', title: '' });
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useFocusEffect(useCallback(() => {
    // We use user.name here because your 'author' table is linked by name, not user_id
    if (user?.role === 'AUTHOR') {
      fetch(`http://192.168.1.93:3000/api/my-theses?author_name=${encodeURIComponent(user.name)}`)
        .then(r => r.json()).then(setHistory).catch(console.error);
    }
  }, [user]));

  const handleAuth = async () => {
    if (!form.email || !form.pass) return Alert.alert("Error", "Missing fields");
    setLoading(true);
    try {
      if (isReg) {
        if (!form.name) throw new Error("Name required");
        // ADDED: Validation for Professor Title
        if (form.role === 'PROFESSOR' && !form.title) throw new Error("Academic Title is required for Professors");
        
        // Register API Call
        // We now send 'professor_title' so the backend can fill the 'professor' table
        const res = await fetch('http://192.168.1.93:3000/api/register', {
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            email: form.email, 
            password: form.pass, 
            full_name: form.name, 
            role: form.role,
            professor_title: form.role === 'PROFESSOR' ? form.title : null 
          })
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        Alert.alert("Success", "Account created! You can now log in."); 
        setIsReg(false);
      } else {
        await login(form.email, form.pass);
      }
    } catch (e) { 
      Alert.alert("Error", e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 1. GUEST VIEW ---
  if (!user) return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView contentContainerStyle={s.center}>
          <View style={s.card}>
            <View style={{alignItems:'center', marginBottom:20}}>
              <Ionicons name="school" size={48} color={THEME.primary} />
              <Text style={s.title}>{isReg ? 'Create Account' : 'Welcome Back'}</Text>
            </View>

            {isReg && (
              <>
                <TextInput 
                  style={s.input} 
                  placeholder="Full Name" 
                  placeholderTextColor="#999" 
                  value={form.name} 
                  onChangeText={t => setForm({...form, name: t})} 
                  autoCapitalize="words"
                />

                <View style={s.row}>
                  {['AUTHOR', 'PROFESSOR'].map(r => (
                    <TouchableOpacity key={r} style={[s.roleBtn, form.role === r && s.roleActive]} onPress={() => setForm({...form, role: r})}>
                      <Ionicons name={r === 'AUTHOR' ? 'school-outline' : 'briefcase-outline'} size={18} color={form.role === r ? '#FFF' : '#000'} />
                      <Text style={{color: form.role === r ? '#FFF' : '#000', fontWeight:'600', fontSize:12}}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ADDED: Dynamic Input for Professor Title */}
                {form.role === 'PROFESSOR' && (
                  <TextInput 
                    style={[s.input, { borderColor: THEME.accent }]} 
                    placeholder="Academic Title (e.g. Dr., Assoc. Prof.)" 
                    placeholderTextColor="#999" 
                    value={form.title} 
                    onChangeText={t => setForm({...form, title: t})} 
                  />
                )}
              </>
            )}

            <TextInput 
              style={s.input} 
              placeholder="Email" 
              placeholderTextColor="#999" 
              value={form.email} 
              onChangeText={t => setForm({...form, email: t})} 
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput 
              style={s.input} 
              placeholder="Password" 
              placeholderTextColor="#999" 
              value={form.pass} 
              onChangeText={t => setForm({...form, pass: t})} 
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={s.btn} onPress={handleAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF"/> : <Text style={s.btnTxt}>{isReg ? 'Sign Up' : 'Log In'}</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={{marginTop:15}} onPress={() => setIsReg(!isReg)}>
              <Text style={{color:THEME.accent, textAlign:'center'}}>{isReg ? "Login instead" : "Create account"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // --- 2. LOGGED IN DASHBOARD ---
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={{color:'#FFF', fontSize:18, fontWeight:'700'}}>Profile</Text>
        <View style={{width:24}}/>
      </View>
      <FlatList
        data={user.role === 'AUTHOR' ? history : []}
        keyExtractor={i => i.thesis_no.toString()}
        contentContainerStyle={{padding:16}}
        ListHeaderComponent={
          <View style={{marginBottom:20}}>
            <View style={[s.card, {alignItems:'center', marginBottom:20}]}>
              <View style={s.avatar}><Text style={{color:'#FFF', fontSize:32, fontWeight:'700'}}>{user.name?.[0]}</Text></View>
              <Text style={{fontSize:22, fontWeight:'700'}}>{user.name}</Text>
              
              {/* Display Title if Professor */}
              <Text style={{color:'#666', letterSpacing:1}}>
                {user.role} {user.title ? `(${user.title})` : ''}
              </Text>
              
              <TouchableOpacity style={s.logout} onPress={logout}><Text style={{color:THEME.error, fontWeight:'700'}}>Log Out</Text></TouchableOpacity>
            </View>
            
            {/* LOGIC: Only Authors can submit. Professors likely only view/supervise. */}
            {user.role === 'AUTHOR' && (
              <TouchableOpacity style={s.action} onPress={() => navigation.navigate('Submission')}>
                <Ionicons name="add-circle" size={32} color={THEME.primary} />
                <Text style={{flex:1, fontSize:16, fontWeight:'700'}}>Submit New Thesis</Text>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            )}
            
            <Text style={{fontSize:16, fontWeight:'700', marginVertical:10}}>
              {user.role === 'AUTHOR' ? 'My Submissions' : 'Supervised Theses (Empty)'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:'700'}} numberOfLines={1}>{item.title}</Text>
              <Text style={{fontSize:12, color:'#666'}}>{item.type} • {item.year}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Submission', { thesis: item })} style={{padding:8, backgroundColor:'#E3F2FD', borderRadius:8}}>
              <Ionicons name="create-outline" size={20} color={THEME.accent} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg, ...(Platform.OS === 'web' ? { height: '100vh' } : {}) },
  center: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 3, shadowOpacity: 0.1 },
  title: { fontSize: 24, fontWeight: '700', color: THEME.primary, marginTop: 10 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: THEME.border, borderRadius: 10, gap: 5 },
  roleActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  btn: { backgroundColor: THEME.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#FFF', fontWeight: '700' },
  topBar: { backgroundColor: THEME.primary, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logout: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#FFEBEE', borderRadius: 20 },
  action: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, gap: 12, elevation: 2 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' }
});