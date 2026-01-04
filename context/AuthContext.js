import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ---------- LOGIN ----------
  const login = async (email, password) => {
    try {
      const response = await fetch('http://192.168.1.93:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        Alert.alert('Error', data.message);
        return false;
      }

      // Canonical user shape used across the app
      const sessionUser = {
        user_id: data.user.user_id,
        author_id: data.user.author_id ?? null,
        professor_id: data.user.professor_id ?? null,
        name: data.user.full_name,
        role: data.user.role,
        email: data.user.email,
      };

      console.log('AUTH LOGIN SUCCESS:', JSON.stringify(sessionUser, null, 2));
      setUser(sessionUser);
      return true;

    } catch (error) {
      console.error('LOGIN ERROR:', error);
      Alert.alert('Error', 'Connection failed');
      return false;
    }
  };

  // ---------- REGISTER ----------
  const register = async (
    fullName,
    email,
    password,
    role,
    professorTitle = null
  ) => {
    try {
      const response = await fetch('http://192.168.1.93:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
          professor_title: professorTitle,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        Alert.alert('Register Failed', data.message);
        return false;
      }

      Alert.alert('Success', 'Account created. Please log in.');
      return true;

    } catch (error) {
      console.error('REGISTER ERROR:', error);
      Alert.alert('Error', 'Connection failed');
      return false;
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
