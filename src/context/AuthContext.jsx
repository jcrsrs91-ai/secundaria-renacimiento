import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [studentSession, setStudentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha de Firebase Auth para personal administrativo
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserPermissions(userDoc.data().permissions || []);
            setUserRole(userDoc.data().role || 'staff');
          } else {
            // Backwards compatibility for the original admin
            setUserPermissions(['all']);
            setUserRole('superadmin');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserPermissions(null);
        setUserRole(null);
      }
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
    userPermissions,
    userRole,
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
