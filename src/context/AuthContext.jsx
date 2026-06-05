import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [studentSession, setStudentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha de Firebase Auth para personal administrativo
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cargar sesión de estudiante desde LocalStorage si existe
    const savedStudent = localStorage.getItem('studentSession');
    if (savedStudent) {
      setStudentSession(JSON.parse(savedStudent));
    }

    return unsubscribe;
  }, []);

  const loginAsStudent = (studentData) => {
    setStudentSession(studentData);
    localStorage.setItem('studentSession', JSON.stringify(studentData));
  };

  const logout = async () => {
    await signOut(auth);
    setStudentSession(null);
    localStorage.removeItem('studentSession');
  };

  const value = {
    currentUser,
    studentSession,
    loginAsStudent,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
