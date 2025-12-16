import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 

  // --- LOGIN ---
  const login = async (email, password) => {
    try {
      // REPLACE WITH YOUR IP ADDRESS
      const response = await fetch('http://10.225.126.1:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("ERROR", "CONNECTION FAILED");
      return false;
    }
  };

  // --- REGISTER (NEW) ---
  const register = async (fullName, email, password, role) => {
    try {
      // REPLACE WITH YOUR IP ADDRESS
      const response = await fetch('http://10.225.126.1:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
      
      const data = await response.json();

      if (data.success) {
        setUser(data.user); // Auto-login after register
        return true;
      } else {
        Alert.alert("REGISTRATION FAILED", data.message || "Unknown Error");
        return false;
      }
    } catch (error) {
      console.error("Register Error:", error);
      Alert.alert("ERROR", "CONNECTION FAILED");
      return false;
    }
  };

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