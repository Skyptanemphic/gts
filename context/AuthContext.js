import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 

  // --- LOGIN ---
  const login = async (email, password) => {
    try {
      // REPLACE IP
      const response = await fetch('http://192.168.1.93:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        // Ensure we map the ID correctly. Backend sends { user_id, full_name ... }
        // We want to store it as { id, name ... } for frontend consistency
        setUser({
            id: data.user.user_id,
            name: data.user.full_name,
            role: data.user.role,
            email: data.user.email
        });
        return true;
      } else {
        Alert.alert("Error", data.message);
        return false;
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Connection failed");
      return false;
    }
  };

  // --- REGISTER ---
  const register = async (fullName, email, password, role, professorTitle = null) => {
    try {
      const response = await fetch('http://192.168.1.93:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role, professor_title: professorTitle }),
      });
      
      const data = await response.json();

      if (data.success) {
        setUser({
            id: data.user.user_id,
            name: data.user.full_name,
            role: data.user.role,
            email: data.user.email
        });
        return true;
      } else {
        Alert.alert("Register Failed", data.message);
        return false;
      }
    } catch (error) {
        Alert.alert("Error", "Connection failed");
        return false;
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}