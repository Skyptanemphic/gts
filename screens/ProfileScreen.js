import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, FlatList, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native'; // Import this to refresh data

const THEME = {
  bg: '#F2F0E9',
  font: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export default function ProfileScreen({ navigation }) {
  const { user, login, register, logout } = useAuth();
  
  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('AUTHOR');

  // My Theses State
  const [myTheses, setMyTheses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- FETCH HISTORY LOGIC ---
  const fetchMyHistory = async () => {
    if (!user || user.role !== 'AUTHOR') return;
    setLoadingHistory(true);
    try {
      // REPLACE IP
      const response = await fetch(`http://10.225.126.1:3000/api/my-theses?author_name=${encodeURIComponent(user.name)}`);
      const data = await response.json();
      setMyTheses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Refresh history whenever we come to this screen
  useFocusEffect(
    useCallback(() => {
      fetchMyHistory();
    }, [user])
  );

  const handleAuth = async () => {
    // ... same auth logic as before ...
    if (!email || !password) return Alert.alert("ERROR", "MISSING DATA");
    if (isRegistering) {
        if (!fullName) return Alert.alert("ERROR", "NAME REQUIRED");
        await register(fullName, email, password, role);
    } else {
        await login(email, password);
    }
  };

  // --- RENDER ITEM FOR HISTORY LIST ---
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={{flex: 1}}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.title.toUpperCase()}</Text>
        <Text style={styles.historyMeta}>{item.type} | {item.year}</Text>
      </View>
      <Ionicons name="document-text-outline" size={20} color="#555" />
    </View>
  );

  // --- 1. GUEST VIEW ---
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <Text style={styles.headerTitle}>{isRegistering ? '// REGISTER' : '// LOGIN'}</Text>
          
          {isRegistering && (
            <>
              <TextInput style={styles.input} placeholder="FULL NAME" value={fullName} onChangeText={setFullName} />
              <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                 <TouchableOpacity onPress={()=>setRole('AUTHOR')} style={[styles.roleBtn, role==='AUTHOR'&&styles.activeRole]}><Text style={{fontWeight:'bold'}}>AUTHOR</Text></TouchableOpacity>
                 <TouchableOpacity onPress={()=>setRole('PROFESSOR')} style={[styles.roleBtn, role==='PROFESSOR'&&styles.activeRole]}><Text style={{fontWeight:'bold'}}>PROFESSOR</Text></TouchableOpacity>
              </View>
            </>
          )}
          
          <TextInput style={styles.input} placeholder="EMAIL" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="PASSWORD" secureTextEntry value={password} onChangeText={setPassword} />
          
          <TouchableOpacity style={styles.btn} onPress={handleAuth}><Text style={styles.btnText}>EXECUTE</Text></TouchableOpacity>
          <TouchableOpacity style={{marginTop: 15}} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={{textAlign:'center', textDecorationLine:'underline'}}>{isRegistering ? "BACK TO LOGIN" : "CREATE ACCOUNT"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 2. LOGGED IN DASHBOARD ---
  return (
    <View style={styles.container}>
      {/* HEADER CARD */}
      <View style={styles.card}>
        <View style={{flexDirection:'row', alignItems:'center', gap:15}}>
          <View style={styles.avatar}><Text style={{color:'#FFF', fontWeight:'bold', fontSize:20}}>{user.name[0]}</Text></View>
          <View>
            <Text style={{fontSize:18, fontWeight:'900', fontFamily: THEME.font}}>{user.name.toUpperCase()}</Text>
            <Text style={{fontSize:12, fontFamily: THEME.font, color:'#666'}}>{user.role}</Text>
          </View>
        </View>
      </View>

      {/* AUTHOR ACTIONS */}
      {user.role === 'AUTHOR' && (
        <>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Submission')}>
            <Ionicons name="add" size={24} color="#000" />
            <Text style={{fontWeight:'bold', fontFamily: THEME.font}}>SUBMIT NEW THESIS</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>// MY_UPLOAD_HISTORY</Text>
          
          {loadingHistory ? (
            <ActivityIndicator color="#000" />
          ) : (
            <FlatList
              data={myTheses}
              keyExtractor={(item) => item.thesis_no.toString()}
              renderItem={renderHistoryItem}
              style={{flex: 1}}
              ListEmptyComponent={<Text style={{fontFamily: THEME.font, color:'#999'}}>NO RECORDS FOUND.</Text>}
            />
          )}
        </>
      )}

      {/* LOGOUT */}
      <TouchableOpacity style={[styles.btn, {marginTop: 10, backgroundColor:'#000'}]} onPress={logout}>
        <Text style={[styles.btnText, {color:'#FFF'}]}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, padding: 20 },
  loginBox: { backgroundColor: '#FFF', padding: 20, borderWidth: 2, borderColor: '#000', borderBottomWidth: 8, borderRightWidth: 8, marginTop: 40 },
  headerTitle: { fontFamily: THEME.font, fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F9F9F9', borderWidth: 2, borderColor: '#000', padding: 10, marginBottom: 15, fontFamily: THEME.font },
  btn: { backgroundColor: '#FF5722', padding: 15, alignItems: 'center', borderWidth: 2, borderColor: '#000', borderBottomWidth: 4, borderRightWidth: 4 },
  btnText: { fontWeight: 'bold', fontFamily: THEME.font },
  roleBtn: { flex:1, padding:10, borderWidth:2, alignItems:'center' },
  activeRole: { backgroundColor: '#DDD' },
  
  card: { backgroundColor: '#FFF', padding: 20, borderWidth: 2, borderColor: '#000', marginBottom: 20, borderBottomWidth: 4, borderRightWidth: 4 },
  avatar: { width: 50, height: 50, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 2, padding: 15, marginBottom: 20, borderBottomWidth: 4, borderRightWidth: 4, gap: 10 },
  sectionHeader: { fontFamily: THEME.font, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  
  historyCard: { backgroundColor: '#FFF', padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#000', flexDirection: 'row', alignItems: 'center' },
  historyTitle: { fontFamily: THEME.font, fontWeight: 'bold', fontSize: 14 },
  historyMeta: { fontFamily: THEME.font, fontSize: 10, color: '#777' }
});